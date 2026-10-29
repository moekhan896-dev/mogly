# End of Summer Sale tracker

AWS Law Firm, Aug 25 to Aug 31 2026. 10% off any legal matter, no minimum,
capped at 20 engagements. Closes Monday Aug 31 at 5:00 PM ET.

68 contacts from the scrubbed August list are pre-loaded.

## Deploy

1. **Supabase** — use the SAME project as the July 4 and Back-to-School trackers.
   Run `setup.sql` in the SQL editor. It creates `leads_eos` and `sends_eos`.
   Existing tables are not touched.
2. **Config** — Project Settings > API. Paste the Project URL and the anon
   public key into `config.js`.
3. **Vercel** — Add New > Project, drop this folder in. Name it `aws-tracker-eos`.
   Do not redeploy over an existing tracker.

Without step 1 and 2 the tracker still works, but changes save only in your own
browser and do not sync to the team.

## What's here

- **Seat meter** — 20 discrete blocks, one per available engagement. Fills as
  leads move to Engaged. This is the same cap the emails advertise, so the
  board and the campaign always agree.
- **Countdown** — live, to Monday Aug 31 at 5:00 PM ET. Turns orange in the
  last 24 hours.
- **Conversion** — Emailed, Reached, Responded, Engaged, with stage rates.
- **Email performance** — five send rows, Tue Aug 25 through Mon Aug 31. Type
  in Sent, Opens, Clicks, Replies from Mailchimp; rates calculate. Replies are
  manual, Mailchimp does not track them.
- **Leads** — status cycles New > Contacted > Responded > Engaged > Dead on
  click. Five call-attempt squares, one per send day; logging a call on a New
  lead moves it to Contacted automatically. Names are click to call and click
  to email. Search and status filters above the table.

## Keep the URL internal

Anyone with the link can edit. The anon key is visible in the deployed source,
which is the accepted tradeoff for a seven day internal tool. Do not post the
link publicly.

Built by Rysen Growth for AWS Law Firm.
