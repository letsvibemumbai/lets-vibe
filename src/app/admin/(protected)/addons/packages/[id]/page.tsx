import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAddonPackage, listAddonItems } from "@/lib/db/addons.server";
import { PackageForm } from "@/components/admin/addons/PackageForm";

export const metadata = { title: "Edit package · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function EditAddonPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, items] = await Promise.all([getAddonPackage(id), listAddonItems()]);
  if (!pkg) notFound();

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
        <h1 className="font-display text-4xl text-foreground">{pkg.name}</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Edit the package details, items, or visibility.
        </p>
      </header>
      <PackageForm pkg={pkg} items={items} />
    </div>
  );
}
