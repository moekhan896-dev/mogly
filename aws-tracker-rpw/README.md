# The Retirement Planning Window — seat tracker

AWS Law Firm and Pelora Advisors, in-person seminar.
**Saturday, November 7, 2026**, check in 9:45 am, starts 10:00 am.
2202 N Westshore Blvd, Suite 200, Tampa FL 33607. **20 seats.**

RSVP line: Ralpf, (813) 776-6059. Eventbrite registration is the second
channel. Aaron's consult line for the follow-up emails: (813) 922-5293.

The client list is **not** bundled with this tracker. You load it on first run from a
CSV export of the master client list; the tracker sorts newest intake first and flags
the rows that must not be emailed. Keeping the roster out of the repo means the client
list lives only in your own Supabase project.

## Deploy

1. **Supabase** — use the SAME project as the July 4, Back-to-School and End of
   Summer trackers. Run `setup.sql` in the SQL editor. It creates `leads_rpw`
   and `sends_rpw` and is safe to run more than once. Existing tables are not
   touched.
2. **Deploy** — `./deploy.sh <SUPABASE_URL> <SUPABASE_ANON_KEY>`. Both values are
   in Project Settings > API. The script writes `config.js` and deploys to a new
   Vercel project named `aws-tracker-rpw`.
3. **Load the list** — open the deployed URL, click **Import list**, and choose a CSV
   export of the Master Client List sheet. Headers are matched by name, so the export
   goes straight across: First / Middle / Last Name, Email, Email 2, Phone, Phone 2,
   City, State, Status / Tags, MyCase Created, New CRM Created. A `Name` column works
   too if that is all you have. Importing writes every row to Supabase once; after
   that the team shares one live board.

Without step 1 the tracker still works, but changes save only in your own
browser and do not sync to the team. A grey dot and a "Local mode" banner tell
you which mode you are in; green and "Live" means the team is in sync.

**Do not let it link to the `mogly` Vercel project.** This repo is already
connected to that project, and deploying into it would publish the tracker over
the Mogly app's domain. `deploy.sh` creates `aws-tracker-rpw` instead.

## What's here

- **Seat meter** — 20 blocks, one per seat. Fills as clients move to RSVP'd,
  Attended or No-show, since each of those reserved a seat. This is the same cap
  the emails advertise, so the board and the campaign always agree.
- **Countdown** — live, to Saturday Nov 7 at 10:00 am ET. Turns amber in the
  last 24 hours, then switches to the follow-up phase after the doors open.
- **Funnel** — list size, contacted, RSVP'd, attended, with stage rates, plus
  no-show and declined counts.
- **Email performance** — eight rows, one per send: emails 1 through 6 plus 7A
  and 7B, which Mailchimp reports separately. Type in Sent, Opens, Clicks and
  Replies; rates calculate. Replies are manual, Mailchimp does not track them.
- **Mailchimp segments** — one click exports the CSV for a segment: everyone
  emailable, Tampa area only, Email 6 (RSVP'd only), Email 7A (attended) and
  Email 7B (did not attend).
- **Clients** — status cycles New > Contacted > RSVP'd > Attended > No-show >
  Declined on click. Seven call-attempt squares, one per send day; logging a
  call on a New client moves them to Contacted automatically. "Via" records
  whether an RSVP came in by phone or Eventbrite. Names and numbers are click
  to call, emails are click to send. Search and filters above the table, 100
  rows per page.

## Filters worth knowing

On the October 2026 master list (2,729 rows) these came out as:

- **Tampa area** (861) — area codes 813, 727, 863, 941 and 352. These are the
  clients who can realistically drive to a Saturday morning in Tampa, and they
  are the call list.
- **Rest of Florida** (427) and **Out of area** (1,175) — inferred from area code,
  since the State column is blank on 92% of rows. Roughly 288 of the out-of-area
  numbers are Michigan.
- **No phone** (261) — reachable by email only, so they sit outside the three
  geographic buckets rather than being guessed into one.
- **Held out** (5) — four clients tagged Deceased and one tagged Do Not Contact.
  They are imported but kept out of the default view and out of every segment
  export, so email 1 cannot land in a deceased client's inbox. The count shows on
  the list tile so nothing disappears silently.
- **No email** (554) — on the list but not reachable by email; 2,170 are.

**Sorting.** "Newest first" uses **MyCase Created**, the real intake date.
`New CRM Created` is a bulk-migration stamp — 1,776 rows all read 08/06/2026 — so
sorting on it would be meaningless. Records that exist only in the new CRM fall back
to their CRM date.

## What this board deliberately does not hold

The importer reads only the columns listed above. Dates of birth, street addresses
and the Notes column are ignored and never written to Supabase. That Notes column
carries intake detail — one record describes a client's father in memory care — and
nothing in a seat tracker needs it.

## Keep the URL internal

Anyone with the link can edit. The anon key is visible in the deployed source,
which is the accepted tradeoff for a short-lived internal tool. Once you import,
this board holds every client's name, phone number and email address, so treat the
URL as you would the client list itself: do not post it publicly, and take the
deployment down once the follow-up emails have gone out.

Built by Rysen Growth for AWS Law Firm.
