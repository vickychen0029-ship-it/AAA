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

export function ProfileProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
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
      const mapped = (result.items || []).map(mapBackendProfileToUi)
      if (mapped.length === 0) {
        setState({
          profiles: [createDraftProfile(EMPTY_PROFILE)],
          currentProfileId: EMPTY_PROFILE.id,
          loading: false,
          error: '',
        })
        return
      }

      setState((prev) => {
        const hasCurrent = mapped.some((p) => p.id === prev.currentProfileId)
        return {
          profiles: mapped,
          currentProfileId: hasCurrent ? prev.currentProfileId : mapped[0].id,
          loading: false,
          error: '',
        }
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '加载档案失败',
      }))
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  const profile = useMemo(
    () => state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0] || createDraftProfile(EMPTY_PROFILE),
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
