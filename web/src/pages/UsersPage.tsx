import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, ErrorBanner, Field, Input, LoadingBlock, Select } from "../components/ui";
import { api, ApiError } from "../lib/api";
import type { User, UserRole } from "../lib/types";

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api<User[]>("/api/users"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kunne ikke hente brukere");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") void load();
  }, [user, load]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
          role,
        }),
      });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("member");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kunne ikke opprette bruker");
    }
  }

  async function patchUser(id: number, body: Partial<{ role: UserRole; is_active: boolean }>) {
    setError(null);
    try {
      await api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Oppdatering feilet");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-spruce">Brukere</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Administratorer kan opprette både vanlige brukere og andre administratorer.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-spruce/10 bg-white/60 p-5 sm:grid-cols-2"
      >
        <h2 className="font-display text-xl text-spruce sm:col-span-2">Ny bruker</h2>
        <Field label="Fullt navn">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="E-post">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Passord">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </Field>
        <Field label="Rolle">
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="member">Medlem</option>
            <option value="admin">Administrator</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">Opprett bruker</Button>
        </div>
      </form>

      {loading ? (
        <LoadingBlock />
      ) : (
        <ul className="divide-y divide-spruce/10 rounded-xl border border-spruce/10 bg-white/55">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold text-spruce">{u.full_name}</p>
                <p className="text-sm text-ink-muted">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={u.role === "admin" ? "brass" : "neutral"}>
                  {u.role === "admin" ? "Admin" : "Medlem"}
                </Badge>
                <Badge tone={u.is_active ? "ok" : "danger"}>
                  {u.is_active ? "Aktiv" : "Deaktivert"}
                </Badge>
                <Select
                  className="w-36"
                  value={u.role}
                  onChange={(e) => void patchUser(u.id, { role: e.target.value as UserRole })}
                >
                  <option value="member">Medlem</option>
                  <option value="admin">Admin</option>
                </Select>
                <Button variant="secondary" onClick={() => void patchUser(u.id, { is_active: !u.is_active })}>
                  {u.is_active ? "Deaktiver" : "Aktiver"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
