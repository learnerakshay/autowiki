import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const remarkPlugins = [remarkGfm]

function ExternalLink({ children, href = '', title }) {
  const external = /^https?:\/\//i.test(href)

  return (
    <a
      href={href}
      title={title}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
    >
      {children}
    </a>
  )
}

function MarkdownTable({ children }) {
  return <div className="wiki-table-scroll"><table>{children}</table></div>
}

function CodeBlock({ children }) {
  return <div className="wiki-code-block"><pre>{children}</pre></div>
}

function OmittedImage({ alt = '' }) {
  return <span className="wiki-image-note">Image omitted{alt ? `: ${alt}` : ''}</span>
}

const components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
  h4: ({ children }) => <h5>{children}</h5>,
  h5: ({ children }) => <h6>{children}</h6>,
  h6: ({ children }) => <h6>{children}</h6>,
  a: ExternalLink,
  table: MarkdownTable,
  pre: CodeBlock,
  img: OmittedImage,
}

function withoutDuplicateTitle(markdown, title = '') {
  const lines = String(markdown || '').split('\n')
  const firstHeading = lines[0]?.match(/^#\s+(.+)$/)

  if (firstHeading?.[1].trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase()) {
    return lines.slice(1).join('\n').trimStart()
  }

  return markdown
}

export function MarkdownDocument({ markdown, title = '', className = '' }) {
  return (
    <div className={`wiki-markdown chapter ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml components={components}>
        {withoutDuplicateTitle(markdown, title)}
      </ReactMarkdown>
    </div>
  )
}
