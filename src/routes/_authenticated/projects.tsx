import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, FolderOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { projectsQuery } from "@/lib/queries";
import { STATUS_LABEL, stepsToGraph } from "@/lib/analysis";
import { SAMPLE_ANALYSIS, SAMPLE_PROJECT } from "@/lib/sample";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "My projects — FixFlow" }, { name: "description", content: "Your FixFlow workflow projects." }, { property: "og:title", content: "My projects — FixFlow" }, { property: "og:description", content: "Your FixFlow workflow projects." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  pendingComponent: () => <div className="p-10 text-center text-muted-foreground">Loading projects…</div>,
  errorComponent: () => <div className="p-10 text-center text-destructive">Couldn't load projects. Refresh to retry.</div>,
  component: Projects,
});

const FILTERS = ["all", "draft", "analyzed", "in_progress", "completed"] as const;

function Projects() {
  const { data } = useSuspenseQuery(projectsQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const list = data.filter(
    (p) => (filter === "all" || p.status === filter) && p.name.toLowerCase().includes(q.toLowerCase()),
  );

  async function rename(id: string, current: string) {
    const name = window.prompt("New project name", current)?.trim();
    if (!name || name === current) return;
    const { error } = await supabase.from("projects").update({ name: name.slice(0, 120) }).eq("id", id);
    if (error) return toast.error("Rename failed");
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function remove() {
    if (!toDelete) return;
    const { error } = await supabase.from("projects").delete().eq("id", toDelete);
    setToDelete(null);
    if (error) return toast.error("Delete failed");
    toast.success("Project deleted");
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function addSample() {
    const { data: user } = await supabase.auth.getUser();
    const { data: p, error } = await supabase
      .from("projects")
      .insert({
        ...SAMPLE_PROJECT,
        user_id: user.user!.id,
        is_sample: true,
        status: "analyzed",
        analysis_json: SAMPLE_ANALYSIS as never,
        current_workflow: stepsToGraph(SAMPLE_ANALYSIS.current_workflow) as never,
        recommended_workflow: stepsToGraph(SAMPLE_ANALYSIS.recommended_workflow) as never,
      })
      .select("id")
      .single();
    if (error || !p) return toast.error("Couldn't add sample");
    await supabase.from("tasks").insert(
      SAMPLE_ANALYSIS.tasks.map((t) => ({ project_id: p.id, user_id: user.user!.id, title: t.title, description: t.description, priority: t.priority })),
    );
    qc.invalidateQueries({ queryKey: ["projects"] });
    navigate({ to: "/projects/$id", params: { id: p.id } });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">My projects</h1>
          <Button variant="hero" asChild><Link to="/new-analysis"><Plus /> New analysis</Link></Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input placeholder="Search projects" aria-label="Search projects" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {f === "all" ? "All" : STATUS_LABEL[f]}
              </Button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="panel mt-10 p-10 text-center">
            <FolderOpen className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">No projects yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Start with your real problem, or try the sample.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="hero" asChild><Link to="/new-analysis"><Plus /> New analysis</Link></Button>
              <Button variant="outline" onClick={addSample}><Sparkles /> Add sample project</Button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No projects match.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id} className="panel flex flex-col p-5">
                <Link to="/projects/$id" params={{ id: p.id }} className="font-semibold hover:text-primary">{p.name}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{p.business_type}</p>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 flex gap-1 border-t border-border pt-3">
                  <Button size="sm" variant="secondary" asChild><Link to="/projects/$id" params={{ id: p.id }}>Open</Link></Button>
                  <Button size="icon" variant="ghost" aria-label={`Rename ${p.name}`} onClick={() => rename(p.id, p.name)}><Pencil /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p.id)}><Trash2 /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>Its analysis, workflow and tasks will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
