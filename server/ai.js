// AI helper used by the Vite server (see vite.config.js).
// Talks to OpenRouter's free models; the API key comes from .env.

function buildPrompt(tool, text, options = {}) {
  if (tool === "summarize") {
    const lengths = {
      short: "2-3 sentences",
      medium: "one short paragraph followed by 3-5 bullet points of key ideas",
      long: "a structured summary with a short intro and bullet points grouped by topic",
    };
    const len = lengths[options.length] || lengths.medium;
    return `Summarize the following study notes in ${len}. Keep it accurate and do not add facts that are not in the text. Reply with the summary only.\n\n---\n${text}`;
  }

  if (tool === "explain") {
    const levels = {
      kid: "a curious 8-year-old, using a simple everyday analogy",
      highschool: "a high school student, using plain language and one example",
      college: "a college student new to the topic, with correct terminology explained briefly",
    };
    const level = levels[options.level] || levels.highschool;
    return `Explain the following topic or passage to ${level}. Be clear and friendly, and keep it under 200 words. Reply with the explanation only.\n\n---\n${text}`;
  }

  if (tool === "flashcards") {
    const n = Math.min(Math.max(parseInt(options.count, 10) || 8, 4), 15);
    return `Create ${n} flashcards from the study notes below.
Respond with ONLY valid JSON (no markdown fences, no extra text) in exactly this shape:
{"cards":[{"front":"a term or short question","back":"a short, clear answer"}]}

---
${text}`;
  }

  if (tool === "reviewer") {
    return `Create a study reviewer from the notes below, using simple markdown with these sections:
## Key Terms
- **Term**: short definition
## Main Points
- bullet points of the most important ideas
## Things to Remember
- tips, mnemonics, or common mistakes
## Possible Exam Questions
- 5 likely questions (no answers)
Use only information from the notes. Reply with the reviewer only.\n\n---\n${text}`;
  }

  if (tool === "quiz") {
    const n = Math.min(Math.max(parseInt(options.count, 10) || 5, 3), 10);
    return `Create a ${n}-question multiple-choice quiz based only on the study notes below.
Respond with ONLY valid JSON (no markdown fences, no extra text) in exactly this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"one sentence why"}]}
Each question must have exactly 4 options, and answerIndex is the 0-based index of the correct option.

---
${text}`;
  }

  return null;
}

async function callAI(prompt, env) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "X-Title": "Lumen Study Helper",
    },
    body: JSON.stringify({
      model: env.LUMEN_MODEL || "openrouter/free",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("The free AI is busy or the daily limit was reached. Try again in a minute.");
    }
    throw new Error(data?.error?.message || `AI request failed (${res.status})`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("The AI returned an empty answer. Please try again.");
  return content;
}

// Free models sometimes wrap JSON in extra text, so pull out the JSON part.
function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start !== -1 && end > start ? text.slice(start, end + 1) : text;
}

function readBody(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Text is too long. Please keep it under about 15,000 words."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJSON(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

export async function handleAI(req, res, env) {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "Use POST." });

  if (!env.OPENROUTER_API_KEY) {
    return sendJSON(res, 500, {
      error: "No API key found. Add OPENROUTER_API_KEY to the .env file and restart the server.",
    });
  }

  try {
    const body = req.body !== undefined ? (typeof req.body === "string" ? JSON.parse(req.body) : req.body) : JSON.parse(await readBody(req));
    const text = String(body.text || "").trim();
    if (!text) return sendJSON(res, 400, { error: "Please enter some text first." });

    const prompt = buildPrompt(body.tool, text, body.options);
    if (!prompt) return sendJSON(res, 400, { error: "Unknown tool." });

    let result = await callAI(prompt, env);
    if (body.tool === "quiz" || body.tool === "flashcards") result = extractJSON(result);
    return sendJSON(res, 200, { result });
  } catch (err) {
    return sendJSON(res, 500, { error: err.message || "Something went wrong." });
  }
}
