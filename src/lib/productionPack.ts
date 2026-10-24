import { ProductionPack, ProductionScene } from "@/types";

export function fallbackPack(input: {
  topic: string;
  audience: string;
  outcome: string;
  format: string;
  duration: string;
  tone: string;
  language: string;
  differentiator?: string;
  cta?: string;
}): ProductionPack {
  const { topic, audience, outcome, format, duration, tone, language, differentiator, cta } = input;
  const isShort = format === "Short";
  const distinction = (differentiator || "a clear, practical example with each decision explained")
    .trim()
    .replace(/^use\s+/i, "")
    .replace(/[.!?]+$/, "");

  const scenes: ProductionScene[] = isShort
    ? [
        {
          time: "0:00–0:04",
          purpose: "Hook + result",
          voiceover: "Want to " + outcome.toLowerCase().replace(/[.!?]+$/, "") + "? Here is the simple version.",
          visual: "Open with the finished result on screen. Cut directly to the most interesting moment; no logo intro.",
          onScreen: "Do this in a few clear steps",
          assetPrompt:
            "Clean close-up of the finished result for a tutorial about " +
            topic +
            ", strong focal point, no embedded words, 9:16 vertical composition.",
          editNote: "Start on action; remove any silence before the first word.",
        },
        {
          time: "0:04–0:15",
          purpose: "Demonstrate the key step",
          voiceover:
            "First, " + distinction + ". Watch this part closely because it is the step that makes everything work.",
          visual:
            "Screen record or film the key action. Zoom in on the exact control, code, tool, or object being demonstrated.",
          onScreen: "Step 1 · Show the important action",
          assetPrompt:
            "Vertical tutorial close-up showing a key step for " +
            topic +
            ", uncluttered background, clear subject, useful negative space for captions.",
          editNote: "Use one quick zoom or highlight to direct attention.",
        },
        {
          time: "0:15–0:29",
          purpose: "Explain + avoid a mistake",
          voiceover:
            "A common mistake is trying to do everything at once. Keep it simple, check the result, and fix one thing at a time.",
          visual:
            "Show a brief mistake-versus-correct example using your own demo. Label each state clearly.",
          onScreen: "Keep it simple · Check the result",
          assetPrompt:
            "Vertical split comparison visual representing common mistake versus correct method for " +
            topic +
            ", simple high contrast educational graphic, no text.",
          editNote: "Keep the wrong example brief; spend more time on the fix.",
        },
        {
          time: "0:29–0:45",
          purpose: "Result + next action",
          voiceover:
            "And that is the working result. Try it yourself and tell me which step you want me to explain in more detail next.",
          visual:
            "Show the completed result, then finish on a clean frame that matches the opening. Add captions and a gentle end cut.",
          onScreen: "Try it · What should we explain next?",
          assetPrompt:
            "Vertical final result showcase for " +
            topic +
            ", polished but realistic, central subject and simple composition, no text.",
          editNote: "End after the payoff; avoid a long outro.",
        },
      ]
    : [
        {
          time: "0:00–0:20",
          purpose: "Hook + proof of outcome",
          voiceover:
            "In this video, you'll " +
            outcome.charAt(0).toLowerCase() +
            outcome.slice(1).replace(/[.!?]+$/, "") +
            ". I'll show you the result first, then we'll build it step by step so you can follow along.",
          visual:
            "Show the finished result or a quick before-and-after. Cut to the speaker or screen capture only after viewers understand the payoff.",
          onScreen: "What you will build / learn",
          assetPrompt:
            "Wide 16:9 educational visual for a tutorial about " +
            topic +
            ", demonstrate the finished outcome clearly, realistic, crisp focal point, no embedded text.",
          editNote: "Deliver the promise immediately; skip greetings and animated logo intros.",
        },
        {
          time: "0:20–0:55",
          purpose: "Context + prerequisites",
          voiceover:
            "Before we begin, here is what you need and why we are approaching it this way. We will keep the example focused so you can understand the important decisions, not just copy steps.",
          visual:
            "Show the starting state, required tools or materials, and the minimum prerequisites. Keep a small progress marker on screen.",
          onScreen: "What you need · Starting point",
          assetPrompt:
            "Organized desk or clean screen setup for a beginner tutorial about " +
            topic +
            ", clear essential items only, documentary lighting, widescreen 16:9.",
          editNote: "List only prerequisites the viewer genuinely needs.",
        },
        {
          time: "0:55–2:15",
          purpose: "Step 1 — establish the foundation",
          voiceover:
            "Step one is to set up the basic structure. I will explain what each important part does, then we will run a small check so we know it works before moving forward.",
          visual:
            "Record the first action at readable scale. Highlight only the relevant area and show the intermediate result before continuing.",
          onScreen: "Step 1 · Build the foundation",
          assetPrompt:
            "Widescreen tutorial screen or close-up demonstrating the first stage of " +
            topic +
            ", high clarity, realistic interface or object, no logos, no invented UI text.",
          editNote: "Keep cuts aligned with completed actions, not every mouse movement.",
        },
        {
          time: "2:15–4:00",
          purpose: "Step 2 — build the useful part",
          voiceover:
            "Now we will connect the pieces into something useful. We'll keep the example focused on " +
            distinction +
            ". Pause here if you need to follow along, and check that your result matches what you see on screen.",
          visual:
            "Show the main process in two or three logical sub-steps. Alternate a full view with close-ups where details matter.",
          onScreen: "Step 2 · Make it useful",
          assetPrompt:
            "Widescreen instructional visual showing the core process behind " +
            topic +
            ", clear sequence and uncluttered layout, leave room for captions, no text baked into image.",
          editNote: "Use a visible checkpoint so viewers can tell whether they are on track.",
        },
        {
          time: "4:00–5:10",
          purpose: "Common mistake + fix",
          voiceover:
            "Here is one issue beginners often run into: moving on before checking the result. If yours looks different, verify the previous step first, then change one thing at a time instead of starting over.",
          visual:
            "Demonstrate one genuine, checked mistake and its fix. If you have not verified a specific error, label it as a possible troubleshooting case rather than a universal rule.",
          onScreen: "Troubleshooting · Check one thing at a time",
          assetPrompt:
            "Widescreen educational comparison of a troubleshooting process related to " +
            topic +
            ", left-right visual structure, calm professional style, no text.",
          editNote: "Do not manufacture an error or claim it always happens.",
        },
        {
          time: "5:10–6:15",
          purpose: "Final result + recap",
          voiceover:
            "Let's review the finished result. We started with the basic structure, added the useful part, and checked that it worked. The main takeaway is to understand why each step matters, not just repeat it.",
          visual:
            "Show the finished outcome again, compare it with the starting state, and recap the steps with short chapter labels.",
          onScreen: "Recap · Start → Build → Check",
          assetPrompt:
            "Widescreen before-and-after result for a tutorial about " +
            topic +
            ", clear completed outcome, polished but credible, no text.",
          editNote: "Match the payoff to what the opening promised.",
        },
        {
          time: "6:15–6:40",
          purpose: "Specific next action",
          voiceover: cta
            ? cta
            : "Try the steps with your own example. If you get stuck, leave the exact question in the comments; that will help me plan the next tutorial.",
          visual:
            "Show a final useful screen or an example challenge. Use a simple end card with one relevant next video or playlist if available.",
          onScreen: "Try it · Ask your next question",
          assetPrompt:
            "Minimal widescreen end-card background related to " +
            topic +
            ", room on one side for a next-video card, no text or logos.",
          editNote: "Use one call to action; do not stack subscribe, like, comment, and unrelated links.",
        },
      ];

  const voiceoverScript = scenes.map((s) => "[" + s.time + "]\n" + s.voiceover).join("\n\n");
  const titleOptions = [
    outcome.replace(/[.!?]+$/, "") + " — " + topic + " step by step",
    topic + " for " + audience + ": a practical walkthrough",
    topic + ": common beginner mistakes and how to avoid them",
  ];
  const description =
    "In this video, you will learn how to " +
    outcome.toLowerCase().replace(/[.!?]+$/, "") +
    ". The walkthrough is designed for " +
    audience +
    " and focuses on a clear, practical example.\n\nChapters:\n" +
    scenes.map((s) => s.time.split("–")[0] + " " + s.purpose).join("\n") +
    "\n\nTry the steps yourself and share the specific question you want covered next. Please verify any version-specific instructions against the tools you use.";

  const tags = [
    topic.split(/\s+/).slice(0, 3).join(" "),
    "Tutorial",
    "Guide",
    "Step by step",
    "How to",
  ];

  return {
    topic,
    audience,
    outcome,
    format,
    duration,
    tone,
    language,
    titleOptions,
    description,
    hashtags: [
      "#" +
        topic
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s.replace(/[^a-z0-9]/gi, ""))
          .join(""),
      "#Tutorial",
      "#LearnByDoing",
    ],
    tags,
    openingHook: scenes[0].voiceover,
    voiceoverScript,
    scenes,
    pinnedComment: cta || "What part should we explain in more detail in the next video?",
    productionChecklist: [
      "Verify every factual or technical claim before recording.",
      "Record a clean voiceover and capture the demo at readable resolution.",
      "Add accurate captions and check spelling of names, code, commands, and numbers.",
      "Review the title and thumbnail together so they make one honest promise.",
      "Watch the final export on mobile before publishing.",
    ],
    source: "template",
    notice: "Template-generated production pack. Review technical details and adapt it to your voice before recording.",
  };
}
