# lets-vibe

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Magic UI.

## Stack

- **Framework**: Next.js 15.5 (App Router, Turbopack)
- **UI**: shadcn/ui (New York, neutral) + Magic UI
- **Styling**: Tailwind CSS 4 with brand palette (white / pink / yellow / cream)
- **Fonts**: Inter (sans) + Playfair Display (`font-display` for headings)
- **Animation**: motion (Framer Motion) + GSAP
- **Forms**: react-hook-form + zod (+ `@hookform/resolvers`)
- **Auth & data**: Firebase (client + admin)
- **Payments**: Razorpay (server SDK + checkout.js loaded client-side)

## Quick start

```bash
npm install
cp .env.local.example .env.local
# fill in the keys (see below)
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Copy `.env.local.example` → `.env.local` and fill in:

### Firebase (client)

1. Create a project at <https://console.firebase.google.com/>.
2. Add a Web app — Project settings → "Your apps" → `</>`.
3. Copy the config object into the `NEXT_PUBLIC_FIREBASE_*` vars.

### Firebase Admin (server)

1. Project settings → **Service accounts** → "Generate new private key".
2. From the downloaded JSON:
   - `FIREBASE_ADMIN_PROJECT_ID` ← `project_id`
   - `FIREBASE_ADMIN_CLIENT_EMAIL` ← `client_email`
   - `FIREBASE_ADMIN_PRIVATE_KEY` ← `private_key` (keep the `\n` escapes; wrap in quotes)

Example:

```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Admin

`ADMIN_EMAIL` — the email of the user who should get admin access in-app.

### Razorpay

1. Sign up at <https://dashboard.razorpay.com/>.
2. **Settings → API Keys → Generate Test Key**.
3. `NEXT_PUBLIC_RAZORPAY_KEY_ID` ← `Key Id` (starts with `rzp_test_`).
4. `RAZORPAY_KEY_SECRET` ← `Key Secret` (server-only, never expose).
5. **Settings → Webhooks → Add New Webhook** — set `RAZORPAY_WEBHOOK_SECRET` to the secret you choose. Point the webhook to `${NEXT_PUBLIC_APP_URL}/api/razorpay/webhook` once that route exists.

### App

`NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` in dev, your prod URL in production.

## Scripts

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

## Project layout

```
src/
  app/                Next.js App Router pages & layouts
    layout.tsx        Root layout (fonts, html shell)
    globals.css       Tailwind 4 theme + brand palette
  components/
    ui/               shadcn/ui + Magic UI primitives
  lib/
    utils.ts          cn() helper
```

## Brand palette

Available as Tailwind utilities (`bg-`, `text-`, `border-`, …):

- `brand-white` (#FFFFFF)
- `brand-pink` (#FFC0CB) — placeholder; will be refined when the logo arrives
- `brand-yellow` (#FFE45C)
- `cream` (#FFFBF5) — soft page background

CSS custom properties are exposed on `:root` as `--brand-white`, `--brand-pink`, `--brand-yellow`, `--brand-cream`.

## Deployment

### Vercel

1. Push this repo to GitHub.
2. Go to <https://vercel.com/new> → **Import Project** → select the repo.
3. Framework preset: **Next.js** (auto-detected). Build command and output directory: leave defaults.
4. In the import wizard, expand **Environment Variables** and paste every key from `.env.local.example` (see the next section).
5. Click **Deploy**. The first build will fail if any env var is missing — fix and redeploy.

### Setting environment variables on Vercel

For each env var:

1. Project → **Settings** → **Environment Variables**.
2. Add the key and value, then pick which environments it applies to: **Production**, **Preview**, **Development**, or all three. Most vars should apply to all environments; the Razorpay keys are the main exception (use test keys for Preview/Development and live keys for Production — see below).
3. After adding/changing vars, redeploy: **Deployments → ⋮ → Redeploy**. Vercel does not auto-pick up env var changes for existing deployments.

Multi-line values (the Firebase Admin private key): paste the key with its `\n` escapes intact and wrap the whole value in double quotes, exactly as it appears in `.env.local`.

### Firestore security rules

The rules in [`firestore.rules`](./firestore.rules) gate everything by the admin email. Replace `ADMIN_EMAIL_PLACEHOLDER` with your real admin email before deploying — or, preferred, set a custom claim and switch `isAdmin()` to check `request.auth.token.admin == true` (the file comments explain how).

Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools     # one-time
firebase login                    # one-time
firebase use --add                # link this directory to your Firebase project
firebase deploy --only firestore:rules
```

Do this after every rules change. Server-side reads/writes via `firebase-admin` bypass these rules; they protect client-side access only.

### Firebase Storage

Receipt and screen-image uploads go to the default Storage bucket via `firebase-admin/storage`. No client-side Storage access is needed, so the default Storage rules are sufficient — we make uploaded objects publicly readable at random paths via the Admin SDK. The bucket name comes from `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

### Razorpay webhook URL

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. Webhook URL: `${NEXT_PUBLIC_APP_URL}/api/razorpay/webhook` — e.g. `https://your-domain.com/api/razorpay/webhook`.
3. Set **Secret** to whatever you used for `RAZORPAY_WEBHOOK_SECRET` (and vice versa — keep them identical).
4. Active events: **payment.captured** and **payment.authorized**.
5. Save. Razorpay will retry failures with exponential backoff, so the webhook is idempotent — it skips bookings whose payment ID it has already recorded, and never reopens a non-pending booking.

### Switching Razorpay from test → live

1. In Razorpay Dashboard, switch to **Live mode** (toggle in the top bar) and complete KYC if you haven't.
2. **Settings → API Keys** → Generate live keys. You'll get `rzp_live_…` instead of `rzp_test_…`.
3. On Vercel: change `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the **Production** environment only. Leave Preview/Development on the test keys so QA still uses the sandbox.
4. Re-create the webhook in live mode — Razorpay keeps test and live webhooks separate. Use a fresh `RAZORPAY_WEBHOOK_SECRET` (don't reuse the test secret) and update it on Vercel Production.
5. Redeploy production.

That's it — the code reads keys from env, so no code changes are needed to switch.

## Notes

- `toast` is no longer in the shadcn registry — it was replaced by `sonner`. Use `<Toaster />` from `@/components/ui/sonner` and `import { toast } from "sonner"`.
- Magic UI components were added via the shadcn registry (`npx shadcn@latest add https://magicui.design/r/<name>.json`); the standalone `magicui-cli` is currently broken.
- Drop your logo at `public/logo.png` and pass `<Logo src="/logo.png" />` in `Navbar`, `Footer`, `Sidebar`, etc — the component falls back to a wordmark when `src` is omitted, which is how the repo ships today.
