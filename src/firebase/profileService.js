import {
  doc,
  deleteField,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './config.js'

const editableProfileFields = new Set([
  'displayName',
  'photoURL',
  'phoneNumber',
  'college',
  'degree',
  'branch',
  'graduationYear',
  'academicYear',
  'technicalSkills',
  'programmingLanguages',
  'tools',
  'experience',
  'projects',
  'certifications',
  'preferredRoles',
  'preferredLocations',
  'professionalSummary',
  'linkedinURL',
  'githubURL',
  'portfolioURL',
])

class ProfileServiceError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ProfileServiceError'
  }
}

function getAuthenticatedUser() {
  const user = auth.currentUser
  if (!user?.uid) {
    throw new ProfileServiceError('Sign in before managing your profile.')
  }
  return user
}

function getProfileReference(uid) {
  return doc(db, 'users', uid)
}

function normalizeProfileData(profileData) {
  if (!profileData || typeof profileData !== 'object' || Array.isArray(profileData)) {
    throw new ProfileServiceError('Enter valid profile details.')
  }

  const normalized = {}
  for (const [field, value] of Object.entries(profileData)) {
    if (!editableProfileFields.has(field)) {
      throw new ProfileServiceError(`The profile field "${field}" cannot be changed here.`)
    }
    if (value !== undefined) normalized[field] = value
  }

  if ('displayName' in normalized) {
    if (typeof normalized.displayName !== 'string' || !normalized.displayName.trim()) {
      throw new ProfileServiceError('Enter your full name.')
    }
    normalized.displayName = normalized.displayName.trim()
  }

  return normalized
}

export async function getUserProfile() {
  const user = getAuthenticatedUser()
  const snapshot = await getDoc(getProfileReference(user.uid))
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveUserProfile(profileData) {
  const user = getAuthenticatedUser()
  if (typeof user.email !== 'string' || !user.email.trim()) {
    throw new ProfileServiceError('Your Firebase Authentication account has no email address.')
  }

  const updates = normalizeProfileData(profileData)
  const reference = getProfileReference(user.uid)

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    const updatedAt = serverTimestamp()

    if (snapshot.exists()) {
      const update = {
        ...updates,
        email: user.email,
        updatedAt,
      }
      if (updates.graduationYear === null) update.graduationYear = deleteField()
      transaction.update(reference, {
        ...update,
      })
      return
    }

    const displayName = updates.displayName || user.displayName?.trim()
    if (!displayName) {
      throw new ProfileServiceError('Enter your full name before creating your profile.')
    }

    const profile = {
      ...updates,
      displayName,
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt,
    }
    if (profile.graduationYear === null) delete profile.graduationYear
    transaction.set(reference, profile)
  })
}
