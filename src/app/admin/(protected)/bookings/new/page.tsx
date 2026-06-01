import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getScreens } from "@/lib/db/screens.server";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import { OfflineBookingForm } from "@/components/admin/bookings/OfflineForm";

export const metadata = { title: "New offline booking · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminNewBookingPage() {
  const [screens, items, packages] = await Promise.all([
    getScreens(),
    listAddonItems(),
    listAddonPackages(),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>
      <header>
        <h1 className="font-display text-4xl text-foreground">
          New offline booking
        </h1>
        <p className="mt-1 text-sm text-foreground/55">
          Walk-ins and phone bookings. Skips Razorpay; records cash/UPI/card/bank.
        </p>
      </header>
      <OfflineBookingForm screens={screens} items={items} packages={packages} />
    </div>
  );
}
