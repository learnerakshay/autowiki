import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText } from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import sampleWiki from '../data/samples/spoon-knife.json'
import { WikiReader } from './Wiki.jsx'

const SAMPLE_SLUG = 'spoon-knife'

function isValidSample(sample) {
  return sample?.id === SAMPLE_SLUG
    && typeof sample.repo === 'string'
    && Array.isArray(sample.chapters)
    && sample.chapters.length > 0
    && sample.chapters.every((chapter) => (
      typeof chapter.title === 'string'
      && typeof chapter.markdown === 'string'
      && typeof chapter.mermaid === 'string'
    ))
}

export default function SampleWiki() {
  const { slug } = useParams()

  if (slug !== SAMPLE_SLUG || !isValidSample(sampleWiki)) {
    return (
      <section className="wiki-state-page" aria-labelledby="sample-missing-title">
        <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Back to Workspace</Link>
        <div className="wiki-state-intro">
          <span className="wiki-state-icon" aria-hidden="true"><BookOpenText size={24} /></span>
          <div><h1 id="sample-missing-title">Sample Wiki unavailable</h1><p>The requested pre-generated sample is not part of this build.</p></div>
        </div>
        <Button asChild><Link to="/workspace">Generate a Wiki</Link></Button>
      </section>
    )
  }

  return (
    <WikiReader
      job={sampleWiki}
      sample
      provenance={`${sampleWiki.provenance.note} Source: ${sampleWiki.provenance.sourceArtifact}.`}
    />
  )
}
