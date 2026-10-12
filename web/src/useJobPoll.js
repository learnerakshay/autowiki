import { useEffect, useState } from 'react'
import { apiRequest } from './api.js'

export function useJobPoll(resource, jobId) {
  const key = jobId ? `${resource}:${jobId}` : ''
  const [result, setResult] = useState({ key: '', job: null, error: '' })
  const current = result.key === key
    ? result
    : { key, job: jobId ? { status: 'pending' } : null, error: '' }

  useEffect(() => {
    if (!jobId) return undefined

    let active = true
    let timer

    async function poll() {
      try {
        const nextJob = await apiRequest(`/api/${resource}/jobs/${jobId}`)
        if (!active) return
        setResult({ key, job: nextJob, error: '' })
        if (nextJob.status === 'pending') timer = setTimeout(poll, 2000)
      } catch (pollError) {
        if (active) setResult({ key, job: null, error: pollError.message })
      }
    }

    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId, key, resource])

  return { job: current.job, error: current.error }
}
