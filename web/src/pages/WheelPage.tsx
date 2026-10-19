import { useCallback, useEffect, useMemo, useState } from "react";
import { YearWheel } from "../components/YearWheel";
import { Badge, Button, EmptyState, ErrorBanner, Field, LoadingBlock, Select, Textarea } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import { daysLabel, formatDate, KIND_LABELS, STATUS_LABELS } from "../lib/labels";
import type { ApplicationStatus, User, WheelItem, WheelResponse } from "../lib/types";

const STATUSES: ApplicationStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "skipped",
];

export function WheelPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<WheelResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wheel, directory] = await Promise.all([
        api<WheelResponse>(`/api/wheel?year=${year}`),
        api<User[]>("/api/users/directory"),
      ]);
      setData(wheel);
      setUsers(directory);
      setSelectedId((current) => {
        if (wheel.items.some((i) => i.deadline_id === current)) return current;
        return wheel.items[0]?.deadline_id ?? null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kunne ikke hente årshjul");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected: WheelItem | null = useMemo(() => {
    if (!data) return null;
    return data.items.find((i) => i.deadline_id === selectedId) ?? null;
  }, [data, selectedId]);

  const upcoming = useMemo(() => {
    if (!data) return [];
    return [...data.items].sort((a, b) => a.days_until - b.days_until);
  }, [data]);

  async function updateApplication(patch: {
    status?: ApplicationStatus;
    assignee_id?: number | null;
    notes?: string;
  }) {
    if (!selected?.application) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/applications/${selected.application.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lagring feilet");
    } finally {
      setSaving(false);
    }
  }

  const canEdit =
    user?.role === "admin" ||
    (selected?.application && selected.application.assignee_id === user?.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-spruce">Årshjul {year}</h1>
          <p className="mt-1 text-sm text-ink-muted">Søknadsvinduer fordelt over året.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setYear((y) => y - 1)}>
            ←
          </Button>
          <Select
            className="w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={() => setYear((y) => y + 1)}>
            →
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingBlock label="Henter årshjul…" />}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title="Ingen frister dette året"
          body="Admin kan legge til støtteordninger og frister under Støtteordninger."
        />
      )}

      {!loading && data && data.items.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <YearWheel
            items={data.items}
            year={year}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {selected ? (
              <article className="rounded-xl border border-spruce/10 bg-white/60 p-5 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-2xl text-spruce">{selected.scheme_name}</h2>
                    <p className="text-sm text-ink-muted">
                      {selected.provider} · {KIND_LABELS[selected.kind]}
                    </p>
                  </div>
                  <Badge tone={selected.days_until <= 14 && selected.days_until >= 0 ? "warn" : "neutral"}>
                    {daysLabel(selected.days_until)}
                  </Badge>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Frist</dt>
                    <dd>{formatDate(selected.deadline_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Åpner typisk</dt>
                    <dd>{selected.opens_date ? formatDate(selected.opens_date) : "—"}</dd>
                  </div>
                </dl>

                {selected.checklist && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sjekkliste</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-ink">
                      {selected.checklist.split("\n").filter(Boolean).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.application && (
                  <div className="mt-5 space-y-3 border-t border-spruce/10 pt-4">
                    <Field label="Status">
                      <Select
                        value={selected.application.status}
                        disabled={!canEdit || saving}
                        onChange={(e) =>
                          void updateApplication({ status: e.target.value as ApplicationStatus })
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {user?.role === "admin" && (
                      <Field label="Ansvarlig">
                        <Select
                          value={selected.application.assignee_id ?? ""}
                          disabled={saving}
                          onChange={(e) =>
                            void updateApplication({
                              assignee_id: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        >
                          <option value="">Ikke tildelt</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    )}
                    <Field label="Notater">
                      <Textarea
                        rows={3}
                        defaultValue={selected.application.notes}
                        key={selected.application.id + String(selected.application.updated_at)}
                        disabled={!canEdit || saving}
                        onBlur={(e) => {
                          if (e.target.value !== selected.application?.notes) {
                            void updateApplication({ notes: e.target.value });
                          }
                        }}
                      />
                    </Field>
                    {!canEdit && (
                      <p className="text-xs text-ink-muted">
                        Kun ansvarlig eller admin kan endre denne søknaden.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ) : null}

            <section>
              <h3 className="mb-2 font-display text-xl text-spruce">Alle frister</h3>
              <ul className="divide-y divide-spruce/10 rounded-xl border border-spruce/10 bg-white/50">
                {upcoming.map((item) => (
                  <li key={item.deadline_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.deadline_id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-mist/40"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-spruce">{item.scheme_name}</span>
                        <span className="text-xs text-ink-muted">
                          {formatDate(item.deadline_date)} ·{" "}
                          {STATUS_LABELS[item.application?.status ?? "not_started"]}
                        </span>
                      </span>
                      <Badge tone={item.days_until < 0 ? "danger" : item.days_until <= 14 ? "warn" : "neutral"}>
                        {daysLabel(item.days_until)}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
