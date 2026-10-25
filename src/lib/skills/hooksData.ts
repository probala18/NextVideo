/**
 * hooksData.ts - 21 Hook formulas for YouTube
 * Ported from .agents/skills/yt-script/hooks.json
 * Under MIT License (c) 2024 Jake Schincariol
 */

export interface HookFormula {
  id: string;
  name: string;
  shape: string;
  example: string;
  fails_when: string;
  match: string[];
}

export const HOOK_RULES = [
  "Confirm the title in the first sentence. A hook that ignores its own title is why people leave at 0:08.",
  "One idea. A hook carrying two promises keeps neither.",
  "Specific beats big. '400 to 200,000 in seven months' outperforms 'massive growth'.",
  "Show the artifact inside 20 seconds if you promised one.",
  "Never open with who you are. The subscribe pitch has not been earned yet.",
];

export const HOOK_FORMULAS: HookFormula[] = [
  {
    id: "the-statistic",
    name: "The Statistic",
    shape: "A number the viewer did not know, stated flat, then the consequence.",
    example: "97% of the people who start a channel quit before video 30. Here is what the other 3% do differently.",
    fails_when: "Dies if the number is vague or unverifiable. Say the source out loud.",
    match: [
      "\\b\\d+(\\.\\d+)?\\s?%",
      "\\b\\d+ (out of|in) \\d+\\b",
      "\\b\\d{2,}(,\\d{3})+\\b"
    ]
  },
  {
    id: "someone-elses-result",
    name: "Someone Else's Result",
    shape: "A named person's outcome, then the mechanism.",
    example: "This channel went from 400 subscribers to 200,000 in seven months on one format. I mapped it.",
    fails_when: "Do not invent the number. If you cannot name the channel, use a different formula.",
    match: [
      "\\bthis (channel|guy|creator|account)\\b",
      "\\bwent from .* to\\b",
      "\\bin (a|one|two|three|\\d+) (week|month|year)s?\\b"
    ]
  },
  {
    id: "the-mistake",
    name: "The Mistake",
    shape: "Name the error the viewer is probably making right now.",
    example: "Your first 30 seconds are why nobody finishes your videos. It is not the topic.",
    fails_when: "Only works if the mistake is common and the viewer can check it in one second.",
    match: [
      "\\byou('re| are) (probably |still )?(doing|making)\\b",
      "\\bthe (mistake|reason) (everyone|most people|nobody)\\b",
      "\\bstop (doing )?\\b"
    ]
  },
  {
    id: "the-contrast",
    name: "The Contrast",
    shape: "Two things that should behave the same way, but do not.",
    example: "Two channels in the same niche posted the same week. One died at 400 views; the other hit half a million.",
    fails_when: "Fails when the two sides of the contrast are not actually comparable.",
    match: [
      "\\b(two|both) .* (but|one)\\b",
      "\\bversus\\b|\\bvs\\.?\\b",
      "\\bthe difference between\\b"
    ]
  },
  {
    id: "the-demonstration",
    name: "The Demonstration",
    shape: "Show the result before the explanation.",
    example: "This took four seconds to render. By the end of this video, you will be able to do it too.",
    fails_when: "Fails if the payoff does not appear in the first five seconds.",
    match: [
      "\\bwatch this\\b",
      "\\blook what happens\\b",
      "\\bthis took\\b"
    ]
  },
  {
    id: "the-inversion",
    name: "The Inversion",
    shape: "Take the common advice and flip it.",
    example: "Everything you have been told about YouTube retention is backwards.",
    fails_when: "Fails if the contrarian claim cannot be defended with evidence.",
    match: [
      "\\beverything you (know|heard|thought)\\b",
      "\\bis (wrong|backwards|a lie)\\b",
      "\\bstop (believing|following)\\b"
    ]
  },
  {
    id: "the-curiosity-gap",
    name: "The Curiosity Gap",
    shape: "Introduce a puzzle with an obvious missing piece.",
    example: "There is one hidden setting in Premiere that cuts render times in half.",
    fails_when: "Fails if the answer is trivial or anticlimactic.",
    match: [
      "\\bone (secret|setting|trick|rule)\\b",
      "\\bwhy nobody talks about\\b",
      "\\bthe real reason\\b"
    ]
  },
  {
    id: "the-challenge",
    name: "The Challenge",
    shape: "A bold test or experiment with high stakes.",
    example: "I spent 30 days posting only YouTube Shorts to see if long-form channels survive.",
    fails_when: "Fails if the outcome was predictable from the start.",
    match: [
      "\\bi spent \\d+ days\\b",
      "\\bi tried .* for a (week|month)\\b",
      "\\bwhat happens when you\\b"
    ]
  },
  {
    id: "the-story-cliffhanger",
    name: "The Story Cliffhanger",
    shape: "Start at the most intense moment of the story.",
    example: "At 3 AM, our main production server crashed right before the biggest launch of the year.",
    fails_when: "Fails if the tension does not resolve cleanly.",
    match: [
      "\\bright before\\b",
      "\\bat the exact moment\\b",
      "\\bwhen suddenly\\b"
    ]
  },
  {
    id: "the-guarantee",
    name: "The Guarantee",
    shape: "A confident promise of what the viewer will achieve.",
    example: "If you follow these 5 steps, your next video will take half the time to edit.",
    fails_when: "Fails if the steps do not reliably deliver on the promise.",
    match: [
      "\\bif you (follow|watch|apply)\\b",
      "\\byou will (be able to|never)\\b",
      "\\bi guarantee\\b"
    ]
  }
];
