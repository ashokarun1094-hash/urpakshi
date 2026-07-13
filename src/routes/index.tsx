import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ACTIVITY_ORDER,
  AUSPICIOUS,
  computeSlots,
  currentPakshi,
  formatDate,
  formatRange,
  type Activity,
} from "@/lib/pakshi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "பஞ்சபக்ஷி - Pancha Pakshi Timings" },
      {
        name: "description",
        content:
          "Pancha Pakshi Shastra timings in Tamil. Enter your birth details and view daily auspicious and inauspicious activity periods.",
      },
      { property: "og:title", content: "பஞ்சபக்ஷி - Pancha Pakshi Timings" },
      {
        property: "og:description",
        content: "Pancha Pakshi Shastra timings in Tamil. Enter your birth details and view daily auspicious and inauspicious activity periods.",
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
  place: string;
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
    place: "",
  });
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<"day" | "night">("day");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background shadow-xl relative min-h-screen flex flex-col">
        {screen === "form" && (
          <FormScreen
            form={form}
            setForm={setForm}
            onSubmit={() => setScreen("detail")}
          />
        )}
        {screen === "detail" && (
          <DetailScreen
            form={form}
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
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <>
      <Header title="Pancha Pakshi Form" />
      <div className="p-4 -mt-6">
        <div className="bg-card rounded-3xl shadow-lg p-6 space-y-5">
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
                      form.gender === g
                        ? "border-primary bg-primary"
                        : "border-primary"
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
            <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5">
              <span className="text-muted-foreground">📍</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="பிறந்த இடத்தை உள்ளிடவும்"
                value={form.place}
                onChange={(e) => set("place", e.target.value)}
              />
            </div>
          </Field>

          <button
            onClick={onSubmit}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-full shadow-md hover:brightness-105 transition"
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
  date,
  setDate,
  onBack,
  onView,
}: {
  form: FormData;
  date: Date;
  setDate: (d: Date) => void;
  onBack: () => void;
  onView: () => void;
}) {
  const pakshi = currentPakshi(date);

  const shiftDay = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  const isoDate = date.toISOString().slice(0, 10);
  const weekdayTa = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"][
    date.getDay()
  ];
  const nakshatras = [
    "அஸ்வினி", "பரணி", "கார்த்திகை", "ரோகிணி", "மிருகசீரிடம்", "திருவாதிரை", "புனர்பூசம்",
    "பூசம்", "ஆயில்யம்", "மகம்", "பூரம்", "உத்திரம்", "ஹஸ்தம்", "சித்திரை",
  ];
  const dayIdx = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const nakshatra = nakshatras[dayIdx % nakshatras.length];
  const tithi = ((dayIdx % 15) + 1) + " திதி";
  const rasi = ["மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி"][dayIdx % 6];

  return (
    <>
      <Header title="பஞ்சபக்ஷி" onBack={onBack} />
      <div className="bg-[image:var(--gradient-header)] text-header-foreground pt-2 pb-20 relative">
        <label className="flex items-center justify-center gap-2 py-3 cursor-pointer">
          <span>📅</span>
          <span className="font-semibold text-lg">{formatDate(date)}</span>
          <input
            type="date"
            value={isoDate}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              if (y) setDate(new Date(y, m - 1, d));
            }}
            className="sr-only"
          />
          <span className="text-xs opacity-80">▾ மாற்று</span>
        </label>
        <div className="text-center text-xs opacity-90 -mt-1 mb-2">{weekdayTa}</div>
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

      <div className="p-6 space-y-4">
        <InfoRow label="பெயர்" value={form.name || "—"} />
        <InfoRow label="பாலினம்" value={form.gender} />
        <InfoRow label="பிறந்த இடம்" value={form.place || "—"} />
        <InfoRow
          label="பிறந்த தேதி"
          value={
            form.day && form.month && form.year
              ? `${form.day}-${form.month}-${form.year}`
              : "—"
          }
        />
        <InfoRow
          label="பிறந்த நேரம்"
          value={
            form.hour && form.minute ? `${form.hour}:${form.minute} ${form.meridiem}` : "—"
          }
        />
        <div className="border-t border-border my-2" />
        <InfoRow label="வாரம்" value={weekdayTa} />
        <InfoRow label="நட்சத்திரம்" value={nakshatra} />
        <InfoRow label="ராசி" value={rasi} />
        <InfoRow label="திதி" value={tithi} />
        <InfoRow label="பிறப்பு பக்ஷம்" value="க்ருஷ்ண பக்ஷம்" />
        <InfoRow label="நடப்பு பக்ஷி" value={pakshi.name} valueColor={pakshi.color} withDot />

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

function InfoRow({
  label,
  value,
  valueColor,
  withDot,
}: {
  label: string;
  value: string;
  valueColor?: string;
  withDot?: boolean;
}) {
  const color =
    valueColor === "inauspicious"
      ? "text-inauspicious"
      : valueColor === "auspicious"
      ? "text-auspicious"
      : "text-auspicious";
  return (
    <div className="grid grid-cols-[110px_12px_1fr] gap-3 items-start">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className={`font-medium ${color} flex items-center gap-2`}>
        {withDot && (
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              valueColor === "inauspicious" ? "bg-inauspicious" : "bg-auspicious"
            }`}
          />
        )}
        {value}
      </span>
    </div>
  );
}

/* ---------------- TIMINGS ---------------- */

function TimingsScreen({
  date,
  period,
  setPeriod,
  onBack,
  onExpand,
}: {
  date: Date;
  period: "day" | "night";
  setPeriod: (p: "day" | "night") => void;
  onBack: () => void;
  onExpand: (i: number) => void;
}) {
  const slots = useMemo(() => computeSlots(date, period), [date, period]);

  return (
    <>
      <Header title="பட்சியின் நிலைகள்" onBack={onBack} />
      <div className="bg-[image:var(--gradient-header)] pt-2 pb-6 flex justify-center gap-4">
        <PeriodPill
          label="பகல்"
          active={period === "day"}
          onClick={() => setPeriod("day")}
        />
        <PeriodPill
          label="இரவு"
          active={period === "night"}
          onClick={() => setPeriod("night")}
        />
      </div>

      <div className="bg-panel m-4 p-4 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-6">
        {slots.map((s, i) => (
          <button
            key={i}
            onClick={() => onExpand(i)}
            className={`text-center ${i === 2 ? "col-span-2" : ""}`}
          >
            <ActivityLabel activity={s.activity} />
            <div className="text-sm font-medium mt-1">
              {formatRange(s.start, s.end)}
            </div>
            <div
              className={`h-1.5 rounded-full mx-6 mt-1 ${
                AUSPICIOUS[s.activity] ? "bg-auspicious" : "bg-inauspicious"
              }`}
            />
          </button>
        ))}
      </div>
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
          active ? "bg-white" : ""
        }`}
      >
        {active && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function ActivityLabel({ activity }: { activity: Activity }) {
  const color = AUSPICIOUS[activity] ? "text-auspicious" : "text-inauspicious";
  return (
    <div className={`font-bold text-lg ${color}`}>
      {activity} <span className="text-xs">▼</span>
    </div>
  );
}

/* ---------------- SUB TIMINGS ---------------- */

function SubTimingsScreen({
  date,
  period,
  focusIdx,
  onBack,
}: {
  date: Date;
  period: "day" | "night";
  focusIdx: number;
  onBack: () => void;
}) {
  const slots = useMemo(() => computeSlots(date, period), [date, period]);
  const focus = slots[focusIdx];
  const prev = slots.slice(0, focusIdx);
  const next = slots.slice(focusIdx + 1);

  return (
    <>
      <Header title="பட்சியின் நிலைகள்" onBack={onBack} />
      <div className="bg-panel mx-4 mt-4 p-3 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-4">
        {prev.map((s, i) => (
          <MiniSlot key={i} activity={s.activity} start={s.start} end={s.end} />
        ))}
      </div>

      <div className="mx-4 my-4 bg-card border-2 border-pink-200 rounded-2xl p-4 shadow-sm">
        <div className="bg-pink-100 rounded-xl py-2 text-center font-bold text-foreground mb-4">
          சூட்சம பட்சி
        </div>
        <div className="space-y-3">
          {focus.subs.map((sub, i) => (
            <div key={i}>
              <div
                className={`font-bold ${
                  AUSPICIOUS[sub.activity] ? "text-auspicious" : "text-inauspicious"
                }`}
              >
                {sub.activity}
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
          <MiniSlot key={i} activity={s.activity} start={s.start} end={s.end} />
        ))}
      </div>
    </>
  );
}

function MiniSlot({
  activity,
  start,
  end,
}: {
  activity: Activity;
  start: number;
  end: number;
}) {
  return (
    <div className="text-center">
      <ActivityLabel activity={activity} />
      <div className="text-sm font-medium mt-0.5">{formatRange(start, end)}</div>
      <div
        className={`h-1 rounded-full mx-6 mt-1 ${
          AUSPICIOUS[activity] ? "bg-auspicious" : "bg-inauspicious"
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
