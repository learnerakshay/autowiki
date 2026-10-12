import { inngest } from "../client.js";
import { askQuestion } from "../../service/rag.js";
import { setJobFailed, setJobResult } from "../../service/jobStore.js";

/**
 * Kept as a named export so the final-failure state transition can be unit
 * tested with Inngest's real failure-event shape. Inngest calls `onFailure`
 * only after its configured retries are exhausted, so a transient first error
 * remains retryable instead of being exposed to the caller as a failed job.
 */
export async function handleAskQuestionFailure({ event, error }) {
  const { jobId } = event.data.event.data;
  setJobFailed(jobId, error);
}

export const askQuestionFn = inngest.createFunction(
    {
      id: "ask-question",
      triggers: [{ event: "chat/question.requested" }],
      onFailure: handleAskQuestionFailure,
    },
    async ({ event, step }) => {
      const { repo, question, jobId } = event.data;
  
    
      const result = await step.run("retrieve-and-answer", async () => {
        return askQuestion(repo, question);
      });

      setJobResult(jobId, {
        answer: result.answer,
        sources: result.sources,
      });

      return {
        repo,
        question,
        status: "completed",
        answer: result.answer,
        sources: result.sources,
      };
    },
  );
