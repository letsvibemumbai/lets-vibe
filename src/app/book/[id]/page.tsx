import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Stepper } from "@/components/booking/Stepper";
import { DateSlotPicker } from "@/components/booking/DateSlotPicker";
import { SCREEN_PRESETS, isScreenId } from "@/lib/booking/constants";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Choose a date · Let's Vibe" };

export default async function BookScreenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) redirect("/book");
  const screen = SCREEN_PRESETS[id];

  return (
    <>
      <Stepper current={2} screenId={id} />

      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Link
            href="/book"
            className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Change room
          </Link>
          <SectionLabel className="mb-5">Step 02 / Date & time</SectionLabel>
          <DisplayHeading as="h1" size="md">
            <span className="italic">{screen.name}.</span> When for?
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          Pick a date, choose how long, then take a slot. The room is held the
          moment payment confirms.
        </p>
      </div>

      <DateSlotPicker screen={screen} />
    </>
  );
}
