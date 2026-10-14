import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText } from 'lucide-react'
import { Button, EmptyState, Page } from '../components/ui/kit/index.js'
import sampleWiki from '../data/samples/spoon-knife.json'
import { WikiReader } from './WikiReader.jsx'

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
      <Page track="content" as="section" className="wiki-state-page" aria-labelledby="sample-missing-title">
        <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Back to Workspace</Link>
        <h1 id="sample-missing-title">Sample Wiki unavailable</h1>
        <EmptyState icon={BookOpenText} title="The sample is not part of this build" description="The requested pre-generated sample is unavailable." action={<Button as={Link} to="/workspace">Generate a Wiki</Button>} />
      </Page>
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
