import type { Analysis } from "./analysis";

/** Illustrative demo only — not a real customer or measured result. */
export const SAMPLE_PROJECT = {
  name: "Online Perfume Store — Order Follow-up (Sample)",
  business_type: "Online Store",
  business_description: "Small online perfume shop selling through social media chat.",
  problem_type: "Orders get lost or delayed",
  problem_description:
    "Orders arrive through chat, tracking is manual, and follow-up can be missed.",
  daily_volume: "10–50",
  team_size: "2",
  current_tools: ["WhatsApp / manual notes"],
  desired_outcome: "Every order is confirmed and shipped without being forgotten.",
};

export const SAMPLE_ANALYSIS: Analysis = {
  title: "Order follow-up for a small perfume store",
  executive_summary:
    "Orders live in chat threads, so there is no single list of open orders. Unconfirmed orders are easy to forget. Fix: log every order in one sheet, confirm within a set time, and create a follow-up when there is no reply.",
  business_context: "Small online perfume shop, 2 people, 10–50 orders a day via chat.",
  user_provided_facts: [
    "Orders arrive through chat",
    "Order tracking is manual",
    "Follow-up is sometimes missed",
  ],
  assumptions: [
    "Both team members reply to chats (needs confirmation)",
    "No fixed time limit for confirming an order (needs confirmation)",
  ],
  bottlenecks: [
    {
      name: "No single order list",
      description: "Orders are scattered across chat threads.",
      evidence_or_reason: "You said tracking is manual and orders come through chat.",
      impact_level: "high",
      confidence: "medium",
      suggested_fix: "Register every order in one shared sheet the moment it arrives.",
    },
    {
      name: "Unconfirmed orders are forgotten",
      description: "Nothing reminds the team when a customer does not reply.",
      evidence_or_reason: "You said follow-up can be missed.",
      impact_level: "high",
      confidence: "medium",
      suggested_fix: "Create a follow-up task when an order is not confirmed within 24h.",
    },
  ],
  current_workflow: [
    { id: "s1", label: "Order arrives in chat", node_type: "start", description: "", next_step_ids: ["s2"] },
    { id: "s2", label: "Reply when free", node_type: "action", description: "No fixed time", next_step_ids: ["s3"] },
    { id: "s3", label: "Customer confirms?", node_type: "decision", description: "", next_step_ids: ["s4", "s5"], yes_label: "Yes", no_label: "No" },
    { id: "s4", label: "Pack & ship", node_type: "action", description: "", next_step_ids: ["s6"] },
    { id: "s5", label: "Order forgotten", node_type: "end", description: "Lost sale", next_step_ids: [] },
    { id: "s6", label: "Done", node_type: "end", description: "", next_step_ids: [] },
  ],
  recommended_workflow: [
    { id: "r1", label: "Receive order", node_type: "start", description: "", next_step_ids: ["r2"] },
    { id: "r2", label: "Register order in sheet", node_type: "action", description: "Order ID, item, status", next_step_ids: ["r3"] },
    { id: "r3", label: "Confirm order?", node_type: "decision", description: "Within 24h", next_step_ids: ["r4", "r6"], yes_label: "Yes", no_label: "No" },
    { id: "r4", label: "Prepare shipment", node_type: "action", description: "", next_step_ids: ["r5"] },
    { id: "r5", label: "Mark as shipped", node_type: "end", description: "", next_step_ids: [] },
    { id: "r6", label: "Create follow-up task", node_type: "wait", description: "Remind after 24h", next_step_ids: ["r3"] },
  ],
  recommendations: [
    { title: "Log every order in one sheet", rationale: "One place to see all open orders.", priority: "high", expected_effect: "Fewer forgotten orders (not measured)" },
    { title: "Set a 24h confirmation rule", rationale: "Makes delays visible.", priority: "high", expected_effect: "Faster confirmations (not measured)" },
    { title: "Follow up on no-reply orders", rationale: "Recovers orders that would be lost.", priority: "medium", expected_effect: "Not measured" },
  ],
  tasks: [
    { title: "Create a shared order sheet", description: "Columns: date, customer ref, item, status.", priority: "high", status: "todo", linked_recommendation: "Log every order in one sheet" },
    { title: "Agree on the 24h rule", description: "Both team members follow it.", priority: "high", status: "todo", linked_recommendation: "Set a 24h confirmation rule" },
    { title: "Daily 5-min review of open orders", description: "Check unconfirmed rows each morning.", priority: "medium", status: "todo", linked_recommendation: "Follow up on no-reply orders" },
  ],
  metrics: [
    { name: "Unconfirmed orders after 24h", definition: "Orders without confirmation after 24h", how_to_measure: "Count rows in the sheet each morning", why_it_matters: "Shows forgotten orders" },
    { name: "Time to ship", definition: "Hours from order to shipped", how_to_measure: "Order date vs shipped date in the sheet", why_it_matters: "Shows delays" },
  ],
  limitations: "Sample only. No real data was measured; all effects are unverified.",
  follow_up_questions: [],
};
