# human.rubenhassid.ai

A one-field landing page that emails people the **/be-a-damn-human** Claude skill, and adds
their address to a Resend audience for manual import into Substack.

Same shape as `ste-landing`: static HTML plus one serverless function, no framework, no npm
dependencies, no build step.

```
public/index.html                 the page (inline CSS + JS)
public/be-a-damn-human.zip        the skill, and the email attachment
api/subscribe.js                  validate -> Resend audience -> Resend send
api/_email.js                     the email body (html + text)
skill-src/be-a-damn-human/        source for the zip
```

## The source skill needed cleaning

The `.md` this was built from was a Google Docs export and was **not usable as a skill**:

- 111 backslash escapes (`\-`, `\#`, `\.`, `\>`, `\!`) — the frontmatter fence itself was
  `\---`, so claude.ai would not have seen frontmatter at all.
- Trailing double-spaces on 85 lines, and runs of blank lines.
- `description:` was a multi-line indented YAML scalar. Folded to a single line, which is
  what the other working skills use and removes any parser ambiguity.

If the skill is ever re-exported from Docs, redo that cleanup before rezipping.

## Rebuilding the zip

`skill-src/` is the source of truth; `public/be-a-damn-human.zip` is what gets emailed:

```bash
cd skill-src && zip -r -X ../public/be-a-damn-human.zip be-a-damn-human \
  -x '*.DS_Store' -x '__MACOSX/*'
```

The zip root must stay the `be-a-damn-human/` folder — claude.ai rejects an archive whose
root is the skill's *contents*. And `name: be-a-damn-human` is what the `/be-a-damn-human`
slash command comes from; it is duplicated in `api/_email.js` as `SLASH`.

## Environment variables

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | sending — the **anisha@** account, where `rubenhassid.ai` is verified |
| `RESEND_CONTACTS_API_KEY` | capture — the **team@** account |
| `RESEND_AUDIENCE_ID` | a new audience in the team@ account |
| `FROM_EMAIL` | `Ruben Hassid <howtoai@rubenhassid.ai>` |
| `REPLY_TO` | `anisha@rubenhassid.ai` |

Capture and sending are deliberately on different accounts. `resend._domainkey` holds one
value, so the domain cannot be verified on both — see the root prompt for the full reasoning.

## The email deliberately warns people off

The skill refuses vague briefs and interrogates the user. That reads as broken if you are
not expecting it, so the email says up front that it *won't* just do the thing, and that the
questions are the point. It also says when not to use it. One paragraph, and it prevents the
"your skill doesn't work" reply.
