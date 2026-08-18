# tortuca

This repository holds unrelated projects that share a scratch remote. Each app has
its own README, build, and (typically) its own Netlify site.

## Projects

| Project | Path | Purpose |
|---------|------|---------|
| **Alfred** | repo root | Personal command center — email, calendar, weather, Woodhouse app dashboard |
| **Family Purpose** | [`family-purpose/`](family-purpose/) | Student check-ins, mentoring group sign-in, debriefs, BOYS curriculum API |
| **BOYS Student** | [`boys-student/`](boys-student/) | Student-facing monthly curriculum app (class code login) |

### Alfred (repo root)

**Alfred** is your personal command center. It reads email and calendar, tracks
weather and todos, and—through the **Woodhouse protocol**—shows the status of
**every app you register**.

```bash
npm install
npm run dev
npx netlify dev   # Woodhouse aggregator + Google OAuth
```

Deploy from the **repo root** (default `netlify.toml`). See [WOODHOUSE.md](./WOODHOUSE.md)
for the Woodhouse integration spec and `.env.example` for environment variables.

### Family Purpose

Standalone web app for logging student check-ins, running the mentoring group
sign-in, and sending daily debriefs. Hosts the BOYS curriculum API used by the
student app.

See [`family-purpose/README.md`](family-purpose/README.md).

Deploy as a **separate Netlify site** with base directory `family-purpose`.

### BOYS Student App

Students join with a class code (`PURPOSE-A`, `PURPOSE-B`, or `PURPOSE-C`), enter
name and grade, and submit monthly warm-up and exit ticket responses.

See [`boys-student/README.md`](boys-student/README.md).

Deploy as a **separate Netlify site** with base directory `boys-student` and
`VITE_BOYS_API_URL` set to your Family Purpose site URL.

## License

MIT
