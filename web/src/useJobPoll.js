import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from './api.js'

export function useJobPoll(resource, jobId) {
  const key = jobId ? `${resource}:${jobId}` : ''
  const [result, setResult] = useState({ key: '', job: null, error: '' })
  const [retryKey, setRetryKey] = useState(0)
  const current = result.key === key
    ? result
    : { key, job: jobId ? { status: 'pending' } : null, error: '' }

  const retry = useCallback(() => {
    if (!jobId) return
    setResult((previous) => ({
      key,
      job: previous.key === key && previous.job ? previous.job : { status: 'pending' },
      error: '',
    }))
    setRetryKey((value) => value + 1)
  }, [jobId, key])

  useEffect(() => {
    if (!jobId) return undefined

    let active = true
    let timer
    let transientFailures = 0

    async function poll() {
      try {
        const nextJob = await apiRequest(`/api/${resource}/jobs/${jobId}`)
        if (!active) return
        transientFailures = 0
        setResult({ key, job: nextJob, error: '' })
        if (nextJob.status === 'pending') timer = setTimeout(poll, 2000)
      } catch (pollError) {
        if (!active) return
        const retryable = pollError.status >= 500
        if (retryable && transientFailures < 2) {
          transientFailures += 1
          timer = setTimeout(poll, 2000)
          return
        }
        setResult((previous) => ({
          key,
          job: previous.key === key ? previous.job : { status: 'pending' },
          error: pollError.message,
          errorStatus: pollError.status || 0,
        }))
      }
    }

    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [jobId, key, resource, retryKey])

  return { job: current.job, error: current.error, errorStatus: current.errorStatus, retry }
}
