import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getScreen } from "@/lib/db/screens.server";
import { isScreenId } from "@/lib/booking/constants";
import { ScreenEditForm } from "@/components/admin/screens/ScreenEditForm";

export const metadata = { title: "Edit screen · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminScreenEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) notFound();
  const screen = await getScreen(id);
  if (!screen) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/admin/screens"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to screens
      </Link>
      <header>
        <h1 className="font-display text-4xl text-foreground">{screen.name}</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Update pricing, hours, image, and blocked dates.
        </p>
      </header>
      <ScreenEditForm screen={screen} />
    </div>
  );
}
