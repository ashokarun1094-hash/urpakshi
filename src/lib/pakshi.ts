// Simplified Pancha Pakshi activity computation.
// Splits sunrise->sunset (day) or sunset->next sunrise (night) into 5 activities,
// each subdivided into 5 sub-activities. Order rotates by weekday.

export type Activity = "அரசு" | "நடை" | "ஊண்" | "சாவு" | "துயில்";

export const ACTIVITY_ORDER: Activity[] = ["அரசு", "நடை", "ஊண்", "சாவு", "துயில்"];

export const AUSPICIOUS: Record<Activity, boolean> = {
  அரசு: true,
  நடை: true,
  ஊண்: true,
  சாவு: false,
  துயில்: false,
};

// Rough fixed sunrise/sunset for demo (Tamil Nadu approx).
const SUNRISE_MIN = 5 * 60 + 55; // 05:55
const SUNSET_MIN = 18 * 60 + 40; // 18:40

function rotate<T>(arr: T[], n: number): T[] {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function fmt(totalMinutes: number, withSeconds = false): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  const sec = Math.floor((m - Math.floor(m)) * 60);
  const ampm = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return withSeconds
    ? `${pad(h12)}:${pad(min)}:${pad(sec)} ${ampm}`
    : `${pad(h12)}:${pad(min)} ${ampm}`;
}

export interface Slot {
  activity: Activity;
  start: number;
  end: number;
  subs: { activity: Activity; start: number; end: number }[];
}

export function computeSlots(date: Date, period: "day" | "night"): Slot[] {
  const start = period === "day" ? SUNRISE_MIN : SUNSET_MIN;
  const end = period === "day" ? SUNSET_MIN : SUNRISE_MIN + 24 * 60;
  const total = end - start;
  const chunk = total / 5;

  const weekday = date.getDay();
  const mains = rotate(ACTIVITY_ORDER, weekday + (period === "night" ? 2 : 0));

  return mains.map((activity, i) => {
    const s = start + i * chunk;
    const e = s + chunk;
    const subChunk = chunk / 5;
    const subs = rotate(ACTIVITY_ORDER, weekday + i + (period === "night" ? 3 : 1)).map(
      (a, j) => ({ activity: a, start: s + j * subChunk, end: s + (j + 1) * subChunk })
    );
    return { activity, start: s, end: e, subs };
  });
}

export function formatRange(s: number, e: number, seconds = false) {
  return `${fmt(s, seconds)} - ${fmt(e, seconds)}`;
}

export function formatDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// Deterministic pakshi (bird) based on nakshatra/paksha stub
export function currentPakshi(date: Date): { name: string; paksha: string; color: string } {
  const paksha = date.getDate() > 15 ? "தேய் பிறை" : "வளர் பிறை";
  const period = date.getHours() < 18 ? "பகல்" : "இரவு";
  return {
    name: `${paksha} ${period}`,
    paksha,
    color: paksha === "தேய் பிறை" ? "inauspicious" : "auspicious",
  };
}
