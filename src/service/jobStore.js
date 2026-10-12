import { randomUUID } from "node:crypto";

/**
 * A process-local Map is enough for this single-server teaching project: it
 * keeps job polling simple and avoids introducing a database solely for short-
 * lived status records. The deliberate trade-off is that every job and result
 * disappears when Express restarts; a durable or multi-instance deployment
 * would replace this module with shared persistent storage.
 */
const jobs = new Map();

export function createJob() {
  const job = { id: randomUUID(), status: "pending" };
  jobs.set(job.id, job);
  return job;
}

export function setJobResult(id, result) {
  const job = jobs.get(id);
  if (!job) return undefined;

  const completedJob = { ...job, ...result, status: "completed" };
  jobs.set(id, completedJob);
  return completedJob;
}

export function setJobFailed(id, error) {
  const job = jobs.get(id);
  if (!job) return undefined;

  const failedJob = {
    ...job,
    status: "failed",
    error: error instanceof Error ? error.message : String(error),
  };
  jobs.set(id, failedJob);
  return failedJob;
}

export function getJob(id) {
  return jobs.get(id);
}
