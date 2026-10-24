export type CreatorStage = "Emerging" | "Growing" | "Established" | "Unranked";

export interface ChannelItem {
  id: string;
  name: string;
  handle: string;
  subs: string;
  subsN: number | null;
  views: string;
  viewsN: number;
  stage: CreatorStage;
  category: string;
  desc: string;
  fit: string;
  avatar: string;
  color: string;
  url: string;
  thumbnail?: string | null;
  hiddenSubscriberCount?: boolean;
}

export interface WatchlistChannel {
  id: string;
  name: string;
  handle: string;
  subs: string;
  views: string;
  stage: string;
  category: string;
  fit: string;
  url: string;
  avatar: string;
  color: string;
  savedAt: string;
}

export interface VideoItem {
  videoId?: string;
  title: string;
  channel: string;
  channelUrl?: string;
  channelSubscribers?: string | null;
  views: string;
  viewCount?: number;
  viewsPerSubscriber?: number | null;
  viewsPerSubscriberLabel?: string;
  viewsPerDay?: number | null;
  viewsPerDayLabel?: string;
  ageDays?: number | null;
  age: string;
  publishedAt?: string | null;
  thumbnail?: string | null;
  format?: string;
  why?: string;
  thumb?: string;
  url: string;
  searchPosition?: number;
}

export interface IdeaItem {
  title: string;
  desc: string;
  score: number;
  tags: string[];
  type: string;
  hook: string;
  outline: string[];
}

export interface PlanItem {
  id: string;
  title: string;
  note: string;
  status: "Idea" | "In progress" | "Ready to record" | "Published";
  created: string;
  score?: number | null;
}

export interface VideoBrief {
  topic: string;
  audience: string;
  format: string;
  promise: string;
  titles: string[];
  hook: string;
  outline: string[];
  thumbnail: string;
  measure: string;
  note?: string;
  pack?: ProductionPack;
}

export interface ProductionScene {
  time: string;
  purpose: string;
  voiceover: string;
  visual: string;
  onScreen: string;
  assetPrompt: string;
  editNote: string;
}

export interface ProductionPack {
  topic: string;
  audience: string;
  outcome: string;
  format: string;
  duration: string;
  tone: string;
  language: string;
  titleOptions: string[];
  description: string;
  hashtags: string[];
  tags?: string[];
  openingHook: string;
  voiceoverScript: string;
  scenes: ProductionScene[];
  pinnedComment: string;
  productionChecklist: string[];
  source: "ai" | "template";
  notice: string;
}

export interface AuditData {
  source: string;
  channel: {
    id: string;
    title: string;
    handle: string;
    description: string;
    subscribers: string;
    subscriberCount: number | null;
    views: string;
    viewCount: number;
    videoCount: number;
    thumbnail: string | null;
    url: string;
  };
  medianRecentViews: number;
  medianRecentViewsLabel: string;
  medianViewsPerSubscriber: number | null;
  videos: {
    id: string;
    title: string;
    publishedAt: string | null;
    viewCount: number;
    views: string;
    likes: number | null;
    comments: number | null;
    thumbnail: string | null;
    url: string;
    position: number;
    multiplier?: number;
    ratioLabel?: string;
  }[];
  insights: {
    title: string;
    body: string;
  }[];
  notice: string;
}

export interface DiagnosisResult {
  topic: string;
  period: string;
  isShort: boolean;
  source: string;
  heading: string;
  recommendation: string;
  steps: string[];
  metricName: string;
  pNow: number;
  pBase: number;
  rNow: number;
  rBase: number;
  vNow: number;
  vBase: number;
  pDelta: { delta: number | null; label: string; detail: string };
  rDelta: { delta: number | null; label: string; detail: string };
  vDelta: { delta: number | null; label: string; detail: string };
}
