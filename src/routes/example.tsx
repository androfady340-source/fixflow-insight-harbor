import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview, Flows, Report } from "@/components/AnalysisView";
import { SAMPLE_ANALYSIS, SAMPLE_PROJECT } from "@/lib/sample";
import { stepsToGraph } from "@/lib/analysis";

export const Route = createFileRoute("/example")({
  head: () => ({
    meta: [
      { title: "Example analysis: perfume store — FixFlow" },
      { name: "description", content: "Sample FixFlow analysis of an online perfume store's order follow-up." },
      { property: "og:title", content: "Example analysis — FixFlow" },
      { property: "og:description", content: "See a sample diagnosis, workflow and action plan." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Example,
});

function Example() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo />
          <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup", redirect: "/new-analysis" }}>Analyze yours <ArrowRight /></Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">Sample data — not a verified result</span>
        <h1 className="mt-4 text-3xl font-bold">{SAMPLE_PROJECT.name}</h1>
        <p className="mt-1 text-muted-foreground">{SAMPLE_PROJECT.problem_description}</p>
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="flow">Flowchart</TabsTrigger><TabsTrigger value="report">Report</TabsTrigger></TabsList>
          <TabsContent value="overview" className="mt-6"><Overview a={SAMPLE_ANALYSIS} /></TabsContent>
          <TabsContent value="flow" className="mt-6"><Flows current={stepsToGraph(SAMPLE_ANALYSIS.current_workflow)} proposed={stepsToGraph(SAMPLE_ANALYSIS.recommended_workflow)} /></TabsContent>
          <TabsContent value="report" className="mt-6"><Report name={SAMPLE_PROJECT.name} context={SAMPLE_ANALYSIS.business_context} a={SAMPLE_ANALYSIS} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
