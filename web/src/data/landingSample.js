// Everything the landing sections show about the sample repository, derived from heroSample.js
// (which in turn reads one JSON file). Swap the sample there and every section below updates:
// the stepper, the chapters carousel, the feature miniatures and the footer links.
import { heroSample } from './heroSample.js'

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
export const countWord = (count) => WORDS[count] ?? String(count)

const { chapters } = heroSample

/** Whole sentences from `text`, up to roughly `limit` characters (never cut mid-sentence). */
export function fitSentences(text = '', limit = 240) {
  // Split after sentence punctuation that is followed by whitespace, so `index.html` is never a boundary.
  const sentences = text.split(/(?<=[.!?])\s+/)
  let out = ''
  for (const sentence of sentences) {
    if (out && `${out} ${sentence}`.length > limit) break
    out = out ? `${out} ${sentence}` : sentence
  }
  return out.trim()
}

export const landingSample = {
  ...heroSample,
  chapterCount: chapters.length,
  countWord: countWord(chapters.length),
  /** Stage 1 of the stepper: one file row per chapter (its primary source file). */
  files: chapters.map((chapter, index) => ({ path: chapter.filePaths[0], chapter: index })),
  featured: chapters[heroSample.featuredChapter],
  featuredBlurb: fitSentences(chapters[heroSample.featuredChapter].excerpt[0], 240),
  /**
   * Carousel slides. The artifact beside each chapter is picked from what the chapter really has:
   * a code fence -> 'code', otherwise alternating a lead-sentence card and the full diagram.
   */
  slides: chapters.map((chapter, index) => ({
    chapter,
    index,
    kind: chapter.code ? 'code' : index % 2 === 0 ? 'lead' : 'graph',
  })),
}
