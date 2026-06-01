"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  confirmMembership,
  getMembership,
  getMembershipConfig,
  requestMembership,
  revokeMembership,
  updateMembershipConfig,
} from "@/lib/db/membership.server";
import { getBookingsForUser } from "@/lib/db/bookings.server";
import type {
  Booking,
  Membership,
  MembershipConfig,
  MembershipStatus,
} from "@/types";

const UidSchema = z.string().trim().min(1).max(128);

// ---------------- public (signed-in guest) ----------------

export async function getMembershipConfigAction(): Promise<MembershipConfig> {
  return getMembershipConfig();
}

const RequestSchema = z.object({
  uid: UidSchema,
  email: z.string().email(),
  name: z.string().trim().max(120).optional(),
});

/**
 * Opt the signed-in user into the membership programme. Creates a `pending`
 * record an admin confirms after collecting the fee. NOTE: trusts the
 * client-supplied uid/email (same posture as the booking flow). Harden later
 * with server-side ID-token verification.
 */
export async function requestMembershipAction(
  input: z.input<typeof RequestSchema>,
): Promise<{ status: MembershipStatus }> {
  const data = RequestSchema.parse(input);
  const status = await requestMembership(data);
  return { status };
}

export async function getMyMembershipAction(
  uid: string,
): Promise<Membership | null> {
  return getMembership(UidSchema.parse(uid));
}

export async function getMyBookingsAction(uid: string): Promise<Booking[]> {
  return getBookingsForUser(UidSchema.parse(uid));
}

// ---------------- admin ----------------

const ConfigSchema = z.object({
  price: z.number().int().min(0).max(1_000_000),
  discountPercent: z.number().int().min(0).max(100),
  discountedBookings: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

export async function updateMembershipConfigAction(
  input: z.input<typeof ConfigSchema>,
): Promise<void> {
  await requireAdmin();
  await updateMembershipConfig(ConfigSchema.parse(input));
  revalidatePath("/admin/membership");
}

export async function confirmMembershipAction(uid: string): Promise<void> {
  await requireAdmin();
  await confirmMembership(UidSchema.parse(uid));
  revalidatePath("/admin/membership");
}

export async function revokeMembershipAction(uid: string): Promise<void> {
  await requireAdmin();
  await revokeMembership(UidSchema.parse(uid));
  revalidatePath("/admin/membership");
}
