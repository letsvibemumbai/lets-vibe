import { redirect } from "next/navigation";
import { Stepper } from "@/components/booking/Stepper";
import { AuthGateClient } from "@/components/booking/AuthGateClient";
import { isScreenId } from "@/lib/booking/constants";
import { getScreenResolved } from "@/lib/db/screens.server";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Continue · Let's Vibe" };
export const dynamic = "force-dynamic";

export default async function BookingAuthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) redirect("/book");
  const screen = await getScreenResolved(id);

  return (
    <>
      <Stepper current={3} screenId={id} />
      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <SectionLabel className="mb-5">Continue</SectionLabel>
          <DisplayHeading as="h1" size="md">
            One quick sign-in.
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          We hold your slot while you sign in, and use your Google profile to
          prefill the next step. Your booking on {screen.name} is already
          saved.
        </p>
      </div>
      <AuthGateClient screenId={id} />
    </>
  );
}
