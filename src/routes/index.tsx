import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AUSPICIOUS_ACTIVITY,
  ACTIVITY_MEANING,
  BIRD_INFO,
  NAKSHATRAS,
  PLACES,
  computeSlots,
  currentActivity,
  enemyOf,
  formatDate,
  formatRange,
  friendOf,
  janmaPakshi,
  nakshatraFromDate,
  pakshaFromBirth,
  pakshaFromDate,
  type Activity,
  type Bird,
  type Place,
} from "@/lib/pakshi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "பஞ்சபக்ஷி - Pancha Pakshi Timings" },
      {
        name: "description",
        content:
          "Pancha Pakshi Shastra timings in Tamil. Enter your birth details and view daily janma, friend and enemy pakshi activities.",
      },
      { property: "og:title", content: "பஞ்சபக்ஷி - Pancha Pakshi Timings" },
      {
        property: "og:description",
        content: "Janma, natpu and pagai pakshi timings with sub-activities.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: App,
});

type Screen = "form" | "detail" | "timings" | "subtimings";

interface FormData {
  name: string;
  gender: "ஆண்" | "பெண்";
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
  placeId: string;
}

function parseBirthDate(f: FormData): Date | null {
  const y = Number(f.year), m = Number(f.month), d = Number(f.day);
  if (!y || !m || !d) return null;
  let h = Number(f.hour) || 0;
  const min = Number(f.minute) || 0;
  if (f.meridiem === "PM" && h < 12) h += 12;
  if (f.meridiem === "AM" && h === 12) h = 0;
  return new Date(Date.UTC(y, m - 1, d, h - 5, min - 30)); // IST → UTC
}

function App() {
  const [screen, setScreen] = useState<Screen>("form");
  const [form, setForm] = useState<FormData>({
    name: "",
    gender: "ஆண்",
    day: "",
    month: "",
    year: "",
    hour: "",
    minute: "",
    meridiem: "AM",
    placeId: "dharmapuri",
  });
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<"day" | "night">("day");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const place = PLACES.find((p) => p.id === form.placeId) ?? PLACES[0];
  const birth = parseBirthDate(form);
  const nakshatraIdx = birth ? nakshatraFromDate(birth) : 0;
  const paksha = birth ? pakshaFromBirth(birth) : "shukla";
  const janma: Bird = janmaPakshi(nakshatraIdx, paksha);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background shadow-xl relative min-h-screen flex flex-col">
        {screen === "form" && (
          <FormScreen form={form} setForm={setForm} onSubmit={() => setScreen("detail")} />
        )}
        {screen === "detail" && (
          <DetailScreen
            form={form}
            place={place}
            janma={janma}
            nakshatraIdx={nakshatraIdx}
            paksha={paksha}
            date={date}
            setDate={setDate}
            onBack={() => setScreen("form")}
            onView={() => setScreen("timings")}
          />
        )}
        {screen === "timings" && (
          <TimingsScreen
            date={date}
            period={period}
            place={place}
            janma={janma}
            setPeriod={setPeriod}
            onBack={() => setScreen("detail")}
            onExpand={(i) => {
              setExpandedIdx(i);
              setScreen("subtimings");
            }}
          />
        )}
        {screen === "subtimings" && expandedIdx !== null && (
          <SubTimingsScreen
            date={date}
            period={period}
            place={place}
            janma={janma}
            focusIdx={expandedIdx}
            onBack={() => setScreen("timings")}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- FORM ---------------- */

function FormScreen({
  form,
  setForm,
  onSubmit,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onSubmit: () => void;
}) {
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm({ ...form, [k]: v });

  return (
    <>
      <Header title="Pancha Pakshi Form" />
      <div className="p-4 -mt-6">
        <div className="bg-card rounded-3xl shadow-[var(--shadow-card)] p-6 space-y-5">
          <Field label="பெயர்">
            <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5">
              <span className="text-muted-foreground">👤</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="பெயரை உள்ளிடவும்"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </Field>

          <Field label="பாலினம்">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">⚥</span>
              {(["ஆண்", "பெண்"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("gender", g)}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      form.gender === g ? "border-primary bg-primary" : "border-primary"
                    }`}
                  />
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="பிறந்த தேதி">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📅</span>
              <MiniInput placeholder="நாள்" value={form.day} onChange={(v) => set("day", v)} />
              <MiniInput placeholder="மாதம்" value={form.month} onChange={(v) => set("month", v)} />
              <MiniInput placeholder="ஆண்டு" value={form.year} onChange={(v) => set("year", v)} />
            </div>
          </Field>

          <Field label="பிறந்த நேரம்">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">🕐</span>
              <MiniInput placeholder="மணி" value={form.hour} onChange={(v) => set("hour", v)} />
              <MiniInput placeholder="நிமிடம்" value={form.minute} onChange={(v) => set("minute", v)} />
              <select
                value={form.meridiem}
                onChange={(e) => set("meridiem", e.target.value as "AM" | "PM")}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-center bg-transparent"
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
          </Field>

          <Field label="பிறந்த இடம்">
            <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-2 bg-background">
              <span className="text-muted-foreground">📍</span>
              <select
                className="flex-1 bg-transparent outline-none text-sm py-1"
                value={form.placeId}
                onChange={(e) => set("placeId", e.target.value)}
              >
                {PLACES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="நட்சத்திரம்">
            <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-2 bg-background">
              <span className="text-muted-foreground">✨</span>
              <select
                className="flex-1 bg-transparent outline-none text-sm py-1"
                value={form.nakshatraIdx}
                onChange={(e) => set("nakshatraIdx", Number(e.target.value))}
              >
                {NAKSHATRAS.map((n, i) => (
                  <option key={n} value={i}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="பிறப்பு பக்ஷம்">
            <div className="flex gap-3">
              {(
                [
                  { v: "shukla", l: "வளர் பிறை" },
                  { v: "krishna", l: "தேய் பிறை" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set("paksha", opt.v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                    form.paksha === opt.v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={onSubmit}
            className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold py-3 rounded-full shadow-[var(--shadow-card)]"
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-semibold text-sm mb-2 text-foreground">{label}</label>
      {children}
    </div>
  );
}

function MiniInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 text-sm text-center bg-transparent outline-none focus:border-primary"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ---------------- DETAIL ---------------- */

function DetailScreen({
  form,
  place,
  janma,
  date,
  setDate,
  onBack,
  onView,
}: {
  form: FormData;
  place: Place;
  janma: Bird;
  date: Date;
  setDate: (d: Date) => void;
  onBack: () => void;
  onView: () => void;
}) {
  const shiftDay = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  const period: "day" | "night" = date.getHours() >= 6 && date.getHours() < 18 ? "day" : "night";
  const dayPaksha = pakshaFromDate(date);
  const slots = useMemo(
    () => computeSlots(date, period, place, janma),
    [date, period, place, janma]
  );
  const current = currentActivity(slots, new Date());
  const currentBird: Bird = current?.bird ?? janma;
  const friend = friendOf(janma, dayPaksha, period);
  const enemy = enemyOf(janma, dayPaksha, period);

  const isoDate = date.toISOString().slice(0, 10);
  const weekdayTa = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"][
    date.getDay()
  ];

  return (
    <>
      <Header title="பஞ்சபக்ஷி" onBack={onBack} />
      <div className="bg-[image:var(--gradient-header)] text-header-foreground pt-2 pb-20 relative">
        <label className="relative mx-4 flex items-center justify-between gap-2 py-2.5 px-4 bg-card/95 rounded-full shadow-[var(--shadow-soft)] cursor-pointer text-foreground mt-1">
          <span className="text-lg">📅</span>
          <span className="font-semibold text-base flex-1 text-center">{formatDate(date)}</span>
          <span className="text-xs font-semibold text-primary">தேதி தேர்வு ▾</span>
          <input
            type="date"
            value={isoDate}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              if (y) setDate(new Date(y, m - 1, d));
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ colorScheme: "light" }}
          />
        </label>
        <div className="text-center text-xs opacity-90 mt-2 mb-3">
          {weekdayTa} • {place.name}
        </div>
        <div className="mx-4 bg-card rounded-full shadow-[var(--shadow-soft)] flex overflow-hidden p-1">
          <button
            onClick={() => shiftDay(-1)}
            className="flex-1 py-2.5 text-sm font-semibold bg-primary/80 text-primary-foreground rounded-full"
          >
            ← முந்தைய தேதி
          </button>
          <button
            onClick={() => shiftDay(1)}
            className="flex-1 py-2.5 text-sm font-semibold text-foreground"
          >
            அடுத்த தேதி →
          </button>
        </div>
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <path d="M0,40 Q200,0 400,40 L400,40 L0,40 Z" fill="var(--background)" />
        </svg>
      </div>

      <div className="p-5 space-y-3">
        <InfoRow label="பெயர்" value={form.name || "—"} />
        <InfoRow label="பாலினம்" value={form.gender} />
        <InfoRow label="பிறந்த இடம்" value={place.name} />
        <InfoRow label="நட்சத்திரம்" value={NAKSHATRAS[form.nakshatraIdx]} />
        <InfoRow
          label="பிறப்பு பக்ஷம்"
          value={form.paksha === "krishna" ? "க்ருஷ்ண பக்ஷம்" : "சுக்ல பக்ஷம்"}
        />

        <div className="pt-2 space-y-3">
          <PakshiCard
            heading="பிறப்பு பட்சி (Janma)"
            bird={janma}
            tone="primary"
            note={current ? `இப்போது: ${current.activity}` : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <PakshiCard heading="நட்பு பட்சி" bird={friend} tone="friend" />
            <PakshiCard heading="பகை பட்சி" bird={enemy} tone="enemy" />
          </div>
          <PakshiCard heading="நடப்பு பட்சி" bird={currentBird} tone="current" />
        </div>

        <button
          onClick={onView}
          className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold py-3.5 rounded-full shadow-[var(--shadow-card)] mt-4"
        >
          பட்சியின் நிலைகளை காண்க →
        </button>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_12px_1fr] gap-3 items-start text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function PakshiCard({
  heading,
  bird,
  tone,
  note,
}: {
  heading: string;
  bird: Bird;
  tone: "primary" | "friend" | "enemy" | "current";
  note?: string;
}) {
  const info = BIRD_INFO[bird];
  const toneClass = {
    primary: "bg-[image:var(--gradient-primary)] text-primary-foreground",
    friend: "bg-auspicious/10 border border-auspicious/30 text-foreground",
    enemy: "bg-inauspicious/10 border border-inauspicious/30 text-foreground",
    current: "bg-card border border-border text-foreground shadow-[var(--shadow-soft)]",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-80 font-semibold">
        {heading}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold">{bird}</span>
        <span className="text-xs opacity-80">({info.english})</span>
      </div>
      <div className="text-xs opacity-80 mt-1">
        {info.element} • திசை: {info.direction}
      </div>
      {note && <div className="text-xs font-semibold mt-2">{note}</div>}
    </div>
  );
}

/* ---------------- TIMINGS ---------------- */

function TimingsScreen({
  date,
  period,
  place,
  janma,
  setPeriod,
  onBack,
  onExpand,
}: {
  date: Date;
  period: "day" | "night";
  place: Place;
  janma: Bird;
  setPeriod: (p: "day" | "night") => void;
  onBack: () => void;
  onExpand: (i: number) => void;
}) {
  const slots = useMemo(
    () => computeSlots(date, period, place, janma),
    [date, period, place, janma]
  );

  return (
    <>
      <Header title="பட்சியின் நிலைகள்" onBack={onBack} />
      <div className="bg-[image:var(--gradient-header)] pt-2 pb-6 flex justify-center gap-4">
        <PeriodPill label="பகல்" active={period === "day"} onClick={() => setPeriod("day")} />
        <PeriodPill label="இரவு" active={period === "night"} onClick={() => setPeriod("night")} />
      </div>

      <div className="bg-panel m-4 p-4 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-6">
        {slots.map((s, i) => (
          <button
            key={i}
            onClick={() => onExpand(i)}
            className={`text-center ${i === 2 ? "col-span-2" : ""}`}
          >
            <BirdActivityLabel bird={s.bird} activity={s.activity} />
            <div className="text-sm font-medium mt-1">{formatRange(s.start, s.end)}</div>
            <div
              className={`h-1.5 rounded-full mx-6 mt-1 ${
                AUSPICIOUS_ACTIVITY[s.activity] ? "bg-auspicious" : "bg-inauspicious"
              }`}
            />
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center px-6 pb-6 leading-relaxed">
        சூரிய உதயம் / அஸ்தமனம் இருப்பிடத்தை பொறுத்து கணக்கிடப்படுகிறது ({place.name}).
      </p>
    </>
  );
}

function PeriodPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-pill text-pill-foreground rounded-full px-6 py-2 flex items-center gap-2 shadow-sm"
    >
      <span
        className={`w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center ${
          active ? "bg-card" : ""
        }`}
      >
        {active && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function BirdActivityLabel({ bird, activity }: { bird: Bird; activity: Activity }) {
  const color = AUSPICIOUS_ACTIVITY[activity] ? "text-auspicious" : "text-inauspicious";
  return (
    <div className={`font-bold ${color}`}>
      <div className="text-base leading-tight">{activity}</div>
      <div className="text-[11px] font-medium opacity-80">{bird}</div>
    </div>
  );
}

/* ---------------- SUB TIMINGS ---------------- */

function SubTimingsScreen({
  date,
  period,
  place,
  janma,
  focusIdx,
  onBack,
}: {
  date: Date;
  period: "day" | "night";
  place: Place;
  janma: Bird;
  focusIdx: number;
  onBack: () => void;
}) {
  const slots = useMemo(
    () => computeSlots(date, period, place, janma),
    [date, period, place, janma]
  );
  const focus = slots[focusIdx];
  const prev = slots.slice(0, focusIdx);
  const next = slots.slice(focusIdx + 1);

  return (
    <>
      <Header title="பட்சியின் நிலைகள்" onBack={onBack} />
      <div className="bg-panel mx-4 mt-4 p-3 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-4">
        {prev.map((s, i) => (
          <MiniSlot key={i} bird={s.bird} activity={s.activity} start={s.start} end={s.end} />
        ))}
      </div>

      <div className="mx-4 my-4 bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-[var(--shadow-soft)]">
        <div className="bg-primary/15 rounded-xl py-2 text-center font-bold text-foreground mb-1">
          சூட்சம பட்சி — {focus.bird} • {focus.activity}
        </div>
        <div className="text-[11px] text-center text-muted-foreground mb-3">
          {ACTIVITY_MEANING[focus.activity]}
        </div>
        <div className="space-y-3">
          {focus.subs.map((sub, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <div>
                <div
                  className={`font-bold ${
                    AUSPICIOUS_ACTIVITY[sub.activity] ? "text-auspicious" : "text-inauspicious"
                  }`}
                >
                  {sub.activity}
                </div>
                <div className="text-[11px] text-muted-foreground">{sub.bird}</div>
              </div>
              <div className="text-sm font-medium text-foreground/80">
                {formatRange(sub.start, sub.end, true)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-panel mx-4 mb-6 p-3 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-4">
        {next.map((s, i) => (
          <MiniSlot key={i} bird={s.bird} activity={s.activity} start={s.start} end={s.end} />
        ))}
      </div>
    </>
  );
}

function MiniSlot({
  bird,
  activity,
  start,
  end,
}: {
  bird: Bird;
  activity: Activity;
  start: number;
  end: number;
}) {
  return (
    <div className="text-center">
      <BirdActivityLabel bird={bird} activity={activity} />
      <div className="text-sm font-medium mt-0.5">{formatRange(start, end)}</div>
      <div
        className={`h-1 rounded-full mx-6 mt-1 ${
          AUSPICIOUS_ACTIVITY[activity] ? "bg-auspicious" : "bg-inauspicious"
        }`}
      />
    </div>
  );
}

/* ---------------- HEADER ---------------- */

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="bg-[image:var(--gradient-header)] text-header-foreground px-4 py-4 flex items-center gap-3 relative shadow-[var(--shadow-soft)]">
      {onBack ? (
        <button onClick={onBack} className="text-2xl leading-none">
          ←
        </button>
      ) : (
        <span className="w-6" />
      )}
      <h1 className="flex-1 text-center font-semibold text-lg">{title}</h1>
      <span className="w-6" />
    </div>
  );
}
