import { z } from "zod";

const level = z.enum(["low", "medium", "high"]).catch("medium");
const nodeType = z.enum(["start", "action", "decision", "wait", "end"]).catch("action");

export const stepSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  node_type: nodeType,
  description: z.string().max(500).catch(""),
  next_step_ids: z.array(z.string()).catch([]),
  yes_label: z.string().max(30).optional().nullable(),
  no_label: z.string().max(30).optional().nullable(),
});

export const analysisSchema = z.object({
  title: z.string().max(160).catch("Workflow analysis"),
  executive_summary: z.string().max(2000),
  business_context: z.string().max(1500).catch(""),
  user_provided_facts: z.array(z.string().max(400)).max(15).catch([]),
  assumptions: z.array(z.string().max(400)).max(15).catch([]),
  bottlenecks: z
    .array(
      z.object({
        name: z.string().max(160),
        description: z.string().max(800).catch(""),
        evidence_or_reason: z.string().max(600).catch(""),
        impact_level: level,
        confidence: level,
        suggested_fix: z.string().max(600).catch(""),
      }),
    )
    .max(8),
  current_workflow: z.array(stepSchema).min(2).max(20),
  recommended_workflow: z.array(stepSchema).min(2).max(20),
  recommendations: z
    .array(
      z.object({
        title: z.string().max(160),
        rationale: z.string().max(800).catch(""),
        priority: level,
        expected_effect: z.string().max(500).catch(""),
      }),
    )
    .max(10),
  tasks: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(600).catch(""),
        priority: level,
        status: z.enum(["todo", "in_progress", "done"]).catch("todo"),
        linked_recommendation: z.string().max(160).catch(""),
      }),
    )
    .max(15),
  metrics: z
    .array(
      z.object({
        name: z.string().max(120),
        definition: z.string().max(400).catch(""),
        how_to_measure: z.string().max(400).catch(""),
        why_it_matters: z.string().max(400).catch(""),
      }),
    )
    .max(6),
  limitations: z.string().max(1000).catch(""),
  follow_up_questions: z.array(z.string().max(300)).max(3).catch([]),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Step = z.infer<typeof stepSchema>;
export type NodeKind = Step["node_type"];

export interface FlowNodeData {
  label: string;
  kind: NodeKind;
  description?: string;
  role?: string;
  duration?: string;
  [key: string]: unknown;
}
export interface Graph {
  nodes: { id: string; type: "ff"; position: { x: number; y: number }; data: FlowNodeData }[];
  edges: { id: string; source: string; target: string; label?: string | undefined }[];
}

/** Convert AI steps into a positioned graph (simple layered layout). */
export function stepsToGraph(steps: Step[]): Graph {
  const ids = new Set(steps.map((s) => s.id));
  const depth = new Map<string, number>();
  const first = steps[0]?.id;
  if (first) depth.set(first, 0);
  const queue = first ? [first] : [];
  while (queue.length) {
    const id = queue.shift()!;
    const s = steps.find((x) => x.id === id);
    for (const n of s?.next_step_ids ?? []) {
      if (ids.has(n) && !depth.has(n)) {
        depth.set(n, (depth.get(id) ?? 0) + 1);
        queue.push(n);
      }
    }
  }
  let extra = Math.max(0, ...depth.values()) + 1;
  for (const s of steps) if (!depth.has(s.id)) depth.set(s.id, extra++);
  const perLevel = new Map<number, number>();
  const nodes = steps.map((s) => {
    const d = depth.get(s.id)!;
    const col = perLevel.get(d) ?? 0;
    perLevel.set(d, col + 1);
    return {
      id: s.id,
      type: "ff" as const,
      position: { x: col * 240, y: d * 130 },
      data: { label: s.label, kind: s.node_type, description: s.description },
    };
  });
  const edges: Graph["edges"] = [];
  for (const s of steps) {
    s.next_step_ids
      .filter((n) => ids.has(n))
      .forEach((n, i) => {
        let label: string | undefined;
        if (s.node_type === "decision") label = i === 0 ? s.yes_label || "Yes" : s.no_label || "No";
        edges.push({ id: `e-${s.id}-${n}`, source: s.id, target: n, label });
      });
  }
  return { nodes, edges };
}

/** Drops edges pointing at missing nodes and trims text. */
export function validateGraph(g: Graph): Graph {
  const nodes = g.nodes
    .filter((n) => n.id && n.data?.label)
    .map((n) => ({
      ...n,
      data: {
        ...n.data,
        label: String(n.data.label).slice(0, 120),
        description: n.data.description ? String(n.data.description).slice(0, 500) : "",
      },
    }));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = g.edges.filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target);
  return { nodes, edges };
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  analyzed: "Analyzed",
  in_progress: "In Progress",
  completed: "Completed",
};

export const BUSINESS_TYPES = ["Online Store", "Restaurant/Café", "Service Business", "Other"];
export const PROBLEM_TYPES = [
  "Orders get lost or delayed",
  "Customer follow-up is weak",
  "Repetitive manual work",
  "Bottlenecks are unclear",
  "Other",
];
export const VOLUMES = ["Under 10", "10–50", "51–100", "100+"];
export const TEAM_SIZES = ["1", "2", "3–5", "6+"];
export const TOOLS = [
  "WhatsApp / manual notes",
  "Spreadsheets",
  "Existing CRM / order system",
  "No consistent system",
  "Other",
];
