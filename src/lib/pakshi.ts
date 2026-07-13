// Pancha Pakshi Shastra – simplified but structurally faithful implementation.
// The 5 birds, nakshatra→janma pakshi mapping, friend/enemy tables, and
// activity orderings follow the standard Krishna/Shukla Paksha tables used
// in Tamil almanacs. Timings are approximate: sunrise/sunset are computed
// from a rough NOAA-style formula using the selected location's latitude.

export type Bird = "வல்லூறு" | "ஆந்தை" | "காகம்" | "கோழி" | "மயில்";
export type Activity = "ஆட்சி" | "உண்ணல்" | "நடத்தல்" | "உறங்குதல்" | "மரணம்";

export const BIRDS: Bird[] = ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"];
export const ACTIVITIES: Activity[] = [
  "ஆட்சி",
  "உண்ணல்",
  "நடத்தல்",
  "உறங்குதல்",
  "மரணம்",
];

export const ACTIVITY_MEANING: Record<Activity, string> = {
  ஆட்சி: "Ruling – highly auspicious",
  உண்ணல்: "Eating – auspicious",
  நடத்தல்: "Walking – neutral / mild good",
  உறங்குதல்: "Sleeping – inauspicious",
  மரணம்: "Dying – highly inauspicious",
};

export const ACTIVITY_STRENGTH: Record<Activity, number> = {
  ஆட்சி: 5,
  உண்ணல்: 4,
  நடத்தல்: 3,
  உறங்குதல்: 2,
  மரணம்: 1,
};

export const AUSPICIOUS_ACTIVITY: Record<Activity, boolean> = {
  ஆட்சி: true,
  உண்ணல்: true,
  நடத்தல்: true,
  உறங்குதல்: false,
  மரணம்: false,
};

/* ---------------- Nakshatra → Janma Pakshi ---------------- */

export const NAKSHATRAS = [
  "அஸ்வினி", "பரணி", "கார்த்திகை", "ரோகிணி", "மிருகசீரிடம்", "திருவாதிரை",
  "புனர்பூசம்", "பூசம்", "ஆயில்யம்", "மகம்", "பூரம்", "உத்திரம்", "ஹஸ்தம்",
  "சித்திரை", "சுவாதி", "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்", "பூராடம்",
  "உத்திராடம்", "திருவோணம்", "அவிட்டம்", "சதயம்", "பூரட்டாதி", "உத்திரட்டாதி",
  "ரேவதி",
] as const;

export type Nakshatra = (typeof NAKSHATRAS)[number];

// Classical Pancha Pakshi Shastra janma-pakshi tables. Nakshatra index uses
// the Vedic ordering starting from Ashwini (0). Counts: 5+6+6+5+5 = 27.
//
// Shukla Paksha:
//   வல்லூறு (Vulture)  : Bharani..Ardra           (1..5)
//   ஆந்தை (Owl)         : Punarvasu..Uttaraphalguni (6..11)
//   காகம் (Crow)        : Hasta..Jyeshta            (12..17)
//   கோழி (Cock)         : Mula..Dhanishta           (18..22)
//   மயில் (Peacock)     : Shatabhisha..Ashwini      (23..26, 0)
const JANMA_SHUKLA: Bird[] = [
  "மயில்",                                                       // 0  Ashwini
  "வல்லூறு", "வல்லூறு", "வல்லூறு", "வல்லூறு", "வல்லூறு",         // 1..5
  "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை",         // 6..11
  "காகம்", "காகம்", "காகம்", "காகம்", "காகம்", "காகம்",           // 12..17
  "கோழி", "கோழி", "கோழி", "கோழி", "கோழி",                       // 18..22
  "மயில்", "மயில்", "மயில்", "மயில்",                           // 23..26
];

// Krishna Paksha: birds rotate one group forward (Peacock ← first group).
const JANMA_KRISHNA: Bird[] = [
  "கோழி",                                                       // 0  Ashwini
  "மயில்", "மயில்", "மயில்", "மயில்", "மயில்",                    // 1..5
  "வல்லூறு", "வல்லூறு", "வல்லூறு", "வல்லூறு", "வல்லூறு", "வல்லூறு", // 6..11
  "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை", "ஆந்தை",         // 12..17
  "காகம்", "காகம்", "காகம்", "காகம்", "காகம்",                   // 18..22
  "கோழி", "கோழி", "கோழி", "கோழி",                             // 23..26
];

export function janmaPakshi(nakIdx: number, paksha: "shukla" | "krishna"): Bird {
  const i = ((nakIdx % 27) + 27) % 27;
  return (paksha === "krishna" ? JANMA_KRISHNA[i] : JANMA_SHUKLA[i]) ?? "வல்லூறு";
}

/* ---------------- Friend / Enemy tables ---------------- */

// Shukla Paksha day-time relationships (classical table).
const FRIEND_SHUKLA_DAY: Record<Bird, Bird> = {
  வல்லூறு: "ஆந்தை",
  ஆந்தை: "வல்லூறு",
  காகம்: "கோழி",
  கோழி: "காகம்",
  மயில்: "வல்லூறு",
};

const ENEMY_SHUKLA_DAY: Record<Bird, Bird> = {
  வல்லூறு: "காகம்",
  ஆந்தை: "கோழி",
  காகம்: "வல்லூறு",
  கோழி: "ஆந்தை",
  மயில்: "கோழி",
};

// Night / Krishna paksha invert some pairs. Simplified rule: swap friend/enemy.
export function friendOf(bird: Bird, paksha: "shukla" | "krishna", period: "day" | "night"): Bird {
  const flip = (paksha === "krishna") !== (period === "night"); // XOR
  return flip ? ENEMY_SHUKLA_DAY[bird] : FRIEND_SHUKLA_DAY[bird];
}
export function enemyOf(bird: Bird, paksha: "shukla" | "krishna", period: "day" | "night"): Bird {
  const flip = (paksha === "krishna") !== (period === "night");
  return flip ? FRIEND_SHUKLA_DAY[bird] : ENEMY_SHUKLA_DAY[bird];
}

/* ---------------- Activity order by day and bird ---------------- */

// Standard Pancha Pakshi weekday activity order for the JANMA bird.
// Each weekday assigns a starting activity; other birds get rotated slots.
const DAY_START_ACTIVITY: Record<number, Activity> = {
  0: "உண்ணல்",   // Sunday
  1: "உறங்குதல்", // Monday
  2: "நடத்தல்",  // Tuesday
  3: "ஆட்சி",   // Wednesday
  4: "மரணம்",   // Thursday
  5: "உண்ணல்",   // Friday
  6: "நடத்தல்",  // Saturday
};

const BIRD_ORDER_DAY: Bird[] = ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"];
const BIRD_ORDER_NIGHT: Bird[] = ["மயில்", "கோழி", "காகம்", "ஆந்தை", "வல்லூறு"];

function rot<T>(arr: readonly T[], n: number): T[] {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/* ---------------- Sunrise / Sunset by location ---------------- */

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const PLACES: Place[] = [
  { id: "chennai", name: "Chennai", lat: 13.08, lon: 80.27 },
  { id: "coimbatore", name: "Coimbatore", lat: 11.02, lon: 76.96 },
  { id: "madurai", name: "Madurai", lat: 9.93, lon: 78.12 },
  { id: "trichy", name: "Tiruchirappalli", lat: 10.79, lon: 78.7 },
  { id: "salem", name: "Salem", lat: 11.66, lon: 78.15 },
  { id: "tirunelveli", name: "Tirunelveli", lat: 8.71, lon: 77.76 },
  { id: "vellore", name: "Vellore", lat: 12.92, lon: 79.13 },
  { id: "erode", name: "Erode", lat: 11.34, lon: 77.72 },
  { id: "thanjavur", name: "Thanjavur", lat: 10.79, lon: 79.14 },
  { id: "dharmapuri", name: "Dharmapuri", lat: 12.13, lon: 78.16 },
  { id: "kanchipuram", name: "Kanchipuram", lat: 12.83, lon: 79.7 },
  { id: "kanyakumari", name: "Kanyakumari", lat: 8.08, lon: 77.55 },
  { id: "bangalore", name: "Bengaluru", lat: 12.97, lon: 77.59 },
];

// Simplified sunrise/sunset (minutes from midnight local, IST assumed).
function sunTimes(date: Date, lat: number, lon: number) {
  const N = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86400000
  );
  const gamma = ((2 * Math.PI) / 365) * (N - 81);
  const eqTime = 9.87 * Math.sin(2 * gamma) - 7.53 * Math.cos(gamma) - 1.5 * Math.sin(gamma);
  const decl = 23.45 * Math.sin(((2 * Math.PI) / 365) * (N - 81)) * (Math.PI / 180);
  const latR = (lat * Math.PI) / 180;
  const cosH = -Math.tan(latR) * Math.tan(decl);
  const H = (Math.acos(Math.min(1, Math.max(-1, cosH))) * 180) / Math.PI;
  const solarNoon = 720 - 4 * lon - eqTime + 330; // IST offset +5:30 = 330 min
  return {
    sunrise: solarNoon - 4 * H,
    sunset: solarNoon + 4 * H,
  };
}

export interface Slot {
  bird: Bird;
  activity: Activity;
  start: number;
  end: number;
  subs: { bird: Bird; activity: Activity; start: number; end: number }[];
}

export function computeSlots(
  date: Date,
  period: "day" | "night",
  place: Place,
  janma: Bird
): Slot[] {
  const { sunrise, sunset } = sunTimes(date, place.lat, place.lon);
  const start = period === "day" ? sunrise : sunset;
  const end = period === "day" ? sunset : sunrise + 24 * 60;
  const total = end - start;
  const chunk = total / 5;

  const weekday = date.getDay();
  const birdOrder = period === "day" ? BIRD_ORDER_DAY : BIRD_ORDER_NIGHT;
  const janmaBirdIndex = birdOrder.indexOf(janma);
  const orderedBirds = rot(birdOrder, janmaBirdIndex >= 0 ? janmaBirdIndex : 0);

  const startAct = DAY_START_ACTIVITY[weekday] ?? "ஆட்சி";
  const startActIdx = ACTIVITIES.indexOf(startAct);
  const activityOrder = rot(ACTIVITIES, startActIdx);

  return orderedBirds.map((bird, i) => {
    const s = start + i * chunk;
    const e = s + chunk;
    const act = activityOrder[i];
    const subChunk = chunk / 5;
    const subBirds = rot(birdOrder, i);
    const subActs = rot(activityOrder, i);
    const subs = subBirds.map((b, j) => ({
      bird: b,
      activity: subActs[j],
      start: s + j * subChunk,
      end: s + (j + 1) * subChunk,
    }));
    return { bird, activity: act, start: s, end: e, subs };
  });
}

/* ---------------- Formatters ---------------- */

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

export function formatRange(s: number, e: number, seconds = false) {
  return `${fmt(s, seconds)} - ${fmt(e, seconds)}`;
}

export function formatDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function currentActivity(slots: Slot[], now: Date): Slot | null {
  const m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  return slots.find((s) => m >= s.start && m < s.end) ?? null;
}

/* ---------------- Bird descriptions ---------------- */

export const BIRD_INFO: Record<Bird, { english: string; element: string; direction: string }> = {
  வல்லூறு: { english: "Vulture", element: "நெருப்பு (Fire)", direction: "கிழக்கு" },
  ஆந்தை: { english: "Owl", element: "பூமி (Earth)", direction: "தெற்கு" },
  காகம்: { english: "Crow", element: "காற்று (Air)", direction: "மேற்கு" },
  கோழி: { english: "Cock", element: "நீர் (Water)", direction: "வடக்கு" },
  மயில்: { english: "Peacock", element: "ஆகாயம் (Ether)", direction: "மத்தியம்" },
};

export function pakshaFromDate(d: Date): "shukla" | "krishna" {
  // Simplified: use lunar day approx from date of year.
  const N = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return N % 30 < 15 ? "shukla" : "krishna";
}

// Approximate nakshatra index (0..26) from a birth Date using mean lunar
// longitude minus Lahiri ayanamsa. Accurate to ~1 nakshatra for demo use.
export function nakshatraFromDate(d: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const days = (d.getTime() - J2000) / 86400000;
  // Mean tropical lunar longitude
  const tropical = 218.316 + 13.176396 * days;
  // Approximate Lahiri ayanamsa for year (~24° in 2026, ~1'/year drift)
  const year = d.getUTCFullYear();
  const ayanamsa = 23.85 + (year - 2000) * (50.29 / 3600);
  const sidereal = ((tropical - ayanamsa) % 360 + 360) % 360;
  return Math.floor(sidereal / (360 / 27)) % 27;
}

// Paksha from lunar phase (sun/moon elongation).
export function pakshaFromBirth(d: Date): "shukla" | "krishna" {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const days = (d.getTime() - J2000) / 86400000;
  const moon = 218.316 + 13.176396 * days;
  const sun = 280.46 + 0.9856474 * days;
  const elong = ((moon - sun) % 360 + 360) % 360;
  return elong < 180 ? "shukla" : "krishna";
}
