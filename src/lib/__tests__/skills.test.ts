import { describe, expect, test } from "bun:test";
import {
  scoreHook,
  specificity,
  address,
  stakes,
  curiosity,
  brevity,
  classifyHook,
} from "../skills/hookscore";
import { checkTitle } from "../skills/title";
import { loadCuesFromText, generateEdl, parseTs } from "../skills/deadair";
import { generateChapters, mmss, keywords } from "../skills/chapters";
import { parseRetentionCsv, analyzeRetention } from "../skills/retention";
import { rankOutliers, calculateMedian } from "../skills/swipe";

describe("Deterministic YouTube Agent Skill Ports", () => {
  describe("1. yt-script: hookscore.ts", () => {
    test("calculates specificity correctly with concrete numbers and names", () => {
      const strong = specificity("This channel reached 250,000 subscribers in 90 days with Python");
      const weak = specificity("Today in this video welcome guys we will see amazing insane stuff");
      expect(strong).toBeGreaterThan(weak);
      expect(strong).toBeGreaterThanOrEqual(60);
      expect(weak).toBeLessThanOrEqual(30);
    });

    test("evaluates address and bonus for early 'you'", () => {
      const early = address("You are making this critical mistake right now");
      const late = address("Many people do this and then you can see it");
      expect(early).toBeGreaterThan(late);
      expect(early).toBeGreaterThanOrEqual(70);
    });

    test("evaluates stakes and consequences", () => {
      const highStakes = stakes("Stop doing this before you lose $10,000 on wasted ads");
      const lowStakes = stakes("Here are some fun facts about coding");
      expect(highStakes).toBeGreaterThan(lowStakes);
      expect(highStakes).toBeGreaterThanOrEqual(60);
    });

    test("evaluates curiosity and questions", () => {
      const openQ = curiosity("Why does nobody talk about this hidden setting?");
      const resolved = curiosity("Why do people click because it looks cool so that they buy");
      expect(openQ).toBeGreaterThan(resolved);
    });

    test("evaluates brevity inside the 9-24 words spoken band", () => {
      const perfect = brevity("If you want to grow a YouTube channel you need to focus on audience retention first");
      expect(perfect).toBe(100);

      const tooShort = brevity("Look here");
      expect(tooShort).toBeLessThan(100);

      const tooLong = brevity("One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight");
      expect(tooLong).toBeLessThan(100);
    });

    test("produces weighted verdict and assigns band", () => {
      const res = scoreHook("97% of creators quit before video 30. Here is what the other 3% do differently.");
      expect(res.verdict).toBeGreaterThanOrEqual(55);
      expect(["STRONG", "WORKABLE"]).toContain(res.band);
      expect(res.formula).toBe("The Statistic");
      expect(res.weakest).toBeDefined();
      expect(res.weakest.fix).toBeDefined();
    });
  });

  describe("2. yt-package: title.ts", () => {
    test("detects desktop and mobile cutoffs", () => {
      const longTitle = "This is an extremely long YouTube title that goes way past the desktop search cut of sixty characters and will be clipped";
      const res = checkTitle(longTitle);
      expect(res.issues.some((i) => i.type === "length")).toBe(true);
      expect(res.issues.some((i) => i.type === "mobile")).toBe(true);
    });

    test("detects excessive all-caps shouting", () => {
      const shouting = checkTitle("HOW TO MAKE HUGE MONEY NOW FAST");
      expect(shouting.issues.some((i) => i.type === "shouting")).toBe(true);
    });

    test("checks thumbnail duplicate words", () => {
      const title = "Build an AI Agent in 15 Minutes";
      const dupThumb = "AI AGENT BUILD";
      const goodThumb = "FAST PYTHON GUIDE";

      const dupRes = checkTitle(title, dupThumb);
      expect(dupRes.issues.some((i) => i.type === "duplicate")).toBe(true);

      const goodRes = checkTitle(title, goodThumb);
      expect(goodRes.issues.some((i) => i.type === "duplicate")).toBe(false);
      expect(goodRes.good.some((g) => g.includes("carry different words"))).toBe(true);
    });

    test("flags vague words and praises concrete numbers", () => {
      const vagueTitle = checkTitle("Amazing mindblowing secret trick");
      expect(vagueTitle.issues.some((i) => i.type === "vague")).toBe(true);
      expect(vagueTitle.issues.some((i) => i.type === "no-number")).toBe(true);

      const concreteTitle = checkTitle("How I Saved 42 Hours With 1 Shortcut");
      expect(concreteTitle.good.some((g) => g.includes("concrete figure"))).toBe(true);
    });
  });

  describe("3. yt-edit: deadair.ts", () => {
    test("parses timestamp formats accurately", () => {
      expect(parseTs("00:01:23.456")).toBeCloseTo(83.456, 2);
      expect(parseTs("02:15")).toBe(135);
      expect(parseTs("00:00:10,500")).toBeCloseTo(10.5, 2);
    });

    test("loads cues from SRT subtitle format", () => {
      const srt = `1
00:00:01,000 --> 00:00:03,500
Welcome back to the channel.

2
00:00:04,500 --> 00:00:06,000
Um, basically...

3
00:00:07,000 --> 00:00:10,000
Welcome back to the channel today we are coding.
`;
      const cues = loadCuesFromText(srt);
      expect(cues.length).toBe(3);
      expect(cues[0].start).toBe(1.0);
      expect(cues[0].end).toBe(3.5);
      expect(cues[1].text).toBe("Um, basically...");
    });

    test("identifies FILLER cues, DEAD gaps, and REPEAT restarts", () => {
      const cues = [
        { start: 0.0, end: 3.0, text: "Let us build an AI application" },
        { start: 4.5, end: 5.5, text: "Um, so yeah" }, // Dead air before (1.5s gap) + filler cue
        { start: 6.0, end: 9.0, text: "Let us build an AI application today from scratch" }, // Restart of cue 0
      ];

      const edl = generateEdl(cues, 0.45);
      expect(edl.cuts.length).toBeGreaterThanOrEqual(2);
      expect(edl.cuts.some((c) => c.kind === "FILLER")).toBe(true);
      expect(edl.cuts.some((c) => c.kind === "DEAD")).toBe(true);
      expect(edl.cuts.some((c) => c.kind === "REPEAT")).toBe(true);
      expect(edl.removed).toBeGreaterThan(0);
      expect(edl.out).toBeLessThan(edl.duration);
    });
  });

  describe("4. yt-chapters: chapters.ts", () => {
    test("formats timecodes into mm:ss and hh:mm:ss", () => {
      expect(mmss(0)).toBe("0:00");
      expect(mmss(75)).toBe("1:15");
      expect(mmss(3665)).toBe("1:01:05");
    });

    test("generates valid YouTube chapters starting at 00:00 with 10s minimum spacing", () => {
      const cues = [
        { start: 0, end: 15, text: "Introduction and overview of the system architecture" },
        { start: 16, end: 35, text: "Setting up database credentials and environment keys" },
        { start: 36, end: 55, text: "Writing the first speech to text transcription worker" },
        { start: 56, end: 75, text: "Connecting the visual video processing pipeline" },
        { start: 76, end: 95, text: "Testing edge cases and export benchmarks" },
        { start: 96, end: 120, text: "Summary and conclusion of the project" },
      ];

      const res = generateChapters(cues, 4);
      expect(res.valid).toBe(true);
      expect(res.chapters.length).toBeGreaterThanOrEqual(3);
      expect(res.chapters[0].start).toBe(0);
      expect(res.chapters[0].label).toBe("0:00");
      for (const ch of res.chapters) {
        expect(ch.seconds).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe("5. yt-retention: retention.ts", () => {
    test("parses YouTube Studio retention CSV", () => {
      const csv = `Position,Percentage
0,100%
5,85%
10,78%
20,70%
30,65%
60,58%
90,52%
120,48%
180,42%
`;
      const points = parseRetentionCsv(csv);
      expect(points.length).toBe(9);
      expect(points[0].position).toBe(0);
      expect(points[0].retentionPercent).toBe(100);

      const res = analyzeRetention(points, 180);
      expect(res.hookLeakPercent).toBeGreaterThanOrEqual(30);
      expect(res.hookVerdict).toBe("leaking");
      expect(res.pointsCount).toBe(9);
    });
  });

  describe("6. yt-viral: swipe.ts", () => {
    test("computes median views correctly", () => {
      expect(calculateMedian([10, 20, 30])).toBe(20);
      expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    });

    test("filters out thin channels with < 4 videos and ranks real outliers", () => {
      const videos = [
        // Thin channel (only 2 videos)
        { channel: "ThinChannel", title: "Video A", views: 100000 },
        { channel: "ThinChannel", title: "Video B", views: 200000 },

        // Rich channel (4 videos, median = 25,000)
        { channel: "TechDesk", title: "Normal Video 1", views: 20000 },
        { channel: "TechDesk", title: "Normal Video 2", views: 25000 },
        { channel: "TechDesk", title: "Normal Video 3", views: 30000 },
        { channel: "TechDesk", title: "Why 97% of Developers Quit Python", views: 150000 }, // 6x outlier
      ];

      const res = rankOutliers(videos, 2.0);
      expect(res.skippedThinChannels.some((t) => t.channel === "ThinChannel")).toBe(true);
      expect(res.outliers.length).toBe(1);
      expect(res.outliers[0].channel).toBe("TechDesk");
      expect(res.outliers[0].multiple).toBeCloseTo(5.45, 1);
      expect(res.outliers[0].formula).toBe("The Statistic");
    });
  });
});
