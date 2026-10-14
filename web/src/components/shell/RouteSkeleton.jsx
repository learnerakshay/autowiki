import { Page, Skeleton, SkeletonText, Surface } from '../ui/kit/index.js'
import './route-skeleton.css'

export function RouteSkeleton({ route, search = '' }) {
  const reader = route === 'sample' || route === 'wiki' && new URLSearchParams(search).has('jobId')
  const wide = route === 'architecture' || reader
  return <Page track={wide ? 'wide' : 'content'} className={`route-skeleton route-skeleton--${reader ? 'reader' : route}`} aria-hidden="true"><Skeleton width="min(40rem, 85%)" height="5rem" /><SkeletonText lines={2} />{route === 'chat' ? <div className="route-skeleton__flow">{[0,1,2].map((index)=><Skeleton key={index} height="3rem" />)}</div> : null}<div className="route-skeleton__body">{reader ? <Surface className="route-skeleton__rail">{[0,1,2,3,4].map((index)=><Skeleton key={index} height="3rem" />)}</Surface> : null}<Surface><SkeletonText lines={route === 'chat' ? 2 : 4} /><Skeleton height={route === 'architecture' || reader ? '20rem' : '3rem'} /><SkeletonText lines={reader ? 6 : 3} />{route === 'chat' ? <Skeleton height="6rem" /> : null}</Surface>{['workspace','architecture'].includes(route) || reader ? <Surface className={reader ? 'route-skeleton__context' : ''} variant={route === 'workspace' ? 'dark' : 'flat'}><SkeletonText lines={6} /><Skeleton height="10rem" /></Surface> : null}</div></Page>
}
