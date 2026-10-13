// Shared by StreamText (what it types) and PreviewWindow (when each paragraph should start).
export const STREAM_CPS = 300
export const streamDuration = (text) => (text.length / STREAM_CPS) * 1000
