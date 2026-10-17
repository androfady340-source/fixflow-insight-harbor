import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { strongPassword, PASSWORD_RULES } from "@/lib/auth-rules";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — FixFlow" },
      { name: "description", content: "Choose a new password for your FixFlow account." },
      { property: "og:title", content: "Set a new password — FixFlow" },
      { property: "og:description", content: "Choose a new password for your FixFlow account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = strongPassword.safeParse(pw);
    if (!r.success) return setErr("Use 10+ characters with upper, lower, number and symbol.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return setErr("Link expired or password rejected. Request a new link.");
    navigate({ to: "/projects", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 grid-bg">
      <form onSubmit={submit} className="panel w-full max-w-md space-y-4 p-8">
        <Logo />
        <h1 className="text-2xl font-bold">New password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" autoComplete="new-password" maxLength={128} value={pw} onChange={(e) => setPw(e.target.value)} />
          <p className="text-xs text-muted-foreground">{PASSWORD_RULES.map((r) => r.label).join(" · ")}</p>
        </div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Save password
        </Button>
      </form>
    </div>
  );
}
