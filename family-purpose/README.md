# Family Purpose — Student Check-ins

A private log of the students you check in with during the school day, a sign-in
sheet for the mentoring group, and the reports you send to school staff and to
Family Purpose.

Built for Family Purpose. It is a standalone project with no dependency on
anything else in this repository.

## Daily check-ins

Each check-in records:

- Student name
- Student ID — optional, and what identifies the student on anything you send out
- Grade (K–12)
- Class period
- Reason(s) — a preset list plus free-text detail
- Outcome — how the conversation ended; can be left blank now and filled in later
- A 48-hour follow-up, if the conversation needs one

Logging students back-to-back is the common case, so the form is built for speed:

- **The period in session is already filled in** — the app knows the bell
  schedule, so most check-ins need no period entry at all
- **Recent students** — one tap fills the name, grade, and class period from that
  student’s last check-in
- **Name suggestions** — start typing and pick a match, or type a known name in
  full and the rest fills itself
- **Period buttons** — every period of today’s schedule, with its times, one tap
  each; recent classes with a subject name are offered underneath
- **Reason pills** — one tap each, ordered by how often you use them
- **Sticky class** — grade and period stay set after saving, so the next student
  in the same room needs only a name and a reason

## The school schedule

The app is set up for Oak Grove Middle School on the Mt. Diablo Unified
2026–2027 calendar, and uses it in three places.

**Filling in the period.** A banner at the top of the log names the period in
session and the schedule it comes from, and the class period is filled in to
match. Between periods it offers the class the student just left. The four
schedules are all built in:

| Schedule | When | Ends |
| --- | --- | --- |
| 6th grade | Mon, Tue, Thu, Fri | 2:18 PM, lunch at 11:30 |
| 7th & 8th grade | Mon, Tue, Thu, Fri | 2:18 PM, lunch at 12:16 |
| All grades | Wednesday | 12:43 PM, early release |
| All grades | Nine minimum days | 12:00 PM |

**Naming the day.** Holidays, recesses, teacher in-service days and the start
and end of each term are known, so the log says "No school — Fall Recess" and
when school resumes rather than offering periods that do not exist. Short days
are noted on the debrief, the attendance clerk list and the weekly summary,
since a half day explains a short list of check-ins.

**Reporting on terms.** Reports and Impact run over the district's quarters,
semesters, trimesters and full school year, with the instructional day counts
from the calendar. Calendar quarters are still there for anyone who wants them.

Settings shows every schedule, the term dates and the minimum days, so it is
clear what the app is working from. To move to another school, edit
`src/schedule.ts` and `src/schoolCalendar.ts` — the dates and times all live in
those two files.

## Follow-up

Outcomes are usually not known when the student walks out, so the **Follow-up**
tab is where the day gets tidied up before anything is sent.

- **Awaiting an outcome** — check-ins from the past week with nothing recorded
  yet. Write what happened and tap an outcome.
- **The 48-hour queue** — anything you ticked "follow up within 48 hours" on,
  split into overdue, due today and upcoming, oldest deadline first. Ticking the
  "Follow-up scheduled" outcome schedules one for you.
- **Recommended services** — School counselor, social worker, attendance
  support, food or clothing assistance, family outreach and the rest. Tap the
  ones a student needs.
- **CARE team referral** — a checkbox that moves the student onto the CARE team
  debrief without putting their detail into the debrief that goes to everyone
  else.

The tab carries a badge with everything outstanding, so it is visible without
going looking for it.

## Group sign-in

The **Group** tab is a standing sign-in sheet for a mentoring group, named
**BOYS Group** by default and renameable in Settings.

- Keep a roster, added by hand or pulled from students already in the log
- Tap a name to sign someone in or out; each tap saves immediately
- Record the day’s focus and session notes
- Today’s session is folded into the end-of-day debrief

## Debriefs

Different people need different things, so the **Debrief** tab holds four
documents. Each one previews on screen and exports as a PDF, plain text, or an
email addressed from Settings.

- **End-of-day debrief** — the day's check-ins with student IDs, outcomes, the
  group sign-in, and every follow-up still owed. Goes to school staff and
  Family Purpose. Where a student was referred to the CARE team it says so, and
  nothing more.
- **Attendance clerk list** — time, name, ID, grade and the class each student
  came from, in arrival order, so the clerk can reconcile the period.
- **Weekly summary** — who was checked in with each day of the week, who was
  seen more than once, the group sessions held, and what is still open.
- **CARE team referrals** — the confidential one. Full detail for each referred
  student: context, outcome, recommended services and follow-up notes, over the
  last week, 30 days or 90 days. It has its own recipient in Settings and its
  own email button so it cannot go out with the daily debrief by mistake.

## Quarterly and yearly reports

The **Reports** tab rolls the data up over any school term — quarter, semester,
trimester or the whole year — or over a calendar quarter or year:

- Total check-ins, students served, group sessions, members signed in, average
  attendance
- Breakdowns by reason, grade, and month, each with its share of the total
- The ten most frequent check-ins

Reports carry counts only. Free-text notes from individual check-ins stay in the
daily log and never appear in a shared summary.

## Impact

Where **Reports** answers "how much," the **Impact** tab answers "is it working."
Pick a term or a year and it shows four measures:

- **Students who come back** — how many were seen once versus repeatedly, how
  many reached four or more check-ins, and how many weeks each student stayed
  engaged. Sustained relationships, not one-off contacts.
- **Attendance trend** — group attendance early in the period against later in
  the period, month by month, plus each member's attendance rate.
- **What check-ins are about** — reasons are grouped into *Intervention*
  (behavior, attendance, conflict, family, referrals), *Support* (academic,
  wellness) and *Growth* (goal-setting, career planning, recognition). The
  period is split at the midpoint of the days actually logged and the two halves
  are compared, so a shift from putting out fires toward forward-looking work
  shows up as a change in percentage points.
- **Outcomes** — the mix of how conversations ended, and what share of check-ins
  have an outcome recorded at all, so the number can be read honestly.

Like the reports, this is counts and trends only, and it exports to PDF, plain
text, or email.

## Where the data lives

Everything is stored in the browser (`localStorage`) on the device you use — no
server, no account, nothing leaves the device unless you send it.

Because of that, **Settings → Data backup** is worth using regularly. It writes a
JSON file holding every check-in, group session, and setting, and can restore
them onto a new device or browser. That file is also what a future impact
analysis would read from.

## Chromebooks and school devices

Built for **ChromeOS stable-channel Chrome** (including current builds such as
Chrome 150) on typical school hardware — including dual-core Celeron
Chromebooks (e.g. Intel Celeron N4000).

### Work offline at school

1. **Once** — on your phone hotspot, open the app in Chrome and **install it**
   (Chrome menu → **Install Family Purpose**, or **Add to shelf**).
2. **All day** — log check-ins with no Wi‑Fi. Data stays on the Chromebook.
3. **After school** — turn on the hotspot. If **Back up automatically when the
   internet comes back** is on in Settings (default), a JSON backup lands in
   **Downloads** when there is new data since the last backup.

You will see an **Offline** banner while disconnected; it disappears when you
are online again.

### Auto-backup options

| Setting | What happens when you connect |
| --- | --- |
| Auto-backup on, no upload URL | `family-purpose-backup-YYYY-MM-DD.json` in Downloads |
| Auto-backup on + upload URL | JSON POST to Family Purpose (or your Netlify site) |
| Auto-backup off | Use **Download backup (JSON)** manually in Settings |

Optional **upload URL** for Family Purpose: deploy this folder to Netlify and set
`FAMILY_PURPOSE_BACKUP_KEY` in the site environment. Paste
`https://your-site.netlify.app/api/family-purpose-backup` and the same key in
Settings.

### Performance on slower Chromebooks
- **Light first load** — only the Log tab code loads at startup; Reports, Debrief,
  Impact and the rest load when you open them. PDF libraries load only when you
  tap **Download PDF**.
- **No web fonts** — the UI uses the system font so the first screen does not wait
  on Google Fonts over a slow school network.
- **PDFs on slower CPUs** — the button shows **Preparing PDF…** while the file is
  built. On dual-core devices you may also see a short note that the first PDF
  can take a few seconds; copy-to-clipboard and email use plain text and stay
  snappy.

If PDF export is painfully slow, use **Copy to clipboard** or **Email** for the
daily debrief and save PDFs for end-of-week summaries when you have a moment.

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
