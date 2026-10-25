/**
 * chapters.ts - YouTube chapters from a timestamped transcript.
 * Ported from .agents/skills/yt-chapters/chapters.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

import { TranscriptCue } from "./deadair";

const STOP_WORDS = new Set(
  "the a an of for to in on and or is are was were be been with this that it as at by from "
    .concat("you your i my we our they them he she but so if then than there here what which who how ")
    .concat("when where why not no yes do does did just really very like about into over out up down ")
    .concat("can could will would should have has had get got make made go going went one two")
    .split(/\s+/)
);

export interface ChapterItem {
  start: number;
  label: string;
  draft_title: string;
  seconds: number;
}

export interface ChaptersResult {
  valid: boolean;
  chapters: ChapterItem[];
  formattedBlock: string;
  reason?: string;
}

export function keywords(text: string): Set<string> {
  const matches = text.toLowerCase().match(/[a-z']{4,}/g) || [];
  return new Set(matches.filter((w) => !STOP_WORDS.has(w)));
}

export function mmss(t: number): string {
  const total = Math.floor(t);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function generateChapters(cues: TranscriptCue[], targetCount: number = 7): ChaptersResult {
  if (!cues || cues.length < 6) {
    return {
      valid: false,
      chapters: [],
      formattedBlock: "",
      reason: "Too few transcript cues to generate meaningful chapters (minimum 6 required).",
    };
  }

  const dur = cues[cues.length - 1].end;
  const candidates: { score: number; time: number; index: number }[] = [];

  for (let i = 1; i < cues.length; i++) {
    const gap = cues[i].start - cues[i - 1].end;
    const beforeText = cues.slice(Math.max(0, i - 12), i).map((c) => c.text).join(" ");
    const afterText = cues.slice(i, i + 12).map((c) => c.text).join(" ");

    const kb = keywords(beforeText);
    const ka = keywords(afterText);

    let intersectionCount = 0;
    const unionSet = new Set<string>();

    for (const w of kb) {
      unionSet.add(w);
      if (ka.has(w)) intersectionCount++;
    }
    for (const w of ka) {
      unionSet.add(w);
    }

    const shift = unionSet.size > 0 ? 1 - intersectionCount / unionSet.size : 0;
    const score = gap * 1.6 + shift * 3.2;

    candidates.push({ score, time: cues[i].start, index: i });
  }

  candidates.sort((a, b) => b.score - a.score);

  const picked: number[] = [0.0];
  const MIN_GAP = 10.0;

  for (const cand of candidates) {
    if (picked.length >= targetCount) break;
    const t = cand.time;
    const farEnough = picked.every((p) => Math.abs(t - p) >= MIN_GAP);
    if (farEnough && dur - t >= MIN_GAP) {
      picked.push(t);
    }
  }

  picked.sort((a, b) => a - b);

  const chapters: ChapterItem[] = [];

  for (let n = 0; n < picked.length; n++) {
    const t = picked[n];
    const end = n + 1 < picked.length ? picked[n + 1] : dur;
    const sectionText = cues
      .filter((c) => c.start >= t && c.end <= end)
      .map((c) => c.text)
      .join(" ");

    const kw = Array.from(keywords(sectionText));
    const lowerSec = sectionText.toLowerCase();

    kw.sort((a, b) => {
      const countA = (lowerSec.match(new RegExp(`\\b${a}\\b`, "g")) || []).length;
      const countB = (lowerSec.match(new RegExp(`\\b${b}\\b`, "g")) || []).length;
      return countB - countA;
    });

    const titleWords = kw.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    const title = titleWords.length > 0 ? titleWords.join(" ") : n === 0 ? "Introduction" : "Key Insight";

    chapters.push({
      start: Math.round(t * 100) / 100,
      label: mmss(t),
      draft_title: title,
      seconds: Math.round((end - t) * 100) / 100,
    });
  }

  const isValid =
    chapters.length >= 3 &&
    chapters[0].start === 0 &&
    chapters.every((c) => c.seconds >= MIN_GAP);

  const formattedBlock = chapters.map((c) => `${c.label} ${c.draft_title}`).join("\n");

  return {
    valid: isValid,
    chapters,
    formattedBlock,
    reason: isValid
      ? undefined
      : "YouTube requires at least 3 chapters, starting at 00:00, with minimum 10 seconds per chapter.",
  };
}
