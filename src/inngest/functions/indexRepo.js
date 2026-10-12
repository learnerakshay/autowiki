import {inngest} from "../client.js";
import { fetchRepoFiles } from "../../service/github.js";
import { chunkFiles } from "../../service/chunker.js";
import { saveChunks } from "../../service/vectorStore.js";
import { setJobFailed, setJobResult } from "../../service/jobStore.js";

/**
 * Kept as a named export so the final-failure state transition can be unit
 * tested with Inngest's real failure-event shape. Inngest calls `onFailure`
 * only after its configured retries are exhausted, so a transient first error
 * remains retryable instead of being exposed to the caller as a failed job.
 */
export async function handleIndexRepoFailure({ event, error }) {
    const { jobId } = event.data.event.data;
    setJobFailed(jobId, error);
}

export const indexRepo = inngest.createFunction(
    {
        id:"index-repo",
        triggers:[{event:"repo/index.requested"}],
        onFailure: handleIndexRepoFailure,
    },
    async ({event , step})=>{
        const { owner , repo, jobId} = event.data;
        const githubToken = process.env.GITHUB_TOKEN;

        const repoName = repo.replace(/\.git$/, "");
        const repoKey = `${owner}/${repoName}`;

        const { files, truncated } = await step.run("fetch-github-files" , async()=>{
            return fetchRepoFiles(githubToken , owner , repoName)
        })

        const documents = await step.run("chunk-files" , async()=>{
            return chunkFiles(files , repoKey)
        });

        const saveResult = await step.run("save-to-pinecone" , async()=>{
            return saveChunks(repoKey , documents)
        })

        const result = {
            repo: repoKey,
            fileCount: files.length,
            chunkCount: documents.length,
            saved: saveResult.saved,
            truncated,
        };

        setJobResult(jobId, {
            fileCount: result.fileCount,
            chunkCount: result.chunkCount,
            saved: result.saved,
            truncated: result.truncated,
        });

        return result;
    }
)
