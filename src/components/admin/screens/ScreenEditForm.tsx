"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarOff, Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateScreenAction } from "@/app/actions/admin-screens";
import { formatINR } from "@/components/admin/dashboard/utils";
import type { Screen } from "@/types";

type Props = {
  screen: Screen;
};

export function ScreenEditForm({ screen }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(screen.name);
  const [theme, setTheme] = useState(screen.theme);
  const [description, setDescription] = useState(screen.description);
  const [operatingStart, setOperatingStart] = useState(screen.operatingStart);
  const [operatingEnd, setOperatingEnd] = useState(screen.operatingEnd);
  const [price1h, setPrice1h] = useState(screen.basePrices["1h"]);
  const [price2h, setPrice2h] = useState(screen.basePrices["2h"]);
  const [price3h, setPrice3h] = useState(screen.basePrices["3h"]);
  const [imageUrl, setImageUrl] = useState(screen.imageUrl ?? "");
  const [blockedDates, setBlockedDates] = useState<string[]>(
    screen.blockedDates ?? [],
  );
  const [newBlockedDate, setNewBlockedDate] = useState("");

  function addBlockedDate() {
    if (!newBlockedDate) return;
    if (blockedDates.includes(newBlockedDate)) {
      setNewBlockedDate("");
      return;
    }
    setBlockedDates((prev) => [...prev, newBlockedDate].sort());
    setNewBlockedDate("");
  }

  function removeBlockedDate(date: string) {
    setBlockedDates((prev) => prev.filter((d) => d !== date));
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/screens/image", {
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
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (operatingEnd <= operatingStart) {
      toast.error("Operating end must be after start");
      return;
    }
    startTransition(async () => {
      try {
        await updateScreenAction(screen.id, {
          name: name.trim(),
          theme: theme.trim(),
          description: description.trim(),
          operatingStart,
          operatingEnd,
          basePrices: {
            "1h": Math.max(0, price1h),
            "2h": Math.max(0, price2h),
            "3h": Math.max(0, price3h),
          },
          imageUrl: imageUrl || "",
          blockedDates,
        });
        toast.success("Screen updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
            />
          </Field>
          <Field id="theme" label="Theme">
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              maxLength={60}
            />
          </Field>
        </div>
        <Field id="description" label="Description">
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            maxLength={500}
          />
        </Field>
      </Section>

      <Section title="Operating hours">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="start" label="Start (0–23)">
            <Input
              id="start"
              type="number"
              min={0}
              max={23}
              value={operatingStart}
              onChange={(e) =>
                setOperatingStart(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
              }
            />
          </Field>
          <Field id="end" label="End (1–24)">
            <Input
              id="end"
              type="number"
              min={1}
              max={24}
              value={operatingEnd}
              onChange={(e) =>
                setOperatingEnd(Math.max(1, Math.min(24, Number(e.target.value) || 1)))
              }
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-foreground/55">
          Bookings can start any half hour from {operatingStart}:00 and must end
          by {operatingEnd}:00.
        </p>
      </Section>

      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <PriceField label="1 hour" value={price1h} onChange={setPrice1h} />
          <PriceField label="2 hours" value={price2h} onChange={setPrice2h} />
          <PriceField label="3 hours" value={price3h} onChange={setPrice3h} />
        </div>
        <p className="mt-4 text-xs text-foreground/55">
          Per-screen add-ons (romantic setup, decor, etc.) are managed under{" "}
          <a className="underline" href="/admin/addons">Add-ons</a>.
        </p>
      </Section>

      <Section title="Image">
        <div className="space-y-3">
          {imageUrl ? (
            <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl bg-cream">
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-cream/40 text-xs text-foreground/45">
              No image yet
            </div>
          )}
          <Field id="imageUrl" label="Image URL">
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
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
              {uploading ? "Uploading…" : "Upload to Storage"}
            </Button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-xs text-foreground/55 hover:text-foreground"
              >
                Remove image
              </button>
            )}
          </div>
          <p className="text-xs text-foreground/55">
            JPG / PNG / WebP up to 5MB. Uploads go to Firebase Storage.
          </p>
        </div>
      </Section>

      <Section
        title="Blocked dates"
        icon={<CalendarOff className="h-4 w-4" />}
      >
        <p className="mb-3 text-sm text-foreground/65">
          Add a date when the screen is unavailable (maintenance, private
          event, etc). Public availability returns no slots for blocked dates.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Field id="blocked" label="Date">
            <Input
              id="blocked"
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
          >
            Add
          </Button>
        </div>

        {blockedDates.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-4 py-4 text-center text-xs text-foreground/55">
            No blocked dates.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {blockedDates.map((d) => (
              <li
                key={d}
                className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
              >
                {d}
                <button
                  type="button"
                  aria-label={`Unblock ${d}`}
                  onClick={() => removeBlockedDate(d)}
                  className="text-amber-700 hover:text-amber-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save screen
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <header className="mb-4 flex items-center gap-2 text-foreground/70">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {title}
        </h2>
      </header>
      {children}
    </section>
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

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
      <p className="text-xs text-foreground/50">{formatINR(value)}</p>
    </div>
  );
}
