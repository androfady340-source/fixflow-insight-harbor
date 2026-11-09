import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Eye, EyeOff, Lock, ShieldCheck, Check, X, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  emailSchema,
  strongPassword,
  PASSWORD_RULES,
  passwordScore,
  safeRedirect,
  lockoutMs,
} from "@/lib/auth-rules";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).catch("login").optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in — FixFlow" },
      { name: "description", content: "Secure sign in to your FixFlow workspace." },
      { property: "og:title", content: "Log in — FixFlow" },
      { property: "og:description", content: "Secure sign in to your FixFlow workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const LOCK_KEY = "ff_auth_lock";
type Lock = { failures: number; until: number };

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const mode = search.mode ?? "login";
  const dest = safeRedirect(search.redirect);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name"|"email"|"password"|"confirm", string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<"" | "signup" | "forgot">("");
  const [lock, setLock] = useState<Lock>({ failures: 0, until: 0 });
  const [now, setNow] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCK_KEY);
      if (raw) setLock(JSON.parse(raw));
    } catch (error) {
      console.warn("Unable to restore local sign-in lockout state.", error);
    }
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const saved = safeRedirect(sessionStorage.getItem("ff_after_login") ?? dest);
        sessionStorage.removeItem("ff_after_login");
        navigate({ to: saved as "/projects", replace: true });
      }
    });
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setErrors({});
    setFormError("");
    setSent("");
    setPassword("");
    setConfirm("");
  }, [mode]);

  const saveLock = (l: Lock) => {
    setLock(l);
    localStorage.setItem(LOCK_KEY, JSON.stringify(l));
  };
  const lockedFor = Math.max(0, Math.ceil((lock.until - now) / 1000));

  const setMode = (m: "login" | "signup" | "forgot") =>
    navigate({ to: "/auth", search: { mode: m, redirect: search.redirect }, replace: true });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError("");
    const errs: Partial<Record<"name"|"email"|"password"|"confirm", string>> = {};
    const em = emailSchema.safeParse(email);
    if (!em.success) errs["email"] = em.error.issues[0]?.message ?? "Invalid";

    if (mode === "signup") {
      if (name.trim().length < 2) errs["name"] = "Enter your name";
      const pw = strongPassword.safeParse(password);
      if (!pw.success) errs["password"] = pw.error.issues[0]?.message ?? "Invalid";
      if (confirm !== password) errs["confirm"] = "Passwords don't match";
    } else if (mode === "login" && !password) errs["password"] = "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length || !em.success) return;

    setLoading(true);
    try {
      if (mode === "login") {
        if (lockedFor > 0) return;
        const { error } = await supabase.auth.signInWithPassword({ email: em.data, password });
        if (error) {
          const failures = lock.failures + 1;
          saveLock({ failures, until: Date.now() + lockoutMs(failures) });
          setFormError(
            /confirm/i.test(error.message)
              ? "Please confirm your email first. Check your inbox."
              : "Email or password is incorrect.",
          );
          return;
        }
        saveLock({ failures: 0, until: 0 });
        navigate({ to: dest as "/projects", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: em.data,
          password,
          options: { emailRedirectTo: window.location.origin + dest, data: { full_name: name.trim().slice(0, 100) } },
        });
        if (error) {
          setFormError(
            /pwned|leak|weak/i.test(error.message)
              ? "This password appeared in a data leak. Choose another one."
              : "Couldn't create the account. Please try again.",
          );
          return;
        }
        setSent("signup");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) {
          setFormError("Couldn't send the reset email. Please try again.");
          return;
        }
        setSent("forgot");
      }
    } catch (error) {
      console.error("Authentication request failed", error);
      setFormError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setFormError("");
    try {
      sessionStorage.setItem("ff_after_login", dest);
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (r.error) setFormError("Google sign-in failed. Try again.");
      else if (!r.redirected) navigate({ to: dest as "/projects", replace: true });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setFormError("Google sign-in failed. Check your connection and try again.");
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back";
  const score = passwordScore(password);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 grid-bg">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="panel p-6 sm:p-8">
          {sent ? (
            <div className="text-center" role="status">
              <MailCheck className="mx-auto size-10 text-success" />
              <h1 className="mt-4 text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {sent === "signup"
                  ? "We sent a confirmation link. Open it to activate your account."
                  : "If an account exists, a reset link is on its way."}
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => setMode("login")}>Back to log in</Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signup" ? "Free. Takes 30 seconds." : mode === "forgot" ? "We'll email you a secure link." : "Log in to your workspace."}
              </p>

              {mode !== "forgot" && (
                <>
                  <Button type="button" variant="outline" className="mt-6 w-full" onClick={google}>
                    <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.07-.15-1.11Z"/></svg>
                    Continue with Google
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={onSubmit} noValidate className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
                {mode === "signup" && (
                  <Field id="name" label="Full name" error={errors.name}>
                    <Input id="name" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
                  </Field>
                )}
                <Field id="email" label="Email" error={errors.email}>
                  <Input id="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
                </Field>
                {mode !== "forgot" && (
                  <Field
                    id="password"
                    label="Password"
                    error={errors.password}
                    extra={mode === "login" ? <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot?</button> : null}
                  >
                    <div className="relative">
                      <Input
                        id="password"
                        type={show ? "text" : "password"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        maxLength={128}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>
                )}
                {mode === "signup" && (
                  <>
                    <div aria-live="polite">
                      <div className="flex gap-1" aria-hidden>
                        {PASSWORD_RULES.map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score === 5 ? "bg-success" : "bg-warning") : "bg-muted"}`} />
                        ))}
                      </div>
                      <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
                        {PASSWORD_RULES.map((r) => {
                          const ok = r.test(password);
                          return (
                            <li key={r.id} className={`flex items-center gap-1 ${ok ? "text-success" : "text-muted-foreground"}`}>
                              {ok ? <Check className="size-3" /> : <X className="size-3" />} {r.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <Field id="confirm" label="Confirm password" error={errors.confirm}>
                      <Input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errors.confirm} />
                    </Field>
                  </>
                )}

                {formError && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
                {mode === "login" && lockedFor > 0 && (
                  <p role="alert" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                    Too many attempts. Try again in {lockedFor}s.
                  </p>
                )}

                <Button type="submit" variant="hero" className="h-11 w-full" disabled={loading || (mode === "login" && lockedFor > 0)}>
                  {loading && <Loader2 className="animate-spin" />}
                  {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>No account? <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Sign up</button></>
                ) : (
                  <>Have an account? <button className="text-primary hover:underline" onClick={() => setMode("login")}>Log in</button></>
                )}
              </p>
            </>
          )}
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1"><Lock className="size-3 text-success" /> Encrypted connection</li>
          <li className="flex items-center gap-1"><ShieldCheck className="size-3 text-success" /> Leaked passwords blocked</li>
          <li className="flex items-center gap-1"><ShieldCheck className="size-3 text-success" /> Email verification</li>
        </ul>
        <p className="mt-4 text-center text-xs"><Link to="/" className="text-muted-foreground hover:text-foreground">← Back to home</Link></p>
      </div>
    </div>
  );
}

function Field({ id, label, error, extra, children }: { id: string; label: string; error?: string | undefined; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {extra}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
