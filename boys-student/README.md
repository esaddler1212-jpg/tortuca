# BOYS Student App

Student-facing app for the **B.O.Y.S.** weekly curriculum (grades 6–8). Students join with a class code, enter their name and grade, then complete the warm-up and exit ticket for each week.

## Class codes

| Group | Code | Excused period |
|-------|------|----------------|
| BOYS Group A | `PURPOSE-A` | 4 |
| BOYS Group B | `PURPOSE-B` | 5 |
| BOYS Group C | `PURPOSE-C` | 6 |

Week 1 starts **Monday, August 24, 2026**.

## Deploy on Netlify

1. Create a new Netlify site from this repo with **Base directory** = `boys-student`
2. Set environment variable:
   - `VITE_BOYS_API_URL` = your Family Purpose site URL (where the BOYS API functions run), e.g. `https://your-family-purpose.netlify.app`
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

Open the student app (usually `http://localhost:5173`). API calls proxy to Netlify dev on port 8888.

## Family Purpose integration

In **Family Purpose → Settings**, set **BOYS student app class code** to match your group (`PURPOSE-A`, `PURPOSE-B`, or `PURPOSE-C`). The **Group** tab then shows:

- Who logged in today (for class excusal)
- Warm-up and exit ticket completion per student
- One-tap add to roster for students who joined via the app
