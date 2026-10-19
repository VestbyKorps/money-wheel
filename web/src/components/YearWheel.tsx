import { useMemo } from "react";
import type { WheelItem } from "../lib/types";
import { cn } from "../lib/utils";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function statusTone(item: WheelItem): string {
  const status = item.application?.status ?? "not_started";
  if (status === "approved") return "#1f6b45";
  if (status === "submitted") return "#1a5c4a";
  if (status === "in_progress") return "#d4a017";
  if (status === "rejected") return "#9b2c2c";
  if (status === "skipped") return "#8a9a93";
  if (item.days_until < 0) return "#9b2c2c";
  if (item.days_until <= 14) return "#d4a017";
  return "#0f3d32";
}

export function YearWheel({
  items,
  year,
  selectedId,
  onSelect,
}: {
  items: WheelItem[];
  year: number;
  selectedId: number | null;
  onSelect: (deadlineId: number) => void;
}) {
  const markers = useMemo(() => {
    return items.map((item) => {
      const d = new Date(item.deadline_date + "T12:00:00");
      const start = new Date(year, 0, 0);
      const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
      const angle = (dayOfYear / 365) * 360;
      return { item, angle };
    });
  }, [items, year]);

  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 150;
  const inner = 95;

  return (
    <div className="relative mx-auto w-full max-w-md animate-fade-up">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full drop-shadow-sm">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a5c4a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f3d32" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={outer + 12} fill="url(#wheelGlow)" />
        <circle
          cx={cx}
          cy={cy}
          r={outer}
          fill="#f7f2e9"
          stroke="#0f3d32"
          strokeWidth="2.5"
          className="animate-draw-ring"
          strokeDasharray="880"
        />
        <circle cx={cx} cy={cy} r={inner} fill="#0f3d32" />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#f3ede2"
          fontFamily="Literata, Georgia, serif"
          fontSize="28"
          fontWeight="700"
        >
          {year}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#d4a017" fontSize="11" letterSpacing="1.5">
          STØTTEHJULET
        </text>

        {MONTH_SHORT.map((label, i) => {
          const angle = (i / 12) * 360;
          const tickOuter = polar(cx, cy, outer, angle);
          const tickInner = polar(cx, cy, outer - 10, angle);
          const labelPos = polar(cx, cy, outer + 22, angle + 15);
          return (
            <g key={label}>
              <line
                x1={tickInner.x}
                y1={tickInner.y}
                x2={tickOuter.x}
                y2={tickOuter.y}
                stroke="#0f3d32"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#4a5c54"
                fontSize="10"
                fontWeight="600"
              >
                {label}
              </text>
            </g>
          );
        })}

        {markers.map(({ item, angle }) => {
          const pos = polar(cx, cy, (outer + inner) / 2 + 8, angle);
          const selected = selectedId === item.deadline_id;
          return (
            <g key={item.deadline_id} className="cursor-pointer" onClick={() => onSelect(item.deadline_id)}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={selected ? 11 : 8}
                fill={statusTone(item)}
                stroke={selected ? "#d4a017" : "#f3ede2"}
                strokeWidth={selected ? 3 : 2}
              />
              <title>{`${item.scheme_name}: ${item.deadline_date}`}</title>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-ink-muted">Klikk en markør for detaljer</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-ink-muted">
        <LegendDot color="#0f3d32" label="Planlagt" />
        <LegendDot color="#d4a017" label="Nært / under arbeid" />
        <LegendDot color="#1f6b45" label="Innvilget" />
        <LegendDot color="#9b2c2c" label="Passert / avslått" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5")}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
