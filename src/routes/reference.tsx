import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BIRDS,
  PLACES,
  computeSlots,
  defaultSunTimes,
  formatRange,
  type Bird,
  type Place,
} from "@/lib/pakshi";
import {
  SHUKLA,
  KRISHNA,
  WEEKDAY_TA,
  MAIN_SLOT_MIN,
  buildGrid,
  adhiIndex,
  type PakshaFullConfig,
} from "@/lib/pakshi-config";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "பஞ்சபக்ஷி முழு அட்டவணை - Reference Tables" },
      {
        name: "description",
        content:
          "All Pancha Pakshi cycles: 7 weekdays × day/night × Shukla/Krishna paksha with bird order, activities and sub-slot minutes.",
      },
    ],
  }),
  component: ReferencePage,
});

function buildTable(cfg: PakshaFullConfig, weekday: number) {
  const grid = buildGrid(cfg, weekday);
  const cell = (row: number, i: number) => grid[row]?.[i] ?? "";
  return { birds: cfg.birds, cell, adhiCol: adhiIndex(cfg, weekday) };
}

function Table({
  cfg,
  weekday,
}: {
  cfg: PakshaFullConfig;
  weekday: number;
}) {
  const { birds, cell } = buildTable(cfg, weekday);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted">
            <th className="border p-1 text-left">பட்சி ↓ / பாகம் →</th>
            {Array.from({ length: 5 }, (_, i) => (
              <th key={i} className="border p-1">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {birds.map((b, row) => (
            <tr key={b}>
              <td className="border p-1 font-medium">{b}</td>
              {Array.from({ length: 5 }, (_, i) => (
                <td key={i} className="border p-1 text-center">
                  {cell(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DurationsRow({
  cfg,
  weekday,
}: {
  cfg: PakshaFullConfig;
  weekday: number;
}) {
  const sub = cfg.subDur;
  void weekday;
  const total = (Object.values(sub) as number[]).reduce((a, b) => a + b, 0);
  return (
    <div className="mt-1 text-[11px] text-muted-foreground">
      சூட்சம நிமிடம்:{" "}
      {(["உண்ணல்", "ஆட்சி", "நடத்தல்", "உறங்குதல்", "மரணம்"] as const).map(
        (a) => (
          <span key={a} className="mr-2">
            {a} {sub[a]}m
          </span>
        )
      )}
      · மொத்தம் {total}m (main {MAIN_SLOT_MIN}m)
    </div>
  );
}

function ClockView({
  paksha,
  period,
  weekday,
  janma,
  place,
  date,
}: {
  paksha: "shukla" | "krishna";
  period: "day" | "night";
  weekday: number;
  janma: Bird;
  place: Place;
  date: Date;
}) {
  const slots = useMemo(() => {
    // Force weekday by adjusting the date so getDay() matches selection.
    const d = new Date(date);
    const shift = weekday - d.getDay();
    d.setDate(d.getDate() + shift);
    return computeSlots(d, period, place, janma, paksha);
  }, [paksha, period, weekday, janma, place, date]);

  return (
    <div className="mt-2 space-y-2">
      {slots.map((s, i) => (
        <div key={i} className="rounded border p-2 text-xs">
          <div className="font-medium">
            {i + 1}. {s.bird} — {s.activity}
            <span className="ml-2 text-muted-foreground">
              {formatRange(s.start, s.end)}
            </span>
          </div>
          <div className="mt-1 grid grid-cols-1 gap-0.5 pl-2 text-[11px] sm:grid-cols-2 md:grid-cols-3">
            {s.subs.map((sub, j) => (
              <div key={j} className="flex justify-between gap-2">
                <span>
                  {sub.bird} · {sub.activity}
                </span>
                <span className="text-muted-foreground">
                  {formatRange(sub.start, sub.end)} · {Math.round(sub.end - sub.start)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferencePage() {
  const [placeId, setPlaceId] = useState(PLACES[0].id);
  const [janma, setJanma] = useState<Bird>("வல்லூறு");
  const [dateStr, setDateStr] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [showClock, setShowClock] = useState(true);

  const place = PLACES.find((p) => p.id === placeId) ?? PLACES[0];
  const date = new Date(dateStr);
  const sun = defaultSunTimes(date, place);

  const sections: {
    key: string;
    label: string;
    paksha: "shukla" | "krishna";
    period: "day" | "night";
  }[] = [
    { key: "sd", label: "வளர்பிறை · பகல்", paksha: "shukla", period: "day" },
    { key: "sn", label: "வளர்பிறை · இரவு", paksha: "shukla", period: "night" },
    { key: "kd", label: "தேய்பிறை · பகல்", paksha: "krishna", period: "day" },
    { key: "kn", label: "தேய்பிறை · இரவு", paksha: "krishna", period: "night" },
  ];

  const getCfg = (p: "shukla" | "krishna", per: "day" | "night") =>
    (p === "shukla" ? SHUKLA : KRISHNA)[per];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">
            பஞ்சபக்ஷி முழு அட்டவணை — Reference
          </h1>
          <p className="text-xs text-muted-foreground">
            7 weekdays × day/night × 2 pakshas. Main and சூட்சம orders are table-based.
            Edit <code>src/lib/pakshi-config.ts</code> to alter any cycle.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm text-primary underline underline-offset-2"
        >
          ← Calculator
        </Link>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded border p-3">
        <label className="text-xs">
          <div>Place</div>
          <select
            className="rounded border bg-background p-1"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <div>Date</div>
          <input
            type="date"
            className="rounded border bg-background p-1"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </label>
        <label className="text-xs">
          <div>Janma pakshi</div>
          <select
            className="rounded border bg-background p-1"
            value={janma}
            onChange={(e) => setJanma(e.target.value as Bird)}
          >
            {BIRDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showClock}
            onChange={(e) => setShowClock(e.target.checked)}
          />
          Show clock times
        </label>
        <div className="text-xs text-muted-foreground">
          Sunrise ~ {formatRange(sun.sunrise, sun.sunrise).split(" - ")[0]}
        </div>
      </div>

      {sections.map((sec) => {
        const cfg = getCfg(sec.paksha, sec.period);
        return (
          <section key={sec.key} className="rounded-lg border p-3">
            <h2 className="mb-2 text-lg font-semibold">{sec.label}</h2>
            <div className="mb-2 text-[11px] text-muted-foreground">
              Bird order: {cfg.birds.join(" · ")} · சூட்சம: {cfg.subBirds.join(" · ")}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {WEEKDAY_TA.map((wname, wd) => (
                <div key={wd} className="rounded border p-2">
                  <div className="mb-1 flex items-baseline justify-between">
                    <div className="font-medium">{wname}</div>
                  </div>
                  <Table cfg={cfg} weekday={wd} />
                  <DurationsRow cfg={cfg} weekday={wd} />
                  {showClock && (
                    <ClockView
                      paksha={sec.paksha}
                      period={sec.period}
                      weekday={wd}
                      janma={janma}
                      place={place}
                      date={date}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <footer className="text-xs text-muted-foreground">
        To alter any cycle (bird order, activity sequence, weekday offset, or
        sub-slot minutes), edit <code>src/lib/pakshi-config.ts</code>. The
        calculator and this reference page both read from that single source.
      </footer>
    </div>
  );
}
