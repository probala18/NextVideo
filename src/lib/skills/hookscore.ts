/**
 * hookscore.ts - Score a YouTube hook before wasting a take on it.
 * Ported from .agents/skills/yt-script/hookscore.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

import { HOOK_FORMULAS, HookFormula } from "./hooksData";

const FILLER = new Set([
  "basically", "actually", "literally", "just", "really", "very", "so",
  "kind", "sort", "like", "guys", "hey", "welcome", "today", "video",
  "subscribe", "channel"
]);

const VAGUE = new Set([
  "amazing", "incredible", "insane", "crazy", "huge", "massive", "game",
  "changer", "secret", "powerful", "ultimate", "best", "revolutionary",
  "mind", "blowing", "unbelievable"
]);

const CONCRETE = /\b(\d[\d,.]*\s?(%|k|m|x|s|h)?|\$\d|\d+\s?(second|minute|hour|day|week|month|year)s?)\b/gi;
const YOU = /\b(you|your|you're|youre|yourself)\b/gi;
const STAKE = /\b(lose|lost|wasting|waste|quit|fail|broke|cost|risk|before|stop|never|die|dying|dead)\b/gi;
const CURIOSITY = /\b(why|how|what|which|until|before|but|nobody|almost|except|reason|actually)\b/gi;

export interface HookProperties {
  SPECIFICITY: number;
  ADDRESS: number;
  STAKES: number;
  CURIOSITY: number;
  BREVITY: number;
}

export interface HookScoreResult {
  hook: string;
  properties: HookProperties;
  verdict: number;
  band: "STRONG" | "WORKABLE" | "WEAK";
  formula: string;
  matched: number;
  weakest: {
    property: keyof HookProperties;
    score: number;
    fix: string;
  };
}

export const HOOK_FIXES: Record<keyof HookProperties, string> = {
  SPECIFICITY: "swap one adjective for a number, a name or a date",
  ADDRESS: "say 'you' in the first six words",
  STAKES: "name what it costs them to keep doing it the current way",
  CURIOSITY: "cut the half of the sentence that answers itself",
  BREVITY: "9 to 24 words. Read it out loud and stop where you run out of breath",
};

export function words(t: string): string[] {
  const matches = t.toLowerCase().match(/[a-z0-9'%$.]+/g);
  return matches ? Array.from(matches) : [];
}

export function specificity(t: string): number {
  const w = words(t);
  if (!w.length) return 0;
  const nums = (t.match(CONCRETE) || []).length;
  const vague = w.filter((x) => VAGUE.has(x)).length;
  const filler = w.filter((x) => FILLER.has(x)).length;
  let s = 34 + nums * 22 - vague * 16 - filler * 5;

  // Proper nouns that are not sentence-initial read as named things
  const tokens = t.trim().split(/\s+/).slice(1);
  const properNouns = tokens.filter((x) => {
    if (!x) return false;
    const firstChar = x[0];
    return firstChar >= "A" && firstChar <= "Z";
  }).length;

  s += Math.min(18, 6 * properNouns);
  return Math.max(0, Math.min(100, Math.round(s)));
}

export function address(t: string): number {
  const n = (t.match(YOU) || []).length;
  const firstSix = t.trim().split(/\s+/).slice(0, 6).join(" ");
  const first = YOU.test(firstSix) ? 30 : 0;
  // Reset regex state after test
  YOU.lastIndex = 0;
  return Math.max(0, Math.min(100, Math.round(26 + n * 20 + first)));
}

export function stakes(t: string): number {
  const n = (t.match(STAKE) || []).length;
  const hasConcrete = CONCRETE.test(t) ? 14 : 0;
  CONCRETE.lastIndex = 0;
  return Math.max(0, Math.min(100, Math.round(22 + n * 26 + hasConcrete)));
}

export function curiosity(t: string): number {
  const n = (t.match(CURIOSITY) || []).length;
  const q = t.trim().endsWith("?") ? 18 : 0;
  const closed = /\b(because|so that|which means)\b/i.test(t) ? -18 : 0;
  return Math.max(0, Math.min(100, Math.round(24 + n * 17 + q + closed)));
}

export function brevity(t: string): number {
  const n = words(t).length;
  if (n === 0) return 0;
  if (n >= 9 && n <= 24) return 100;
  if (n < 9) return Math.max(30, Math.round(100 - (9 - n) * 11));
  return Math.max(10, Math.round(100 - (n - 24) * 7));
}

export function classifyHook(t: string, formulas: HookFormula[] = HOOK_FORMULAS): { name: string; hits: number } {
  let best: HookFormula | null = null;
  let maxHits = 0;

  for (const f of formulas) {
    let hits = 0;
    for (const pattern of f.match) {
      try {
        if (new RegExp(pattern, "i").test(t)) {
          hits++;
        }
      } catch {
        // Safe regex fallback
      }
    }
    if (hits > maxHits) {
      best = f;
      maxHits = hits;
    }
  }

  return {
    name: best ? best.name : "Unclassified",
    hits: maxHits,
  };
}

export function scoreHook(t: string): HookScoreResult {
  const properties: HookProperties = {
    SPECIFICITY: specificity(t),
    ADDRESS: address(t),
    STAKES: stakes(t),
    CURIOSITY: curiosity(t),
    BREVITY: brevity(t),
  };

  const values = Object.values(properties);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const minVal = Math.min(...values);

  // Verdict is 60% mean and 40% weakest link
  const verdict = Math.round(0.6 * mean + 0.4 * minVal);

  const { name: formula, hits } = classifyHook(t);

  const band = verdict >= 72 ? "STRONG" : verdict >= 55 ? "WORKABLE" : "WEAK";

  let weakestProp: keyof HookProperties = "SPECIFICITY";
  let weakestScore = properties.SPECIFICITY;

  for (const [key, val] of Object.entries(properties) as [keyof HookProperties, number][]) {
    if (val < weakestScore) {
      weakestScore = val;
      weakestProp = key;
    }
  }

  return {
    hook: t.trim(),
    properties,
    verdict,
    band,
    formula,
    matched: hits,
    weakest: {
      property: weakestProp,
      score: weakestScore,
      fix: HOOK_FIXES[weakestProp],
    },
  };
}
