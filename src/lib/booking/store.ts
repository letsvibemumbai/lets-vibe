"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BookingAddonSelection, Duration, ScreenId } from "@/types";

export type CustomerDetails = {
  name: string;
  phone: string;
  email?: string;
  guestCount: number;
};

/**
 * Booking-draft add-on shape. `selections` is the canonical source from the
 * dynamic catalogue; `decorations` is a free-text note.
 */
export type AddOns = {
  selections?: BookingAddonSelection[];
  decorations?: string;
};

type BookingDraft = {
  screenId?: ScreenId;
  date?: string;
  duration?: Duration;
  startTime?: string;
  endTime?: string;
  customer?: CustomerDetails;
  addOns: AddOns;
  amount?: number;
};

type BookingActions = {
  setScreen: (id: ScreenId) => void;
  setSlot: (date: string, duration: Duration, startTime: string, endTime: string) => void;
  setCustomer: (customer: CustomerDetails) => void;
  setAddOns: (addOns: AddOns) => void;
  setAmount: (amount: number) => void;
  reset: () => void;
};

const initial: BookingDraft = {
  screenId: undefined,
  date: undefined,
  duration: undefined,
  startTime: undefined,
  endTime: undefined,
  customer: undefined,
  addOns: {},
  amount: undefined,
};

export const useBookingStore = create<BookingDraft & BookingActions>()(
  persist(
    (set) => ({
      ...initial,
      setScreen: (screenId) =>
        set((s) =>
          s.screenId === screenId
            ? { screenId }
            : {
                ...initial,
                screenId,
              },
        ),
      setSlot: (date, duration, startTime, endTime) =>
        set({ date, duration, startTime, endTime }),
      setCustomer: (customer) => set({ customer }),
      setAddOns: (addOns) => set({ addOns }),
      setAmount: (amount) => set({ amount }),
      reset: () => set(initial),
    }),
    {
      name: "letsvibe.booking",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : window.sessionStorage,
      ),
    },
  ),
);
