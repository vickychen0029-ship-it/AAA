import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProfileContext } from './ProfileContextValue.js'
import {
  createProfile as createProfileApi,
  deleteProfile as deleteProfileApi,
  listProfiles,
  mapBackendProfileToUi,
  mapUiProfileToCreatePayload,
  mapUiProfileToUpdatePayload,
  updateProfile as updateProfileApi,
} from '../services/profilesApi.js'
import { useAuth } from './useAuth.js'

const PROFILE_BACKUP_KEY_PREFIX = 'smweb_profile_backup_v1'

function createDraftProfile(base = {}) {
  return {
    id: base.id || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname: base.nickname || '',
    gender: base.gender || '',
    birthDate: base.birthDate || '',
    birthHour: base.birthHour ?? '12',
    birthMinute: base.birthMinute ?? '0',
    birthPlace: base.birthPlace || '',
    currentPlace: base.currentPlace || '',
    dstMode: base.dstMode === 'manual' ? 'manual' : 'auto',
    isDST: Boolean(base.isDST),
    geo: base.geo || null,
  }
}

const EMPTY_PROFILE = {
  id: 'draft-empty',
  nickname: '',
  gender: '',
  birthDate: '',
  birthHour: '12',
  birthMinute: '0',
  birthPlace: '',
  currentPlace: '',
  dstMode: 'auto',
  isDST: false,
  geo: null,
}

function profileHasRequiredFields(profile) {
  return Boolean(
    profile?.nickname
    && profile?.birthDate
    && profile?.birthHour !== ''
    && profile?.birthMinute !== ''
    && profile?.birthPlace,
  )
}

function isDraftProfileId(id) {
  const value = String(id || '')
  return value === 'draft-empty' || value.startsWith('draft-')
}

function getBackupKey(user) {
  const uid = user?.email || user?.id
  if (!uid) return ''
  return `${PROFILE_BACKUP_KEY_PREFIX}:${uid}`
}

function readProfileBackup(user) {
  const primaryKey = getBackupKey(user)
  const legacyKey = user?.id ? `${PROFILE_BACKUP_KEY_PREFIX}:${user.id}` : ''
  if (!primaryKey && !legacyKey) return null
  try {
    let raw = primaryKey ? localStorage.getItem(primaryKey) : null
    if (!raw && legacyKey) raw = localStorage.getItem(legacyKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.profiles) || parsed.profiles.length === 0) return null
    if (!localStorage.getItem(primaryKey) && raw && primaryKey) {
      localStorage.setItem(primaryKey, raw)
    }
    return {
      profiles: parsed.profiles,
      currentProfileId: parsed.currentProfileId || parsed.profiles[0]?.id,
    }
  } catch {
    return null
  }
}

function writeProfileBackup(user, profiles, currentProfileId) {
  const key = getBackupKey(user)
  if (!key) return
  try {
    const clean = (profiles || []).filter((p) => p && !isDraftProfileId(p.id))
    if (clean.length === 0) return
    localStorage.setItem(
      key,
      JSON.stringify({
        profiles: clean,
        currentProfileId: clean.some((p) => p.id === currentProfileId) ? currentProfileId : clean[0].id,
        updatedAt: Date.now(),
      }),
    )
  } catch {
    // ignore storage failures
  }
}

function mergeProfilesWithBackup(serverProfiles, backupProfiles) {
  if (!Array.isArray(serverProfiles) || serverProfiles.length === 0) return serverProfiles || []
  if (!Array.isArray(backupProfiles) || backupProfiles.length === 0) return serverProfiles
  if (serverProfiles.length === 1 && backupProfiles.length === 1) {
    const sp = serverProfiles[0]
    const bp = backupProfiles[0]
    return [{
      ...sp,
      nickname: (sp.nickname || '').trim() || bp.nickname || '',
      gender: sp.gender || bp.gender || '',
    }]
  }
  return serverProfiles.map((sp) => {
    const candidate = backupProfiles.find((bp) =>
      (bp?.id && sp?.id && bp.id === sp.id)
      || (
        String(bp?.birthDate || '') === String(sp?.birthDate || '')
        && String(bp?.birthHour || '') === String(sp?.birthHour || '')
        && String(bp?.birthMinute || '') === String(sp?.birthMinute || '')
        && String(bp?.birthPlace || '') === String(sp?.birthPlace || '')
      ),
    )
    if (!candidate) return sp
    return {
      ...sp,
      nickname: (sp.nickname || '').trim() || candidate.nickname || '',
      gender: sp.gender || candidate.gender || '',
    }
  })
}

function profileCompletenessScore(profile) {
  if (!profile) return 0
  let score = 0
  if ((profile.nickname || '').trim()) score += 4
  if (profile.gender) score += 3
  if (profile.birthDate) score += 2
  if (profile.birthPlace) score += 2
  if (profile.currentPlace) score += 1
  return score
}

function sameBirthSignature(a, b) {
  if (!a || !b) return false
  return (
    String(a.birthDate || '') === String(b.birthDate || '')
    && String(a.birthHour || '') === String(b.birthHour || '')
    && String(a.birthMinute || '') === String(b.birthMinute || '')
    && String(a.birthPlace || '') === String(b.birthPlace || '')
  )
}

function choosePreferredProfileId(mapped, previousId) {
  if (!Array.isArray(mapped) || mapped.length === 0) return EMPTY_PROFILE.id
  const hasPrev = mapped.find((p) => p.id === previousId)
  if (!hasPrev) {
    return [...mapped].sort((a, b) => profileCompletenessScore(b) - profileCompletenessScore(a))[0].id
  }
  const prevScore = profileCompletenessScore(hasPrev)
  if (prevScore >= 6) return previousId
  const siblingBetter = mapped.find((p) => p.id !== hasPrev.id && sameBirthSignature(p, hasPrev) && profileCompletenessScore(p) > prevScore)
  if (siblingBetter) return siblingBetter.id
  const globalBest = [...mapped].sort((a, b) => profileCompletenessScore(b) - profileCompletenessScore(a))[0]
  return profileCompletenessScore(globalBest) > prevScore ? globalBest.id : previousId
}

function enrichCurrentProfile(profile, profiles) {
  if (!profile) return profile
  const needsNickname = !(profile.nickname || '').trim()
  const needsGender = !profile.gender
  if (!needsNickname && !needsGender) return profile
  const list = Array.isArray(profiles) ? profiles : []
  const sameBirth = list
    .filter((p) => p.id !== profile.id && sameBirthSignature(p, profile))
    .sort((a, b) => profileCompletenessScore(b) - profileCompletenessScore(a))[0]
  const fallback = sameBirth || [...list].sort((a, b) => profileCompletenessScore(b) - profileCompletenessScore(a))[0]
  if (!fallback || fallback.id === profile.id) return profile
  return {
    ...profile,
    nickname: needsNickname ? (fallback.nickname || profile.nickname || '') : profile.nickname,
    gender: needsGender ? (fallback.gender || profile.gender || '') : profile.gender,
  }
}

export function ProfileProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth()
  const [state, setState] = useState({
    profiles: [createDraftProfile(EMPTY_PROFILE)],
    currentProfileId: EMPTY_PROFILE.id,
    loading: true,
    error: '',
  })

  const refreshProfiles = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setState({
        profiles: [createDraftProfile(EMPTY_PROFILE)],
        currentProfileId: EMPTY_PROFILE.id,
        loading: false,
        error: '',
      })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    try {
      const result = await listProfiles(10)
      const mappedRaw = (result.items || []).map(mapBackendProfileToUi)
      const backup = readProfileBackup(user)
      const mapped = mergeProfilesWithBackup(mappedRaw, backup?.profiles || [])
      if (mapped.length === 0) {
        if (backup?.profiles?.length) {
          setState({
            profiles: backup.profiles,
            currentProfileId: backup.currentProfileId || backup.profiles[0].id,
            loading: false,
            error: '',
          })
          return
        }
        setState({
          profiles: [createDraftProfile(EMPTY_PROFILE)],
          currentProfileId: EMPTY_PROFILE.id,
          loading: false,
          error: '',
        })
        return
      }

      setState((prev) => {
        const preferredId = choosePreferredProfileId(mapped, prev.currentProfileId)
        const nextState = {
          profiles: mapped,
          currentProfileId: preferredId,
          loading: false,
          error: '',
        }
        writeProfileBackup(user, nextState.profiles, nextState.currentProfileId)
        return {
          ...nextState,
        }
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '加载档案失败',
      }))
    }
  }, [isAuthenticated, token, user])

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (!state.profiles?.length) return
    writeProfileBackup(user, state.profiles, state.currentProfileId)
  }, [isAuthenticated, user, state.profiles, state.currentProfileId])

  const profile = useMemo(
    () => {
      const current = state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0] || createDraftProfile(EMPTY_PROFILE)
      return enrichCurrentProfile(current, state.profiles)
    },
    [state.currentProfileId, state.profiles],
  )

  const setCurrentProfile = (id) => {
    setState((prev) => {
      if (!prev.profiles.some((p) => p.id === id)) return prev
      return { ...prev, currentProfileId: id }
    })
  }

  const updateProfile = async (updates) => {
    const current = state.profiles.find((p) => p.id === state.currentProfileId)
    if (!current) {
      throw new Error('未找到当前档案')
    }
    const merged = { ...current, ...updates }
    const payload = mapUiProfileToUpdatePayload(merged)

    // Draft profile has no backend record yet, so it must be created first.
    if (isDraftProfileId(current.id)) {
      const created = await createProfileApi(payload)
      const mappedCreated = mapBackendProfileToUi(created)
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === current.id ? mappedCreated : p)),
        currentProfileId: mappedCreated.id,
      }))
      return mappedCreated.id
    }

    try {
      const updated = await updateProfileApi(current.id, payload)
      const mapped = mapBackendProfileToUi(updated)
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === current.id ? mapped : p)),
      }))
      return mapped.id
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // If record vanished (e.g. serverless ephemeral DB), recover by creating a new one.
      if (/404|not found|profile not found/i.test(message)) {
        const created = await createProfileApi(payload)
        const mappedCreated = mapBackendProfileToUi(created)
        setState((prev) => ({
          ...prev,
          profiles: prev.profiles.map((p) => (p.id === current.id ? mappedCreated : p)),
          currentProfileId: mappedCreated.id,
        }))
        return mappedCreated.id
      }
      throw err
    }
  }

  const addProfile = async (newProfile) => {
    const payload = mapUiProfileToCreatePayload(newProfile || EMPTY_PROFILE)
    const created = await createProfileApi(payload)
    const mapped = mapBackendProfileToUi(created)
    setState((prev) => {
      const base = prev.profiles.filter((p) => !String(p.id).startsWith('draft-'))
      return {
        ...prev,
        profiles: [...base, mapped],
        currentProfileId: mapped.id,
      }
    })
    return mapped.id
  }

  const deleteProfile = async (id) => {
    if (state.profiles.length <= 1) return false
    await deleteProfileApi(id)
    setState((prev) => {
      const remaining = prev.profiles.filter((p) => p.id !== id)
      return {
        ...prev,
        profiles: remaining.length > 0 ? remaining : [createDraftProfile(EMPTY_PROFILE)],
        currentProfileId: prev.currentProfileId === id
          ? (remaining[0]?.id || EMPTY_PROFILE.id)
          : prev.currentProfileId,
      }
    })
    return true
  }

  const hasProfile = profileHasRequiredFields(profile)

  return (
    <ProfileContext.Provider
      value={{
        profile,
        profiles: state.profiles,
        currentProfileId: state.currentProfileId,
        setCurrentProfile,
        updateProfile,
        addProfile,
        deleteProfile,
        loading: state.loading,
        error: state.error,
        refreshProfiles,
        hasProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}
