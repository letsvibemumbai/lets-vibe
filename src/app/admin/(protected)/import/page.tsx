import { ImportPanel } from "@/components/admin/import/ImportPanel";

export const metadata = { title: "Import Excel · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Import Excel</h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground/55">
          Bulk-upload the standard{" "}
          <span className="font-medium text-foreground/75">Lets vibe.xlsx</span>{" "}
          workbook. Import is <span className="font-medium">add-new-only</span> —
          existing bookings and expenses are never touched or overwritten, only
          rows that don&apos;t exist yet are inserted.
        </p>
      </header>

      <ImportPanel />
    </div>
  );
}
