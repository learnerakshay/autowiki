import test from "node:test";
import assert from "node:assert/strict";
import {
  extractJson,
  parseChapterResponse,
  parseOutlineResponse,
} from "../src/service/wiki.js";

test("extractJson parses plain JSON", () => {
  assert.deepEqual(extractJson('{"ok":true}'), { ok: true });
});

test("extractJson parses fenced JSON", () => {
  assert.deepEqual(extractJson('```json\n{"ok":true}\n```'), { ok: true });
});

test("extractJson parses prose-wrapped JSON", () => {
  assert.deepEqual(extractJson('Here is the result: {"ok":true} Thanks.'), {
    ok: true,
  });
});

test("extractJson returns null for garbage", () => {
  assert.equal(extractJson("not JSON at all"), null);
});

test("parseOutlineResponse accepts eight valid chapters", () => {
  const filePaths = Array.from({ length: 8 }, (_, index) => `file-${index}.js`);
  const rawText = JSON.stringify({
    chapters: filePaths.map((filePath, index) => ({
      title: `Chapter ${index + 1}`,
      description: `Description ${index + 1}`,
      filePaths: [filePath],
    })),
  });

  const result = parseOutlineResponse(rawText, filePaths);
  assert.equal(result.shouldRetry, false);
  assert.equal(result.outline.chapters.length, 8);
});

test("parseOutlineResponse assigns omitted paths to the first chapter", () => {
  const result = parseOutlineResponse(
    JSON.stringify({
      chapters: [
        {
          title: "Core",
          description: "Core code",
          filePaths: ["src/index.js"],
        },
      ],
    }),
    ["src/index.js", "src/helper.js", "readme.md"],
  );

  assert.deepEqual(result.outline.chapters[0].filePaths, [
    "src/index.js",
    "src/helper.js",
    "readme.md",
  ]);
});

test("parseOutlineResponse requests one retry after malformed first output", () => {
  assert.deepEqual(parseOutlineResponse("malformed", ["src/index.js"]), {
    outline: null,
    shouldRetry: true,
  });
});

test("parseOutlineResponse falls back to Overview after two invalid attempts", () => {
  const filePaths = ["src/index.js", "readme.md"];
  const firstAttempt = parseOutlineResponse("first invalid response", filePaths);
  assert.equal(firstAttempt.shouldRetry, true);

  const finalAttempt = parseOutlineResponse("second invalid response", filePaths, {
    finalAttempt: true,
  });
  assert.deepEqual(finalAttempt, {
    outline: {
      chapters: [
        {
          title: "Overview",
          description: "An overview of the repository and its files.",
          filePaths,
        },
      ],
    },
    shouldRetry: false,
  });
});

test("parseChapterResponse accepts graph diagrams", () => {
  assert.deepEqual(
    parseChapterResponse(
      JSON.stringify({ markdown: "Chapter text", mermaid: "graph TD\nA --> B" }),
    ),
    {
      markdown: "Chapter text",
      mermaid: "graph TD\nA --> B",
      diagramValid: true,
    },
  );
});

test("parseChapterResponse accepts classDiagram diagrams", () => {
  const result = parseChapterResponse(
    JSON.stringify({ markdown: "Types", mermaid: "  classDiagram\nA <|-- B" }),
  );
  assert.equal(result.diagramValid, true);
});

test("parseChapterResponse preserves invalid Mermaid and flags it", () => {
  assert.deepEqual(
    parseChapterResponse(
      JSON.stringify({ markdown: "Still useful", mermaid: "not-a-diagram A B" }),
    ),
    {
      markdown: "Still useful",
      mermaid: "not-a-diagram A B",
      diagramValid: false,
    },
  );
});

test("parseChapterResponse throws for malformed chapter JSON", () => {
  assert.throws(
    () => parseChapterResponse("this is not JSON"),
    /invalid chapter JSON/,
  );
});
