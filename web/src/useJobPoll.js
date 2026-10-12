import { useEffect, useState } from 'react'
import { apiRequest } from './api.js'

export function useJobPoll(resource, jobId) {
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setJob(jobId ? { status: 'pending' } : null)
    setError('')
    if (!jobId) return undefined

    let active = true
    let timer

    async function poll() {
      try {
        const nextJob = await apiRequest(`/api/${resource}/jobs/${jobId}`)
        if (!active) return
        setJob(nextJob)
        if (nextJob.status === 'pending') timer = setTimeout(poll, 2000)
      } catch (pollError) {
        if (active) setError(pollError.message)
      }
    }

    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId, resource])

  return { job, error }
}
