import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import chatRoutes from "../src/routes/chat.routes.js";
import indexRoutes from "../src/routes/index.routes.js";
import {
  createJob,
  getJob,
  setJobFailed,
  setJobResult,
} from "../src/service/jobStore.js";

const [
  { handleAskQuestionFailure },
  { handleIndexRepoFailure },
  { handleGenerateWikiFailure },
] = await Promise.all([
  import("../src/inngest/functions/askQuestions.js"),
  import("../src/inngest/functions/indexRepo.js"),
  import("../src/inngest/functions/generateWiki.js"),
]);

function failureContext(jobId, message) {
  return {
    event: {
      name: "inngest/function.failed",
      data: {
        function_id: "test-function",
        run_id: "test-run",
        error: { name: "Error", message },
        event: {
          name: "test/requested",
          data: { jobId },
          ts: Date.now(),
        },
      },
    },
    error: new Error(message),
  };
}

for (const [name, handler] of [
  ["chat", handleAskQuestionFailure],
  ["index", handleIndexRepoFailure],
  ["wiki", handleGenerateWikiFailure],
]) {
  test(`${name} failure handler stores the final error`, async () => {
    const job = createJob();
    await handler(failureContext(job.id, `${name} retries exhausted`));

    assert.deepEqual(getJob(job.id), {
      id: job.id,
      status: "failed",
      error: `${name} retries exhausted`,
    });
  });
}

test("chat failed-job HTTP contract returns status and error", async () => {
  const app = express();
  app.use("/api/chat", chatRoutes);
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });

  try {
    const job = createJob();
    setJobFailed(job.id, new Error("HTTP failure proof"));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/chat/jobs/${job.id}`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "failed",
      error: "HTTP failure proof",
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("index job HTTP contract covers unknown, pending, completed, and failed", async () => {
  const app = express();
  app.use("/api/index", indexRoutes);
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/index/jobs`;

    const unknownResponse = await fetch(`${baseUrl}/unknown`);
    assert.equal(unknownResponse.status, 404);
    assert.deepEqual(await unknownResponse.json(), { error: "job not found" });

    const pendingJob = createJob();
    const pendingResponse = await fetch(`${baseUrl}/${pendingJob.id}`);
    assert.deepEqual(await pendingResponse.json(), { status: "pending" });

    const completedJob = createJob();
    setJobResult(completedJob.id, {
      fileCount: 16,
      chunkCount: 20,
      saved: true,
      truncated: false,
    });
    const completedResponse = await fetch(`${baseUrl}/${completedJob.id}`);
    assert.deepEqual(await completedResponse.json(), {
      status: "completed",
      fileCount: 16,
      chunkCount: 20,
      saved: true,
      truncated: false,
    });

    const failedJob = createJob();
    setJobFailed(failedJob.id, new Error("index failure proof"));
    const failedResponse = await fetch(`${baseUrl}/${failedJob.id}`);
    assert.deepEqual(await failedResponse.json(), {
      status: "failed",
      error: "index failure proof",
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
