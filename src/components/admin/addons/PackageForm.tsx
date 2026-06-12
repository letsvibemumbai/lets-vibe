"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAddonPackageAction,
  deleteAddonPackageAction,
  updateAddonPackageAction,
} from "@/app/actions/addons";
import { SCREEN_IDS } from "@/lib/booking/constants";
import { SCREEN_LABEL } from "@/components/admin/dashboard/utils";
import type { AddonItem, AddonPackage, ScreenId } from "@/types";

type Props = {
  /** When undefined, the form creates a new package. */
  pkg?: AddonPackage;
  /** All items available to reference from a bundle. */
  items: AddonItem[];
};

type Kind = "bundle" | "standalone";

export function PackageForm({ pkg, items }: Props) {
  const router = useRouter();
  const isEditing = !!pkg;
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(pkg?.name ?? "");
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [price, setPrice] = useState(pkg?.price ?? 0);
  const [imageUrl, setImageUrl] = useState(pkg?.imageUrl ?? "");
  const [kind, setKind] = useState<Kind>(pkg?.kind ?? "standalone");
  const [itemIds, setItemIds] = useState<string[]>(pkg?.itemIds ?? []);
  const [active, setActive] = useState(pkg?.active ?? true);
  const [featured, setFeatured] = useState(pkg?.featured ?? false);
  const [includesAddons, setIncludesAddons] = useState(pkg?.includesAddons ?? false);
  const [sortOrder, setSortOrder] = useState(pkg?.sortOrder ?? 100);
  // Per-room price overrides kept as strings so blank = "use base price".
  const [priceByScreen, setPriceByScreen] = useState<Partial<Record<ScreenId, string>>>(
    () => {
      const initial: Partial<Record<ScreenId, string>> = {};
      for (const id of SCREEN_IDS) {
        const override = pkg?.priceByScreen?.[id];
        if (typeof override === "number") initial[id] = String(override);
      }
      return initial;
    },
  );

  function setScreenPrice(id: ScreenId, value: string) {
    setPriceByScreen((prev) => ({ ...prev, [id]: value }));
  }

  const itemTotal = useMemo(() => {
    if (kind !== "bundle") return 0;
    return items
      .filter((i) => itemIds.includes(i.id))
      .reduce((sum, i) => sum + i.price, 0);
  }, [kind, itemIds, items]);

  function toggleItem(id: string, checked: boolean) {
    setItemIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (kind === "bundle" && itemIds.length === 0) {
      toast.error("Pick at least one item for a bundle package");
      return;
    }
    const priceOverrides: Partial<Record<ScreenId, number>> = {};
    for (const id of SCREEN_IDS) {
      const raw = (priceByScreen[id] ?? "").trim();
      if (!raw) continue;
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) {
        priceOverrides[id] = Math.round(value);
      }
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Math.max(0, Math.round(price)),
      imageUrl: imageUrl.trim() || undefined,
      kind,
      itemIds: kind === "bundle" ? itemIds : [],
      active,
      featured: featured || undefined,
      includesAddons,
      priceByScreen: priceOverrides,
      sortOrder: Math.max(0, Math.min(9999, Math.round(sortOrder))),
    };
    startTransition(async () => {
      try {
        if (isEditing && pkg) {
          await updateAddonPackageAction(pkg.id, payload);
          toast.success("Package updated");
          router.refresh();
        } else {
          await createAddonPackageAction(payload);
          toast.success("Package created");
          router.push("/admin/addons");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function onDelete() {
    if (!pkg) return;
    if (!confirm(`Delete "${pkg.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteAddonPackageAction(pkg.id);
      toast.success("Package deleted");
      router.push("/admin/addons");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identity">
        <Field id="name" label="Name">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Celebration"
          />
        </Field>
        <Field id="description" label="Description (optional)">
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Cake, balloons, lights, fog — the room is dressed before you arrive."
          />
        </Field>
      </Section>

      <Section title="Type">
        <div className="grid gap-3 sm:grid-cols-2">
          <KindOption
            value="standalone"
            current={kind}
            onChange={setKind}
            title="Standalone"
            body="Just a name + price + description. No item references."
          />
          <KindOption
            value="bundle"
            current={kind}
            onChange={setKind}
            title="Bundle of items"
            body="Pick items below. The package price overrides their sum."
          />
        </div>
      </Section>

      {kind === "bundle" ? (
        <Section title="Items in this bundle">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-4 py-6 text-center text-sm text-foreground/55">
              No items yet. Create some à la carte items first.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => {
                const checked = itemIds.includes(it.id);
                return (
                  <li
                    key={it.id}
                    className="flex items-start gap-3 rounded-2xl border border-hairline bg-card p-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleItem(it.id, e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {it.name}
                        {!it.active && (
                          <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/55">
                            inactive
                          </span>
                        )}
                      </p>
                      {it.description && (
                        <p className="truncate text-xs text-foreground/55">
                          {it.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-foreground/65">
                      ₹{it.price.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {itemIds.length > 0 && (
            <p className="mt-3 text-xs text-foreground/55">
              Items total ₹{itemTotal.toLocaleString("en-IN")} — package price
              overrides this sum on the booking form.
            </p>
          )}
        </Section>
      ) : null}

      <Section title="Price & order">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="price" label="Price (₹)">
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
            />
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
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SCREEN_IDS.map((id) => (
            <Field
              key={id}
              id={`price-${id}`}
              label={`${SCREEN_LABEL[id]} price (₹, optional)`}
            >
              <Input
                id={`price-${id}`}
                type="number"
                min={0}
                value={priceByScreen[id] ?? ""}
                onChange={(e) => setScreenPrice(id, e.target.value)}
                placeholder={`${price}`}
              />
            </Field>
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground/55">
          Set a different price per room — e.g. Celebration costs more in the
          Forest. Blank = use base price.
        </p>
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
        <div className="space-y-3">
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
                Inactive packages are hidden from the booking form.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Star className="h-3.5 w-3.5" /> Featured
              </span>
              <span className="block text-xs text-foreground/55">
                Highlighted on the booking form (visual emphasis only).
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={includesAddons}
              onChange={(e) => setIncludesAddons(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Experience package (includes
                all decoration add-ons)
              </span>
              <span className="block text-xs text-foreground/55">
                Shown in the booking form&apos;s &ldquo;Choose your
                experience&rdquo; selector next to the plain Movie option.
                Customers picking it can&apos;t add à la carte items —
                they&apos;re included.
              </span>
            </span>
          </label>
        </div>
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
          {isEditing ? "Save changes" : "Create package"}
        </Button>
      </div>
    </form>
  );
}

function KindOption({
  value,
  current,
  onChange,
  title,
  body,
}: {
  value: Kind;
  current: Kind;
  onChange: (k: Kind) => void;
  title: string;
  body: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={
        "flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors " +
        (selected
          ? "border-foreground bg-foreground/5"
          : "border-hairline-strong bg-card hover:border-foreground/40")
      }
    >
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-foreground/60">{body}</span>
    </button>
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
