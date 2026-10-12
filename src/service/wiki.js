import { ChatOpenAI } from "@langchain/openai";

const MAX_CHAPTERS = 8;
const MAX_FILE_CONTENT = 3000;
const MERMAID_START =
  /^\s*(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|journey|gantt|pie|mindmap|timeline)\b/i;

function toText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part.text ?? ""))
      .join("");
  }
  return String(content ?? "");
}

export function extractJson(content) {
  const text = toText(content).trim();
  if (!text) return null;

  const candidates = [text];
  for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    candidates.push(match[1].trim());
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function normalizeOutline(parsed, filePaths) {
  if (!Array.isArray(parsed?.chapters)) return null;

  const availablePaths = new Set(filePaths);
  const chapters = parsed.chapters
    .slice(0, MAX_CHAPTERS)
    .map((chapter, index) => ({
      title:
        typeof chapter?.title === "string" && chapter.title.trim()
          ? chapter.title.trim()
          : `Chapter ${index + 1}`,
      description:
        typeof chapter?.description === "string"
          ? chapter.description.trim()
          : "",
      filePaths: [
        ...new Set(
          Array.isArray(chapter?.filePaths)
            ? chapter.filePaths.filter(
                (filePath) =>
                  typeof filePath === "string" && availablePaths.has(filePath),
              )
            : [],
        ),
      ],
    }))
    .filter((chapter) => chapter.filePaths.length > 0);

  if (!chapters.length) return null;

  const assignedPaths = new Set(chapters.flatMap((chapter) => chapter.filePaths));
  chapters[0].filePaths.push(
    ...filePaths.filter((filePath) => !assignedPaths.has(filePath)),
  );

  return { chapters };
}

function fallbackOutline(filePaths) {
  return {
    chapters: [
      {
        title: "Overview",
        description: "An overview of the repository and its files.",
        filePaths,
      },
    ],
  };
}

/**
 * Model I/O stays separate from `parseOutlineResponse` so JSON validation,
 * retry decisions, and the deterministic fallback can be tested with supplied
 * strings instead of spending API calls or depending on nondeterministic model
 * output. `buildOutline` is the small orchestration layer joining both sides.
 */
async function callOutlineModel(filePaths, stricter = false) {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const strictPrefix = stricter
    ? "Respond with ONLY valid JSON, no prose, no Markdown fences. "
    : "";
  const response = await llm.invoke(
    `${strictPrefix}Plan a concise code wiki from these repository file paths. ` +
      `Return STRICT JSON only with this shape: ` +
      `{"chapters":[{"title":"...","description":"...","filePaths":["..."]}]}. ` +
      `Create between 1 and ${MAX_CHAPTERS} chapters, use only paths from the list, ` +
      `and assign files to the chapter where they are most relevant.\n\n` +
      `File paths:\n${JSON.stringify(filePaths)}`,
  );

  return toText(response.content);
}

export function parseOutlineResponse(
  rawText,
  filePaths,
  { finalAttempt = false } = {},
) {
  const outline = normalizeOutline(extractJson(rawText), filePaths);
  if (outline) return { outline, shouldRetry: false };
  if (!finalAttempt) return { outline: null, shouldRetry: true };
  return { outline: fallbackOutline(filePaths), shouldRetry: false };
}

export async function buildOutline(files) {
  const filePaths = files.map((file) => file.path);
  const firstResponse = await callOutlineModel(filePaths);
  const firstResult = parseOutlineResponse(firstResponse, filePaths);
  if (!firstResult.shouldRetry) {
    return firstResult.outline;
  }

  const secondResponse = await callOutlineModel(filePaths, true);
  return parseOutlineResponse(secondResponse, filePaths, {
    finalAttempt: true,
  }).outline;
}

/**
 * Chapter generation follows the same impure/pure split: this function owns
 * the OpenAI call while `parseChapterResponse` owns deterministic validation.
 * Tests can therefore cover malformed JSON and Mermaid classification without
 * real credentials, network access, cost, or model variability.
 */
async function callChapterModel(chapterMeta, context) {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const response = await llm.invoke(
    `Write one code-wiki chapter titled ${JSON.stringify(chapterMeta.title)}. ` +
      `Explain what this part of the code does and why, referencing actual file paths ` +
      `and function names from the supplied files. Return STRICT JSON only with this shape: ` +
      `{"markdown":"...","mermaid":"..."}. The mermaid value must be a single ` +
      `fenced-free Mermaid diagram string showing relationships between these files or functions.\n\n` +
      `Chapter description: ${chapterMeta.description}\n\n${context}`,
  );
  return toText(response.content);
}

export function parseChapterResponse(rawText) {
  const parsed = extractJson(rawText);

  if (typeof parsed?.markdown !== "string" || typeof parsed?.mermaid !== "string") {
    throw new Error("LLM returned invalid chapter JSON");
  }

  return {
    markdown: parsed.markdown,
    mermaid: parsed.mermaid,
    diagramValid: MERMAID_START.test(parsed.mermaid),
  };
}

export async function writeChapter(chapterMeta, files) {
  const chapterPaths = new Set(chapterMeta.filePaths);
  const context = files
    .filter((file) => chapterPaths.has(file.path))
    .map((file) => {
      const truncated = file.content.length > MAX_FILE_CONTENT;
      const content = file.content.slice(0, MAX_FILE_CONTENT);
      return `File: ${file.path}${truncated ? " (truncated to 3000 characters)" : ""}\n${content}`;
    })
    .join("\n\n---\n\n");

  const rawText = await callChapterModel(chapterMeta, context);

  try {
    return { ...chapterMeta, ...parseChapterResponse(rawText) };
  } catch (error) {
    throw new Error(`LLM returned invalid chapter JSON for ${chapterMeta.title}`, {
      cause: error,
    });
  }
}
