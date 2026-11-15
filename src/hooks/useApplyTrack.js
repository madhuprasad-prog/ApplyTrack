import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { initialFollowups, initialInterviews, initialResumes } from '../data/demoData.js'
import {
  createApplication,
  deleteApplication,
  getApplicationErrorMessage,
  getApplications,
  updateApplication,
  updateApplicationStatus,
} from '../firebase/applicationService.js'
import useAuth from './useAuth.js'

export default function useApplyTrack() {
  const { user } = useAuth()
  const userUid = user?.uid
  const [applicationData, setApplicationData] = useState({
    uid: null,
    records: [],
    loading: false,
    error: '',
  })
  const [interviews, setInterviews] = useState(initialInterviews)
  const [followups, setFollowups] = useState(initialFollowups)
  const [resumes, setResumes] = useState(initialResumes)
  const loadGeneration = useRef(0)
  const applications = applicationData.uid === userUid ? applicationData.records : []
  const applicationsLoading = applicationData.uid !== userUid || applicationData.loading
  const applicationsError = applicationData.uid === userUid ? applicationData.error : ''

  const refreshApplications = useCallback(async () => {
    const uid = userUid
    if (!uid) return false
    const generation = ++loadGeneration.current
    setApplicationData((current) => ({
      uid,
      records: current.uid === uid ? current.records : [],
      loading: true,
      error: '',
    }))
    try {
      const records = await getApplications()
      if (generation !== loadGeneration.current || uid !== userUid) return false
      setApplicationData({ uid, records, loading: false, error: '' })
      return true
    } catch (error) {
      if (generation !== loadGeneration.current || uid !== userUid) return false
      const message = getApplicationErrorMessage(error, 'load')
      setApplicationData((current) => ({
        uid,
        records: current.uid === uid ? current.records : [],
        loading: false,
        error: message,
      }))
      toast.error(message)
      return false
    }
  }, [userUid])

  useEffect(() => {
    if (!userUid) return undefined
    const uid = userUid
    const generation = ++loadGeneration.current
    let active = true

    getApplications().then((records) => {
      if (active && generation === loadGeneration.current) {
        setApplicationData({ uid, records, loading: false, error: '' })
      }
    }).catch((error) => {
      if (active && generation === loadGeneration.current) {
        const message = getApplicationErrorMessage(error, 'load')
        setApplicationData({ uid, records: [], loading: false, error: message })
        toast.error(message)
      }
    })

    return () => {
      active = false
      if (generation === loadGeneration.current) loadGeneration.current += 1
    }
  }, [userUid])

  const setApplications = useCallback((records) => {
    setApplicationData((current) => ({
      uid: userUid ?? null,
      records: typeof records === 'function'
        ? records(current.uid === userUid ? current.records : [])
        : records,
      loading: false,
      error: '',
    }))
  }, [userUid])

  async function runApplicationMutation(operation, successMessage) {
    try {
      await operation()
      toast.success(successMessage)
      await refreshApplications()
      return true
    } catch (error) {
      toast.error(getApplicationErrorMessage(error))
      return false
    }
  }

  const addApplication = (values) => runApplicationMutation(
    () => createApplication(values),
    'Application added',
  )

  const editApplication = (id, values) => runApplicationMutation(
    () => updateApplication(id, values),
    'Application updated',
  )

  const removeApplication = async (id) => {
    const removed = await runApplicationMutation(
      () => deleteApplication(id),
      'Application deleted',
    )
    if (removed) {
      setApplications((items) => items.filter((item) => item.id !== id))
      setInterviews((items) => items.filter((item) => item.applicationId !== id))
      setFollowups((items) => items.filter((item) => item.applicationId !== id))
    }
    return removed
  }

  const changeStatus = (id, status) => runApplicationMutation(
    () => updateApplicationStatus(id, status),
    `Moved to ${status}`,
  )

  const addInterview = (values) => {
    setInterviews((items) => [{ ...values, id: `i${Date.now()}` }, ...items])
    toast.success('Interview scheduled')
  }
  const addFollowup = (values) => {
    setFollowups((items) => [{ ...values, id: `f${Date.now()}`, completed: false }, ...items])
    toast.success('Follow-up added')
  }
  const toggleFollowup = (id) => setFollowups((items) => items.map((item) => item.id === id ? { ...item, completed: !item.completed } : item))
  const addResume = (resume) => {
    setResumes((items) => [{ ...resume, id: `r${Date.now()}`, updatedAt: new Date().toISOString() }, ...items])
    toast.success('Resume added to your vault')
  }

  return {
    applications,
    applicationsLoading,
    applicationsError,
    refreshApplications,
    interviews,
    followups,
    resumes,
    addApplication,
    updateApplication: editApplication,
    removeApplication,
    changeStatus,
    addInterview,
    addFollowup,
    toggleFollowup,
    addResume,
    setApplications,
  }
}
