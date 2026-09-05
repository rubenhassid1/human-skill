// POST /api/subscribe  { email, company, referrer }
//
// Adds the address to a Resend audience (the list Ruben exports for Substack),
// then emails the skill zip. Zero npm dependencies -- native fetch only, so
// there is no build step and nothing to keep patched.

const fs = require('fs');
const path = require('path');
const { SUBJECT, TEXT, html } = require('./_email');

const ZIP_NAME = 'be-a-damn-human.zip';
const RESEND_URL = 'https://api.resend.com/emails';

// Deliberately conservative: one @, a dot in the domain, no whitespace.
// Anything exotic enough to fail this is more likely a typo than a real address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Read the attachment once per cold start rather than once per request.
let zipCache = null;
function zipBase64() {
  if (zipCache === null) {
    const p = path.join(process.cwd(), 'public', ZIP_NAME);
    zipCache = fs.readFileSync(p).toString('base64');
  }
  return zipCache;
}

// Stops a double-click or an impatient double-submit from sending twice while
// the same lambda instance is warm. Not a real rate limiter -- just enough to
// keep the obvious duplicate out of the Sheet.
const recent = new Map();
const RECENT_TTL_MS = 60_000;
function seenRecently(email) {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > RECENT_TTL_MS) recent.delete(k);
  if (recent.has(email)) return true;
  recent.set(email, now);
  return false;
}

// The list Ruben exports to CSV and imports into Substack by hand. Resend
// treats a repeat POST as an update rather than an error, so re-signups are
// idempotent and there is no duplicate to clean out of the export.
//
// Capture and sending deliberately use *different* Resend accounts. New
// contacts belong in team@rubenhassid.ai, but `rubenhassid.ai` is only a
// verified sending domain on the anisha@ account -- and `resend._domainkey`
// can hold one value, so verifying it on both is impossible. Splitting the
// keys gets the contacts where they belong without touching DNS.
// RESEND_CONTACTS_API_KEY falls back to RESEND_API_KEY so an unset variable
// degrades to the old single-account behaviour instead of dropping signups.
async function addToAudience(email) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    console.warn('RESEND_AUDIENCE_ID not set - skipping contact write');
    return;
  }
  const key = process.env.RESEND_CONTACTS_API_KEY || process.env.RESEND_API_KEY;
  const res = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) {
    throw new Error(`contacts ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function sendEmail(to, attachment) {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [to],
      reply_to: process.env.REPLY_TO || process.env.FROM_EMAIL,
      subject: SUBJECT,
      text: TEXT,
      html: html(),
      attachments: [{ filename: ZIP_NAME, content: attachment }],
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.REPLY_TO || process.env.FROM_EMAIL}?subject=unsubscribe>`,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'bad_json' });
    }
  }
  body = body || {};

  // Honeypot. Answer 200 so a bot learns nothing about why it failed.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    console.error('RESEND_API_KEY or FROM_EMAIL is not configured');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  // Load the attachment before anything else. If `includeFiles` in vercel.json
  // ever stops matching, this is the failure -- and without its own error code
  // it masquerades as a Resend outage in the logs.
  let attachment;
  try {
    attachment = zipBase64();
  } catch (err) {
    console.error('ATTACHMENT MISSING at', path.join(process.cwd(), 'public', ZIP_NAME), '-', err.message);
    return res.status(500).json({ ok: false, error: 'attachment_missing' });
  }

  if (seenRecently(email)) return res.status(200).json({ ok: true, deduped: true });

  // The audience is Ruben's copy of the list; the email is what the subscriber
  // came for. If only the list write fails, they should still get their skill --
  // so log it loudly and carry on rather than failing the whole request.
  try {
    await addToAudience(email);
  } catch (err) {
    console.error('CONTACT WRITE FAILED for', email, '-', err.message);
  }

  try {
    const sent = await sendEmail(email, attachment);
    console.log('sent', sent && sent.id, 'to', email);
  } catch (err) {
    console.error('RESEND FAILED for', email, '-', err.message);
    recent.delete(email); // let them retry immediately
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }

  return res.status(200).json({ ok: true });
};
