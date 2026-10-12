import { Router } from "express";
import { inngest } from "../inngest/client.js";
import { parseRepo } from "../service/github.js";
import { createJob, getJob } from "../service/jobStore.js";

const router = Router();



async function startChatJob(repo, question) {
  const { repoKey } = parseRepo(repo);
  const job = createJob();

  await inngest.send({
    name: "chat/question.requested",
    data: { repo: repoKey, question, jobId: job.id },
  });

  return { jobId: job.id, status: job.status };
}


router.post("/", async (req, res) => {
  const { repo, question } = req.body ?? {};

  if (!repo || !question) {
    return res.status(400).json({ error: "repo and question are required" });
  }

  res.status(202).json(await startChatJob(repo, question));
});

router.get("/jobs/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "job not found" });
  }

  if (job.status === "completed") {
    return res.json({
      status: job.status,
      answer: job.answer,
      sources: job.sources,
    });
  }

  if (job.status === "failed") {
    return res.json({ status: job.status, error: job.error });
  }

  return res.json({ status: job.status });
});



export default router;
