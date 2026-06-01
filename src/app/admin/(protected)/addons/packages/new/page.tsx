import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listAddonItems } from "@/lib/db/addons.server";
import { PackageForm } from "@/components/admin/addons/PackageForm";

export const metadata = { title: "New package · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function NewAddonPackagePage() {
  const items = await listAddonItems();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/addons"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to add-ons
      </Link>
      <header>
        <h1 className="font-display text-4xl text-foreground">New package</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Curated bundles (referencing items) or standalone hero offers.
        </p>
      </header>
      <PackageForm items={items} />
    </div>
  );
}
