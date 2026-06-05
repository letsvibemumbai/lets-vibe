import { CallbackClient } from "@/components/admin/CallbackClient";

export const metadata = { title: "Signing in… · Let's Vibe" };
// Pulls in the Firebase client SDK, which reads runtime env. Don't prerender.
export const dynamic = "force-dynamic";

export default function AdminCallbackPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-card p-8 ring-1 ring-hairline ">
          <CallbackClient />
        </div>
      </div>
    </div>
  );
}
