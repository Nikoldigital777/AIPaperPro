import Anthropic from "@anthropic-ai/sdk";

/*
The newest Anthropic model is "claude-sonnet-4-20250514". If the user doesn't specify a model,
always prefer using "claude-sonnet-4-20250514" as it is the latest model.
*/

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

export interface EnhanceTextOptions {
  tone: 'professional' | 'casual' | 'formal' | 'creative';
  length: 'concise' | 'moderate' | 'detailed';
  customPrompt?: string;
}

export async function enhanceText(
  text: string,
  options: EnhanceTextOptions
): Promise<string> {
  const { tone = "professional", length = "moderate", customPrompt } = options;
  
  const system = `You are an expert editor. Improve clarity, tone ("${tone}"), and length ("${length}"). Output ONLY the rewritten text.`;
  const user = `${customPrompt ? `Guidance: ${customPrompt}\n\n` : ""}Original:\n${text}`;

  const resp = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  const part = resp.content[0];
  return part.type === "text" ? part.text : "";
}

export async function generateSuggestions(text: string, context?: string): Promise<string[]> {
  const system = `Generate 3 alternative versions of the given text, each with a different approach or style. Return only the alternatives, one per line.`;
  const user = context ? `Context: ${context}\n\nText to rewrite: ${text}` : `Text to rewrite: ${text}`;

  const resp = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: user }],
  });
  const part = resp.content[0];
  const body = part.type === "text" ? part.text : "";
  return body.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 3);
}

export async function analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number }>{
  const resp = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    system: `You're a sentiment analysis AI. Output JSON with keys: "sentiment" (positive|negative|neutral) and "confidence" (0..1).`,
    messages: [{ role: "user", content: text }],
  });
  const part = resp.content[0];
  const json = part.type === "text" ? part.text : "{}";
  const parsed = JSON.parse(json);
  return { sentiment: parsed.sentiment, confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)) };
}