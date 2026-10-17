import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TYPES, PROBLEM_TYPES, TEAM_SIZES, TOOLS, VOLUMES } from "@/lib/analysis";
import { generateAnalysis } from "@/lib/analysis.functions";

const editSearch = z.object({ edit: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/new-analysis")({
  validateSearch: editSearch,
  head: () => ({ meta: [{ title: "New analysis — FixFlow" }, { name: "description", content: "Describe your workflow problem in four short steps." }, { property: "og:title", content: "New analysis — FixFlow" }, { property: "og:description", content: "Describe your workflow problem in four short steps." }] }),
  loaderDeps: ({ search }) => ({ edit: search.edit }),
  loader: async ({ deps }) => {
    if (!deps.edit) return null;
    const { data } = await supabase.from("projects").select("*").eq("id", deps.edit).maybeSingle();
    return data;
  },
  component: Wizard,
});

type Form = {
  name: string; business_type: string; business_description: string;
  problem_type: string; problem_description: string;
  daily_volume: string; team_size: string; current_tools: string[]; desired_outcome: string;
};

const STEPS = ["Business", "Problem", "Process", "Review"];

function Wizard() {
  const existing = Route.useLoaderData();
  const navigate = useNavigate();
  const run = useServerFn(generateAnalysis);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState<Form>(() => ({
    name: existing?.name ?? "",
    business_type: existing?.business_type ?? "",
    business_description: existing?.business_description ?? "",
    problem_type: existing?.problem_type ?? "",
    problem_description: existing?.problem_description ?? "",
    daily_volume: existing?.daily_volume ?? "",
    team_size: existing?.team_size ?? "",
    current_tools: existing?.current_tools ?? [],
    desired_outcome: existing?.desired_outcome ?? "",
  }));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!f.name.trim()) e.name = "Required";
      if (!f.business_type) e.business_type = "Pick one";
      if (f.business_description.trim().length < 10) e.business_description = "At least 10 characters";
    }
    if (s === 1) {
      if (!f.problem_type) e.problem_type = "Pick one";
      if (f.problem_description.trim().length < 20) e.problem_description = "At least 20 characters";
    }
    if (s === 2) {
      if (!f.daily_volume) e.daily_volume = "Pick one";
      if (!f.team_size) e.team_size = "Pick one";
      if (!f.current_tools.length) e.current_tools = "Pick at least one";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const payload = { ...f, name: f.name.trim().slice(0, 120) };
      let id = existing?.id;
      if (id) {
        const { error } = await supabase.from("projects").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("projects").insert({ ...payload, user_id: u.user!.id }).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      const res = await run({ data: { projectId: id! } });
      if (!res.ok) {
        toast.error(res.error, { description: "Your answers are saved as a draft." });
        navigate({ to: "/projects/$id", params: { id: id! } });
        return;
      }
      navigate({ to: "/projects/$id", params: { id: id! } });
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">{existing ? "Edit analysis" : "New analysis"}</h1>
        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`mt-2 block text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{i + 1}. {s}</span>
            </li>
          ))}
        </ol>

        <div className="panel mt-8 space-y-5 p-6">
          {step === 0 && (
            <>
              <F label="Project name" error={errors.name} id="name">
                <Input id="name" maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Order follow-up" />
              </F>
              <F label="Business type" error={errors.business_type}>
                <Chips options={BUSINESS_TYPES} value={[f.business_type]} onChange={(v) => set("business_type", v)} />
              </F>
              <F label="Short description" error={errors.business_description} id="bd">
                <Textarea id="bd" maxLength={800} value={f.business_description} onChange={(e) => set("business_description", e.target.value)} placeholder="What do you sell, and to whom?" />
              </F>
            </>
          )}
          {step === 1 && (
            <>
              <F label="Main problem" error={errors.problem_type}>
                <Chips options={PROBLEM_TYPES} value={[f.problem_type]} onChange={(v) => set("problem_type", v)} />
              </F>
              <F label="What is happening?" error={errors.problem_description} id="pd">
                <Textarea id="pd" rows={5} maxLength={2000} value={f.problem_description} onChange={(e) => set("problem_description", e.target.value)} placeholder="Describe a typical day when things go wrong." />
              </F>
            </>
          )}
          {step === 2 && (
            <>
              <F label="Orders / requests per day" error={errors.daily_volume}>
                <Chips options={VOLUMES} value={[f.daily_volume]} onChange={(v) => set("daily_volume", v)} />
              </F>
              <F label="Team size" error={errors.team_size}>
                <Chips options={TEAM_SIZES} value={[f.team_size]} onChange={(v) => set("team_size", v)} />
              </F>
              <F label="Current tools" error={errors.current_tools}>
                <Chips multi options={TOOLS} value={f.current_tools} onChange={(v) => set("current_tools", f.current_tools.includes(v) ? f.current_tools.filter((x) => x !== v) : [...f.current_tools, v])} />
              </F>
              <F label="What would success look like? (optional)" id="do">
                <Textarea id="do" maxLength={600} value={f.desired_outcome} onChange={(e) => set("desired_outcome", e.target.value)} />
              </F>
            </>
          )}
          {step === 3 && (
            <dl className="grid gap-3 text-sm">
              {[
                ["Project", f.name], ["Business", `${f.business_type} — ${f.business_description}`],
                ["Problem", `${f.problem_type} — ${f.problem_description}`],
                ["Volume / team", `${f.daily_volume} per day · ${f.team_size} people`],
                ["Tools", f.current_tools.join(", ")], ["Success", f.desired_outcome || "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}><ArrowLeft /> Back</Button>
          {step < 3 ? (
            <Button onClick={() => validate(step) && setStep((s) => s + 1)}>Next <ArrowRight /></Button>
          ) : (
            <Button variant="hero" onClick={submit} disabled={busy}>
              {busy ? <><Loader2 className="animate-spin" /> Analyzing… (up to a minute)</> : <><Sparkles /> Generate analysis</>}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function F({ label, error, id, children }: { label: string; error?: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Chips({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onChange(o)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
