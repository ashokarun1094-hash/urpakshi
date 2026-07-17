// Pancha Pakshi configuration — classical structure.
//
// Rules:
// 1. Sub-slot (சூட்சம) bird order is fixed per paksha × period (4 total).
// 2. Activity is determined by weekday adhikaram + rotation:
//      - For each weekday, one bird is "adhikaram" (rules slot 1 with ஆட்சி).
//      - Main-slot i (0..4): bird = birds[(adhiIdx + i) mod 5], activity = acts[i].
//      - Full grid: grid[birdRow][slotCol] = acts[(slotCol - birdRow + adhiIdx + 5) % 5].
// 3. Sub-slots within a main slot rotate through the same birds/acts starting
//    from that main slot's bird.
//
// Edit `adhikaram[weekday]` to change the ruling bird for any weekday.
// Edit `acts` to change the activity rotation order.
// Edit `birds` to change bird order.

import type { Bird, Activity } from "./pakshi";

export const MAIN_SLOT_MIN = 144;
export const WEEKDAY_TA = [
  "ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி",
] as const;

export interface PeriodConfig {
  /** Main-slot bird order for this paksha × period. */
  birds: Bird[];
  /** Sub-slot bird rotation order for this paksha × period. */
  subBirds: Bird[];
  /** Activity rotation order (index 0 is what the adhikaram bird gets in slot 1). */
  acts: Activity[];
  /** 7 entries (Sun..Sat) — bird that rules slot 1 (gets ஆட்சி) for that weekday. */
  adhikaram: Bird[];
  /** Minutes per activity inside a 144-min main slot. Must sum to 144. */
  subDur: Record<Activity, number>;
}

/* Classical activity sequences.
   Day: ஆட்சி → உண்ணல் → நடத்தல் → உறங்குதல் → மரணம்
   Night: reversed — sleep/death dominate at night. */
const ACTS_DAY: Activity[] = ["ஆட்சி", "உண்ணல்", "நடத்தல்", "உறங்குதல்", "மரணம்"];
const ACTS_NIGHT: Activity[] = ["உறங்குதல்", "மரணம்", "ஆட்சி", "உண்ணல்", "நடத்தல்"];

/* Sub-slot minute weights.
   Day: ruling/eating longer, death shortest.
   Night: sleep/death longer. Totals must equal 144. */
const SUBDUR_DAY: Record<Activity, number> = {
  "ஆட்சி": 48, "உண்ணல்": 36, "நடத்தல்": 30, "உறங்குதல்": 18, "மரணம்": 12,
};
const SUBDUR_NIGHT: Record<Activity, number> = {
  "ஆட்சி": 24, "உண்ணல்": 30, "நடத்தல்": 30, "உறங்குதல்": 24, "மரணம்": 36,
};

/* =============== வளர்பிறை (Shukla) =============== */
export const SHUKLA_DAY: PeriodConfig = {
  birds:    ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"],
  subBirds: ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"],
  acts: ACTS_DAY,
  //           ஞாயி     திங்    செவ்    புதன்   வியா    வெள்    சனி
  adhikaram: ["வல்லூறு", "ஆந்தை", "மயில்", "காகம்", "கோழி", "ஆந்தை", "வல்லூறு"],
  subDur: SUBDUR_DAY,
};

export const SHUKLA_NIGHT: PeriodConfig = {
  birds:    ["மயில்", "கோழி", "காகம்", "ஆந்தை", "வல்லூறு"],
  subBirds: ["மயில்", "கோழி", "காகம்", "ஆந்தை", "வல்லூறு"],
  acts: ACTS_NIGHT,
  adhikaram: ["மயில்", "கோழி", "வல்லூறு", "காகம்", "ஆந்தை", "கோழி", "மயில்"],
  subDur: SUBDUR_NIGHT,
};

/* =============== தேய்பிறை (Krishna) =============== */
export const KRISHNA_DAY: PeriodConfig = {
  birds:    ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
  subBirds: ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
  acts: ACTS_DAY,
  adhikaram: ["கோழி", "ஆந்தை", "வல்லூறு", "மயில்", "காகம்", "ஆந்தை", "கோழி"],
  subDur: SUBDUR_DAY,
};

export const KRISHNA_NIGHT: PeriodConfig = {
  birds:    ["வல்லூறு", "காகம்", "மயில்", "ஆந்தை", "கோழி"],
  subBirds: ["வல்லூறு", "காகம்", "மயில்", "ஆந்தை", "கோழி"],
  acts: ACTS_NIGHT,
  adhikaram: ["வல்லூறு", "காகம்", "கோழி", "மயில்", "ஆந்தை", "காகம்", "வல்லூறு"],
  subDur: SUBDUR_NIGHT,
};

export const SHUKLA = { day: SHUKLA_DAY, night: SHUKLA_NIGHT };
export const KRISHNA = { day: KRISHNA_DAY, night: KRISHNA_NIGHT };

export function getConfig(
  paksha: "shukla" | "krishna",
  period: "day" | "night"
): PeriodConfig {
  return (paksha === "shukla" ? SHUKLA : KRISHNA)[period];
}

/** Compute the 5×5 activity grid for a given weekday from adhikaram + rotation.
 *  grid[birdRow][slotCol] = acts[(slotCol - birdRow + adhiIdx + 5) % 5] */
export function buildGrid(cfg: PeriodConfig, weekday: number): Activity[][] {
  const adhiBird = cfg.adhikaram[weekday] ?? cfg.birds[0];
  const adhiIdx = Math.max(0, cfg.birds.indexOf(adhiBird));
  return cfg.birds.map((_, b) =>
    cfg.acts.map((_, c) => cfg.acts[((c - b + adhiIdx) % 5 + 5) % 5])
  );
}

/** Convenience: adhikaram index for a weekday. */
export function adhiIndex(cfg: PeriodConfig, weekday: number): number {
  const b = cfg.adhikaram[weekday] ?? cfg.birds[0];
  return Math.max(0, cfg.birds.indexOf(b));
}

// Back-compat type alias — reference.tsx still imports this name.
export type PakshaFullConfig = PeriodConfig;
