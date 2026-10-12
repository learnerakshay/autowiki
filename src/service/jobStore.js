import { randomUUID } from "node:crypto";

/**
 * A process-local Map is enough for this single-server teaching project: it
 * keeps job polling simple and avoids introducing a database solely for short-
 * lived status records. The deliberate trade-off is that every job and result
 * disappears when Express restarts; a durable or multi-instance deployment
 * would replace this module with shared persistent storage.
 */
const jobs = new Map();

export const WIKI_JOB_STAGES = Object.freeze({
  QUEUED: "queued",
  FETCHING_REPOSITORY: "fetching_repository",
  PLANNING_OUTLINE: "planning_outline",
  GENERATING_CHAPTER: "generating_chapter",
  SAVING_WIKI: "saving_wiki",
});

const wikiJobStages = new Set(Object.values(WIKI_JOB_STAGES));

function normalizeProgress(progress) {
  if (!progress || !wikiJobStages.has(progress.stage)) return undefined;

  const normalized = { stage: progress.stage };
  if (progress.stage !== WIKI_JOB_STAGES.GENERATING_CHAPTER) {
    return normalized;
  }

  const { chapter, totalChapters } = progress;
  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(totalChapters) ||
    chapter < 1 ||
    totalChapters < chapter
  ) {
    return undefined;
  }

  return { ...normalized, chapter, totalChapters };
}

export function createJob({ repo } = {}) {
  const job = { id: randomUUID(), status: "pending" };
  if (typeof repo === "string" && repo.trim()) {
    job.repo = repo.trim();
  }
  jobs.set(job.id, job);
  return job;
}

export function setJobProgress(id, progress) {
  const job = jobs.get(id);
  if (!job || job.status !== "pending") return undefined;

  const normalized = normalizeProgress(progress);
  if (!normalized) return undefined;

  const pendingJob = { ...job, progress: normalized };
  jobs.set(id, pendingJob);
  return pendingJob;
}

export function setJobResult(id, result) {
  const job = jobs.get(id);
  if (!job) return undefined;

  const completedJob = { ...job, ...result, status: "completed" };
  delete completedJob.progress;
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
  delete failedJob.progress;
  jobs.set(id, failedJob);
  return failedJob;
}

export function getJob(id) {
  return jobs.get(id);
}
