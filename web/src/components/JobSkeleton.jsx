import { Card } from './ui/card.jsx'
import { Skeleton } from './ui/skeleton.jsx'

export function ChatSkeleton() {
  return (
    <Card className="max-w-3xl p-5 sm:p-6" aria-label="Answer loading">
      <Skeleton className="h-5 w-24" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[78%]" />
      </div>
      <Skeleton className="mt-7 h-5 w-20" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-28" />
      </div>
    </Card>
  )
}

export function HomeSkeleton() {
  return (
    <Card className="max-w-3xl p-5 sm:p-6" aria-label="Repository indexing in progress">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14" />)}
      </div>
    </Card>
  )
}

export function WikiSkeleton() {
  return (
    <div className="wiki-grid" aria-label="Wiki generation in progress">
      <Card className="chapter-panel p-3 shadow-none">
        <Skeleton className="m-2 h-5 w-24" />
        <div className="mt-4 flex gap-2 overflow-hidden lg:grid">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-11 min-w-36 lg:min-w-0" />)}
        </div>
      </Card>
      <Card className="p-5 sm:p-7">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="mt-4 h-4 w-2/3" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className={`h-3 ${item === 5 ? 'w-3/5' : 'w-full'}`} />)}
        </div>
        <Skeleton className="mt-9 h-52 w-full" />
      </Card>
    </div>
  )
}
