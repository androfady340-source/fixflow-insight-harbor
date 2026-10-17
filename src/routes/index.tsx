import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, GitBranch, ListChecks, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixFlow — Stop guessing. Fix your workflow." },
      { name: "description", content: "Find bottlenecks, map a better process, and get a clear action plan for your small business." },
      { property: "og:title", content: "FixFlow — Stop guessing. Fix your workflow." },
      { property: "og:description", content: "Find bottlenecks, map a better process, and get a clear action plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  { t: "Describe", d: "Tell us what goes wrong." },
  { t: "Diagnose", d: "See where it gets stuck." },
  { t: "Redesign", d: "Get a simpler workflow." },
  { t: "Act", d: "Follow a clear checklist." },
];

const features = [
  { icon: Sparkles, t: "AI diagnosis", d: "Facts and assumptions, clearly separated." },
  { icon: GitBranch, t: "Editable flowcharts", d: "Drag, connect, and save your process." },
  { icon: ListChecks, t: "Action checklist", d: "Tasks with status and owners." },
  { icon: FileText, t: "Printable report", d: "Save as PDF in one click." },
];

function Landing() {
  const { session } = useSession();
  const navigate = useNavigate();
  const start = () =>
    session ? navigate({ to: "/new-analysis" }) : navigate({ to: "/auth", search: { mode: "signup", redirect: "/new-analysis" } });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex" aria-label="Sections">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#example" className="hover:text-foreground">Example</a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild size="sm"><Link to="/projects">My projects</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth" search={{ mode: "login" }}>Log in</Link></Button>
                <Button size="sm" onClick={start}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="grid-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" /> For small stores, restaurants & services
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Stop guessing.<br /><span className="text-primary">Fix your workflow.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Find the bottleneck. Get a simpler process. Know exactly what to do next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="xl" onClick={start}>
                Analyze a problem <ArrowRight />
              </Button>
              <Button asChild variant="outline" size="xl"><Link to="/example">Explore example</Link></Button>
            </div>
          </div>
          <HeroFlow />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <h2 className="text-3xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground">Four steps. About five minutes.</p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="panel p-5">
              <span className="font-display text-sm text-primary">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-bold">What you get</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.t} className="panel p-5">
                <f.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="example" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="panel grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">Sample — not a real customer</span>
            <h2 className="mt-4 text-2xl font-bold">Online perfume store</h2>
            <p className="mt-2 text-muted-foreground">
              <strong className="text-foreground">Problem:</strong> orders arrive in chat and get forgotten.
            </p>
            <p className="mt-1 text-muted-foreground">
              <strong className="text-foreground">Fix:</strong> one order sheet, a 24h confirm rule, auto follow-up.
            </p>
            <Button asChild className="mt-6"><Link to="/example">Open the example <ArrowRight /></Link></Button>
          </div>
          <ul className="space-y-2 text-sm">
            {["Receive order", "Register order", "Confirm order?", "Prepare shipment", "Mark as shipped"].map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
                <span className="grid size-6 place-items-center rounded-full bg-accent text-xs">{i + 1}</span>{s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <Logo />
          <p>Clear workflows and action plans for small businesses.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroFlow() {
  const node = "rounded-lg border px-4 py-2.5 text-sm font-medium";
  return (
    <div className="panel relative p-6" aria-hidden>
      <div className="flex flex-col items-center gap-3">
        <div className={`${node} border-primary/50 bg-accent`}>Order arrives</div>
        <div className="h-5 w-px bg-border" />
        <div className={`${node} border-border bg-surface`}>Register in one list</div>
        <div className="h-5 w-px bg-border" />
        <div className={`${node} rotate-0 border-warning/60 bg-warning/10 text-warning`}>Confirmed within 24h?</div>
        <div className="flex w-full justify-around">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-success">Yes</span>
            <div className={`${node} border-success/50 bg-success/10`}>Ship</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">No</span>
            <div className={`${node} border-border bg-surface`}>Follow up</div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        <Search className="size-3.5 text-primary" /> Bottleneck found: no single order list
      </div>
    </div>
  );
}
