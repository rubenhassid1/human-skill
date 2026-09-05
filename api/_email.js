// The delivery email. Deliberately plain: no header image, no CTA button, no
// footer branding. It should read like Ruben typed it, because that is what
// makes people actually follow the steps.

const SUBJECT = 'Your "be a damn human" skill';

// claude.ai derives the slash command from the `name:` in SKILL.md frontmatter,
// so this string is coupled to skill-src/be-a-damn-human/SKILL.md.
const SLASH = '/be-a-damn-human';

const TEXT = `Hey,

The skill is the file attached to this email.

1. Download be-a-damn-human.zip
2. In Claude, open Settings and flip two switches:
     Capabilities -> turn on file creation
     Customize -> Skills -> + -> Upload skill -> pick the zip
   Ten seconds. The Skills menu only appears once that first one is on.

3. Next time you catch yourself writing a lazy prompt, type:
     ${SLASH} make this better

Here's the part people aren't ready for: it won't do it.

It'll tell you "make this better" isn't a request yet, then ask you five or six
blunt questions -- who it's for, what breaks if it's wrong, what you're avoiding
saying. Answer them and you get something with a point of view, not a glossy
draft built on fog.

The questions are the feature. Most of the time you'll realise you didn't know
what you wanted either.

One warning: it's built to argue with you, so don't reach for it when you
already know exactly what you want and just need it typed. Use it when you're
stuck, or when the stakes are real enough that being told "this is weak" is
cheaper than finding out later.

Ruben
`;

function html() {
  // Single quotes around multi-word font names -- double quotes would close the
  // surrounding style="..." attribute and silently drop the rest of the stack.
  const FONT =
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  // Gmail strips <html>, <head> and <body> along with their styles, so the font
  // has to be repeated on the wrapper and on every text block that matters.
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:#363737;${FONT}`;
  const step = `margin:0 0 10px;font-size:16px;line-height:1.6;color:#363737;${FONT}`;
  const note = `margin:0 0 6px;font-size:15px;line-height:1.55;color:#757575;${FONT}`;
  const code =
    "font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;background:#F5F5F5;padding:2px 6px;border-radius:4px;color:#363737";

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#ffffff;${FONT}">
<div style="max-width:520px;margin:0 auto;${FONT}">

  <p style="${p}">Hey,</p>

  <p style="${p}">The skill is the <strong>file attached to this email</strong>.</p>

  <p style="${step}">1. Download <code style="${code}">be-a-damn-human.zip</code></p>
  <p style="${step};margin-bottom:4px">2. In Claude, open <strong>Settings</strong> and flip two switches:</p>
  <p style="${step};margin:0 0 4px;padding-left:18px">&bull;&nbsp; <strong>Capabilities</strong> &rarr; turn on <strong>file creation</strong></p>
  <p style="${step};margin:0 0 4px;padding-left:18px">&bull;&nbsp; <strong>Customize &rarr; Skills &rarr; +</strong> &rarr; Upload skill &rarr; pick the zip</p>
  <p style="${note};margin:0 0 16px">Ten seconds. The Skills menu only appears once that first one is on.</p>

  <p style="${step}">3. Next time you catch yourself writing a lazy prompt, type:</p>
  <p style="${step};margin:0 0 16px;padding-left:18px"><code style="${code}">${SLASH}</code> make this better</p>

  <p style="${p};margin-top:20px">Here&rsquo;s the part people aren&rsquo;t ready for: <strong>it won&rsquo;t do it.</strong></p>

  <p style="${p}">It&rsquo;ll tell you &ldquo;make this better&rdquo; isn&rsquo;t a request yet, then ask you five or six blunt
     questions &mdash; who it&rsquo;s for, what breaks if it&rsquo;s wrong, what you&rsquo;re avoiding saying. Answer them
     and you get something with a point of view, not a glossy draft built on fog.</p>

  <p style="${p}">The questions are the feature. Most of the time you&rsquo;ll realise you didn&rsquo;t know what you
     wanted either.</p>

  <p style="${p}"><strong>One warning:</strong> it&rsquo;s built to argue with you, so don&rsquo;t reach for it when you
     already know exactly what you want and just need it typed. Use it when you&rsquo;re stuck, or when the
     stakes are real enough that being told &ldquo;this is weak&rdquo; is cheaper than finding out later.</p>

  <p style="${p};margin-top:28px">Ruben</p>

</div>
</body></html>`;
}

module.exports = { SUBJECT, TEXT, html };
