import { NextRequest, NextResponse } from "next/server";

function safeCount(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function compact(value: unknown): string {
  const n = safeCount(value);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function stageFor(count: number): "Unranked" | "Emerging" | "Growing" | "Established" {
  if (!count) return "Unranked";
  if (count < 10000) return "Emerging";
  if (count < 100000) return "Growing";
  return "Established";
}

function samplePayload(topic: string) {
  const videos = [
    {
      videoId: "sample-v1",
      title: "Sample: a complete beginner walkthrough",
      channel: "Sample Creator Lab",
      views: "12K sample",
      viewCount: 12000,
      age: "sample pattern",
      format: "Project walkthrough",
      why: "Illustrative record showing the kind of video detail shown in the dashboard.",
      thumb: "thumb-1",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
    {
      videoId: "sample-v2",
      title: "Sample: common mistakes explained",
      channel: "Sample Learn Studio",
      views: "8.4K sample",
      viewCount: 8400,
      age: "sample pattern",
      format: "Problem-solving",
      why: "A problem-first structure can help a viewer find the answer they need.",
      thumb: "thumb-2",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
    {
      videoId: "sample-v3",
      title: "Sample: learn the basics step by step",
      channel: "Sample Skills Channel",
      views: "6.1K sample",
      viewCount: 6100,
      age: "sample pattern",
      format: "Beginner tutorial",
      why: "Example record only; validate real demand with live search and audience signals.",
      thumb: "thumb-3",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
  ];

  const channels = [
    {
      id: "sample-a",
      name: "Sample Creator Lab",
      handle: "Illustrative profile",
      subs: "24K sample",
      subsN: 24000,
      views: "1.2M sample",
      viewsN: 1200000,
      stage: "Growing" as const,
      category: topic,
      desc: "Illustrative profile only. Live channel data appears after a YouTube Data API key is configured.",
      fit: "Sample profile",
      avatar: "SC",
      color: "av1",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
    {
      id: "sample-b",
      name: "Sample Learn Studio",
      handle: "Illustrative profile",
      subs: "8.4K sample",
      subsN: 8400,
      views: "390K sample",
      viewsN: 390000,
      stage: "Emerging" as const,
      category: topic,
      desc: "Example of a smaller channel profile for previewing the comparison layout; not a real channel.",
      fit: "Sample profile",
      avatar: "SL",
      color: "av2",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
    {
      id: "sample-c",
      name: "Sample Skills Channel",
      handle: "Illustrative profile",
      subs: "142K sample",
      subsN: 142000,
      views: "8.1M sample",
      viewsN: 8100000,
      stage: "Established" as const,
      category: topic,
      desc: "Illustrative profile for interface testing only—not a live recommendation or real channel stats.",
      fit: "Sample profile",
      avatar: "SS",
      color: "av3",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(topic),
    },
  ];

  return {
    source: "demo",
    topic,
    channels,
    videos,
    videoCount: videos.length,
    notice: "Demo sample profiles only. Add a YouTube Data API key to fetch live public data.",
  };
}

async function yt(endpoint: string, params: Record<string, string | number | undefined | null>, apiKey: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + endpoint);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url.toString(), {
    headers: { "X-Goog-Api-Key": apiKey },
    signal: AbortSignal.timeout(12000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data?.error?.message || "YouTube Data API request failed");
    error.reason = data?.error?.errors?.[0]?.reason || "youtube_api_error";
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topicRaw = searchParams.get("topic") || "";
  const topic = topicRaw.trim().slice(0, 140);
  const region = (searchParams.get("region") || "IN").toUpperCase();
  const sort = (searchParams.get("sort") || "popular").toLowerCase();

  if (!topic) {
    return NextResponse.json({ error: "Enter a topic or niche to research." }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json(samplePayload(topic));
  }

  try {
    const regionParams = region === "GLOBAL" ? {} : { regionCode: /^[A-Z]{2}$/.test(region) ? region : "IN" };
    const order = sort === "recent" ? "date" : sort === "relevance" ? "relevance" : "viewCount";

    const videoSearch = await yt(
      "search",
      {
        part: "snippet",
        type: "video",
        q: topic,
        maxResults: 25,
        order,
        videoDuration: "any",
        ...regionParams,
      },
      apiKey.trim()
    );

    const videoItems = (videoSearch.items || []).filter((x: any) => x.id?.videoId);
    const videoIds = videoItems.map((x: any) => x.id.videoId);
    const channelIds = Array.from(new Set(videoItems.map((x: any) => x.snippet?.channelId).filter(Boolean)));

    const [channelResult, videoResult] = await Promise.all([
      channelIds.length
        ? yt("channels", { part: "snippet,statistics", id: channelIds.join(","), maxResults: 50 }, apiKey.trim())
        : Promise.resolve({ items: [] }),
      videoIds.length
        ? yt("videos", { part: "snippet,statistics,contentDetails", id: videoIds.join(","), maxResults: 50 }, apiKey.trim())
        : Promise.resolve({ items: [] }),
    ]);

    const channelById = new Map((channelResult.items || []).map((c: any) => [c.id, c]));
    const channels = channelIds
      .map((id: any, index: number) => {
        const full: any = channelById.get(id);
        const base: any = videoItems.find((x: any) => x.snippet?.channelId === id)?.snippet || {};
        const snippet = full?.snippet || base;
        const stats = full?.statistics || {};
        const subsN = stats.hiddenSubscriberCount
          ? null
          : stats.subscriberCount === undefined
          ? null
          : safeCount(stats.subscriberCount);
        const viewsN = safeCount(stats.viewCount);
        const name = snippet.title || base.channelTitle || "YouTube channel";

        return {
          id,
          name,
          handle: snippet.customUrl || "",
          subs: subsN === null ? (stats.hiddenSubscriberCount ? "Hidden" : "Unavailable") : compact(subsN),
          subsN,
          views: full ? compact(viewsN) : "Unavailable",
          viewsN,
          stage: subsN === null ? ("Unranked" as const) : stageFor(subsN),
          category: topic,
          desc: String(snippet.description || "").slice(0, 230) || "Public channel profile returned for this topic.",
          fit: "Creator of a relevant video",
          avatar: name
            .split(/\s+/)
            .slice(0, 2)
            .map((s: string) => s[0] || "")
            .join("")
            .toUpperCase(),
          color: ["av1", "av2", "av3", "av4", "av5", "av6"][index % 6],
          url: "https://www.youtube.com/channel/" + id,
          thumbnail: snippet.thumbnails?.default?.url || null,
          hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.subsN || 0) - (a.subsN || 0));

    const videoById = new Map((videoResult.items || []).map((v: any) => [v.id, v]));
    const videos = videoItems
      .map((item: any, index: number) => {
        const id = item.id.videoId;
        const full: any = videoById.get(id);
        const snippet = full?.snippet || item.snippet || {};
        const viewsN = safeCount(full?.statistics?.viewCount);
        const channelId = snippet.channelId || item.snippet?.channelId;
        const channel: any = channelById.get(channelId);
        const subsRaw =
          channel?.statistics?.hiddenSubscriberCount || channel?.statistics?.subscriberCount === undefined
            ? null
            : safeCount(channel.statistics.subscriberCount);
        const ratio = subsRaw && viewsN ? viewsN / subsRaw : null;
        const published = snippet.publishedAt ? new Date(snippet.publishedAt) : null;
        const ageDays = published ? Math.max(1, Math.floor((Date.now() - published.getTime()) / 86400000)) : null;
        const viewsPerDay = ageDays && viewsN ? Math.round(viewsN / ageDays) : null;

        return {
          videoId: id,
          title: snippet.title || "Untitled video",
          channel: channel?.snippet?.title || snippet.channelTitle || "YouTube channel",
          channelUrl: "https://www.youtube.com/channel/" + channelId,
          channelSubscribers: subsRaw === null ? null : compact(subsRaw),
          views: compact(viewsN),
          viewCount: viewsN,
          viewsPerSubscriber: ratio === null ? null : Math.round(ratio * 100) / 100,
          viewsPerSubscriberLabel:
            ratio === null
              ? "Subscriber count unavailable"
              : ratio >= 1
              ? ratio.toFixed(1) + "× subscriber count"
              : Math.round(ratio * 100) + "% of subscriber count",
          viewsPerDay,
          viewsPerDayLabel: viewsPerDay === null ? "" : compact(viewsPerDay) + " views/day average",
          ageDays,
          age: published ? published.toISOString().slice(0, 10) : "Published date unavailable",
          publishedAt: published ? published.toISOString() : null,
          thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null,
          searchPosition: index,
          format: full?.contentDetails?.duration ? "Video" : "Public video",
          why: "Use topic, age, title promise, and views relative to channel size as research signals—not a prediction of future views.",
          thumb: ["thumb-1", "thumb-2", "thumb-3"][index % 3],
          url: "https://www.youtube.com/watch?v=" + id,
        };
      })
      .sort((a: any, b: any) =>
        sort === "recent"
          ? new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
          : sort === "relevance"
          ? a.searchPosition - b.searchPosition
          : b.viewCount - a.viewCount
      );

    return NextResponse.json({
      source: "youtube",
      topic,
      sort: order,
      channels,
      videos,
      videoCount: videos.length,
      notice:
        "Live public YouTube Data API results. Each search uses one video search plus public statistics lookups. Counts can change; competitor impressions, click-through rate, and retention are private.",
    });
  } catch (error: any) {
    const payload: any = samplePayload(topic);
    payload.notice =
      "Live research couldn't complete (" +
      String(error.reason || error.status || "connection issue").slice(0, 60) +
      "). Demo profiles are shown; check the API key and quota.";
    payload.apiError = String(error.reason || error.status || "connection issue").slice(0, 60);
    return NextResponse.json(payload);
  }
}
