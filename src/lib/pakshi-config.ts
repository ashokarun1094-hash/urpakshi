// Pancha Pakshi configuration — central source of truth.
//
// Rules now match the supplied tables:
// 1. A main பட்சி slot is always 144 minutes from sunrise.
// 2. Main activity varies by janma bird row, weekday, paksha and day/night.
// 3. சூட்சம பட்சி / சூட்சம தொழில் order is fixed only by paksha × day/night
//    (4 total orders); it does not rotate by weekday or selected slot.

import type { Bird, Activity } from "./pakshi";

export const MAIN_SLOT_MIN = 144;
export const WEEKDAY_TA = [
  "ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி",
] as const;

export interface PeriodConfig {
  /** Bird row order used to calculate activity for a janma bird. */
  birds: Bird[];
  /** Main 2h24 slot bird display order for this paksha × period. */
  slotBirds: Bird[];
  /** Fixed sub-slot bird order for this paksha × period. */
  subBirds: Bird[];
  /** Main activity cycle used by the weekday offset formula. */
  mainActs: Activity[];
  /** Fixed sub-activity order for this paksha × period. */
  subActs: Activity[];
  /** +1 / -1 controls how bird rows move through the main activity cycle. */
  rowDirection: 1 | -1;
  /** +1 / -1 controls how the five 2h24 columns move through the cycle. */
  columnDirection: 1 | -1;
  /** 7 entries (Sun..Sat) — activity-cycle offset for that weekday. */
  weekdayOffset: number[];
  /** Minutes per activity inside a 144-min main slot. Must sum to 144. */
  subDur: Record<Activity, number>;
}

const STANDARD_BIRDS: Bird[] = ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"];

// வளர்பிறை reference table offsets:
// ஞாயிறு/செவ்வாய் = 3, திங்கள்/புதன் = 2, வியாழன் = 1,
// வெள்ளி = 0, சனி = 4.
const SHUKLA_WEEKDAY_OFFSET = [3, 2, 3, 2, 1, 0, 4];

// வளர்பிறை பகல்: Friday Owl row becomes
// உறங்குதல் → மரணம் → உண்ணல் → நடத்தல் → ஆட்சி.
const SHUKLA_DAY_MAIN: Activity[] = [
  "ஆட்சி",
  "உறங்குதல்",
  "மரணம்",
  "உண்ணல்",
  "நடத்தல்",
];

// வளர்பிறை இரவு uses reverse column movement. Friday Owl row becomes
// உறங்குதல் → உண்ணல் → ஆட்சி → மரணம் → நடத்தல்.
const SHUKLA_NIGHT_MAIN: Activity[] = [
  "உண்ணல்",
  "உறங்குதல்",
  "நடத்தல்",
  "மரணம்",
  "ஆட்சி",
];

const SHUKLA_SUB_ACTS: Activity[] = ["உண்ணல்", "நடத்தல்", "ஆட்சி", "உறங்குதல்", "மரணம்"];
const KRISHNA_SUB_ACTS: Activity[] = ["உறங்குதல்", "நடத்தல்", "மரணம்", "ஆட்சி", "உண்ணல்"];

const SHUKLA_SUBDUR_DAY: Record<Activity, number> = {
  "உண்ணல்": 30, "நடத்தல்": 36, "ஆட்சி": 48, "உறங்குதல்": 18, "மரணம்": 12,
};
const SHUKLA_SUBDUR_NIGHT: Record<Activity, number> = {
  "உண்ணல்": 30, "நடத்தல்": 30, "ஆட்சி": 24, "உறங்குதல்": 24, "மரணம்": 36,
};
const KRISHNA_SUBDUR_DAY: Record<Activity, number> = {
  "உறங்குதல்": 12, "நடத்தல்": 36, "மரணம்": 30, "ஆட்சி": 18, "உண்ணல்": 48,
};
const KRISHNA_SUBDUR_NIGHT: Record<Activity, number> = {
  "உறங்குதல்": 18, "நடத்தல்": 42, "மரணம்": 24, "ஆட்சி": 18, "உண்ணல்": 42,
};

/* =============== வளர்பிறை (Shukla) =============== */
export const SHUKLA_DAY: PeriodConfig = {
  birds: STANDARD_BIRDS,
  slotBirds: STANDARD_BIRDS,
  subBirds: STANDARD_BIRDS,
  mainActs: SHUKLA_DAY_MAIN,
  subActs: SHUKLA_SUB_ACTS,
  rowDirection: 1,
  columnDirection: 1,
  weekdayOffset: SHUKLA_WEEKDAY_OFFSET,
  subDur: SHUKLA_SUBDUR_DAY,
};

export const SHUKLA_NIGHT: PeriodConfig = {
  birds: STANDARD_BIRDS,
  slotBirds: ["மயில்", "கோழி", "காகம்", "ஆந்தை", "வல்லூறு"],
  subBirds: ["மயில்", "கோழி", "காகம்", "ஆந்தை", "வல்லூறு"],
  mainActs: SHUKLA_NIGHT_MAIN,
  subActs: SHUKLA_SUB_ACTS,
  rowDirection: 1,
  columnDirection: -1,
  weekdayOffset: SHUKLA_WEEKDAY_OFFSET,
  subDur: SHUKLA_SUBDUR_NIGHT,
};

/* =============== தேய்பிறை (Krishna) =============== */
export const KRISHNA_DAY: PeriodConfig = {
  birds:    ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
  slotBirds: ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
  subBirds: ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
  mainActs: ["ஆட்சி", "உண்ணல்", "நடத்தல்", "உறங்குதல்", "மரணம்"],
  subActs: KRISHNA_SUB_ACTS,
  rowDirection: -1,
  columnDirection: 1,
  weekdayOffset: [0, 1, 4, 2, 3, 1, 0],
  subDur: KRISHNA_SUBDUR_DAY,
};

export const KRISHNA_NIGHT: PeriodConfig = {
  birds:    ["வல்லூறு", "காகம்", "மயில்", "ஆந்தை", "கோழி"],
  slotBirds: ["வல்லூறு", "காகம்", "மயில்", "ஆந்தை", "கோழி"],
  subBirds: ["வல்லூறு", "காகம்", "மயில்", "ஆந்தை", "கோழி"],
  mainActs: ["உறங்குதல்", "மரணம்", "ஆட்சி", "உண்ணல்", "நடத்தல்"],
  subActs: KRISHNA_SUB_ACTS,
  rowDirection: -1,
  columnDirection: 1,
  weekdayOffset: [0, 1, 4, 2, 3, 1, 0],
  subDur: KRISHNA_SUBDUR_NIGHT,
};

export const SHUKLA = { day: SHUKLA_DAY, night: SHUKLA_NIGHT };
export const KRISHNA = { day: KRISHNA_DAY, night: KRISHNA_NIGHT };

export function getConfig(
  paksha: "shukla" | "krishna",
  period: "day" | "night"
): PeriodConfig {
  return (paksha === "shukla" ? SHUKLA : KRISHNA)[period];
}

export function activityFor(cfg: PeriodConfig, weekday: number, birdRow: number, slotCol: number): Activity {
  const offset = cfg.weekdayOffset[weekday] ?? 0;
  const i =
    offset + cfg.rowDirection * birdRow + cfg.columnDirection * slotCol;
  return cfg.mainActs[((i % 5) + 5) % 5];
}

/** Compute the 5×5 activity grid for a given weekday. */
export function buildGrid(cfg: PeriodConfig, weekday: number): Activity[][] {
  return cfg.birds.map((_, b) =>
    Array.from({ length: 5 }, (_, c) => activityFor(cfg, weekday, b, c))
  );
}

/** Convenience: weekday offset for a table. */
export function adhiIndex(cfg: PeriodConfig, weekday: number): number {
  return cfg.weekdayOffset[weekday] ?? 0;
}

// Back-compat type alias — reference.tsx still imports this name.
export type PakshaFullConfig = PeriodConfig;
