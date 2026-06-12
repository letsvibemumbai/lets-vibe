"use client";

import { Check, Minus, Plus } from "lucide-react";
import {
  effectivePackagePrice,
  isExperiencePackage,
  itemAvailableOnScreen,
  packageContentsForScreen,
} from "@/lib/booking/addons";
import { cn } from "@/lib/utils";
import type {
  AddonItem,
  AddonPackage,
  BookingAddonSelection,
  ScreenId,
} from "@/types";

export type AddOnsPickerProps = {
  items: AddonItem[];
  packages: AddonPackage[];
  value: BookingAddonSelection[];
  onChange: (next: BookingAddonSelection[]) => void;
  /** Compact rendering for admin forms. Drops the section heading + intro. */
  compact?: boolean;
  /** Screen the booking is for. Filters screen-restricted items and applies
   * per-screen package pricing. Absent ⇒ no filtering, base prices. */
  screenId?: ScreenId;
};

function keyOf(kind: "item" | "package", id: string): string {
  return `${kind}:${id}`;
}

export function AddOnsPicker({
  items,
  packages,
  value,
  onChange,
  screenId,
}: AddOnsPickerProps) {
  const selectionsByKey = new Map(value.map((s) => [keyOf(s.kind, s.id), s]));

  const experiencePackages = packages.filter(isExperiencePackage);
  const regularPackages = packages.filter((p) => !isExperiencePackage(p));
  const experienceIds = new Set(experiencePackages.map((p) => p.id));
  const selectedExperience =
    experiencePackages.find((p) =>
      selectionsByKey.has(keyOf("package", p.id)),
    ) ?? null;

  // A selection counts as an experience if it carries the snapshot flag OR its
  // id matches a current experience package (legacy selections without the flag).
  function isExperienceSelection(sel: BookingAddonSelection): boolean {
    return (
      sel.experience === true ||
      (sel.kind === "package" && experienceIds.has(sel.id))
    );
  }

  // Hide items not offered on this screen, but keep ones already selected
  // (admin edits of legacy bookings) so they stay visible and removable.
  const visibleItems = screenId
    ? items.filter(
        (item) =>
          itemAvailableOnScreen(item, screenId) ||
          selectionsByKey.has(keyOf("item", item.id)),
      )
    : items;

  function replace(next: BookingAddonSelection[]) {
    onChange(next);
  }

  function setItemQty(item: AddonItem, qty: number) {
    const k = keyOf("item", item.id);
    const without = value.filter((s) => keyOf(s.kind, s.id) !== k);
    if (qty <= 0) return replace(without);
    const clamped = Math.min(qty, Math.max(1, item.maxQuantity));
    replace([
      ...without,
      {
        kind: "item",
        id: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: clamped,
      },
    ]);
  }

  function togglePackage(pkg: AddonPackage) {
    const k = keyOf("package", pkg.id);
    if (selectionsByKey.has(k)) {
      replace(value.filter((s) => keyOf(s.kind, s.id) !== k));
    } else {
      replace([
        ...value,
        {
          kind: "package",
          id: pkg.id,
          name: pkg.name,
          unitPrice: effectivePackagePrice(pkg, screenId),
          quantity: 1,
        },
      ]);
    }
  }

  function chooseExperience(pkg: AddonPackage | null) {
    if (pkg === null) {
      // Movie: keep à la carte / regular selections, drop any experience.
      replace(value.filter((s) => !isExperienceSelection(s)));
      return;
    }
    // Experience: à la carte items are included — drop them along with any
    // previously chosen experience, then snapshot the per-screen price.
    const kept = value.filter(
      (s) => s.kind !== "item" && !isExperienceSelection(s),
    );
    replace([
      ...kept,
      {
        kind: "package",
        id: pkg.id,
        name: pkg.name,
        unitPrice: effectivePackagePrice(pkg, screenId),
        quantity: 1,
        experience: true,
      },
    ]);
  }

  const featuredPackages = regularPackages.filter((p) => p.featured);
  const otherPackages = regularPackages.filter((p) => !p.featured);
  const hasAddOns = packages.length > 0 || items.length > 0;

  if (!hasAddOns) {
    return (
      <p className="border-y border-dashed border-hairline-strong px-4 py-6 text-center text-[13px] text-muted">
        No add-ons configured yet. Manage them in{" "}
        <a className="underline transition-colors hover:text-accent" href="/admin/addons">
          /admin/addons
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {experiencePackages.length > 0 && (
        <div>
          <h4 className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Choose your experience
          </h4>
          <div className="mt-4 space-y-3">
            <ExperienceOption
              selected={selectedExperience === null}
              onSelect={() => chooseExperience(null)}
              title="Movie"
              subtitle="Just the screening — room price only"
            />
            {experiencePackages.map((pkg) => {
              const includes = packageContentsForScreen(pkg, items, screenId)
                .map((i) => i.name)
                .join(" · ");
              return (
                <ExperienceOption
                  key={pkg.id}
                  selected={selectedExperience?.id === pkg.id}
                  onSelect={() => chooseExperience(pkg)}
                  title={pkg.name}
                  subtitle={pkg.description}
                  includes={includes || undefined}
                  amountLabel={`+₹${effectivePackagePrice(
                    pkg,
                    screenId,
                  ).toLocaleString("en-IN")}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {selectedExperience ? (
        <p className="text-[13px] text-muted">
          All decorations are included in {selectedExperience.name}.
        </p>
      ) : (
        <>
          {featuredPackages.length > 0 && (
            <PackageGroup
              heading="Featured packages"
              packages={featuredPackages}
              screenId={screenId}
              selectionsByKey={selectionsByKey}
              onToggle={togglePackage}
            />
          )}

          {otherPackages.length > 0 && (
            <PackageGroup
              heading={featuredPackages.length > 0 ? "More packages" : "Packages"}
              packages={otherPackages}
              screenId={screenId}
              selectionsByKey={selectionsByKey}
              onToggle={togglePackage}
            />
          )}

          {visibleItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                À la carte
              </h4>
              <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    <ItemRow
                      item={item}
                      quantity={
                        selectionsByKey.get(keyOf("item", item.id))?.quantity ?? 0
                      }
                      offScreen={
                        screenId !== undefined &&
                        !itemAvailableOnScreen(item, screenId)
                      }
                      onChange={(qty) => setItemQty(item, qty)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExperienceOption({
  selected,
  onSelect,
  title,
  subtitle,
  includes,
  amountLabel,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  includes?: string;
  amountLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-sm border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-ink bg-ink/[0.03]"
          : "border-hairline-strong hover:border-ink/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-ink bg-ink text-cream" : "border-hairline-strong",
        )}
      >
        {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[14px] font-medium text-ink">{title}</span>
          {amountLabel && (
            <span className="shrink-0 tabular-nums text-[14px] text-ink">
              {amountLabel}
            </span>
          )}
        </span>
        {subtitle && (
          <span className="mt-1 block text-[12px] leading-[1.5] text-muted">
            {subtitle}
          </span>
        )}
        {includes && (
          <span className="mt-1 block text-[12px] leading-[1.5] text-muted">
            Includes: {includes}
          </span>
        )}
      </span>
    </button>
  );
}

function PackageGroup({
  heading,
  packages,
  screenId,
  selectionsByKey,
  onToggle,
}: {
  heading: string;
  packages: AddonPackage[];
  screenId?: ScreenId;
  selectionsByKey: Map<string, BookingAddonSelection>;
  onToggle: (pkg: AddonPackage) => void;
}) {
  return (
    <div>
      <h4 className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        {heading}
      </h4>
      <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
        {packages.map((pkg) => {
          const selected = selectionsByKey.has(keyOf("package", pkg.id));
          return (
            <li key={pkg.id}>
              <button
                type="button"
                onClick={() => onToggle(pkg)}
                className="group flex w-full items-start justify-between gap-5 py-5 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink">{pkg.name}</p>
                  {pkg.description && (
                    <p className="mt-1 text-[13px] leading-[1.65] text-muted">
                      {pkg.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="tabular-nums text-[14px] text-ink">
                    +₹{effectivePackagePrice(pkg, screenId).toLocaleString("en-IN")}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                      selected
                        ? "border-ink bg-ink text-cream"
                        : "border-hairline-strong bg-transparent group-hover:border-ink",
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={2.5} />}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemRow({
  item,
  quantity,
  offScreen,
  onChange,
}: {
  item: AddonItem;
  quantity: number;
  offScreen?: boolean;
  onChange: (qty: number) => void;
}) {
  const isCheckbox = item.maxQuantity <= 1;
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-ink">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 text-[12px] text-muted">{item.description}</p>
        )}
        <p className="mt-1 text-[12px] tabular-nums text-muted">
          +₹{item.price.toLocaleString("en-IN")}
          {item.maxQuantity > 1 ? " each" : ""}
        </p>
        {offScreen && (
          <p className="mt-1.5 inline-block border border-dashed border-hairline-strong px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
            Not offered on this screen
          </p>
        )}
      </div>
      {isCheckbox ? (
        <button
          type="button"
          onClick={() => onChange(quantity > 0 ? 0 : 1)}
          aria-pressed={quantity > 0}
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border transition-colors",
            quantity > 0
              ? "border-ink bg-ink text-cream"
              : "border-hairline-strong bg-transparent hover:border-ink",
          )}
        >
          {quantity > 0 && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
        </button>
      ) : (
        <div className="inline-flex shrink-0 items-center gap-2">
          <StepperButton
            onClick={() => onChange(Math.max(0, quantity - 1))}
            disabled={quantity <= 0}
            aria-label="Decrease"
          >
            <Minus className="h-3 w-3" strokeWidth={2} />
          </StepperButton>
          <span className="w-5 text-center text-[14px] tabular-nums text-ink">
            {quantity}
          </span>
          <StepperButton
            onClick={() => onChange(Math.min(item.maxQuantity, quantity + 1))}
            disabled={quantity >= item.maxQuantity}
            aria-label="Increase"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </StepperButton>
        </div>
      )}
    </div>
  );
}

function StepperButton({
  children,
  onClick,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-hairline-strong bg-transparent text-ink transition-colors hover:border-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
