# Family Purpose — Student Check-ins

A private log of the students you check in with during the school day, a sign-in
sheet for the mentoring group, and the reports you send to school staff and to
Family Purpose.

Built for Family Purpose. It is a standalone project with no dependency on
anything else in this repository.

## Daily check-ins

Each check-in records:

- Student name
- Grade (K–12)
- Class period
- Reason(s) — a preset list plus free-text detail

Logging students back-to-back is the common case, so the form is built for speed:

- **Recent students** — one tap fills the name, grade, and class period from that
  student’s last check-in
- **Name suggestions** — start typing and pick a match, or type a known name in
  full and the rest fills itself
- **Recent periods** — tap to set the class period
- **Reason pills** — one tap each, ordered by how often you use them
- **Sticky class** — grade and period stay set after saving, so the next student
  in the same room needs only a name and a reason

## Group sign-in

The **Group** tab is a standing sign-in sheet for a mentoring group, named
**BOYS Group** by default and renameable in Settings.

- Keep a roster, added by hand or pulled from students already in the log
- Tap a name to sign someone in or out; each tap saves immediately
- Record the day’s focus and session notes
- Today’s session is folded into the end-of-day debrief

## End-of-day debrief

The **Debrief** tab writes up the day’s check-ins and group sign-in. Download it
as a PDF, copy the text, or open your email client with recipients from Settings.

## Quarterly and yearly reports

The **Reports** tab rolls the data up by quarter (Jan–Mar, Apr–Jun, Jul–Sep,
Oct–Dec) or full year:

- Total check-ins, students served, group sessions, members signed in, average
  attendance
- Breakdowns by reason, grade, and month, each with its share of the total
- The ten most frequent check-ins

Reports carry counts only. Free-text notes from individual check-ins stay in the
daily log and never appear in a shared summary.

## Where the data lives

Everything is stored in the browser (`localStorage`) on the device you use — no
server, no account, nothing leaves the device unless you send it.

Because of that, **Settings → Data backup** is worth using regularly. It writes a
JSON file holding every check-in, group session, and setting, and can restore
them onto a new device or browser. That file is also what a future impact
analysis would read from.

## Development

```bash
npm install
npm run dev
```

```bash
npm run build   # type-check and bundle
npm test        # unit and component tests
```

## Moving this into its own repository

The project is self-contained in this directory, so it can be lifted out as-is:

```bash
# from the repository root
cp -r family-purpose ../family-purpose-checkins
cd ../family-purpose-checkins
git init && git add -A && git commit -m "Family Purpose student check-ins"
git remote add origin <new-repo-url>
git push -u origin main
```

To keep the commit history instead, use `git subtree split --prefix=family-purpose -b family-purpose-only` and push that branch to the new remote.
