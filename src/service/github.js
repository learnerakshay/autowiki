import { Octokit } from "@octokit/rest";

const SKIP_DIRS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "coverage",
    ".next",
    "vendor",
    "target",
    "__pycache__",
    ".gradle",
  ];

  const SKIP_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "bmp",
    "woff", "woff2", "ttf", "eot", "otf",
    "mp3", "mp4", "mov", "wav", "webm",
    "exe", "dll", "so", "dylib", "bin", "wasm",
    "class", "jar", "war", "ear",
    "zip", "tar", "gz", "tgz", "7z", "rar",
    "pdf", "lock", "map",
  ]);

  const SKIP_FILES = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "composer.lock",
    "go.sum",
  ]);

  /**
   * Generated dependencies, lockfiles, binaries, and oversized files add cost
   * and noise but little explanatory value for code search or wiki generation.
   * Filtering them before blob downloads reduces GitHub requests, prompt size,
   * embedding work, and the chance of treating binary data as UTF-8 text.
   */
  function shouldSkipFile(path, size) {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
  
    if (parts.some((part) => SKIP_DIRS.includes(part))) return true;
    if (SKIP_FILES.has(fileName)) return true;
    if (typeof size === "number" && size > 200_000) return true;
  
    const ext = fileName.includes(".")
      ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
      : "";
  
    if (SKIP_EXTENSIONS.has(ext)) return true;
    if (fileName.endsWith(".min.js")) return true;
  
    return false;
  }

  export function parseRepo(input) {
    const clean = input
      .replace("https://github.com/", "")
      .replace("http://github.com/", "")
      .replace(/\.git$/, "");
  
    const [owner, repo] = clean.split("/");
    return { owner, repo, repoKey: `${owner}/${repo}` };
  }

  /**
   * The 200-file ceiling keeps indexing time, API usage, embedding cost, and
   * Inngest run size bounded for this local project. `truncated: true` means
   * either GitHub reported an incomplete recursive tree or more than 200
   * eligible files remained after filtering, so callers know the repository
   * was only partially represented; intentionally skipped files alone do not
   * set the flag.
   */
  export async function fetchRepoFiles(token , owner , repo){
    const octokit = new Octokit({ auth: token });

    const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo }).catch((err) => {
        if (err.status === 404) {
          throw new Error(
            `GitHub could not find ${owner}/${repo}. Fine-grained tokens (github_pat_) must include this repo.`,
          );
        }
        throw err;
      });

      const {data:tree} = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha:repoInfo.default_branch,
        recursive:"true"
      })

      const items = tree.tree.filter(
        (item) => item.type === "blob" && !shouldSkipFile(item.path, item.size),
      );
      const truncated = Boolean(tree.truncated) || items.length > 200;
      const files = [];

      for (const item of items.slice(0, 200)) {
        const { data: blob } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: item.sha,
        });
    
        files.push({
          path: item.path,
          content: Buffer.from(blob.content, "base64").toString("utf8"),
        });
      }

      return { files, truncated };
  }
