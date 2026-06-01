import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAddonItem } from "@/lib/db/addons.server";
import { ItemForm } from "@/components/admin/addons/ItemForm";

export const metadata = { title: "Edit item · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function EditAddonItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAddonItem(id);
  if (!item) notFound();

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
        <h1 className="font-display text-4xl text-foreground">{item.name}</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Edit price, limits, image, or visibility.
        </p>
      </header>
      <ItemForm item={item} />
    </div>
  );
}
