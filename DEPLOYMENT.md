# Deployment & environment setup

How to run **locally** and deploy to **Vercel** so the booking flow, confirmation
emails, and the QR check-in all resolve URLs correctly.

The app derives its public base URL (used for QR entry passes, email links, and
Open Graph tags) in `src/lib/app-url.ts`, in this order:

1. `NEXT_PUBLIC_APP_URL` — explicit override (set to your custom domain in prod).
2. `NEXT_PUBLIC_VERCEL_URL` — **auto-set by Vercel** for every deployment, so
   preview/test deployments work with no manual URL config.
3. `http://localhost:3000` — local dev.

---

## 1. Local

1. Copy the env template and fill it in:
   ```bash
   cp .env.local.example .env.local
   ```
2. Minimum to boot: the `NEXT_PUBLIC_FIREBASE_*` client keys and the
   `FIREBASE_ADMIN_*` service-account keys (Firebase console → Project settings →
   Service accounts → *Generate new private key*). Keep
   `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
3. Optional per feature:
   - **Confirmation emails:** `GMAIL_USER` + `GMAIL_APP_PASSWORD` (a Google
     *App Password*, needs 2-Step Verification). Blank = emails are skipped.
   - **QR check-in signing:** `CHECKIN_SECRET` (any random 32+ char string). Blank
     falls back to the Firebase admin key; the scanner shows a banner if unset.
   - **Payments:** `RAZORPAY_*` (the flow is currently a "pay at venue" bypass).
4. Seed the three screens into Firestore (one-time):
   ```bash
   npm run seed
   ```
5. Run it:
   ```bash
   npm run dev      # http://localhost:3000
   npm run build    # production build (what Vercel runs)
   npm test         # unit tests
   ```

---

## 2. Vercel

### a. Import the project
Import the Git repo in Vercel. Framework preset auto-detects **Next.js** — no
`vercel.json` needed. Leave "Automatically expose System Environment Variables"
**on** (default) so `NEXT_PUBLIC_VERCEL_URL` is available.

### b. Environment variables (Project → Settings → Environment Variables)
Add every key from `.env.local.example`:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` (7) | All | Client Firebase config (public). |
| `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | All | Service account. See private-key note below. |
| `ADMIN_PASSWORD` | All | Admin-panel login password (password-only). |
| `ADMIN_SESSION_SECRET` | All | Long random string; signs the admin session cookie (falls back to the Firebase admin key if unset). |
| `ADMIN_EMAIL` | All | Recipient/sender for booking-notification emails (no longer controls login). |
| `RAZORPAY_*` | All | Optional while payments are bypassed. |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `EMAIL_FROM` | All | Confirmation emails. |
| `CHECKIN_SECRET` | All | Random 32+ chars for QR signing. |
| `NEXT_PUBLIC_APP_URL` | **Production only** | Your custom domain, e.g. `https://letsvibe.in`. **Leave unset for Preview** so each preview uses its own URL. |

**`FIREBASE_ADMIN_PRIVATE_KEY`:** paste the full key *including* the
`-----BEGIN/END PRIVATE KEY-----` lines. Either paste it with real newlines, or
keep the `\n` escapes — the app normalizes `\n` → newline in
`src/lib/firebase/admin.ts`. Don't wrap it in extra quotes.

### c. Firebase Console (required for auth + uploads)
- **Authentication → Settings → Authorized domains:** add your Vercel domains
  (`your-app.vercel.app`, and your custom domain). Google sign-in (customer
  booking) **fails on unlisted domains**. (Admin login is username/password and
  is domain-independent.) Per-deployment preview URLs are unique — for stable
  preview testing, add a
  [preview alias domain](https://vercel.com/docs/deployments/preview-deployments)
  and authorize that, or test auth on the production/alias URL.
- **Storage — enable it once:** Firebase console → **Storage → Get started**
  (provisions the default bucket). Screen photos/videos, receipts, UPI QR, and
  payment proofs all upload here. Confirm the bucket matches
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`. Deploy `storage.rules` (client access is
  denied — all uploads go through the server-side Admin SDK).
- **Firestore rules:** deploy `firestore.rules` (the admin pages + booking form
  depend on them).

### d. After deploy — smoke test
1. Open the deployment URL → homepage renders, `/book` lists the three rooms.
2. `/admin` → password sign-in works (`ADMIN_PASSWORD`).
3. Make a test booking → confirmation screen shows a QR; the email arrives (if
   Gmail is set) with a working "View your booking" link.
4. In `/admin/check-in`, scan that QR (or open it on your phone) → it resolves to
   the verify page on the **same deployment** and you can Admit. If the QR points
   at `localhost`, `NEXT_PUBLIC_APP_URL` is misconfigured for that environment.

> Tip (Mumbai latency): you can pin Vercel functions to the `bom1` region in
> Project → Settings → Functions if your Firestore is in `asia-south1`.
