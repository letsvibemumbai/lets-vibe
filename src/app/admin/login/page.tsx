import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in · Let's Vibe" };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl">Let&rsquo;s Vibe</h1>
          <p className="mt-2 text-sm text-foreground/55">Admin sign-in</p>
        </div>

        <div className="mt-10 rounded-3xl bg-card p-8 ring-1 ring-hairline ">
          <LoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-foreground/45">
          Only the configured admin email can sign in.
        </p>
      </div>
    </div>
  );
}
