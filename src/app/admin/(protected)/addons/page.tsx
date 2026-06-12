import Link from "next/link";
import { PackagePlus, Plus, Sparkles } from "lucide-react";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import { SCREEN_IDS } from "@/lib/booking/constants";
import { SCREEN_LABEL } from "@/components/admin/dashboard/utils";
import type { AddonItem, AddonPackage } from "@/types";

export const metadata = { title: "Add-ons · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAddonsPage() {
  const [items, packages] = await Promise.all([
    listAddonItems(),
    listAddonPackages(),
  ]);
  const itemsById = new Map(items.map((i) => [i.id, i] as const));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="font-display text-4xl text-foreground">Add-ons</h1>
        <p className="mt-1 text-sm text-foreground/55">
          À la carte items and packages offered at checkout. Edit anything,
          toggle visibility, or reorder.
        </p>
      </header>

      {/* Packages */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl text-foreground">
              <PackagePlus className="h-5 w-5 text-foreground/70" />
              Packages
            </h2>
            <p className="mt-1 text-xs text-foreground/55">
              Curated bundles or standalone hero offers.
            </p>
          </div>
          <Link
            href="/admin/addons/packages/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-cream hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            New package
          </Link>
        </div>

        {packages.length === 0 ? (
          <EmptyCard
            message="No packages yet."
            cta="Create your first package"
            href="/admin/addons/packages/new"
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {packages.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} itemsById={itemsById} />
            ))}
          </ul>
        )}
      </section>

      {/* Items */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl text-foreground">
              <Sparkles className="h-5 w-5 text-foreground/70" />
              À la carte items
            </h2>
            <p className="mt-1 text-xs text-foreground/55">
              Single line items customers can tick on the booking form.
            </p>
          </div>
          <Link
            href="/admin/addons/items/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-cream hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" />
            New item
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyCard
            message="No items yet."
            cta="Create your first item"
            href="/admin/addons/items/new"
          />
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-3xl bg-card ring-1 ring-hairline">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ItemRow({ item }: { item: AddonItem }) {
  return (
    <li>
      <Link
        href={`/admin/addons/items/${item.id}`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
            {!item.active && (
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/55">
                inactive
              </span>
            )}
            {item.category && (
              <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/55">
                {item.category}
              </span>
            )}
            {!!item.screenIds?.length && (
              <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/55">
                {item.screenIds.map((id) => SCREEN_LABEL[id]).join(" · ")} only
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-foreground/55">
              {item.description}
            </p>
          )}
        </div>
        <div className="hidden text-right text-xs text-foreground/55 sm:block">
          max {item.maxQuantity} · order {item.sortOrder}
        </div>
        <div className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          ₹{item.price.toLocaleString("en-IN")}
        </div>
      </Link>
    </li>
  );
}

function PackageRow({
  pkg,
  itemsById,
}: {
  pkg: AddonPackage;
  itemsById: Map<string, AddonItem>;
}) {
  const bundleSubtitle =
    pkg.kind === "bundle"
      ? pkg.itemIds
          .map((id) => itemsById.get(id)?.name)
          .filter(Boolean)
          .join(" · ")
      : "Standalone offer";
  const priceOverrides = SCREEN_IDS.flatMap((id) => {
    const value = pkg.priceByScreen?.[id];
    return typeof value === "number" ? [{ id, value }] : [];
  });

  return (
    <li>
      <Link
        href={`/admin/addons/packages/${pkg.id}`}
        className="block rounded-3xl bg-card p-5 ring-1 ring-hairline transition-colors hover:bg-cream/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {pkg.name}
              </p>
              {pkg.featured && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">
                  featured
                </span>
              )}
              {pkg.includesAddons && (
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream">
                  experience
                </span>
              )}
              {!pkg.active && (
                <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/55">
                  inactive
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-foreground/45">
              {pkg.kind}
            </p>
          </div>
          <div className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
            ₹{pkg.price.toLocaleString("en-IN")}
            {priceOverrides.length > 0 && (
              <span className="font-normal text-foreground/55">
                {priceOverrides
                  .map((o) => ` · ${o.id} ₹${o.value.toLocaleString("en-IN")}`)
                  .join("")}
              </span>
            )}
          </div>
        </div>
        {pkg.description && (
          <p className="mt-2 line-clamp-2 text-xs text-foreground/65">
            {pkg.description}
          </p>
        )}
        {bundleSubtitle && (
          <p className="mt-2 line-clamp-1 text-xs text-foreground/55">
            {bundleSubtitle}
          </p>
        )}
      </Link>
    </li>
  );
}

function EmptyCard({
  message,
  cta,
  href,
}: {
  message: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-10 text-center">
      <p className="text-sm text-foreground/65">{message}</p>
      <Link
        href={href}
        className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}
