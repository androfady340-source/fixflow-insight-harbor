import { useCallback, useState } from "react";
import {
  ReactFlow, Background, Controls, Handle, Position, addEdge, useNodesState, useEdgesState,
  type Connection, type Edge, type Node, type NodeProps,
} from "@xyflow/react";
import { Plus, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlowNodeData, Graph, NodeKind } from "@/lib/analysis";
import { validateGraph } from "@/lib/analysis";

const kindStyle: Record<NodeKind, string> = {
  start: "border-primary bg-accent",
  action: "border-border bg-card",
  decision: "border-warning bg-warning/10",
  wait: "border-chart-4 bg-secondary",
  end: "border-success bg-success/10",
};

function FFNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`min-w-36 max-w-52 rounded-lg border-2 px-3 py-2 text-center text-xs text-foreground ${kindStyle[data.kind]} ${selected ? "ring-2 ring-ring" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{data.kind}</div>
      <div className="font-medium">{data.label}</div>
      {data.role && <div className="mt-0.5 text-[10px] text-muted-foreground">{data.role}{data.duration ? ` · ${data.duration}` : ""}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { ff: FFNode };

export default function FlowEditor({ graph, onSave, readOnly }: { graph: Graph; onSave?: ((g: Graph) => Promise<void>) | undefined; readOnly?: boolean }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(graph.nodes as Node<FlowNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges as Edge[]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const sel = nodes.find((n) => n.id === selected);

  const onConnect = useCallback(
    (c: Connection) => {
      setEdges((eds) => {
        const src = nodes.find((n) => n.id === c.source);
        let label: string | undefined;
        if (src?.data.kind === "decision") label = eds.some((e) => e.source === c.source) ? "No" : "Yes";
        return addEdge({ ...c, id: `e-${c.source}-${c.target}-${Date.now()}`, label }, eds);
      });
      setDirty(true);
    },
    [nodes, setEdges],
  );

  const add = (kind: NodeKind) => {
    const id = `n${Date.now()}`;
    setNodes((ns) => [...ns, { id, type: "ff", position: { x: 40 + ns.length * 12, y: 40 + ns.length * 12 }, data: { label: `New ${kind}`, kind } }]);
    setSelected(id);
    setDirty(true);
  };
  const update = (patch: Partial<FlowNodeData>) => {
    setNodes((ns) => ns.map((n) => (n.id === selected ? { ...n, data: { ...n.data, ...patch } } : n)));
    setDirty(true);
  };
  const del = () => {
    setNodes((ns) => ns.filter((n) => n.id !== selected));
    setEdges((es) => es.filter((e) => e.source !== selected && e.target !== selected));
    setSelected(null);
    setDirty(true);
  };
  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    const g = validateGraph({
      nodes: nodes.map((n) => ({ id: n.id, type: "ff", position: n.position, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: typeof e.label === "string" ? e.label : undefined })),
    });
    await onSave(g);
    setSaving(false);
    setDirty(false);
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="panel h-[460px] flex-1 overflow-hidden">
        {nodes.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Empty workflow. Add a step to begin.</div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={(c) => { onNodesChange(c); if (c.some((x) => x.type === "position" && x.dragging === false)) setDirty(true); }}
            onEdgesChange={(c) => { onEdgesChange(c); if (c.some((x) => x.type === "remove")) setDirty(true); }}
            onConnect={readOnly ? () => {} : onConnect}
            onNodeClick={(_, n) => setSelected(n.id)}
            onPaneClick={() => setSelected(null)}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      {!readOnly && (
        <aside className="panel w-full space-y-4 p-4 lg:w-72">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Add step</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["start", "action", "decision", "wait", "end"] as NodeKind[]).map((k) => (
                <Button key={k} size="sm" variant="secondary" onClick={() => add(k)}><Plus /> {k}</Button>
              ))}
            </div>
          </div>
          {sel ? (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="space-y-1"><Label htmlFor="nl">Name</Label><Input id="nl" maxLength={120} value={sel.data.label} onChange={(e) => update({ label: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="nd">Description</Label><Textarea id="nd" maxLength={500} value={sel.data.description ?? ""} onChange={(e) => update({ description: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="nr">Responsible (optional)</Label><Input id="nr" maxLength={60} value={sel.data.role ?? ""} onChange={(e) => update({ role: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="nt">Duration (optional)</Label><Input id="nt" maxLength={30} value={sel.data.duration ?? ""} onChange={(e) => update({ duration: e.target.value })} /></div>
              <Button size="sm" variant="destructive" onClick={del}><Trash2 /> Delete step</Button>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">Click a step to edit it. Drag from a dot to connect steps.</p>
          )}
          <Button className="w-full" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Save workflow" : "Saved"}
          </Button>
        </aside>
      )}
    </div>
  );
}
