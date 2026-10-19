import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button, ErrorBanner, Field, Input } from "../components/ui";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("admin@korps.example");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Innlogging feilet");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <div className="animate-fade-up">
        <p className="font-display text-5xl leading-none text-spruce">Støttehjulet</p>
        <p className="mt-3 text-base text-ink-muted">
          Hold oversikt over årets søknadsfrister for penge- og materialstøtte.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-10 space-y-4 rounded-xl border border-spruce/10 bg-white/55 p-6 shadow-sm backdrop-blur animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <h1 className="font-display text-2xl text-spruce">Logg inn</h1>
        {error && <ErrorBanner message={error} />}
        <Field label="E-post">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </Field>
        <Field label="Passord">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logger inn…" : "Logg inn"}
        </Button>
        <p className="text-xs text-ink-muted">
          Demo: admin@korps.example / admin123 — eller styre@korps.example / styre123
        </p>
      </form>
    </div>
  );
}
