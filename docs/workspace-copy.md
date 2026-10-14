# Workspace copy for approval

This inventory includes every visible static string introduced or changed by the Workspace page rewrite. Variable values (repository names, API errors, real chapter titles, stage labels and counts) come from user input or the API. Existing unchanged labels are included where they form part of a rewritten control, so review can happen in one place.

## Header and form

- Repository workspace · Wiki generation
- What will we document today?
- Turn a public GitHub repository into a structured technical wiki, or index its source for repository-grounded Q&A.
- Generate a technical wiki
- GitHub repository
- Use owner/repository or paste a public GitHub URL. A trailing .git is accepted.
- owner/repository
- Generate Wiki
- Wiki generation is already running
- Creates chapters, technical explanations, and architecture diagrams.
- Want to see the finished reader first?
- The sample is pre-generated and starts no backend job.
- Explore a sample Wiki

## Sample and live Wiki panel

- Pre-generated sample
- What arrives on the other side
- Generated wiki
- Repository
- Wiki outline
- Documentation
- Conceptual repository to Wiki workflow
- Conceptual workflow—not live job progress.
- Wiki request
- Live job
- Starting
- Starting the job
- Generating your technical wiki
- Wiki generation pending
- Wiki generation completed
- Wiki generation failed
- Wiki is ready
- generated chapter / generated chapters
- Open wiki
- Generate another
- Wiki generation could not start
- The backend could not complete this request.
- Repository fetching reads up to 200 eligible files and skips files larger than 200 KB.
- Retry status check
- Try again
- Edit repository

The live stage names, stage text and chapter counters are rendered by `WikiGenerationProgress` from the API response and its existing validated stage map.

## Index and benefits

- Index for grounded Q&A
- Build a searchable source index for Chat. Indexing is independent from wiki generation and does not create chapters.
- Index Repository
- Enter a valid repository first
- Repository indexing is already running
- Repository indexing is in progress.
- source files read · searchable chunks
- The index was processed but was not saved for repository-grounded Q&A.
- The searchable index was saved from a limited file list: the 200-file cap was reached or GitHub returned an incomplete tree.
- The searchable index was saved and is ready for repository-grounded Q&A.
- Open Chat
- Independent jobs
- Wiki and index work can run at the same time.
- Structured output
- Chapters organize code into a readable system narrative.
- Grounded answers
- Indexing prepares repository context for Chat.

## Request and job errors

- Enter a repository before starting a job.
- The service is rate-limited. Try again later.
- The job was not found. Job records are process-local and may be gone after a server restart. Start over from Workspace.
- The service could not be reached. Check your connection and try again.
- The request could not be completed.
- Repository indexing could not start
- Repository index is ready
- Repository indexing failed

Repository validation errors are reused verbatim from `lib/repoInput.js`. Completion is shown on the page only. Polling stops on route departure; there are no completion toasts.

Pass B: Status check failed describes a polling error; Job not found offers Start over because records are process-local. Only an API failed job is called a generation failure. Finished, not saved is neutral; Succeeded requires saved:true. Failure announcements use one inline live region, without a duplicate toast.
