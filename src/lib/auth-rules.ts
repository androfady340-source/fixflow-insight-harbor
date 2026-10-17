import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(254);

export const PASSWORD_RULES = [
  { id: "len", label: "10+ characters", test: (p: string) => p.length >= 10 },
  { id: "upper", label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "num", label: "Number", test: (p: string) => /\d/.test(p) },
  { id: "sym", label: "Symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordScore(p: string) {
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}

export const strongPassword = z
  .string()
  .max(128, "Too long")
  .refine((p) => passwordScore(p) === PASSWORD_RULES.length, "Password does not meet all rules");

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(r: unknown): string {
  if (typeof r !== "string") return "/projects";
  if (!r.startsWith("/") || r.startsWith("//") || r.startsWith("/\\")) return "/projects";
  return r;
}

/** Lockout after repeated failed sign-ins: 5 tries, then 1, 2, 4... minutes. */
export const MAX_ATTEMPTS = 5;
export function lockoutMs(failures: number) {
  if (failures < MAX_ATTEMPTS) return 0;
  return 60_000 * 2 ** Math.min(failures - MAX_ATTEMPTS, 5);
}
