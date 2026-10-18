import { STATUS_LABEL } from "@/lib/analysis";

const tone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  analyzed: "bg-primary/15 text-primary",
  in_progress: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[status] ?? tone["draft"]}`}>{STATUS_LABEL[status] ?? status}</span>;
}

const lv: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-muted text-muted-foreground",
};
export function LevelBadge({ level, prefix }: { level: string; prefix?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lv[level] ?? lv["low"]}`}>{prefix ? `${prefix}: ` : ""}{level}</span>;
}
