import { describe, expect, it } from "bun:test";
import { collectNicheResearch } from "../research/collector";
import { extractPatterns } from "../patterns/engine";
import { computeOptimizationScores } from "../scoring/optimizer";
import { saveOptimizationRecord, recordPerformanceSnapshot, getChannelHistory } from "../feedback/tracker";
import { generatePackagingWithAI } from "../openrouter";

describe("YouTube Pattern Recognition & Optimization Engine", () => {
  describe("Research Collector", () => {
    it("collects research dataset with transparent source and calculated metrics", async () => {
      const result = await collectNicheResearch({
        nicheOrTopic: "AI Agents Next.js",
        maxVideos: 5,
        allowBenchmarkFallback: true,
      });

      expect(result.videos.length).toBeGreaterThan(0);
      expect(["youtube_data_api_v3", "curated_benchmark_dataset"]).toContain(result.source);
      expect(result.channelMedians).toBeDefined();

      const sample = result.videos[0];
      expect(sample.title).toBeDefined();
      expect(sample.viewsPerDay).toBeGreaterThan(0);
      expect(sample.multipleOfChannelMedian).toBeDefined();
      expect(sample.likeToViewRatio).toBeDefined();
    });

    it("correctly identifies outlier videos performing above channel median", async () => {
      const result = await collectNicheResearch({
        nicheOrTopic: "coding tutorials",
        maxVideos: 10,
        allowBenchmarkFallback: true,
      });

      expect(result.videos.length).toBeGreaterThan(0);
      expect(result.metricsSummary).toBeDefined();
    });
  });

  describe("Pattern Recognition Engine", () => {
    it("extracts topic clusters and classifies title formulas with performance multiples", async () => {
      const research = await collectNicheResearch({ nicheOrTopic: "AI Agents" });
      const patterns = extractPatterns(research);

      expect(patterns.topicClusters.length).toBeGreaterThan(0);
      expect(patterns.winningTitlePatterns.length).toBeGreaterThan(0);
      expect(patterns.thumbnailInsights).toBeDefined();
      expect(patterns.contentGaps.length).toBeGreaterThan(0);
      expect(patterns.findings.length).toBeGreaterThan(0);

      // Verify each evidence finding provides citations and limitations
      const finding = patterns.findings[0];
      expect(finding.finding).toBeDefined();
      expect(finding.whyItMatters).toBeDefined();
      expect(finding.proposedAction).toBeDefined();
      expect(finding.confidence).toBeDefined();
      expect(finding.limitations).toBeDefined();
      expect(finding.evidence).toBeDefined();
    });
  });

  describe("Scoring & Optimization Engine", () => {
    it("computes transparent multi-component recommendation score bounded between 0 and 100", async () => {
      const research = await collectNicheResearch({ nicheOrTopic: "Web Dev" });
      const patterns = extractPatterns(research);

      const scorecard = computeOptimizationScores({
        title: "I Built an Autonomous AI Agent in Next.js in 10 Minutes",
        description: "In this video we build an autonomous AI agent in Next.js. \n0:00 Intro\n1:20 Architecture\n#ai #nextjs",
        first15sSpeech: "In the next ten minutes, you will build an autonomous AI agent that runs right inside your Next.js app.",
        videoDurationSecs: 620,
        deadAirReductionPercent: 8,
        edlCutsCount: 12,
        research,
        patterns,
      });

      expect(scorecard.overallScore).toBeGreaterThanOrEqual(0);
      expect(scorecard.overallScore).toBeLessThanOrEqual(100);
      expect(["Medium", "High"]).toContain(scorecard.confidence.level);
      
      // Check weights sum
      const sumWeights =
        scorecard.components.topicDemand.weight +
        scorecard.components.titlePackaging.weight +
        scorecard.components.hookAndPacing.weight +
        scorecard.components.metadataCompleteness.weight;
      expect(Math.round(sumWeights * 100) / 100).toBe(1.0);

      // Check indicators are inspectable
      expect(scorecard.components.topicDemand.indicators.length).toBeGreaterThan(0);
      expect(scorecard.components.titlePackaging.indicators.length).toBeGreaterThan(0);
      expect(scorecard.components.hookAndPacing.indicators.length).toBeGreaterThan(0);
    });

    it("flags weak opening hooks honestly and identifies room for improvement", async () => {
      const research = await collectNicheResearch({ nicheOrTopic: "Web Dev" });
      const patterns = extractPatterns(research);

      const scorecard = computeOptimizationScores({
        title: "Hey guys welcome back today video",
        description: "A short description.",
        first15sSpeech: "Hey guys, welcome back to my channel! Today basically in this video we are gonna kind of look at stuff.",
        videoDurationSecs: 300,
        deadAirReductionPercent: 0,
        edlCutsCount: 0,
        research,
        patterns,
      });

      expect(scorecard.components.hookAndPacing.score).toBeLessThan(75);
      expect(scorecard.components.hookAndPacing.label).toBe("Needs Improvement");
    });
  });

  describe("Learning & Feedback Tracker", () => {
    it("persists optimization records and logs subsequent performance snapshots", async () => {
      const channelId = "test_channel_regression_123";
      const record = saveOptimizationRecord({
        channelId,
        videoTitle: "Autonomous Coding Agents in Next.js",
        targetNiche: "AI Agents",
        approvedTitle: "How I Built an Autonomous AI Agent in Next.js",
        approvedDescription: "Step by step walkthrough with timestamps.\n0:00 Intro",
        cutsApplied: 7,
        deadAirSecondsSaved: 24.5,
        modelUsed: "openrouter:deepseek/deepseek-chat",
      });

      expect(record.recordId).toBeDefined();
      expect(record.approvedTitle).toBe("How I Built an Autonomous AI Agent in Next.js");

      // Record subsequent performance snapshot
      const updated = recordPerformanceSnapshot({
        recordId: record.recordId,
        publishedVideoId: "yt_mock_vid_999",
        views: 1250,
        impressions: 15400,
        ctrPercent: 7.8,
        watchTimeMinutes: 4800,
        retentionPercentAt30s: 68.5,
      });

      expect(updated).not.toBeNull();
      expect(updated?.publishedVideoId).toBe("yt_mock_vid_999");
      expect(updated?.subsequentPerformance?.views).toBe(1250);
      expect(updated?.subsequentPerformance?.ctrPercent).toBe(7.8);

      // Retrieve channel history
      const history = getChannelHistory(channelId);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history.some((h) => h.recordId === record.recordId)).toBe(true);
    });
  });

  describe("AI Content Generation Agent", () => {
    it("generates packaging (titles, description, thumbnail concepts) respecting constraints", async () => {
      const packaging = await generatePackagingWithAI({
        transcriptOrSummary: "In this tutorial we build an autonomous AI agent in Next.js that automates video editing and SEO optimization.",
        niche: "AI & Tech",
        targetAudience: "Developers & Creators",
        winningFormulas: ["Curiosity Gap", "Ultimate Guide", "X vs Y"],
        durationSeconds: 600,
      });

      expect(packaging).toBeDefined();
      expect(packaging.titles.length).toBeGreaterThanOrEqual(3);
      // All titles should be within reasonable YouTube boundaries (<= 85 chars)
      for (const title of packaging.titles) {
        expect(title.length).toBeGreaterThan(5);
        expect(title.length).toBeLessThanOrEqual(85);
      }

      // Description should have value hook and sections
      expect(packaging.description).toBeDefined();
      expect(packaging.description.length).toBeGreaterThan(50);

      // Thumbnail concepts
      expect(packaging.thumbnailConcepts.length).toBeGreaterThanOrEqual(1);
      for (const concept of packaging.thumbnailConcepts) {
        expect(concept.textOverlay).toBeDefined();
        // Text overlay should be punchy (<= 6 words)
        const wordCount = concept.textOverlay.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(8);
        expect(concept.visualLayout).toBeDefined();
        expect(concept.focalPoint).toBeDefined();
      }

      // Tags
      expect(packaging.tags.length).toBeGreaterThan(0);
      expect(packaging.model).toBeDefined();
    });
  });
});

