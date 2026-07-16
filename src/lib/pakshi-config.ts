// Editable configuration for Pancha Pakshi cycles.
// Change values here to alter bird order, activity sequence, adhikaram
// (ruling bird per weekday), and sub-slot minute durations.
// Both வளர்பிறை (Shukla) and தேய்பிறை (Krishna) are configured separately
// for day (பகல்) and night (இரவு).

import type { Bird, Activity } from "./pakshi";

export interface PakshaPeriodConfig {
  /** Bird columns, left-to-right, in the reference table. */
  birds: Bird[];
  /** Activity sequence starting from the adhikaram row (ஊண் first). */
  acts: Activity[];
  /** Adhikaram (ruling) bird per weekday. 0=ஞாயிறு .. 6=சனி */
  adhi: Record<number, Bird>;
  /** Minutes each activity occupies inside a 144-min main slot. Must sum to 144. */
  subDur: Record<Activity, number>;
  /**
   * Direction of activity rotation.
   *  "forward"  : idx = (col - adhiCol + i)
   *  "backward" : idx = (adhiCol - col + i)
   */
  direction: "forward" | "backward";
}

export interface PakshaConfig {
  day: PakshaPeriodConfig;
  night: PakshaPeriodConfig;
}

/* --------------------- வளர்பிறை (Shukla) --------------------- */
export const SHUKLA: PakshaConfig = {
  day: {
    birds: ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"],
    acts:  ["உண்ணல்", "நடத்தல்", "ஆட்சி", "உறங்குதல்", "மரணம்"],
    adhi: {
      0: "வல்லூறு", // ஞாயிறு
      1: "ஆந்தை",  // திங்கள்
      2: "வல்லூறு", // செவ்வாய்
      3: "ஆந்தை",  // புதன்
      4: "காகம்",  // வியாழன்
      5: "கோழி",   // வெள்ளி
      6: "மயில்",  // சனி
    },
    subDur: { ஆட்சி: 48, உண்ணல்: 30, நடத்தல்: 36, உறங்குதல்: 18, மரணம்: 12 },
    direction: "forward",
  },
  night: {
    birds: ["வல்லூறு", "ஆந்தை", "காகம்", "கோழி", "மயில்"],
    acts:  ["உண்ணல்", "ஆட்சி", "மரணம்", "நடத்தல்", "உறங்குதல்"],
    adhi: {
      0: "காகம்",
      1: "கோழி",
      2: "காகம்",
      3: "கோழி",
      4: "மயில்",
      5: "வல்லூறு",
      6: "ஆந்தை",
    },
    subDur: { ஆட்சி: 24, உண்ணல்: 30, நடத்தல்: 30, உறங்குதல்: 24, மரணம்: 36 },
    direction: "backward",
  },
};

/* --------------------- தேய்பிறை (Krishna) --------------------- */
export const KRISHNA: PakshaConfig = {
  day: {
    birds: ["கோழி", "ஆந்தை", "மயில்", "காகம்", "வல்லூறு"],
    acts:  ["உண்ணல்", "மரணம்", "உறங்குதல்", "ஆட்சி", "நடத்தல்"],
    adhi: {
      0: "கோழி",
      1: "மயில்",
      2: "கோழி",
      3: "காகம்",
      4: "ஆந்தை",
      5: "வல்லூறு",
      6: "மயில்",
    },
    subDur: { உறங்குதல்: 12, நடத்தல்: 36, மரணம்: 30, ஆட்சி: 18, உண்ணல்: 48 },
    direction: "forward",
  },
  night: {
    birds: ["வல்லூறு", "மயில்", "கோழி", "காகம்", "ஆந்தை"],
    acts:  ["உண்ணல்", "உறங்குதல்", "நடத்தல்", "மரணம்", "ஆட்சி"],
    adhi: {
      0: "வல்லூறு",
      1: "கோழி",
      2: "வல்லூறு",
      3: "ஆந்தை",
      4: "காகம்",
      5: "மயில்",
      6: "கோழி",
    },
    subDur: { உறங்குதல்: 18, நடத்தல்: 42, மரணம்: 24, ஆட்சி: 18, உண்ணல்: 42 },
    direction: "forward",
  },
};

export function getConfig(
  paksha: "shukla" | "krishna",
  period: "day" | "night"
): PakshaPeriodConfig {
  return (paksha === "shukla" ? SHUKLA : KRISHNA)[period];
}

/** Fixed main-slot duration in minutes (2h 24m × 5 = 12h). */
export const MAIN_SLOT_MIN = 144;

export const WEEKDAY_TA = [
  "ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி",
] as const;
