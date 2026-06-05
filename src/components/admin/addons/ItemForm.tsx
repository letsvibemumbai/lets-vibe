"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAddonItemAction,
  deleteAddonItemAction,
  updateAddonItemAction,
} from "@/app/actions/addons";
import type { AddonItem } from "@/types";

type Props = {
  /** When undefined, the form creates a new item. */
  item?: AddonItem;
};

export function ItemForm({ item }: Props) {
  const router = useRouter();
  const isEditing = !!item;
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [category, setCategory] = useState(item?.category ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [maxQuantity, setMaxQuantity] = useState(item?.maxQuantity ?? 1);
  const [active, setActive] = useState(item?.active ?? true);
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 100);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Math.max(0, Math.round(price)),
      category: category.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      maxQuantity: Math.max(1, Math.min(99, Math.round(maxQuantity))),
      active,
      sortOrder: Math.max(0, Math.min(9999, Math.round(sortOrder))),
    };
    startTransition(async () => {
      try {
        if (isEditing && item) {
          await updateAddonItemAction(item.id, payload);
          toast.success("Item updated");
          router.refresh();
        } else {
          await createAddonItemAction(payload);
          toast.success("Item created");
          router.push("/admin/addons");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function onDelete() {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteAddonItemAction(item.id);
      toast.success("Item deleted");
      router.push("/admin/addons");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="Chocolate cake"
            />
          </Field>
          <Field id="category" label="Category (optional)">
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={40}
              placeholder="Cake, Decoration, Snack…"
            />
          </Field>
        </div>
        <Field id="description" label="Description (optional)">
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Short blurb shown to customers on the booking form."
          />
        </Field>
      </Section>

      <Section title="Pricing & limits">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="price" label="Price (₹)">
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field id="maxQuantity" label="Max per booking">
            <Input
              id="maxQuantity"
              type="number"
              min={1}
              max={99}
              value={maxQuantity}
              onChange={(e) =>
                setMaxQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
            />
            <p className="text-xs text-foreground/55">
              1 renders as a checkbox; &gt;1 renders as a +/− stepper.
            </p>
          </Field>
          <Field id="sortOrder" label="Sort order">
            <Input
              id="sortOrder"
              type="number"
              min={0}
              max={9999}
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))
              }
            />
            <p className="text-xs text-foreground/55">Lower numbers appear first.</p>
          </Field>
        </div>
      </Section>

      <Section title="Image (optional)">
        <Field id="imageUrl" label="Image URL">
          <Input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </Section>

      <Section title="Visibility">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Active</span>
            <span className="block text-xs text-foreground/55">
              Inactive items are hidden from the booking form but kept in the
              database (and remain on existing bookings).
            </span>
          </span>
        </label>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isEditing ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            disabled={pending || deleting}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending || deleting}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEditing ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <header className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
