import { create } from 'zustand'
import { persistDraftToSession } from '../utils/drafts'
import type { EditorTarget, WorkoutDraft, Unit } from '../types'
import { createBlankSet, makeId, renumberSets, toCanonicalKg } from '../utils/format'

interface EditorState {
  target: EditorTarget | null
  activeDraft: WorkoutDraft | null
  preferredUnit: Unit
  uid: string | null

  loadDraft: (uid: string, target: EditorTarget, draft: WorkoutDraft, preferredUnit: Unit) => void
  unloadDraft: () => void
  replaceDraft: (draft: WorkoutDraft) => void
  updateDraftMeta: (patch: Partial<Pick<WorkoutDraft, 'workoutDate'>>) => void
  toggleMuscleGroup: (muscleGroupId: string) => void
  addExerciseBlock: (exerciseId: string, name: string, primaryMuscleGroupId: string, duplicateWarning: boolean) => void
  updateExerciseNote: (workoutExerciseId: string, note: string) => void
  updateSetField: (workoutExerciseId: string, setId: string, field: 'weightValue' | 'reps' | 'note', value: string) => void
  addSet: (workoutExerciseId: string) => void
  duplicateLastSet: (workoutExerciseId: string) => void
  deleteSet: (workoutExerciseId: string, setId: string) => void
  deleteExerciseBlock: (workoutExerciseId: string) => void
}



export const useEditorStore = create<EditorState>((set, get) => {
  const syncDraft = (draft: WorkoutDraft) => {
    const { uid, target } = get()
    if (uid && target) {
      persistDraftToSession(uid, target, draft)
    }
  }

  return {
    target: null,
    activeDraft: null,
    preferredUnit: 'lb',
    uid: null,

    loadDraft: (uid, target, draft, preferredUnit) => {
      set({ uid, target, activeDraft: draft, preferredUnit })
      persistDraftToSession(uid, target, draft)
    },

    unloadDraft: () => set({ uid: null, target: null, activeDraft: null }),

    replaceDraft: (draft) => {
      set({ activeDraft: draft })
      syncDraft(draft)
    },

    updateDraftMeta: (patch) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = { ...state.activeDraft, ...patch }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    toggleMuscleGroup: (muscleGroupId) => {
      set((state) => {
        if (!state.activeDraft) return state
        const alreadySelected = state.activeDraft.muscleGroupIds.includes(muscleGroupId)
        const next = {
          ...state.activeDraft,
          muscleGroupIds: alreadySelected
            ? state.activeDraft.muscleGroupIds.filter((id) => id !== muscleGroupId)
            : [...state.activeDraft.muscleGroupIds, muscleGroupId],
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    addExerciseBlock: (exerciseId, name, primaryMuscleGroupId, duplicateWarning) => {
      set((state) => {
        if (!state.activeDraft) return state
        
        const nextBlocks: WorkoutDraft['exerciseBlocks'] = [
          ...state.activeDraft.exerciseBlocks,
          {
            workoutExerciseId: `block-${makeId('exercise')}`,
            exerciseId,
            name,
            note: '',
            isDuplicateInstance: duplicateWarning,
            duplicateWarning,
            sets: [createBlankSet(1, state.preferredUnit)],
          },
        ]

        // Build mapping on the fly for derivation
        const primaryMap = new Map<string, string>()
        primaryMap.set(exerciseId, primaryMuscleGroupId)
        // Also map existing blocks (simplified logic: just append new muscle group if needed)
        // We will just use the old method: derive from blocks but using a map
        // Actually, it's easier to just append if not there, or recreate map.
        // Let's just assume we add primaryMuscleGroupId if not present.
        const currentMuscles = state.activeDraft.muscleGroupIds
        const nextMuscles = currentMuscles.includes(primaryMuscleGroupId) 
          ? currentMuscles 
          : [...currentMuscles, primaryMuscleGroupId]

        const next = {
          ...state.activeDraft,
          muscleGroupIds: nextMuscles,
          exerciseBlocks: nextBlocks,
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    updateExerciseNote: (workoutExerciseId, note) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = {
          ...state.activeDraft,
          exerciseBlocks: state.activeDraft.exerciseBlocks.map((block) =>
            block.workoutExerciseId === workoutExerciseId ? { ...block, note } : block
          ),
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    updateSetField: (workoutExerciseId, setId, field, value) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = {
          ...state.activeDraft,
          exerciseBlocks: state.activeDraft.exerciseBlocks.map((block) => {
            if (block.workoutExerciseId !== workoutExerciseId) return block

            return {
              ...block,
              sets: block.sets.map((setRow) => {
                if (setRow.id !== setId) return setRow

                if (field === 'note') {
                  return { ...setRow, note: value }
                }

                if (field === 'reps') {
                  return { ...setRow, reps: value === '' ? null : Number(value) }
                }

                return {
                  ...setRow,
                  weightValue: value === '' ? null : Number(value),
                  weightUnit: state.preferredUnit,
                  canonicalKg: value === '' ? null : toCanonicalKg(Number(value), state.preferredUnit),
                }
              }),
            }
          }),
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    addSet: (workoutExerciseId) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = {
          ...state.activeDraft,
          exerciseBlocks: state.activeDraft.exerciseBlocks.map((block) =>
            block.workoutExerciseId === workoutExerciseId
              ? {
                  ...block,
                  sets: [...block.sets, createBlankSet(block.sets.length + 1, state.preferredUnit)],
                }
              : block
          ),
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    duplicateLastSet: (workoutExerciseId) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = {
          ...state.activeDraft,
          exerciseBlocks: state.activeDraft.exerciseBlocks.map((block) => {
            if (block.workoutExerciseId !== workoutExerciseId) return block

            const lastSet = block.sets[block.sets.length - 1]
            const duplicated = lastSet
              ? {
                  ...lastSet,
                  id: `set-${makeId('copy')}`,
                  orderIndex: block.sets.length + 1,
                  hasPR: false,
                }
              : createBlankSet(1, state.preferredUnit)

            return {
              ...block,
              sets: [...block.sets, duplicated],
            }
          }),
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    deleteSet: (workoutExerciseId, setId) => {
      set((state) => {
        if (!state.activeDraft) return state
        const next = {
          ...state.activeDraft,
          exerciseBlocks: state.activeDraft.exerciseBlocks.map((block) => {
            if (block.workoutExerciseId !== workoutExerciseId) return block

            const nextSets = block.sets.filter((setRow) => setRow.id !== setId)
            return {
              ...block,
              sets: nextSets.length > 0
                ? renumberSets(nextSets).map((setRow) => ({ ...setRow, hasPR: false }))
                : [createBlankSet(1, state.preferredUnit)],
            }
          }),
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },

    deleteExerciseBlock: (workoutExerciseId) => {
      set((state) => {
        if (!state.activeDraft) return state
        const nextBlocks = state.activeDraft.exerciseBlocks.filter(
          (block) => block.workoutExerciseId !== workoutExerciseId
        )

        const next = {
          ...state.activeDraft,
          // Not recalculating muscle groups on delete since it's hard without the primary map, 
          // keeping it simple or we can just leave the muscle group selected. Let's just leave it.
          exerciseBlocks: nextBlocks,
        }
        syncDraft(next)
        return { activeDraft: next }
      })
    },
  }
})
