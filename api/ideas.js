export const access = "public";
export const methods = ["POST"];

function clean(v, limit) {
  return typeof v === "string" ? v.trim().slice(0, limit) : "";
}
function localBrief(topic, audience, goal, format, differentiator) {
  const short = format.toLowerCase().includes("short");
  const promise = goal || "Understand " + topic + " and complete one practical next step.";
  return {
    topic, audience, format, promise,
    titles: [
      topic + ": a beginner-friendly step-by-step guide",
      "Learn " + topic + " by building one real example",
      "Before you try " + topic + ", understand these essentials"
    ],
    hook: "If you are " + audience.toLowerCase() + ", this video will help you " + promise.charAt(0).toLowerCase() + promise.slice(1) + " I'll show the result first, then break the process into steps you can follow.",
    outline: short
      ? ["Show the outcome or problem immediately", "Demonstrate one key step", "End with a clear result and next action"]
      : ["Open with the specific problem and show the outcome", "Explain only the concepts needed to begin", "Demonstrate the process in clear steps", "Show a common mistake and how to fix it", "Recap the result and offer one next challenge"],
    thumbnail: "Show one clear focal subject or the finished result. Use strong contrast and very few words. The thumbnail should honestly match the video, not promise an outcome it cannot deliver." + (differentiator ? " Keep the distinctive angle visible: " + differentiator : ""),
    measure: "Compare click-through rate with your own channel's usual results and traffic sources once impressions accumulate. Then inspect early audience retention and the retention graph. Ask which viewer question remains unanswered and use that to plan a follow-up."
  };
}

export default async function (req, res) {
  const body = req.body || {};
  const topic = clean(body.topic, 180);
  const audience = clean(body.audience, 180) || "curious beginners";
  const goal = clean(body.goal, 400);
  const format = clean(body.format, 80) || "Tutorial";
  const stage = clean(body.stage, 80) || "New channel";
  const differentiator = clean(body.differentiator, 200);
  if (!topic) return res.status(400).json({ error: "A video topic is required." });
  if (topic.length < 3) return res.status(400).json({ error: "Please enter a more specific topic." });

  const fallback = localBrief(topic, audience, goal, format, differentiator);
  return res.json({ source: "template", brief: fallback, notice: "Template-generated brief. Connect an AI provider to enhance it." });
}