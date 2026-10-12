import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { inngest } from "../client.js";
import { fetchRepoFiles } from "../../service/github.js";
import { buildOutline, writeChapter } from "../../service/wiki.js";
import {
  setJobFailed,
  setJobProgress,
  setJobResult,
  WIKI_JOB_STAGES,
} from "../../service/jobStore.js";

/**
 * Kept as a named export so the final-failure state transition can be unit
 * tested with Inngest's real failure-event shape. Inngest calls `onFailure`
 * only after its configured retries are exhausted, so a transient first error
 * remains retryable instead of being exposed to the caller as a failed job.
 */
export async function handleGenerateWikiFailure({ event, error }) {
  const { jobId } = event.data.event.data;
  setJobFailed(jobId, error);
}

export const generateWiki = inngest.createFunction(
  {
    id: "generate-wiki",
    triggers: [{ event: "wiki/chapters.requested" }],
    onFailure: handleGenerateWikiFailure,
  },
  async ({ event, step }) => {
    const { owner, repo, repoKey, jobId } = event.data;
    const githubToken = process.env.GITHUB_TOKEN;

    const { files } = await step.run("fetch-github-files", async () => {
      setJobProgress(jobId, {
        stage: WIKI_JOB_STAGES.FETCHING_REPOSITORY,
      });
      return fetchRepoFiles(githubToken, owner, repo);
    });

    const outline = await step.run("build-outline", async () => {
      setJobProgress(jobId, { stage: WIKI_JOB_STAGES.PLANNING_OUTLINE });
      return buildOutline(files);
    });

    const chapters = [];
    for (let index = 0; index < outline.chapters.length; index += 1) {
      const chapterMeta = outline.chapters[index];
      const chapter = await step.run(`write-chapter-${index + 1}`, async () => {
        setJobProgress(jobId, {
          stage: WIKI_JOB_STAGES.GENERATING_CHAPTER,
          chapter: index + 1,
          totalChapters: outline.chapters.length,
        });
        return writeChapter(chapterMeta, files);
      });
      chapters.push(chapter);
    }

    const generatedAt = await step.run("record-generated-at", async () => {
      return new Date().toISOString();
    });
    const result = { repo: repoKey, generatedAt, chapters };

    await step.run("persist-wiki-output", async () => {
      setJobProgress(jobId, { stage: WIKI_JOB_STAGES.SAVING_WIKI });
      const outputDirectory = path.resolve("wiki-output");
      await mkdir(outputDirectory, { recursive: true });
      await writeFile(
        path.join(outputDirectory, `${owner}-${repo}.json`),
        `${JSON.stringify(result, null, 2)}\n`,
        "utf8",
      );
    });

    setJobResult(jobId, result);
    return result;
  },
);
