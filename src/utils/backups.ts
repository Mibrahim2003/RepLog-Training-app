const BACKUP_STORAGE_KEY = 'replog:deleteBackups'
const MAX_BACKUPS = 25

type DeletionBackup = {
  id: string
  type: 'workout' | 'exercise' | 'set'
  createdAt: string
  payload: unknown
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function readBackups(): DeletionBackup[] {
  if (!hasWindow()) {
    return []
  }

  const raw = window.localStorage.getItem(BACKUP_STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as DeletionBackup[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDeletionBackup(type: DeletionBackup['type'], payload: unknown) {
  if (!hasWindow()) {
    return
  }

  const current = readBackups()
  const entry: DeletionBackup = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: new Date().toISOString(),
    payload,
  }

  const next = [entry, ...current].slice(0, MAX_BACKUPS)
  window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(next))
}
