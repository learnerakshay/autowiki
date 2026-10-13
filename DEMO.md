# AutoWiki Demonstration Runbook

## Before the viva

1. Confirm `.env` contains nonempty OpenAI and Pinecone credentials and the expected Pinecone index name. Do not display the file.
2. Open three terminals at the repository root.
3. Start Express with `npm run dev`.
4. Confirm `http://localhost:5555/api/health` returns the AutoWiki API health response.
5. Start Inngest with `npm run dev:inngest`. Wait for `apps synced`; opening the dashboard alone does not prove function registration.
6. Start Vite with `npm run dev:web`, then open `http://localhost:5173`.
7. Keep `/wiki/sample/spoon-knife` open in a second tab as the provider-independent fallback.

## Primary live demonstration

1. On Landing, explain that the real Wiki interface is the hero—not a decorative mockup.
2. Scroll through Repository → Planned Chapters → Generated Wiki. Reverse once to show that the active stage follows scroll direction.
3. Continue into the dark horizontal chapter story. Move from Introduction to Web Structure to Styling, then use the numbered keyboard-focusable controls.
4. Open Workspace and enter `octocat/Spoon-Knife`.
5. Choose **Generate Wiki**. Show the accepted job ID and worker-reported stage. Explain that the UI never invents a percentage.
6. When complete, open the Wiki. Navigate chapters, inspect source paths, switch rapidly once, and expand a Mermaid diagram.
7. Return to Workspace and choose **Index Repository**. Explain that this job is independent from Wiki generation.
8. After indexing completes, open Chat and ask: “Which files define the page structure and styling?”
9. Show the request-bound repository/question, the Markdown answer, and the returned source paths. Do not describe paths as citations the backend did not return.
10. Open Architecture. Select React, Express, Inngest, OpenAI, Pinecone, and Wiki artifact nodes. Point out incoming/outgoing paths and implementation files.
11. End with the limitations section: process-local jobs, provider dependencies, repository limits, and no multi-user database.

## Reliable fallback demonstration

If any external provider is unavailable:

1. Keep Landing and its scroll stories unchanged; they use the committed authentic sample fixture.
2. Open **Explore Sample Wiki** or `/wiki/sample/spoon-knife`.
3. State clearly: “This is a pre-generated verified sample, not a generation performed during this presentation.”
4. Navigate all three chapters, inspect source paths, switch rapidly, and expand a diagram.
5. Open Architecture and explain the live execution boundaries from source-backed panels.
6. Show Workspace and Chat UI states, but do not claim an unavailable live job completed.

## Troubleshooting

### Express unavailable

- Check that port 5555 is free and `npm run dev` is still running.
- Open `/api/health`; failure here is an API-process problem, not an Inngest problem.

### Inngest dispatch returns `fetch failed`

- Confirm `INNGEST_DEV=1` is loaded by Express.
- Confirm port 8288 is listening.
- Run `npm run dev:inngest` and wait for `apps synced`.
- Confirm the registered URL is `http://localhost:5555/api/inngest`.
- This failure occurs before GitHub retrieval, OpenAI generation, or Pinecone access.

### GitHub rate limit

- Add a valid server-side `GITHUB_TOKEN` and restart Express.
- Use the sample route rather than repeatedly generating during visual checks.

### OpenAI credentials or quota

- Confirm the environment variable is nonempty without printing it.
- Use the sample reader and disclose that live generation is externally blocked.

### Pinecone unavailable

- Wiki generation and the sample remain usable because they do not depend on Pinecone.
- Index and Chat require a reachable index with the configured name, 1536 dimensions, and cosine similarity.

### Lost job after restart

- The job store is process-local. Restarting Express invalidates existing polling IDs.
- Start a new job. A saved Wiki JSON file is not currently rehydrated into the job API.

### Polling transport failure

- Use **Retry status check**. It preserves the existing job ID and does not submit duplicate provider work.

### Port conflict

- Check listeners on 5555, 8288, and 5173. Stop only the stale AutoWiki process you started; do not terminate unrelated Node processes.

## Closing statement

AutoWiki’s original contribution is the repository-to-outline-to-chapter pipeline and its shared documentation reader. Indexing and Chat demonstrate a separate retrieval workflow; the Architecture route makes that distinction inspectable rather than hiding it behind a generic AI interface.
