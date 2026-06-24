import { redirect } from "next/navigation";
import { Stepper } from "@/components/booking/Stepper";
import { PaymentClient } from "@/components/booking/PaymentClient";
import { isScreenId } from "@/lib/booking/constants";
import { getScreenResolved } from "@/lib/db/screens.server";
import { getPaymentSettings } from "@/lib/db/payment-settings.server";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Review & pay · Let's Vibe" };
export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) redirect("/book");
  const [screen, payment] = await Promise.all([
    getScreenResolved(id),
    getPaymentSettings(),
  ]);

  return (
    <>
      <Stepper current={4} screenId={id} />
      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <SectionLabel className="mb-5">Step 04 / Pay & confirm</SectionLabel>
          <DisplayHeading as="h1" size="md">
            Scan, pay, and you&rsquo;re set.
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          Pay by UPI with the QR on the right, upload your payment screenshot,
          and we&rsquo;ll confirm your booking by email shortly after.
        </p>
      </div>
      <PaymentClient screen={screen} payment={payment} />
    </>
  );
}
