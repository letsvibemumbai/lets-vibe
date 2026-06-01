import { redirect } from "next/navigation";
import { Stepper } from "@/components/booking/Stepper";
import { PaymentClient } from "@/components/booking/PaymentClient";
import { SCREEN_PRESETS, isScreenId } from "@/lib/booking/constants";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Review & pay · Let's Vibe" };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) redirect("/book");
  const screen = SCREEN_PRESETS[id];

  return (
    <>
      <Stepper current={4} screenId={id} />
      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <SectionLabel className="mb-5">Step 04 / Confirm</SectionLabel>
          <DisplayHeading as="h1" size="md">
            One last look.
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          Check the details below, then lock in your evening. You can settle up
          at the venue.
        </p>
      </div>
      <PaymentClient screen={screen} />
    </>
  );
}
