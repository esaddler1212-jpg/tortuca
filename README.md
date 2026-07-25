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

## Debrief

The **Debrief** tab builds a plain-text summary of today’s check-ins. You can **download a PDF**, copy the text, or open your email client with recipients from **Settings** (school staff and company).

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
