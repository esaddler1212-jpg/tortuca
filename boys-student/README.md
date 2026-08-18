# BOYS Student App

Student-facing app for the **B.O.Y.S.** monthly curriculum (grades 6–8). Students join with a class code, enter their name and grade, then complete the warm-up and exit ticket during their group's week each month.

## Monthly schedule

Each month has **one theme** (September through June). Within each month:

| Group | Code | Meets | Excused period |
|-------|------|-------|----------------|
| BOYS Group A | `PURPOSE-A` | Week 1 | 4 |
| BOYS Group B | `PURPOSE-B` | Week 2 | 5 |
| BOYS Group C | `PURPOSE-C` | Week 3 | 6 |

Curriculum themes start **September 2026**.

## School year themes

| Month | Theme |
|-------|-------|
| September | Identity — Who Am I? |
| October | Respect |
| November | Confidence |
| December | Peer Pressure |
| January | Leadership |
| February | Communication |
| March | Accountability |
| April | Resilience |
| May | Decision Making |
| June | Purpose — I Move With Purpose |

## Deploy on Netlify

1. Create a new Netlify site from this repo with **Base directory** = `boys-student`
2. Set environment variable:
   - `VITE_BOYS_API_URL` = your Family Purpose site URL (where the BOYS API functions run)
3. Build command: `npm run build` · Publish: `dist`

## Local development

```bash
# Terminal 1 — Family Purpose (hosts the API)
cd family-purpose
npm install
npx netlify dev

# Terminal 2 — Student app
cd boys-student
npm install
BOYS_API_PROXY=http://127.0.0.1:8888 npm run dev
```

## Family Purpose integration

In **Family Purpose → Settings**, set **BOYS student app class code** to match your group. The **Group** tab shows monthly theme, session week, and warm-up/exit ticket completion.
