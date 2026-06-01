import { Stepper } from "@/components/booking/Stepper";
import { BookScreenCard } from "@/components/booking/BookScreenCard";
import { AvailabilityChecker } from "@/components/booking/AvailabilityChecker";
import { SCREEN_IDS, SCREEN_PRESETS } from "@/lib/booking/constants";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata = {
  title: "Choose a room · Let's Vibe",
};

export default function BookStartPage() {
  return (
    <>
      <Stepper current={1} />

      <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <SectionLabel className="mb-5">Step 01 / Screen</SectionLabel>
          <DisplayHeading as="h1" size="md">
            Choose a room.
          </DisplayHeading>
        </div>
        <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
          Three private rooms. Each tuned for a different evening — pick by
          mood, not by the film. You can change it later.
        </p>
      </div>

      <div className="mb-12">
        <AvailabilityChecker variant="panel" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SCREEN_IDS.map((id) => {
          const screen = SCREEN_PRESETS[id];
          return (
            <BookScreenCard
              key={id}
              theme={id}
              name={screen.name}
              startingPrice={screen.basePrices["1h"]}
              href={`/book/${id}`}
              romanticBadge={id === "grass"}
            />
          );
        })}
      </div>
    </>
  );
}
