/**
 * title.ts - Lint a YouTube title and thumbnail pairing before you publish it.
 * Ported from .agents/skills/yt-package/title.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

export const DESKTOP_LIMIT = 60;
export const MOBILE_LIMIT = 40;
export const HARD_LIMIT = 100;

export const VAGUE_WORDS = new Set([
  "amazing", "incredible", "insane", "crazy", "huge", "massive", "ultimate",
  "best", "powerful", "secret", "revolutionary", "mindblowing", "epic",
  "perfect", "complete", "everything"
]);

export const STOP_WORDS = new Set([
  "the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are",
  "with", "your", "you", "my", "i", "this", "that", "it", "how", "what", "why"
]);

export interface TitleIssue {
  type: "length" | "mobile" | "shouting" | "vague" | "no-number" | "front-load" | "duplicate" | "thumb-length";
  message: string;
}

export interface TitleCheckResult {
  title: string;
  chars: number;
  score: number;
  issues: TitleIssue[];
  good: string[];
}

export function extractTitleWords(t: string): string[] {
  const matches = t.toLowerCase().match(/[a-z0-9']+/g);
  return matches ? Array.from(matches) : [];
}

export function checkTitle(title: string, thumb?: string | null): TitleCheckResult {
  const t = title.trim();
  const n = t.length;
  const issues: TitleIssue[] = [];
  const good: string[] = [];

  // Length checks
  if (n > HARD_LIMIT) {
    issues.push({ type: "length", message: `${n} characters - YouTube's hard limit is ${HARD_LIMIT}` });
  } else if (n > DESKTOP_LIMIT) {
    issues.push({ type: "length", message: `${n} characters - desktop search cuts near ${DESKTOP_LIMIT}` });
  } else {
    good.push(`${n} characters, inside the ${DESKTOP_LIMIT}-character desktop cut`);
  }

  // Mobile cut check
  if (n > MOBILE_LIMIT) {
    const rawHead = t.slice(0, MOBILE_LIMIT);
    const lastSpace = rawHead.lastIndexOf(" ");
    const head = lastSpace !== -1 ? rawHead.slice(0, lastSpace) : rawHead;
    issues.push({
      type: "mobile",
      message: `a mobile feed shows about "${head}..." - check the subject survives`,
    });
  }

  // All-caps shouting check
  const tokens = t.split(/\s+/).filter(Boolean);
  const caps = tokens.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (caps.length > 2) {
    issues.push({
      type: "shouting",
      message: `${caps.length} all-caps words - two is the ceiling before it reads as spam`,
    });
  } else if (caps.length > 0) {
    good.push(`${caps.length} all-caps word for emphasis`);
  }

  // Vague word check
  const wList = extractTitleWords(t);
  const vagueHits = Array.from(new Set(wList.filter((w) => VAGUE_WORDS.has(w)))).sort();
  if (vagueHits.length > 0) {
    issues.push({
      type: "vague",
      message: `${vagueHits.join(", ")} - swap for a number, a name or a date`,
    });
  }

  // Concrete figure check
  const nums = t.match(/\d[\d,.]*%?/g);
  if (nums && nums.length > 0) {
    good.push(`carries a concrete figure (${nums.slice(0, 3).join(", ")})`);
  } else {
    issues.push({
      type: "no-number",
      message: "no number, date or name - the most reliable single fix",
    });
  }

  // Question mark check
  if (t.endsWith("?")) {
    good.push("open question in the title");
  }

  // Front-loading check
  const front = wList.slice(0, 3).filter((w) => !STOP_WORDS.has(w));
  if (!front.length) {
    issues.push({
      type: "front-load",
      message: "the first three words are all filler - move the subject forward",
    });
  }

  // Thumbnail pairing check
  if (thumb && thumb.trim()) {
    const tw = new Set(wList.filter((w) => !STOP_WORDS.has(w)));
    const thumbWords = extractTitleWords(thumb);
    const hw = new Set(thumbWords.filter((w) => !STOP_WORDS.has(w)));

    const shared: string[] = [];
    for (const word of tw) {
      if (hw.has(word)) shared.push(word);
    }

    if (shared.length > 0) {
      shared.sort();
      issues.push({
        type: "duplicate",
        message: `thumbnail repeats the title on ${shared.join(", ")} - the thumbnail should say what the title does not`,
      });
    } else {
      good.push("thumbnail and title carry different words");
    }

    if (thumbWords.length > 4) {
      issues.push({
        type: "thumb-length",
        message: `${thumbWords.length} words on the thumbnail - three is the ceiling at feed size`,
      });
    }
  }

  const score = Math.max(0, Math.min(100, 100 - 14 * issues.length + 4 * good.length));

  return {
    title: t,
    chars: n,
    score,
    issues,
    good,
  };
}
