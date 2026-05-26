import type { DraftReference, EditorTarget, StoredDraftPayload, WorkoutDraft } from '../types'
import { formatLongDate } from './format'

const DRAFT_STORAGE_PREFIX = 'replog:draft'

function hasWindow() {
  return typeof window !== 'undefined'
}

export function draftStorageKey(uid: string, target: EditorTarget) {
  return target.kind === 'new'
    ? `${DRAFT_STORAGE_PREFIX}:${uid}:new`
    : `${DRAFT_STORAGE_PREFIX}:${uid}:edit:${target.workoutId}`
}

export function draftRouteForPayload(payload: StoredDraftPayload) {
  if (payload.target.kind === 'edit') {
    return `/workouts/${payload.target.workoutId}/edit`
  }

  return payload.draft.exerciseBlocks.length > 0 ? '/workouts/new?step=log' : '/workouts/new'
}

export function persistDraftToSession(uid: string, target: EditorTarget, draft: WorkoutDraft) {
  if (!hasWindow()) {
    return
  }

  const payload: StoredDraftPayload = {
    target,
    draft,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(draftStorageKey(uid, target), JSON.stringify(payload))
}

export function clearDraftFromSession(uid: string, target: EditorTarget) {
  if (!hasWindow()) {
    return
  }

  window.localStorage.removeItem(draftStorageKey(uid, target))
}

export function clearAllDraftsForUser(uid: string) {
  if (!hasWindow()) {
    return
  }

  const prefix = `${DRAFT_STORAGE_PREFIX}:${uid}:`
  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(prefix))
  for (const key of keys) {
    window.localStorage.removeItem(key)
  }
}

export function readDraftPayload(key: string) {
  if (!hasWindow()) {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredDraftPayload
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function labelForDraft(payload: StoredDraftPayload) {
  if (payload.target.kind === 'edit') {
    return `Resume edit from ${formatLongDate(payload.draft.workoutDate)}`
  }

  return payload.draft.exerciseBlocks.length > 0
    ? `Resume workout from ${formatLongDate(payload.draft.workoutDate)}`
    : `Resume setup from ${formatLongDate(payload.draft.workoutDate)}`
}

export function listDraftReferences(uid: string): DraftReference[] {
  if (!hasWindow()) {
    return []
  }

  const prefix = `${DRAFT_STORAGE_PREFIX}:${uid}:`
  const ttlMs = 48 * 60 * 60 * 1000 // 48 hours

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      const payload = readDraftPayload(key)
      if (!payload) {
        return null
      }

      const isStale = Date.now() - new Date(payload.updatedAt).getTime() > ttlMs
      if (isStale) {
        window.localStorage.removeItem(key)
        return null
      }

      return {
        key,
        target: payload.target,
        route: draftRouteForPayload(payload),
        label: labelForDraft(payload),
        updatedAt: payload.updatedAt,
      } satisfies DraftReference
    })
    .filter((value): value is DraftReference => value !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function discardStoredDraft(reference: DraftReference) {
  if (!hasWindow()) {
    return
  }

  window.localStorage.removeItem(reference.key)
}
