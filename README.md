# Tortuca

Student check-in log with an end-of-day debrief for school staff and your employer.

## Fields per check-in

- Student name
- Grade
- Class period
- Reason(s) for the check-in (preset list + free-text details)

## Fast entry

- **Recent students** — tap a name to fill in that student’s grade and period
- **Name suggestions** — start typing and pick a match, or type a known name in full and the rest fills itself
- **Recent periods** — tap to set the class period
- **Reason pills** — one tap each, ordered by how often you use them
- **Sticky class** — grade and period stay set after saving, so the next student in the same room needs only a name and a reason

## Group sign-in

The **Group** tab is a standing sign-in sheet for a mentoring group (named **BOYS Group** by default; rename it in Settings).

- Keep a roster of members, added by hand or pulled from students already in your check-in log
- Tap a name to sign someone in or out — each tap saves immediately
- Record the day’s focus and session notes
- Today’s session is folded into the end-of-day debrief

## Reports

The **Reports** tab rolls the data up by **quarter** (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec) or **full year**:

- Total check-ins, students served, group sessions, members signed in, average attendance
- Breakdowns by reason, grade, and month, each with its share of the total
- The ten most frequent check-ins
- Download as PDF, copy, or email to school staff and your company

Reports carry counts only — the free-text notes from individual check-ins stay in the daily log.

## Debrief

The **Debrief** tab builds a plain-text summary of today’s check-ins and group sign-in. You can **download a PDF**, copy the text, or open your email client with recipients from **Settings** (school staff and company).

Data is stored in your browser (`localStorage`) on this device.

## Development

```bash
npm install
npm run dev
```

```bash
npm run build
npm test
```
