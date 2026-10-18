import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import type { Analysis, Graph } from "@/lib/analysis";
import { LevelBadge } from "./StatusBadge";

const FlowEditor = lazy(() => import("./FlowEditor"));

export function Overview({ a }: { a: Analysis }) {
  const order = { high: 0, medium: 1, low: 2 } as const;
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">In short</h2>
        <p className="mt-2 leading-relaxed">{a.executive_summary}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel p-5">
          <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-success" /> What we know</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{a.user_provided_facts.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="panel p-5">
          <h3 className="flex items-center gap-2 font-semibold"><HelpCircle className="size-4 text-warning" /> Needs confirmation</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{a.assumptions.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Bottlenecks</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {a.bottlenecks.map((b) => (
            <article key={b.name} className="panel p-5">
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                <h3 className="font-semibold">{b.name}</h3>
              </div>
              <div className="mt-2 flex gap-2"><LevelBadge level={b.impact_level} prefix="Impact" /><LevelBadge level={b.confidence} prefix="Confidence" /></div>
              <p className="mt-3 text-sm">{b.description}</p>
              {b.evidence_or_reason && <p className="mt-1 text-xs text-muted-foreground">Why: {b.evidence_or_reason}</p>}
              {b.suggested_fix && <p className="mt-3 rounded-md bg-surface p-2 text-sm"><strong>Fix:</strong> {b.suggested_fix}</p>}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recommendations (by priority)</h2>
        <ol className="space-y-2">
          {[...a.recommendations].sort((x, y) => order[x.priority] - order[y.priority]).map((r, i) => (
            <li key={r.title} className="panel flex gap-4 p-4">
              <span className="font-display text-primary">{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{r.title}</h3><LevelBadge level={r.priority} /></div>
                <p className="mt-1 text-sm text-muted-foreground">{r.rationale}</p>
                {r.expected_effect && <p className="mt-1 text-xs text-muted-foreground">Expected: {r.expected_effect}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {a.follow_up_questions.length > 0 && (
        <section className="panel p-5">
          <h3 className="font-semibold">Questions to sharpen the result</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">{a.follow_up_questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
      )}
      {a.limitations && <p className="text-xs text-muted-foreground">Note: {a.limitations} AI suggestions are not verified facts.</p>}
    </div>
  );
}

export function Flows({ current, proposed, onSave }: { current: Graph; proposed: Graph; onSave?: (which: "current_workflow" | "recommended_workflow", g: Graph) => Promise<void> }) {
  const fallback = <div className="panel grid h-[460px] place-items-center text-sm text-muted-foreground">Loading editor…</div>;
  return (
    <div className="space-y-8">
      {([["Current workflow", current, "current_workflow"], ["Proposed workflow", proposed, "recommended_workflow"]] as const).map(([title, g, key]) => (
        <section key={key}>
          <h2 className="mb-3 text-lg font-semibold">{title}</h2>
          <ClientOnly fallback={fallback}>
            <Suspense fallback={fallback}>
              <FlowEditor graph={g} readOnly={!onSave} onSave={onSave ? (x) => onSave(key, x) : undefined} />
            </Suspense>
          </ClientOnly>
        </section>
      ))}
    </div>
  );
}

export function Report({ name, context, a }: { name: string; context: string; a: Analysis }) {
  return (
    <article className="print-area panel space-y-6 p-6 sm:p-10">
      <header>
        <p className="text-xs text-muted-foreground">FixFlow report · {new Date().toLocaleDateString()}</p>
        <h1 className="mt-1 text-2xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{context}</p>
      </header>
      <Sec t="Summary"><p>{a.executive_summary}</p></Sec>
      <Sec t="Bottlenecks"><ul className="list-disc pl-5">{a.bottlenecks.map((b) => <li key={b.name}><strong>{b.name}</strong> ({b.impact_level} impact) — {b.suggested_fix}</li>)}</ul></Sec>
      <Sec t="Recommended workflow"><ol className="list-decimal pl-5">{a.recommended_workflow.map((s) => <li key={s.id}>{s.label}</li>)}</ol></Sec>
      <Sec t="Actions"><ol className="list-decimal pl-5">{a.recommendations.map((r) => <li key={r.title}>{r.title} — {r.priority}</li>)}</ol></Sec>
      <Sec t="Metrics to track"><ul className="list-disc pl-5">{a.metrics.map((m) => <li key={m.name}><strong>{m.name}:</strong> {m.how_to_measure}</li>)}</ul></Sec>
      <p className="text-xs text-muted-foreground">AI-assisted analysis. Effects are not measured until real data is collected.</p>
    </article>
  );
}
function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <section className="text-sm leading-relaxed"><h2 className="mb-2 text-base font-semibold">{t}</h2>{children}</section>;
}
