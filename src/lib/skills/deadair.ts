/**
 * deadair.ts - Edit decision list (EDL) generator from a timestamped transcript.
 * Ported from .agents/skills/yt-edit/deadair.py
 * Under MIT License (c) 2024 Jake Schincariol
 */

export const FILLER_ONLY = /^[\s,.-]*((um+|uh+|er+|ah+|so|okay|ok|right|yeah|like|anyway|basically|actually|you know|i mean|let me see|hold on)[\s,.-]*)+$/i;

export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
}

export interface CutItem {
  kind: "DEAD" | "FILLER" | "REPEAT";
  start: number;
  end: number;
  why: string;
}

export interface EdlResult {
  duration: number;
  cuesCount: number;
  cuts: CutItem[];
  removed: number;
  out: number;
  reductionPercent: number;
}

export function parseTs(s: string): number {
  const clean = s.trim().replace(",", ".");
  const p = clean.split(":");
  if (p.length === 3) {
    return parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseFloat(p[2]);
  }
  if (p.length === 2) {
    return parseInt(p[0], 10) * 60 + parseFloat(p[1]);
  }
  return parseFloat(clean) || 0;
}

export function norm(t: string): string[] {
  return t.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean);
}

export function loadCuesFromText(raw: string): TranscriptCue[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const d = JSON.parse(trimmed);
      const segs = Array.isArray(d) ? d : d.segments || [];
      return segs.map((s: any) => ({
        start: parseFloat(s.start) || 0,
        end: parseFloat(s.end) || 0,
        text: String(s.text || "").trim(),
      }));
    } catch {
      // Fall through to subtitle parser
    }
  }

  const cues: TranscriptCue[] = [];
  let cur: { start: number; end: number; lines: string[] } | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const timeMatch = line.match(/\s*(\d[\d:.,]+)\s*-->\s*(\d[\d:.,]+)/);
    if (timeMatch) {
      if (cur && cur.lines.length > 0) {
        cues.push({ start: cur.start, end: cur.end, text: cur.lines.join(" ").trim() });
      }
      cur = {
        start: parseTs(timeMatch[1]),
        end: parseTs(timeMatch[2]),
        lines: [],
      };
    } else if (cur !== null && line.trim() && !/^\d+$/.test(line.trim())) {
      cur.lines.push(line.trim());
    }
  }

  if (cur && cur.lines.length > 0) {
    cues.push({ start: cur.start, end: cur.end, text: cur.lines.join(" ").trim() });
  }

  return cues;
}

export function generateEdl(cues: TranscriptCue[], floor: number = 0.45): EdlResult {
  if (!cues || cues.length === 0) {
    return {
      duration: 0,
      cuesCount: 0,
      cuts: [],
      removed: 0,
      out: 0,
      reductionPercent: 0,
    };
  }

  const dur = cues[cues.length - 1].end;
  const cuts: CutItem[] = [];

  for (let i = 0; i < cues.length; i++) {
    const { start: s, end: e, text: t } = cues[i];

    // Filler-only cues
    if (FILLER_ONLY.test(t)) {
      cuts.push({
        kind: "FILLER",
        start: s,
        end: e,
        why: t.trim().slice(0, 48),
      });
    }

    // Dead air gaps between spoken cues
    if (i > 0) {
      const gap = s - cues[i - 1].end;
      if (gap > floor) {
        const keep = floor / 2;
        cuts.push({
          kind: "DEAD",
          start: Math.round((cues[i - 1].end + keep) * 1000) / 1000,
          end: Math.round((s - keep) * 1000) / 1000,
          why: `${gap.toFixed(2)}s gap`,
        });
      }
    }

    // Sentence restart / second take comparison against previous speech cue
    if (t.trim() && !FILLER_ONLY.test(t)) {
      let j = i - 1;
      while (j >= 0 && (FILLER_ONLY.test(cues[j].text) || !cues[j].text.trim())) {
        j--;
      }
      if (j >= 0) {
        const a1 = norm(cues[j].text).slice(0, 5);
        const b1 = norm(t).slice(0, 5);
        if (a1.length >= 3 && a1.join(" ") === b1.join(" ")) {
          cuts.push({
            kind: "REPEAT",
            start: cues[j].start,
            end: cues[j].end,
            why: `restart of "${a1.join(" ")}"`,
          });
        }
      }
    }
  }

  const validCuts = cuts
    .filter((c) => c.end > c.start)
    .sort((a, b) => a.start - b.start);

  const removed = validCuts.reduce((acc, c) => acc + (c.end - c.start), 0);
  const out = Math.max(0, dur - removed);
  const reductionPercent = dur > 0 ? (removed / dur) * 100 : 0;

  return {
    duration: Math.round(dur * 100) / 100,
    cuesCount: cues.length,
    cuts: validCuts,
    removed: Math.round(removed * 100) / 100,
    out: Math.round(out * 100) / 100,
    reductionPercent: Math.round(reductionPercent * 10) / 10,
  };
}
