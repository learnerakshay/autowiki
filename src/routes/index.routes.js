import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../service/github.js";
import { createJob, getJob } from "../service/jobStore.js";

const router = Router();

router.post("/", async (req, res) => {
  const { owner, repo, repoKey } = parseRepo(req.body.repo);
  const job = createJob();

  await inngest.send({
    name: "repo/index.requested",
    data: { owner, repo, repoKey, jobId: job.id },
  });

  res.status(202).json({ jobId: job.id, status: job.status });
});

router.get("/jobs/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "job not found" });
  }

  if (job.status === "completed") {
    const { status, fileCount, chunkCount, saved, truncated } = job;
    return res.json({ status, fileCount, chunkCount, saved, truncated });
  }

  if (job.status === "failed") {
    return res.json({ status: job.status, error: job.error });
  }

  return res.json({ status: job.status });
});

export default router;
