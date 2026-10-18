import type { TablesUpdate } from "@/integrations/supabase/types";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Pencil, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview, Flows, Report } from "@/components/AnalysisView";
import { StatusBadge, LevelBadge } from "@/components/StatusBadge";
import { projectQuery, tasksQuery } from "@/lib/queries";
import { analysisSchema, type Graph } from "@/lib/analysis";
import { generateAnalysis } from "@/lib/analysis.functions";

export const Route = createFileRoute("/_authenticated/projects_/$id")({
  head: () => ({ meta: [{ title: "Analysis — FixFlow" }, { name: "description", content: "Diagnosis, workflow, tasks and report." }, { property: "og:title", content: "Analysis — FixFlow" }, { property: "og:description", content: "Diagnosis, workflow, tasks and report." }] }),
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(projectQuery(params.id));
    if (!p) throw notFound();
    await context.queryClient.ensureQueryData(tasksQuery(params.id));
  },
  pendingComponent: () => <div className="p-10 text-center text-muted-foreground">Loading…</div>,
  notFoundComponent: () => (
    <div className="p-10 text-center"><p>Project not found.</p><Link to="/projects" className="text-primary">Back to projects</Link></div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: p } = useSuspenseQuery(projectQuery(id));
  const run = useServerFn(generateAnalysis);
  const [busy, setBusy] = useState(false);
  if (!p) return null;
  const parsed = p.analysis_json ? analysisSchema.safeParse(p.analysis_json) : null;
  const a = parsed?.success ? parsed.data : null;

  async function regenerate() {
    setBusy(true);
    const r = await run({ data: { projectId: id } }).catch(() => ({ ok: false as const, error: "Request failed." }));
    setBusy(false);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("Analysis ready");
    qc.invalidateQueries({ queryKey: ["project", id] });
    qc.invalidateQueries({ queryKey: ["tasks", id] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function saveFlow(which: "current_workflow" | "recommended_workflow", g: Graph) {
    const { error } = await supabase.from("projects").update({ [which]: g as never }).eq("id", id);
    if (error) toast.error("Save failed");
    else { toast.success("Workflow saved"); qc.invalidateQueries({ queryKey: ["project", id] }); }
  }

  async function setStatus(status: string) {
    await supabase.from("projects").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["project", id] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="no-print flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={p.status} />
              {p.is_sample && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">Sample</span>}
            </div>
            <h1 className="mt-2 text-3xl font-bold">{p.name}</h1>
            <p className="text-sm text-muted-foreground">{p.business_type} · updated {new Date(p.updated_at).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Project status" value={p.status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-surface px-2 text-sm">
              <option value="draft">Draft</option><option value="analyzed">Analyzed</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
            </select>
            <Button variant="outline" asChild><Link to="/new-analysis" search={{ edit: id }}><Pencil /> Edit input</Link></Button>
            <Button onClick={regenerate} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} {a ? "Regenerate" : "Generate"}</Button>
          </div>
        </div>

        {busy && <p className="no-print mt-6 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">Analyzing your workflow… this can take up to a minute.</p>}

        {!a ? (
          <div className="panel mt-8 p-10 text-center">
            <h2 className="text-xl font-semibold">No analysis yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your answers are saved. Generate the analysis when ready.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="no-print"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="flow">Flowchart</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="report">Report</TabsTrigger></TabsList>
            <TabsContent value="overview" className="mt-6"><Overview a={a} /></TabsContent>
            <TabsContent value="flow" className="mt-6">
              <Flows current={(p.current_workflow as unknown as Graph) ?? { nodes: [], edges: [] }} proposed={(p.recommended_workflow as unknown as Graph) ?? { nodes: [], edges: [] }} onSave={saveFlow} />
            </TabsContent>
            <TabsContent value="tasks" className="mt-6"><Tasks projectId={id} /></TabsContent>
            <TabsContent value="report" className="mt-6">
              <Button className="no-print mb-4" onClick={() => window.print()}><Printer /> Print / Save as PDF</Button>
              <Report name={p.name} context={`${p.business_type} — ${p.business_description}`} a={a} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function Tasks({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: tasks } = useSuspenseQuery(tasksQuery(projectId));
  const [title, setTitle] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks", projectId] });
  const done = tasks.filter((t) => t.status === "done").length;

  async function add() {
    const t = title.trim();
    if (!t) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert({ project_id: projectId, user_id: u.user!.id, title: t.slice(0, 200) });
    if (error) { toast.error("Couldn't add task"); return; }
    setTitle("");
    refresh();
  }
  async function patch(id: string, v: TablesUpdate<"tasks">) {
    const { error } = await supabase.from("tasks").update(v).eq("id", id);
    if (error) toast.error("Update failed");
    refresh();
  }
  async function del(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground"><strong className="text-foreground">{done} of {tasks.length}</strong> completed</p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full bg-success" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Input placeholder="Add a task" aria-label="New task title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit"><Plus /> Add</Button>
      </form>
      {tasks.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted-foreground">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <input type="checkbox" aria-label={`Mark ${t.title} done`} className="size-4 accent-primary" checked={t.status === "done"} onChange={(e) => patch(t.id, { status: e.target.checked ? "done" : "todo" })} />
              <div className="flex-1">
                <input aria-label="Task title" defaultValue={t.title} maxLength={200} onBlur={(e) => e.target.value.trim() && e.target.value !== t.title && patch(t.id, { title: e.target.value.trim() })}
                  className={`w-full bg-transparent font-medium outline-none ${t.status === "done" ? "text-muted-foreground line-through" : ""}`} />
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <LevelBadge level={t.priority} />
              <input aria-label="Owner" placeholder="Owner" defaultValue={t.owner ?? ""} maxLength={60} onBlur={(e) => e.target.value !== (t.owner ?? "") && patch(t.id, { owner: e.target.value || null })}
                className="h-8 w-28 rounded-md border border-input bg-surface px-2 text-xs" />
              <input type="date" aria-label="Due date" defaultValue={t.due_date ?? ""} onChange={(e) => patch(t.id, { due_date: e.target.value || null })}
                className="h-8 rounded-md border border-input bg-surface px-2 text-xs" />
              <select aria-label="Status" value={t.status} onChange={(e) => patch(t.id, { status: e.target.value })} className="h-8 rounded-md border border-input bg-surface px-2 text-xs">
                <option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option>
              </select>
              <Button size="icon" variant="ghost" aria-label={`Delete ${t.title}`} onClick={() => del(t.id)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
