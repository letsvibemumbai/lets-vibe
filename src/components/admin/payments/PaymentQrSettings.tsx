"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePaymentSettingsAction } from "@/app/actions/admin-payment-settings";
import type { PaymentSettings } from "@/types";

type Props = { settings: PaymentSettings };

/**
 * Admin form for the manual-UPI checkout: upload the "scan & pay" QR image and
 * set the UPI ID / payee name shown to customers at checkout. The customer
 * pays out-of-band and uploads a screenshot; nothing is computed here.
 */
export function PaymentQrSettings({ settings }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [upiQrUrl, setUpiQrUrl] = useState(settings.upiQrUrl ?? "");
  const [upiId, setUpiId] = useState(settings.upiId ?? "");
  const [payeeName, setPayeeName] = useState(settings.payeeName ?? "");
  const [instructions, setInstructions] = useState(settings.instructions ?? "");

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/payment-qr/image", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function onChooseFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setUpiQrUrl(url);
      toast.success("QR image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updatePaymentSettingsAction({
          upiQrUrl: upiQrUrl || undefined,
          upiId: upiId.trim() || undefined,
          payeeName: payeeName.trim() || undefined,
          instructions: instructions.trim() || undefined,
        });
        toast.success("Payment settings saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[200px_1fr] md:items-start">
        <div className="space-y-2">
          {upiQrUrl ? (
            <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl bg-cream ring-1 ring-hairline">
              <Image
                src={upiQrUrl}
                alt="UPI payment QR"
                fill
                sizes="200px"
                className="object-contain p-2"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full max-w-[200px] items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-cream/40 text-center text-xs text-foreground/45">
              No QR uploaded
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChooseFile(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "Uploading…" : "Upload QR"}
            </Button>
            {upiQrUrl && (
              <button
                type="button"
                onClick={() => setUpiQrUrl("")}
                className="text-xs text-foreground/55 hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-foreground/55">
            PNG / JPG / WebP up to 5MB. Use your GPay/PhonePe &ldquo;scan &amp;
            pay&rdquo; QR.
          </p>
        </div>

        <div className="space-y-4">
          <Field id="upiId" label="UPI ID (optional)">
            <Input
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="letsvibe@okhdfcbank"
              maxLength={120}
            />
          </Field>
          <Field id="payeeName" label="Payee name (optional)">
            <Input
              id="payeeName"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="Let's Vibe"
              maxLength={120}
            />
          </Field>
          <Field id="instructions" label="Note shown at checkout (optional)">
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Add your name in the UPI note so we can match your payment."
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save payment settings
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
