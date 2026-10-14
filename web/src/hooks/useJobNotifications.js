import { useEffect } from 'react'
import { toast } from '../components/ui/kit/toastStore.js'

export function useJobNotifications(job, jobId, labels) {
  useEffect(() => {
    if (!jobId || !job?.status || job.status === 'pending') return
    const id = `${jobId}-${job.status}`
    if (job.status === 'failed') toast.error(labels.failed, { id, description: job.error })
  }, [job?.error, job?.status, jobId, labels.completed, labels.failed])
}
