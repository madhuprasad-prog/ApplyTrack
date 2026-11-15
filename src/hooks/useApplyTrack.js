import { useState } from 'react'
import toast from 'react-hot-toast'
import { initialApplications, initialFollowups, initialInterviews, initialResumes } from '../data/demoData.js'

export default function useApplyTrack() {
  const [applications, setApplications] = useState(initialApplications)
  const [interviews, setInterviews] = useState(initialInterviews)
  const [followups, setFollowups] = useState(initialFollowups)
  const [resumes, setResumes] = useState(initialResumes)

  const addApplication = (values) => {
    const application = { ...values, id: `a${Date.now()}`, color: '#5146e5', activity: [{ type: 'Application added', date: new Date().toISOString() }] }
    setApplications((items) => [application, ...items])
    toast.success('Application added')
    return application
  }
  const updateApplication = (id, values) => {
    setApplications((items) => items.map((item) => item.id === id ? { ...item, ...values } : item))
    toast.success('Application updated')
  }
  const removeApplication = (id) => {
    setApplications((items) => items.filter((item) => item.id !== id))
    setInterviews((items) => items.filter((item) => item.applicationId !== id))
    setFollowups((items) => items.filter((item) => item.applicationId !== id))
    toast.success('Application deleted')
  }
  const changeStatus = (id, status) => {
    setApplications((items) => items.map((item) => item.id === id ? { ...item, status, activity: [{ type: `Moved to ${status}`, date: new Date().toISOString() }, ...item.activity] } : item))
    toast.success(`Moved to ${status}`)
  }
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

  return { applications, interviews, followups, resumes, addApplication, updateApplication, removeApplication, changeStatus, addInterview, addFollowup, toggleFollowup, addResume, setApplications }
}
