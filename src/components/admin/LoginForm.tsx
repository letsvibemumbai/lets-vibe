"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendAdminMagicLink } from "@/lib/firebase/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await sendAdminMagicLink(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send link");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow">
          <CheckCircle2 className="h-6 w-6 text-foreground" />
        </div>
        <h2 className="mt-5 font-display text-2xl text-foreground">Check your email</h2>
        <p className="mt-2 text-sm text-foreground/65">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to
          finish signing in.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-6 text-xs text-foreground/55 underline-offset-2 hover:text-foreground hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-2 text-foreground">
        <Mail className="h-5 w-5" />
        <h2 className="font-display text-2xl">Sign in</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <Button
        type="submit"
        disabled={sending || !email}
        className="h-11 w-full rounded-full bg-foreground text-cream hover:bg-foreground/90 disabled:opacity-60"
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link…
          </>
        ) : (
          <>
            Send magic link <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
