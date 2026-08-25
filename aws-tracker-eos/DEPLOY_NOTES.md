# EOS tracker — deploy status

Staged and verified here, **not yet live**. Two things block go-live from an
automated session; both need a human with account access.

## Blocked

1. **No Supabase credentials.** The tracker must use the same project as the
   July 4 / Back-to-School trackers. That project's ref, URL, and anon key exist
   only in the Supabase account — nothing in this repo or environment references
   them, so the project cannot be identified, let alone connected to.
2. **Network egress is closed.** `api.supabase.com` and `api.vercel.com` both
   return `403` on CONNECT at the environment gateway. No token would help; the
   requests do not leave the container.

`config.js` therefore still holds the shipped `YOUR_...` placeholders, and no
Vercel project was created.

## Verified

Run against local PostgreSQL 16 and headless Chromium:

- `setup.sql` applies cleanly to a database carrying the `supabase_realtime`
  publication. Resulting schema, RLS state, policies, and publication membership
  all match what `index.html` reads and writes.
- App boots with no page errors. 68 leads + 5 send rows render; the seat meter
  renders 20 blocks.
- With placeholder config: "Local mode" banner shows, indicator is grey,
  label reads `Local only`.
- With a populated config and a working client: banner is gone, indicator is
  green, label reads `Live`.
- A simulated `postgres_changes` event on `leads_eos` re-renders immediately —
  engagements-claimed went 0 → 1. This is the mechanism behind cross-browser
  sync; end-to-end latency still needs a real Supabase project to measure.

## Changed from the original

`setup.sql` was not re-runnable. `alter publication ... add table` errors with
`relation "leads_eos" is already member of publication "supabase_realtime"` on a
second run, which aborts the script and rolls back the whole batch in the
Supabase SQL editor. Both publication adds are now guarded by an existence check
against `pg_publication_tables`. Schema and intent are unchanged; the script now
runs cleanly three times in a row. Everything else is byte-identical to what was
supplied.

## To finish

1. Supabase → the existing tracker project → SQL editor → run `setup.sql`.
   It only creates `leads_eos` / `sends_eos`; existing tables are untouched.
2. Project Settings → API. Copy the Project URL and the **anon public** key into
   `config.js`, replacing both placeholders.
3. Deploy this folder as a new Vercel project named `aws-tracker-eos`:
   `cd aws-tracker-eos && vercel --prod`.

   **Watch the link prompt.** This repo is already connected to a Vercel project
   called `mogly` through the GitHub integration, so `vercel` will offer to link
   to it. Decline, and create a new project named `aws-tracker-eos`. Linking to
   `mogly` would deploy the tracker over the app at that project's domain. If you
   set it up from the dashboard instead, set **Root Directory** to
   `aws-tracker-eos`, or the build will pick up the Next.js app at the repo root.
4. Load the URL. Banner gone + green `Live` means step 2 worked. Open it in a
   second browser and change a status to confirm sync.

The tracker is usable before step 1 — it just saves to one browser and does not
sync, which is what the banner is telling you.
