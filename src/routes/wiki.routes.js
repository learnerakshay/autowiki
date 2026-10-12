import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../service/github.js";
import { createJob, getJob } from "../service/jobStore.js";

const router = Router();

router.post("/", async (req, res) => {
  const repoInput = req.body?.repo;
  if (typeof repoInput !== "string" || !repoInput.trim()) {
    return res.status(400).json({ error: "repo is required" });
  }

  const { owner, repo, repoKey } = parseRepo(repoInput.trim());
  if (!owner || !repo) {
    return res.status(400).json({ error: "repo must use the owner/repo format" });
  }

  const job = createJob();
  await inngest.send({
    name: "wiki/chapters.requested",
    data: { owner, repo, repoKey, jobId: job.id },
  });

  return res.status(202).json({ jobId: job.id, status: job.status });
});

router.get("/jobs/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "job not found" });
  }

  if (job.status === "completed") {
    const { status, repo, generatedAt, chapters } = job;
    return res.json({ status, repo, generatedAt, chapters });
  }

  if (job.status === "failed") {
    return res.json({ status: job.status, error: job.error });
  }

  return res.json({ status: job.status });
});

export default router;
