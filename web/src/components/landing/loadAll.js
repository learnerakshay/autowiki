/** Asks every lazy section to load now (nav clicks and deep links need real layout before scrolling). */
export const LOAD_ALL_EVENT = 'landing:load-all'
export const loadAllSections = () => window.dispatchEvent(new Event(LOAD_ALL_EVENT))
