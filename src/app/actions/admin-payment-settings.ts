"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { updatePaymentSettings } from "@/lib/db/payment-settings.server";

const PaymentSettingsSchema = z.object({
  upiQrUrl: z
    .string()
    .url()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  upiId: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  payeeName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  instructions: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdatePaymentSettingsPayload = z.infer<typeof PaymentSettingsSchema>;

export async function updatePaymentSettingsAction(
  raw: UpdatePaymentSettingsPayload,
): Promise<void> {
  await requireAdmin();
  const payload = PaymentSettingsSchema.parse(raw);
  await updatePaymentSettings({
    upiQrUrl: payload.upiQrUrl,
    upiId: payload.upiId,
    payeeName: payload.payeeName,
    instructions: payload.instructions,
  });
  revalidatePath("/admin/payments");
}
