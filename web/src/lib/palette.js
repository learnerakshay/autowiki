export const prefetchPalette = () => import('../components/shell/CommandPalette.jsx')
export const openPalette = () => window.dispatchEvent(new Event('autowiki:palette'))
