import { NextRequest, NextResponse } from "next/server";

function count(v: unknown): number {
  const n = Number(v || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function compact(v: unknown): string {
  const n = count(v);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function median(values: number[]): number {
  const a = values.filter((v) => Number.isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function yt(endpoint: string, params: Record<string, string | number | undefined | null>, apiKey: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/" + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
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

function parseInput(input: string): { id?: string; handle?: string; username?: string } {
  const raw = String(input || "").trim();
  if (!raw) return {};
  const channel = raw.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/i);
  if (channel) return { id: channel[1] };
  const handleInUrl = raw.match(/youtube\.com\/@([A-Za-z0-9._-]+)/i);
  if (handleInUrl) return { handle: handleInUrl[1] };
  const legacyUser = raw.match(/youtube\.com\/user\/([A-Za-z0-9_-]+)/i);
  if (legacyUser) return { username: legacyUser[1] };
  if (/^UC[A-Za-z0-9_-]{10,}$/.test(raw)) return { id: raw };
  if (raw.startsWith("@")) return { handle: raw.slice(1).split(/[/?#]/)[0] };
  if (/^https?:\/\//i.test(raw)) return {};
  return { handle: raw.replace(/^@/, "").split(/[/?#]/)[0] };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = (searchParams.get("channel") || "").trim().slice(0, 240);

  if (!input) {
    return NextResponse.json({ error: "Paste a YouTube channel URL, channel ID, or @handle." }, { status: 400 });
  }

  const selector = parseInput(input);
  if (!selector.id && !selector.handle && !selector.username) {
    return NextResponse.json(
      { error: "Use a YouTube channel URL, channel ID, or @handle. Custom /c/ URLs are not supported yet; open the channel and copy its @handle." },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json(
      {
        needsSetup: true,
        error: "Live channel audit needs a YouTube Data API key. Add YOUTUBE_API_KEY in environment or project setup.",
      },
      { status: 503 }
    );
  }

  const key = apiKey;

  try {
    const lookup: Record<string, string> = { part: "snippet,statistics,contentDetails" };
    if (selector.id) lookup.id = selector.id;
    else if (selector.handle) lookup.forHandle = selector.handle;
    else if (selector.username) lookup.forUsername = selector.username;

    const response = await yt("channels", lookup, key);
    const channel = response.items?.[0];
    if (!channel) {
      return NextResponse.json({ error: "No public channel was found. Check the channel URL or @handle." }, { status: 404 });
    }

    const snippet = channel.snippet || {};
    const stats = channel.statistics || {};
    const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
    let playlistItems: any[] = [];
    if (uploadsId) {
      const uploads = await yt("playlistItems", { part: "snippet,contentDetails", playlistId: uploadsId, maxResults: 20 }, key);
      playlistItems = uploads.items || [];
    }

    const videoIds = playlistItems.map((x) => x.contentDetails?.videoId).filter(Boolean);
    const videoResult = videoIds.length
      ? await yt("videos", { part: "snippet,statistics,contentDetails", id: videoIds.join(","), maxResults: 50 }, key)
      : { items: [] };

    const byId = new Map((videoResult.items || []).map((x: any) => [x.id, x]));
    const videos = playlistItems
      .map((item, idx) => {
        const id = item.contentDetails?.videoId;
        const full: any = byId.get(id);
        const s = full?.snippet || item.snippet || {};
        const st = full?.statistics || {};
        return {
          id,
          title: s.title || item.snippet?.title || "Untitled video",
          publishedAt: s.publishedAt || item.contentDetails?.videoPublishedAt || null,
          viewCount: count(st.viewCount),
          views: compact(st.viewCount),
          likes: st.likeCount === undefined ? null : count(st.likeCount),
          comments: st.commentCount === undefined ? null : count(st.commentCount),
          thumbnail: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || null,
          url: "https://www.youtube.com/watch?v=" + id,
          position: idx + 1,
        };
      })
      .filter((x) => x.id);

    const values = videos.map((v) => v.viewCount);
    const mid = median(values);
    const subs = stats.hiddenSubscriberCount ? null : count(stats.subscriberCount);
    const newest3 = videos.slice(0, 3);
    const next3 = videos.slice(3, 6);
    const avg = (xs: typeof videos) => (xs.length ? xs.reduce((s, x) => s + x.viewCount, 0) / xs.length : 0);
    const latestAvg = avg(newest3);
    const priorAvg = avg(next3);
    const insights: { title: string; body: string }[] = [];

    if (videos.length >= 6 && priorAvg > 0) {
      const delta = Math.round(((latestAvg - priorAvg) / priorAvg) * 100);
      if (delta >= 25) {
        insights.push({
          title: "Your latest uploads are getting more public views",
          body:
            "The newest three average about " +
            compact(Math.round(latestAvg)) +
            " views compared with " +
            compact(Math.round(priorAvg)) +
            " for the next three older uploads (+" +
            delta +
            "%). Inspect what changed, then test the strongest audience promise again.",
        });
      } else if (delta <= -25) {
        insights.push({
          title: "Recent public views are lower than the prior group",
          body:
            "The newest three average about " +
            compact(Math.round(latestAvg)) +
            " views compared with " +
            compact(Math.round(priorAvg)) +
            " for the next three older uploads (" +
            delta +
            "%). This alone doesn't prove an algorithm issue. Compare topic, traffic source, packaging, and retention in your private analytics.",
        });
      } else {
        insights.push({
          title: "Recent view levels are broadly similar",
          body:
            "The newest three uploads average " +
            compact(Math.round(latestAvg)) +
            " views; the next three older ones average " +
            compact(Math.round(priorAvg)) +
            ". Try one controlled change at a time to learn what your viewers respond to.",
        });
      }
    } else {
      insights.push({
        title: "Build a usable baseline",
        body:
          "There are " +
          videos.length +
          " recent public uploads available. With more uploads, the comparison between newer and older videos becomes more informative.",
      });
    }

    const top = [...videos].sort((a, b) => b.viewCount - a.viewCount)[0];
    if (top && mid > 0 && top.viewCount >= 1.8 * mid) {
      insights.push({
        title: "Study your standout video",
        body:
          '"' +
          top.title.slice(0, 110) +
          '" has ' +
          compact(top.viewCount) +
          " public views, versus a recent median of " +
          compact(mid) +
          ". Identify the viewer problem and outcome behind it; create a related follow-up without copying the title or video.",
      });
    }

    const latest = videos[0]?.publishedAt ? new Date(videos[0].publishedAt) : null;
    const daysSince = latest ? Math.floor((Date.now() - latest.getTime()) / 86400000) : null;
    if (daysSince !== null && daysSince > 60) {
      insights.push({
        title: "Review your publishing rhythm",
        body:
          "The newest public upload we found is about " +
          daysSince +
          " days old. Choose a realistic schedule you can sustain rather than posting more than you can make well.",
      });
    }

    const stop = new Set([
      "the", "and", "for", "with", "you", "your", "how", "what", "why", "from",
      "this", "that", "are", "was", "were", "have", "has", "into", "learn", "part",
      "best", "new", "guide", "tutorial", "full", "course", "in", "to", "a", "an",
      "of", "on", "is", "it", "my", "i", "by", "at", "or", "vs", "as", "all",
      "2024", "2025", "2026",
    ]);
    const freq = new Map<string, number>();
    for (const v of videos) {
      for (const word of v.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
        if (word.length > 2 && !stop.has(word)) freq.set(word, (freq.get(word) || 0) + 1);
      }
    }
    const repeated = [...freq.entries()]
      .filter((x) => x[1] > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((x) => x[0]);

    if (repeated.length) {
      insights.push({
        title: "Recurring words in recent titles",
        body:
          "These terms appear repeatedly in the titles we analyzed: " +
          repeated.join(", ") +
          ". This is a description of your recent uploads, not proof of search demand—validate topics with actual audience feedback and search results.",
      });
    }

    insights.push({
      title: "Use your private analytics for the real diagnosis",
      body:
        "This audit sees public view counts and titles only. For impressions, click-through rate, first-30-second retention, traffic sources, and returning viewers, open YouTube Studio and compare videos with similar traffic sources and ages.",
    });

    return NextResponse.json({
      source: "youtube",
      channel: {
        id: channel.id,
        title: snippet.title || "YouTube channel",
        handle: snippet.customUrl || "",
        description: String(snippet.description || "").slice(0, 500),
        subscribers: subs === null ? "Hidden" : compact(subs),
        subscriberCount: subs,
        views: compact(stats.viewCount),
        viewCount: count(stats.viewCount),
        videoCount: count(stats.videoCount),
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
        url: "https://www.youtube.com/channel/" + channel.id,
      },
      medianRecentViews: mid,
      medianRecentViewsLabel: compact(mid),
      medianViewsPerSubscriber: subs && mid ? Math.round((mid / subs) * 1000) / 10 : null,
      videos,
      insights,
      notice:
        "Public data only. Public views are snapshots and do not expose a creator's private impressions, click-through rate, retention, audience demographics, or revenue.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "YouTube could not complete this audit. Check the API key, quota, and channel URL.",
        detail: String(error.reason || error.status || "connection issue").slice(0, 80),
      },
      { status: 502 }
    );
  }
}
