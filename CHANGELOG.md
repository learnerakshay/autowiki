# Project Changelog

This changelog consolidates the repository's short Git history and the later
working-tree changes into a report-ready account of how the project became a
complete local Git repository wiki and question-answering application. It is
grouped by engineering theme because several features evolved across multiple
passes and are easier to explain as design decisions than as commit messages.

## Initial setup and dependency compatibility

### Resolved the Pinecone and LangChain package conflict

The initial completed backend depended on `@langchain/pinecone` 1.0.3 while
also using `@pinecone-database/pinecone` 8.2.0. The LangChain adapter declared a
peer dependency on Pinecone 5.x, so a clean installation could not produce a
coherent dependency tree. Rather than downgrading the current Pinecone client
or forcing npm to accept incompatible peers, the adapter was removed and
`vectorStore.js` was implemented directly against the official Pinecone SDK.
LangChain remains responsible for OpenAI embeddings and text splitting, while
the Pinecone SDK owns namespace selection, upserts, and queries. This reduced
the dependency surface and made the installed versions genuinely compatible.

### Replaced an undeclared nodemon command

The original `dev` script called `nodemon`, but nodemon was not declared in the
project dependencies. That meant the documented development command depended
on a machine-global package and failed on a clean workstation. The script now
uses Node's built-in `--watch` mode, which provides the required restart-on-save
behavior without another development dependency.

### Removed the hardcoded development port

Express originally listened on port 3000 and printed a separate hardcoded 3000
message, ignoring the `PORT` value in `.env`. Startup now reads
`process.env.PORT` with a 5555 fallback and logs the same resolved value that is
passed to `listen`. The example environment file, Vite proxy, tests, and README
were aligned on port 5555 so runtime behavior and documentation cannot drift.

### Established reproducible local configuration

The six-variable `.env.example` documents Inngest development mode, the HTTP
port, OpenAI and Pinecone credentials, the Pinecone index name, and the optional
GitHub token. Real values remain exclusively in the ignored `.env` file. The
Pinecone `git-wiki` serverless index was standardized on AWS `us-east-1`, cosine
similarity, and 1536 dimensions to match `text-embedding-3-small`.

## Chat feature

### Replaced fire-and-forget responses with job polling

The first Chat route emitted `chat/question.requested` and returned the string
"check your inngest", forcing users to inspect the Inngest dashboard for the
answer. The route now creates a UUID-backed job, includes its ID in the event,
and immediately returns HTTP 202 with `{ jobId, status: "pending" }`. The
background function writes the answer and sources into the generic job store,
and `GET /api/chat/jobs/:jobId` exposes pending, completed, failed, and unknown
states. This kept the HTTP request short while giving both browsers and other
clients a deterministic way to retrieve the eventual result.

### Recorded failure only after retries are exhausted

The original question function wrapped its work in a catch block that simply
rethrew the same error. That added no recovery behavior and could not
distinguish a transient attempt from a final failure. It was replaced with
Inngest's `onFailure` lifecycle hook, which runs after the function has exhausted
its configured retries. The handler is a separately named export so unit tests
can construct the installed SDK's real failure-event shape and prove that the
job changes to `failed` with the expected message without deliberately breaking
live credentials.

### Preserved a graceful no-content result

RAG searches that find no vectors return an informational answer asking the
user to index the repository first. This is an expected application state, not
an infrastructure failure, so completing the job with actionable guidance is
more useful than spending retries on an error that only a separate indexing
operation can resolve.

## Wiki chapter generation

### Added the outline-to-chapter pipeline

The backend grew from single-question RAG into wiki generation through the
`wiki/chapters.requested` event and `generateWiki` function. The job fetches the
repository, asks `gpt-4o-mini` for a bounded outline of up to eight chapters,
then writes each chapter in its own Inngest step. Each chapter contains
explanatory Markdown, file references, and one Mermaid diagram. The final result
is stored for polling and also written to `wiki-output/<owner>-<repo>.json`, so
the latest generated artifact survives even though the in-memory polling state
does not.

### Made malformed model output recoverable

Outline generation accepts plain JSON, fenced JSON, or a JSON object embedded
in surrounding prose. A malformed first outline triggers one stricter model
request; if that also fails, generation falls back to one Overview chapter so
the job can still produce useful output. Chapter responses are validated for
both required strings, and Mermaid content is marked valid only when it begins
with a supported diagram declaration. Invalid diagrams retain their raw source
for transparent display rather than being silently discarded.

### Split model I/O from deterministic parsing

`callOutlineModel` and `callChapterModel` contain the credentialed, costly, and
nondeterministic OpenAI calls. `parseOutlineResponse` and
`parseChapterResponse` are pure exported functions that operate only on supplied
text. This boundary made retry decisions, fallback behavior, path assignment,
JSON extraction, and Mermaid validation testable without network access or API
charges. It was chosen over mocking the entire LangChain client because the
tests can exercise the real parsing contract with much less setup.

### Added the Wiki HTTP and browser flows

`POST /api/wiki` validates `owner/repo`, creates a pending job, and emits the
wiki event. Its polling endpoint returns repository metadata, generation time,
and chapters once complete. The React Wiki page polls that endpoint, presents a
chapter list beside the selected chapter, renders Mermaid client-side with
strict security settings, and replaces the previous SVG when the user switches
chapters.

## Index feature

### Reported partial GitHub indexing explicitly

Repository fetching intentionally excludes dependency/build directories,
binary media, lockfiles, source maps, minified JavaScript, and files over 200
KB. Eligible files are capped at 200 to bound GitHub requests, embeddings,
Pinecone writes, execution time, and cost. `fetchRepoFiles` now returns both the
files and a `truncated` flag. The flag is true when GitHub itself truncates the
recursive tree or when more than 200 eligible files exist, allowing callers to
distinguish a complete index from a deliberately partial one.

### Brought Index to polling parity

Indexing originally returned a bare "Repo Indexing" response with no observable
completion or failure state. It now creates the same generic job record as Chat
and Wiki, returns HTTP 202, and exposes `GET /api/index/jobs/:jobId`. Successful
runs publish file count, chunk count, Pinecone save status, and truncation status
to the job store. A named `onFailure` handler records a failed state only after
Inngest retries are exhausted. The Home page polls and visibly distinguishes
pending, completed, and failed outcomes.

### Kept repository vectors isolated

Every repository is stored in its own Pinecone namespace so similarity searches
cannot mix chunks from unrelated codebases. The local encoding converts
`owner/repo` to `owner-repo`; this is simple and readable but has a documented
collision edge case for names such as `a-b/c` and `a/b-c`. Stable SHA-256 record
IDs make repeated indexing idempotent for unchanged chunks, and upserts are
batched to avoid oversized Pinecone requests.

## Security and dependency maintenance

### Removed GitHub credentials from event history

The first Index route accepted a GitHub token and included it in Inngest event
data. Event payloads are retained and displayed in development tooling, so that
design could leak a credential into logs or dashboards. The token is no longer
accepted or forwarded by the route; `indexRepo` and `generateWiki` read
`GITHUB_TOKEN` directly from the server process environment immediately before
calling GitHub. Secrets therefore remain in `.env` and out of event history.

### Completed the root dependency audit repair

The backend audit initially reported three transitive findings. `npm audit fix`
updated `@grpc/grpc-js` from 1.14.4 to 1.14.6, `brace-expansion` from 2.1.4 to
2.1.7, and `proxy-addr` from 2.0.7 to 2.0.8. The dependency tree was then
reinstalled and audited again rather than relying on the advisory count alone;
the root project now reports zero vulnerabilities.

### Resolved the frontend Mermaid/KaTeX advisory separately

The later React/Mermaid dependency tree exposed a vulnerable transitive KaTeX
version even though the backend audit was already clean. A package override pins
KaTeX 0.18.2 for the frontend tree, retaining Mermaid functionality while
forcing the patched release. This was followed by a fresh frontend install,
audit, production build, and browser run. Root, frontend, and E2E packages now
all audit clean independently.

## Frontend

### Added the React and Vite application

A separate `web/` application provides Home, Chat, and Wiki routes while Vite
proxies relative `/api` requests to Express on port 5555. Home starts Index and
Wiki jobs, Chat submits questions and renders returned sources, and Wiki provides
chapter navigation plus Mermaid output. Keeping the UI separate from Express
preserves a small backend and makes development responsibilities explicit.

### Added consistent polling UX

The shared `useJobPoll` hook polls the matching job endpoint until completion or
failure. Each page now shows pending, completed, failed, submission-error, and
polling-error states instead of exposing raw API responses. Job IDs remain
visible for debugging, while completed content is presented directly in the
page rather than requiring the Inngest dashboard.

### Completed a plain-CSS polish and accessibility pass

The final visual pass consolidated styling into one imported stylesheet. It
added consistent spacing and typography, an active navigation treatment,
intentional inputs and buttons, a responsive two-pane Wiki layout, and readable
content/diagram surfaces. Pending, completed, and failed states use both text or
symbols and color, alerts retain `role="alert"`, keyboard focus is visible, and
reduced-motion preferences disable the small loading animation. No component,
animation, or icon library was introduced because the existing semantic markup
only needed a coherent visual system.

## Testing and reproducibility

### Added deterministic backend coverage

The root test command now runs Node's built-in test runner. Pure wiki tests cover
JSON extraction, chapter limits, omitted-path assignment, retry and fallback
decisions, supported Mermaid forms, invalid diagrams, and malformed chapter
responses. Failure-handler tests directly invoke all three named `onFailure`
exports with the SDK's nested failure event and verify the final stored error.
Route-contract tests use real ephemeral Express listeners to prove Chat failure
responses and every Index polling state without adding production debug routes.

### Added repeatable browser tests

An isolated top-level `e2e/` package uses Playwright and Chromium against the
already-running Vite server. The Chat spec ensures Spoon-Knife is indexed,
submits a real browser question, observes the pending state, and requires a
nonempty answer and source list in the DOM. The Wiki spec generates a real wiki,
switches between two chapters, and asserts that exactly one Mermaid SVG exists
after each change, guarding against the stale-diagram bug observed during manual
testing. The tests also capture representative Home, completed Chat, and Wiki
screenshots.

### Performed a clean-install rehearsal

Root, frontend, and E2E `node_modules` directories plus generated caches were
removed and rebuilt using only README commands. The `.env` file was checked by
shape and hash without printing secrets, all three services were started from
the documented commands, and both test suites and the production build passed.
That rehearsal exposed one machine-specific address mismatch: fresh Vite bound
to IPv6 localhost while Playwright used IPv4 `127.0.0.1`. Aligning Playwright
with the README's `http://localhost:5173` made the setup reproducible without
changing application behavior.

### Documented the remaining operational limits

The job store is intentionally process-local, so polling records vanish on an
Express restart and are not shared across server instances. GitHub requests made
without `GITHUB_TOKEN` use the low public rate limit, and the E2E suite can
temporarily be throttled when it repeatedly refetches repositories. Generated
wiki JSON is durable on local disk, but a production deployment would need
shared job storage, durable artifact storage, deployment-specific frontend/API
routing, and an unambiguous Pinecone namespace encoding.
