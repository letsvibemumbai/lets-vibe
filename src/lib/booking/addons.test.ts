import { describe, expect, it } from "vitest";
import type {
  AddonItem,
  AddonPackage,
  BookingAddonSelection,
} from "@/types";
import {
  effectivePackagePrice,
  experienceName,
  itemAvailableOnScreen,
  packageContentsForScreen,
  reconcileSelectionsForScreen,
  resolveSelectionsAgainstCatalog,
  type AddonCatalog,
} from "./addons";

function makeItem(overrides: Partial<AddonItem> = {}): AddonItem {
  return {
    id: "cake",
    name: "Cake",
    price: 400,
    maxQuantity: 1,
    active: true,
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makePackage(overrides: Partial<AddonPackage> = {}): AddonPackage {
  return {
    id: "celebration",
    name: "Celebration",
    price: 1500,
    kind: "bundle",
    itemIds: [],
    active: true,
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeCatalog(items: AddonItem[], packages: AddonPackage[]): AddonCatalog {
  const itemById = new Map(items.map((i) => [i.id, i]));
  const pkgById = new Map(packages.map((p) => [p.id, p]));
  return {
    getItem: async (id) => itemById.get(id) ?? null,
    getPackage: async (id) => pkgById.get(id) ?? null,
  };
}

const ROSE_PETALS = makeItem({
  id: "rose-petals",
  name: "Rose petals",
  screenIds: ["forest"],
});
const CELEBRATION = makePackage({
  includesAddons: true,
  priceByScreen: { forest: 2000 },
});

describe("effectivePackagePrice", () => {
  it("uses the per-screen override when set", () => {
    expect(effectivePackagePrice(CELEBRATION, "forest")).toBe(2000);
  });

  it("falls back to the base price when the screen has no override", () => {
    expect(effectivePackagePrice(CELEBRATION, "beach")).toBe(1500);
  });

  it("uses the base price when no screen is given", () => {
    expect(effectivePackagePrice(CELEBRATION)).toBe(1500);
  });
});

describe("itemAvailableOnScreen", () => {
  it("absent screenIds means all screens", () => {
    const item = makeItem();
    expect(itemAvailableOnScreen(item, "beach")).toBe(true);
    expect(itemAvailableOnScreen(item, "grass")).toBe(true);
    expect(itemAvailableOnScreen(item, "forest")).toBe(true);
  });

  it("empty screenIds means all screens", () => {
    const item = makeItem({ screenIds: [] });
    expect(itemAvailableOnScreen(item, "beach")).toBe(true);
    expect(itemAvailableOnScreen(item, "forest")).toBe(true);
  });

  it("restricted items are only available on their listed screens", () => {
    expect(itemAvailableOnScreen(ROSE_PETALS, "forest")).toBe(true);
    expect(itemAvailableOnScreen(ROSE_PETALS, "beach")).toBe(false);
    expect(itemAvailableOnScreen(ROSE_PETALS, "grass")).toBe(false);
  });
});

describe("packageContentsForScreen", () => {
  const cake = makeItem();
  const bundle = makePackage({ itemIds: ["cake", "rose-petals"] });

  it("excludes screen-restricted items on other screens", () => {
    const contents = packageContentsForScreen(bundle, [cake, ROSE_PETALS], "beach");
    expect(contents.map((i) => i.id)).toEqual(["cake"]);
  });

  it("includes screen-restricted items on their screen", () => {
    const contents = packageContentsForScreen(bundle, [cake, ROSE_PETALS], "forest");
    expect(contents.map((i) => i.id)).toEqual(["cake", "rose-petals"]);
  });

  it("standalone packages have no contents", () => {
    const standalone = makePackage({ kind: "standalone", itemIds: [] });
    expect(packageContentsForScreen(standalone, [cake], "forest")).toEqual([]);
  });
});

describe("experienceName", () => {
  it("returns the experience selection's name when flagged", () => {
    expect(
      experienceName({
        selections: [
          { kind: "package", id: "celebration", name: "Celebration", unitPrice: 2000, quantity: 1, experience: true },
        ],
      }),
    ).toBe("Celebration");
  });

  it("falls back to Movie when no selection carries the flag", () => {
    expect(
      experienceName({
        selections: [
          { kind: "item", id: "cake", name: "Cake", unitPrice: 400, quantity: 1 },
        ],
      }),
    ).toBe("Movie");
  });

  it("falls back to Movie when addOns is undefined", () => {
    expect(experienceName(undefined)).toBe("Movie");
  });
});

describe("reconcileSelectionsForScreen", () => {
  const items = [makeItem(), ROSE_PETALS];
  const packages = [CELEBRATION];

  it("forest→beach drops rose petals and re-prices the package", () => {
    const selections: BookingAddonSelection[] = [
      { kind: "package", id: "celebration", name: "Celebration", unitPrice: 2000, quantity: 1, experience: true },
      { kind: "item", id: "rose-petals", name: "Rose petals", unitPrice: 400, quantity: 1 },
    ];
    const result = reconcileSelectionsForScreen(selections, items, packages, "beach");
    expect(result.removed).toEqual(["Rose petals"]);
    expect(result.selections).toHaveLength(1);
    expect(result.selections[0]).toMatchObject({ id: "celebration", unitPrice: 1500 });
  });

  it("beach→forest re-prices the package and drops nothing", () => {
    const selections: BookingAddonSelection[] = [
      { kind: "package", id: "celebration", name: "Celebration", unitPrice: 1500, quantity: 1, experience: true },
    ];
    const result = reconcileSelectionsForScreen(selections, items, packages, "forest");
    expect(result.removed).toEqual([]);
    expect(result.selections).toHaveLength(1);
    expect(result.selections[0]).toMatchObject({ id: "celebration", unitPrice: 2000 });
  });
});

describe("resolveSelectionsAgainstCatalog", () => {
  it("snapshots the per-screen price and the experience flag", async () => {
    const catalog = makeCatalog([], [CELEBRATION]);
    const resolved = await resolveSelectionsAgainstCatalog(
      [{ kind: "package", id: "celebration", quantity: 1 }],
      "forest",
      catalog,
    );
    expect(resolved).toEqual([
      {
        kind: "package",
        id: "celebration",
        name: "Celebration",
        unitPrice: 2000,
        quantity: 1,
        experience: true,
      },
    ]);
  });

  it("rejects an inactive item unless allowInactive is set", async () => {
    const catalog = makeCatalog([makeItem({ active: false })], []);
    await expect(
      resolveSelectionsAgainstCatalog(
        [{ kind: "item", id: "cake", quantity: 1 }],
        "beach",
        catalog,
      ),
    ).rejects.toThrow("ADDON_ITEM_UNAVAILABLE:cake");

    const resolved = await resolveSelectionsAgainstCatalog(
      [{ kind: "item", id: "cake", quantity: 1 }],
      "beach",
      catalog,
      { allowInactive: true },
    );
    expect(resolved[0]).toMatchObject({ id: "cake", unitPrice: 400 });
  });

  it("rejects screen-restricted items only when enforcement is on", async () => {
    const catalog = makeCatalog([ROSE_PETALS], []);
    await expect(
      resolveSelectionsAgainstCatalog(
        [{ kind: "item", id: "rose-petals", quantity: 1 }],
        "beach",
        catalog,
        { enforceScreenAvailability: true },
      ),
    ).rejects.toThrow("ADDON_ITEM_UNAVAILABLE_ON_SCREEN:rose-petals");

    const resolved = await resolveSelectionsAgainstCatalog(
      [{ kind: "item", id: "rose-petals", quantity: 1 }],
      "beach",
      catalog,
    );
    expect(resolved[0]).toMatchObject({ id: "rose-petals", name: "Rose petals" });
  });

  it("throws ADDON_EXPERIENCE_CONFLICT when an experience package is mixed with items", async () => {
    const catalog = makeCatalog([makeItem()], [CELEBRATION]);
    await expect(
      resolveSelectionsAgainstCatalog(
        [
          { kind: "package", id: "celebration", quantity: 1 },
          { kind: "item", id: "cake", quantity: 1 },
        ],
        "forest",
        catalog,
      ),
    ).rejects.toThrow("ADDON_EXPERIENCE_CONFLICT");
  });

  it("throws ADDON_EXPERIENCE_CONFLICT for two experience packages", async () => {
    const deluxe = makePackage({ id: "deluxe", name: "Deluxe", includesAddons: true });
    const catalog = makeCatalog([], [CELEBRATION, deluxe]);
    await expect(
      resolveSelectionsAgainstCatalog(
        [
          { kind: "package", id: "celebration", quantity: 1 },
          { kind: "package", id: "deluxe", quantity: 1 },
        ],
        "forest",
        catalog,
      ),
    ).rejects.toThrow("ADDON_EXPERIENCE_CONFLICT");
  });

  it("clamps item quantity to maxQuantity", async () => {
    const catalog = makeCatalog([makeItem({ maxQuantity: 3 })], []);
    const resolved = await resolveSelectionsAgainstCatalog(
      [{ kind: "item", id: "cake", quantity: 5 }],
      "beach",
      catalog,
    );
    expect(resolved[0]?.quantity).toBe(3);
  });

  it("returns [] for empty requests", async () => {
    const catalog = makeCatalog([], []);
    await expect(
      resolveSelectionsAgainstCatalog([], "beach", catalog),
    ).resolves.toEqual([]);
  });
});
