import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ItemForm } from "@/components/admin/addons/ItemForm";

export const metadata = { title: "New item · Let's Vibe Admin" };

export default function NewAddonItemPage() {
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
        <h1 className="font-display text-4xl text-foreground">New item</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Single line items customers can tick at checkout (cake, decorations,
          snacks, etc).
        </p>
      </header>
      <ItemForm />
    </div>
  );
}
