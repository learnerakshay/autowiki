import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '../components/ui/kit/index.js'

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

function MarkdownCodeBlock({ children }) {
  const code = String(children?.props?.children ?? '').replace(/\n$/, '')
  const language = children?.props?.className?.match(/language-([\w+-]+)/)?.[1]
  return <CodeBlock code={code} language={language} className="wiki-code-block" />
}

function OmittedImage({ alt = '' }) {
  return <span className="wiki-image-note">Image omitted{alt ? `: ${alt}` : ''}</span>
}

const components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children, node }) => <h3 id={`wiki-heading-${node?.position?.start?.line ?? 'two'}`} data-toc="true">{children}</h3>,
  h3: ({ children, node }) => <h4 id={`wiki-heading-${node?.position?.start?.line ?? 'three'}`} data-toc="true">{children}</h4>,
  h4: ({ children }) => <h5>{children}</h5>,
  h5: ({ children }) => <h6>{children}</h6>,
  h6: ({ children }) => <h6>{children}</h6>,
  a: ExternalLink,
  table: MarkdownTable,
  pre: MarkdownCodeBlock,
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
