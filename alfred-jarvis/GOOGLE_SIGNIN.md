# Google sign-in for Alfred (one setup, both Alfreds)

One Google "OAuth client" serves both:

- **Alfred web app** on Netlify (Gmail + Calendar on the dashboard)
- **Alfred on the iMac** (OpenJarvis `jarvis connect gdrive`: Gmail, Calendar, Tasks for the briefing)

Takes about 15 minutes. Do it from a computer, not a phone.

## 1. Deploy Alfred first (you need its URL)

Netlify → **Add new site → Import an existing project → GitHub → tortuca** → leave base
directory blank → **Deploy**. Copy the URL, e.g. `https://ecs-alfred.netlify.app`.
Tip: rename it in **Site configuration → Change site name** *before* the Google steps, because
the URL becomes part of the Google settings.

## 2. Create a Google Cloud project

1. Go to <https://console.cloud.google.com> signed in as **esaddler1212@gmail.com**.
2. Top bar project picker → **New project** → name it `Alfred` → **Create** → select it.

## 3. Turn on the APIs

**APIs & Services → Library**, search for and **Enable** each one:

- Gmail API
- Google Calendar API
- Google Tasks API (for the iMac briefing)
- Google Drive API (for the iMac's `gdrive` connector)

## 4. Consent screen (this is where most setups break)

**APIs & Services → OAuth consent screen** (newer console: **Google Auth Platform → Branding /
Audience**):

1. User type: **External** → app name `Alfred`, support email and developer email = your Gmail.
2. **Audience → Test users → Add users →** `esaddler1212@gmail.com`. Skipping this step gives
   an "Access blocked" / `access_denied` error.
3. Leave publishing status on **Testing**. (Publishing would require Google's security review
   because Alfred reads Gmail.)

> **Testing mode quirk:** Google expires the sign-in **every 7 days** for apps in Testing.
> When the dashboard or briefing loses Gmail, click Connect Google again (web) or re-run
> `jarvis connect gdrive` (iMac). It takes 10 seconds.

## 5. Create the OAuth client

**APIs & Services → Credentials → Create credentials → OAuth client ID**:

- Application type: **Web application**, name `Alfred`
- **Authorized redirect URIs**: add **both** of these, exactly (https, no trailing slash):

  ```
  https://YOUR-SITE.netlify.app/api/auth-callback
  http://localhost:8789/callback
  ```

  The first is the web app; the second is OpenJarvis on the iMac.
  If you later add a custom domain to Netlify, add `https://yourdomain.com/api/auth-callback` too.
  Alfred uses Netlify's primary URL, so whichever domain is primary must be listed.

- **Create** → copy the **Client ID** and **Client secret**.

## 6. Give the keys to Netlify

Netlify → your Alfred site → **Site configuration → Environment variables → Add**:

| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the Client ID |
| `GOOGLE_CLIENT_SECRET` | the Client secret |
| `WOODHOUSE_TIMEZONE` | `America/Los_Angeles` |
| `WOODHOUSE_REVENUE_GOAL` | `1000` |

Then **Deploys → Trigger deploy → Deploy site**. Environment variables only take effect
after a new deploy.

## 7. Test the web app

Open your Alfred URL → **Connect Google** → pick your account → you'll see "Google hasn't
verified this app". That's expected for your own Testing app: **Continue** → allow access.

| Error after sign-in | Fix |
|---|---|
| `Error 400: redirect_uri_mismatch` or `oauth_error=redirect` | Redirect URI in step 5 doesn't exactly match `<your URL>/api/auth-callback` |
| `Access blocked` / `oauth_error=denied` | Add yourself as a test user (step 4.2) |
| `oauth_error=client` | Client ID/secret typo in Netlify, or you didn't redeploy (step 6) |
| "Google OAuth is not configured" | Env vars missing, or no redeploy after adding them |
| Worked, then stopped a week later | Testing-mode expiry. Click Connect Google again |

## 8. On the iMac

Run `jarvis connect gdrive`. It asks for the same **Client ID** and **Client secret**, opens the
browser, and returns to `localhost:8789`. That's why step 5 included that address.

**Keep the Client secret private.** It goes in Netlify and in OpenJarvis's prompt, never in this
repo or in chat.
