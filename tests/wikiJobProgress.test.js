import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import wikiRoutes from "../src/routes/wiki.routes.js";
import {
  createJob,
  getJob,
  setJobFailed,
  setJobProgress,
  setJobResult,
  WIKI_JOB_STAGES,
} from "../src/service/jobStore.js";

test("wiki progress accepts only known, truthful stage metadata", () => {
  const job = createJob({ repo: "octocat/hello-world" });

  assert.equal(
    setJobProgress(job.id, { stage: "invented_stage", percent: 50 }),
    undefined,
  );
  assert.equal(
    setJobProgress(job.id, {
      stage: WIKI_JOB_STAGES.GENERATING_CHAPTER,
      chapter: 2,
      totalChapters: 1,
    }),
    undefined,
  );

  setJobProgress(job.id, {
    stage: WIKI_JOB_STAGES.GENERATING_CHAPTER,
    chapter: 2,
    totalChapters: 4,
    percent: 50,
    estimatedSeconds: 12,
  });

  assert.deepEqual(getJob(job.id), {
    id: job.id,
    status: "pending",
    repo: "octocat/hello-world",
    progress: {
      stage: "generating_chapter",
      chapter: 2,
      totalChapters: 4,
    },
  });
});

test("unknown jobs ignore progress updates", () => {
  assert.equal(
    setJobProgress("missing-job", { stage: WIKI_JOB_STAGES.QUEUED }),
    undefined,
  );
});

test("terminal wiki jobs discard progress and reject delayed stage updates", () => {
  const completed = createJob({ repo: "octocat/completed" });
  setJobProgress(completed.id, { stage: WIKI_JOB_STAGES.SAVING_WIKI });
  setJobResult(completed.id, {
    repo: "octocat/completed",
    generatedAt: "2026-10-13T00:00:00.000Z",
    chapters: [],
  });
  const completedResult = getJob(completed.id);

  assert.equal(
    setJobProgress(completed.id, { stage: WIKI_JOB_STAGES.PLANNING_OUTLINE }),
    undefined,
  );
  assert.deepEqual(getJob(completed.id), completedResult);
  assert.equal("progress" in completedResult, false);

  const failed = createJob({ repo: "octocat/failed" });
  setJobProgress(failed.id, { stage: WIKI_JOB_STAGES.FETCHING_REPOSITORY });
  setJobFailed(failed.id, new Error("retries exhausted"));
  const failedResult = getJob(failed.id);

  assert.equal(
    setJobProgress(failed.id, { stage: WIKI_JOB_STAGES.SAVING_WIKI }),
    undefined,
  );
  assert.deepEqual(getJob(failed.id), failedResult);
  assert.equal("progress" in failedResult, false);
});

test("wiki job HTTP contract exposes progress only while pending", async () => {
  const app = express();
  app.use("/api/wiki", wikiRoutes);
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/wiki/jobs`;

    const pending = createJob({ repo: "octocat/pending" });
    setJobProgress(pending.id, { stage: WIKI_JOB_STAGES.PLANNING_OUTLINE });
    const pendingResponse = await fetch(`${baseUrl}/${pending.id}`);
    assert.deepEqual(await pendingResponse.json(), {
      status: "pending",
      repo: "octocat/pending",
      progress: { stage: "planning_outline" },
    });

    const completed = createJob({ repo: "octocat/completed" });
    setJobProgress(completed.id, { stage: WIKI_JOB_STAGES.SAVING_WIKI });
    setJobResult(completed.id, {
      repo: "octocat/completed",
      generatedAt: "2026-10-13T00:00:00.000Z",
      chapters: [],
    });
    const completedResponse = await fetch(`${baseUrl}/${completed.id}`);
    assert.deepEqual(await completedResponse.json(), {
      status: "completed",
      repo: "octocat/completed",
      generatedAt: "2026-10-13T00:00:00.000Z",
      chapters: [],
    });

    const failed = createJob({ repo: "octocat/failed" });
    setJobProgress(failed.id, { stage: WIKI_JOB_STAGES.FETCHING_REPOSITORY });
    setJobFailed(failed.id, new Error("generation failed"));
    const failedResponse = await fetch(`${baseUrl}/${failed.id}`);
    assert.deepEqual(await failedResponse.json(), {
      status: "failed",
      error: "generation failed",
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
