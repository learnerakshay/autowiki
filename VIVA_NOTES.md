# AutoWiki Viva Notes

## Project objective

AutoWiki converts public repository source into structured technical documentation. The output is a chaptered Wiki with explanatory Markdown, source paths, and one Mermaid diagram per chapter.

## Original contribution

The main contribution is a multi-stage Wiki-generation pipeline:

1. Read and filter repository files.
2. Ask the model for a bounded one-to-eight-chapter outline.
3. Generate every chapter from its assigned source context.
4. Return chapter prose and Mermaid source together.
5. Save the final Wiki and expose it through a polling job.

This is distinct from generic repository chat because it plans and produces a coherent document before the reader asks questions.

## Actual architecture

- React and Vite render the Landing, Workspace, Wiki, Chat, and Architecture routes.
- Express validates requests, creates job records, sends Inngest events, and exposes polling endpoints.
- Inngest performs long-running GitHub, OpenAI, and Pinecone work outside HTTP requests.
- OpenAI generates outlines, chapters, diagrams, and grounded answers; it also produces embeddings for indexed source chunks.
- Pinecone stores and retrieves source vectors for Index and Chat only.
- Mermaid renders chapter diagrams in the browser with strict security settings.

## Why use multi-stage generation?

Planning the outline first separates document structure from prose generation. It keeps the number of chapters bounded, assigns source paths before writing, and lets each chapter run as an independent Inngest step. Invalid outline JSON gets one stricter retry and then a deterministic Overview fallback.

## How are diagrams produced?

Each chapter model call returns the Markdown explanation and Mermaid definition together from the same assigned source context. Diagram generation is not a separate worker stage. The server validates the Mermaid declaration; the browser safely renders valid definitions and exposes raw source when validation fails.

## Why Inngest?

GitHub retrieval, model calls, embeddings, and vector writes can outlive a normal request. Inngest provides explicit events, step boundaries, retry behavior, and final-failure hooks. Express can respond with a job ID immediately while work continues in the background.

## Why polling?

The current architecture is local and simple. Polling every two seconds makes eventual completion visible without WebSocket infrastructure. A status transport failure receives two bounded automatic retries and then a manual **Retry status check** action; it never resubmits the original job.

## What is Pinecone used for?

Indexing chunks eligible source files, embeds them with `text-embedding-3-small`, and upserts them into a repository namespace. Chat embeds the question, retrieves the best matching chunks, and asks the model to answer from that context. Returned file paths are shown as sources.

## Why is Wiki generation independent of Pinecone?

Wiki generation already fetches repository files directly and assigns them to planned chapters. It does not need a prior vector index. This keeps the flagship Wiki path available even when Pinecone is unavailable.

## What race condition was fixed?

Mermaid rendering is asynchronous. Rapid chapter selection could allow an older render to finish after a newer one and leave stale or duplicate SVGs. The reader tracks the authoritative render, cancels stale work during cleanup, clears the container before replacement, and regression tests require exactly one SVG after rapid switching.

## What do the tests prove?

- Node tests verify deterministic parsing, outline fallback, progress guards, terminal states, failure handlers, and route contracts.
- Deterministic Playwright tests mock APIs and verify UI states, stale-request protection, polling recovery, accessibility behavior, scroll direction, responsive layouts, and Mermaid replacement.
- Sample tests prove the committed fixture works without backend/provider calls.
- Live tests verify actual Express → Inngest → GitHub/OpenAI/Pinecone completion. A returned HTTP 202 alone is not considered success.

## Inngest dispatch incident

The SDK correctly entered development mode from `INNGEST_DEV=1` and targeted `http://localhost:8288`. The prior `TypeError: fetch failed` happened because no development runner was listening; it occurred before provider work. Starting Express, then the pinned Inngest CLI and waiting for function sync restored dispatch. A harmless hello event returned an event ID, followed by completed live Wiki, Index, and Chat jobs.

## Honest limitations

- Jobs live in one process-local `Map` and disappear after an Express restart.
- Generated JSON persists locally, but the API cannot rehydrate a missing job from it.
- Repository reads are capped at 200 eligible files and exclude large/generated/binary content.
- Provider credentials, quotas, network availability, and billing affect live workflows.
- Pinecone namespaces use a readable encoding with a documented collision edge case.
- Re-indexing does not delete old vectors for source chunks that disappeared.
- Chat has no conversation memory.
- There is no authentication, persistent multi-user database, or production deployment configuration.

## One-sentence defense

AutoWiki is not a generic chatbot: it is a source-grounded, asynchronous repository-to-document pipeline with a separate retrieval path for follow-up questions and an inspectable reader/architecture experience.
