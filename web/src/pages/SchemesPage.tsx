import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  LoadingBlock,
  Select,
  Textarea,
} from "../components/ui";
import { api, ApiError } from "../lib/api";
import { KIND_LABELS, MONTHS_NB } from "../lib/labels";
import type { Deadline, Scheme, SupportKind } from "../lib/types";

export function SchemesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [kind, setKind] = useState<SupportKind>("money");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(15);
  const [checklist, setChecklist] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, d] = await Promise.all([
        api<Scheme[]>("/api/schemes?include_inactive=true"),
        api<Deadline[]>("/api/deadlines?include_inactive=true"),
      ]);
      setSchemes(s);
      setDeadlines(d);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kunne ikke hente data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    try {
      const scheme = await api<Scheme>("/api/schemes", {
        method: "POST",
        body: JSON.stringify({
          name,
          provider,
          kind,
          description,
        }),
      });
      await api("/api/deadlines", {
        method: "POST",
        body: JSON.stringify({
          scheme_id: scheme.id,
          title: title || `Søknadsfrist ${name}`,
          recurrence: "yearly",
          month,
          day,
          opens_days_before: 30,
          reminder_days: "30,14,7",
          checklist,
        }),
      });
      setShowForm(false);
      setName("");
      setProvider("");
      setDescription("");
      setTitle("");
      setChecklist("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kunne ikke opprette");
    }
  }

  async function toggleScheme(scheme: Scheme) {
    if (!isAdmin) return;
    try {
      await api(`/api/schemes/${scheme.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !scheme.is_active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Oppdatering feilet");
    }
  }

  const deadlinesByScheme = (schemeId: number) =>
    deadlines.filter((d) => d.scheme_id === schemeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-spruce">Støtteordninger</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Programmer korpset søker midler eller materiell fra.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Lukk" : "Ny ordning"}
          </Button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingBlock />}

      {showForm && isAdmin && (
        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-xl border border-spruce/10 bg-white/60 p-5 sm:grid-cols-2"
        >
          <Field label="Navn">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Tilbyder">
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} required />
          </Field>
          <Field label="Type">
            <Select value={kind} onChange={(e) => setKind(e.target.value as SupportKind)}>
              <option value="money">Penger</option>
              <option value="material">Materiell</option>
              <option value="both">Begge</option>
            </Select>
          </Field>
          <Field label="Frist-tittel">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Valgfritt" />
          </Field>
          <Field label="Måned">
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS_NB.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dag">
            <Input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Beskrivelse">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Sjekkliste (én per linje)">
              <Textarea value={checklist} onChange={(e) => setChecklist(e.target.value)} rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Opprett med årlig frist</Button>
          </div>
        </form>
      )}

      {!loading && schemes.length === 0 && (
        <EmptyState title="Ingen støtteordninger" body="Admin kan opprette den første ordningen her." />
      )}

      <ul className="space-y-3">
        {schemes.map((scheme) => {
          const dls = deadlinesByScheme(scheme.id);
          return (
            <li
              key={scheme.id}
              className="rounded-xl border border-spruce/10 bg-white/55 px-5 py-4 animate-fade-up"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-spruce">{scheme.name}</h2>
                  <p className="text-sm text-ink-muted">
                    {scheme.provider} · {KIND_LABELS[scheme.kind]}
                  </p>
                  {scheme.description && (
                    <p className="mt-2 max-w-2xl text-sm text-ink">{scheme.description}</p>
                  )}
                  <ul className="mt-3 space-y-1 text-sm">
                    {dls.map((d) => (
                      <li key={d.id} className="text-ink-muted">
                        {d.title}
                        {d.month && d.day
                          ? ` — ${d.day}. ${MONTHS_NB[d.month - 1].toLowerCase()} (årlig)`
                          : d.absolute_deadline
                            ? ` — ${d.absolute_deadline}`
                            : ""}
                        {!d.is_active ? " (inaktiv)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={scheme.is_active ? "ok" : "neutral"}>
                    {scheme.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                  {isAdmin && (
                    <Button variant="secondary" onClick={() => void toggleScheme(scheme)}>
                      {scheme.is_active ? "Deaktiver" : "Aktiver"}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
