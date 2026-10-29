# Seminar tracker — claude.ai artifact build

Live: https://claude.ai/artifact/3tgHxvP5LrH8eR8i2eWpwR

The same tracker as `../index.html`, rebuilt to run as a claude.ai artifact
instead of on Vercel + Supabase. Use whichever suits the audience:

|                      | Artifact build (this)            | Vercel build (`../`)              |
|----------------------|----------------------------------|-----------------------------------|
| Who can open it      | people you share it with, signed in to claude.ai | anyone with the link, no sign-in |
| Setup                | none — the link already works    | run `setup.sql`, then `deploy.sh` |
| Shared state         | the artifact's own database      | Supabase                          |
| The client list      | loaded from CSV in the browser   | loaded from CSV in the browser    |

## The page holds no client data

Neither build has a single client name in its source. The artifact build keeps
the list in the artifact's shared database, written once by whoever loads the
CSV; the Vercel build keeps it in Supabase. Street addresses, dates of birth
and case notes are never read from the spreadsheet at all.

## Loading the list

Export the Master Client List sheet as CSV (Excel: File → Save As → CSV) and
choose it under **The client list**. The parser wants the sheet's own headers:
`First Name`, `Last Name`, `Email`, `Phone`, `City`, `Status / Tags`,
`MyCase Created`. It writes the list in chunks of 150 to the `roster`
collection, so re-loading a corrected sheet is one action, not 2,729 writes.

People are keyed by a hash of name + phone + email rather than by row number,
so re-loading an edited sheet keeps each person's logged calls and notes
attached to them.

## What it derives

- **Held out** — `Status / Tags` containing *deceased* or *do not contact*.
  Excluded from every count and every export.
- **Tampa area** — 813, 727, 863, 941, 352. **Rest of Florida** — other FL
  area codes. **Out of area** — a phone outside Florida. **No phone** — nothing
  to call at all. The four partition the mailable list exactly.
- **Newest first** — by `MyCase Created`, falling back to `New CRM Created`.
  The CRM column alone is a bulk stamp (1,776 rows share one date) and is
  useless for recency.

## Collections

- `roster/c000…` — the client list, 150 people per document.
- `track/<key>` — per person: status, how they replied, call days, note.
- `walkins/<id>` — people added on the page who were not on the list.
- `sends/<n>` — per email: sent, opens, clicks, replies.
