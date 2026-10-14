// The app's routes in one table: how to load the page chunk, which width track it lives in, and which nav item owns
// it. `track: 'full'` means the page manages its own width (Architecture's full-bleed sections).
//
// Pages are loaded explicitly (not with React.lazy) so the route viewport can fetch the next page while the current
// one stays on screen, then swap in a page that is already ready: no Suspense flash between routes.
export const appRoutes = [
  { key: 'workspace', path: '/workspace', load: () => import('../../pages/Home.jsx'), track: 'full' },
  { key: 'chat', path: '/chat', load: () => import('../../pages/Chat.jsx'), track: 'full' },
  { key: 'wiki', path: '/wiki', load: () => import('../../pages/Wiki.jsx'), track: 'full' },
  { key: 'sample', path: '/wiki/sample/:slug', load: () => import('../../pages/SampleWiki.jsx'), track: 'full' },
  { key: 'architecture', path: '/architecture', load: () => import('../../pages/Architecture.jsx'), track: 'full' },
]

/** Top-level nav items. The sample wiki lives under /wiki, so it highlights "Wiki" too. */
export const appNav = [
  { key: 'workspace', label: 'Workspace', to: '/workspace' },
  { key: 'chat', label: 'Chat', to: '/chat' },
  { key: 'wiki', label: 'Wiki', to: '/wiki' },
  { key: 'architecture', label: 'Architecture', to: '/architecture' },
]

const SEGMENT_TO_NAV = { workspace: 0, chat: 1, wiki: 2, architecture: 3 }

/** Index of the nav item that owns `pathname` (nested routes such as /wiki/sample/spoon-knife included), or -1. */
export function activeNavIndex(pathname) {
  return SEGMENT_TO_NAV[pathname.split('/')[1]] ?? -1
}

/** The route record for a pathname (params are matched, not parsed), or undefined. */
export function routeFor(pathname) {
  return appRoutes.find(({ path }) => new RegExp(`^${path.replace(/:[^/]+/g, '[^/]+')}/?$`).test(pathname))
}

const loaded = new Map()

/** Fetches a route's page module (once) and resolves with its component. */
export function loadRoute(route) {
  if (loaded.has(route.key)) return Promise.resolve(loaded.get(route.key))
  return route.load().then((module) => { loaded.set(route.key, module.default); return module.default })
}

/** The page component, once its chunk has loaded. */
export const loadedPage = (key) => loaded.get(key)
