import { redirect } from "next/navigation";
import { Stepper } from "@/components/booking/Stepper";
import { DetailsForm } from "@/components/booking/DetailsForm";
import { isScreenId } from "@/lib/booking/constants";
import { getScreenResolved } from "@/lib/db/screens.server";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Your details · Let's Vibe" };
export const dynamic = "force-dynamic";

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) redirect("/book");
  const screen = await getScreenResolved(id);

  const [items, packages] = await Promise.all([
    listAddonItems({ activeOnly: true }),
    listAddonPackages({ activeOnly: true }),
  ]);

  return (
    <>
      <Stepper current={3} screenId={id} />
      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <SectionLabel className="mb-5">Step 03 / Details</SectionLabel>
          <DisplayHeading as="h1" size="md">
            A few details.
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          We use these to confirm your booking and reach you on the day. Nothing
          else.
        </p>
      </div>
      <DetailsForm screen={screen} items={items} packages={packages} />
    </>
  );
}
