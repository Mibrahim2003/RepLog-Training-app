import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell, EmptyState } from '../components'
import { useAppContext } from '../context/AppContext'

export function TemplatesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { templates, muscleGroups, applyTemplateToNewDraft, saveTemplate, ensureNewDraft } =
    useAppContext()
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftMuscleIds, setDraftMuscleIds] = useState<string[]>([])

  const pickerMode = searchParams.get('pick') === 'new'

  const editingTemplate = useMemo(
    () => templates.find((template) => template.id === editingTemplateId) ?? null,
    [editingTemplateId, templates],
  )

  const handleUseTemplate = (templateId: string) => {
    void (async () => {
      ensureNewDraft()
      await applyTemplateToNewDraft(templateId)
      navigate(pickerMode ? '/workouts/new' : '/workouts/new?step=log')
    })()
  }

  const startEditingTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    setEditingTemplateId(template.id)
    setDraftName(template.name)
    setDraftMuscleIds(template.muscleGroupIds)
  }

  const handleSaveTemplate = () => {
    void (async () => {
      if (!editingTemplate) {
        return
      }

      await saveTemplate({
        ...editingTemplate,
        name: draftName || editingTemplate.name,
        muscleGroupIds: draftMuscleIds,
      })
      setEditingTemplateId(null)
    })()
  }

  return (
    <AppShell activeTab="plans">
      <section className="page-stack">
        <div className="section-heading">
          <h1>Templates</h1>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            title="No templates yet."
            message="Save a template after a workout or start fresh without one."
            actionLabel="Start Without Template"
            actionTo="/workouts/new"
          />
        ) : (
          <div className="card-stack">
            {templates.map((template) => (
              <article key={template.id} className="template-card brutal-card">
                <div className="template-card__top">
                  <div>
                    <p className="eyebrow">Template</p>
                    <h2>{template.name}</h2>
                  </div>
                  <div className="template-card__meta">
                    <span>{template.exerciseCount} exercises</span>
                    {template.lastUsedAt ? <span>Last used {template.lastUsedAt}</span> : null}
                  </div>
                </div>

                <div className="tag-row">
                  {template.muscleGroupIds.map((muscleId) => {
                    const name = muscleGroups.find((group) => group.id === muscleId)?.name
                    return name ? (
                      <span key={muscleId} className="tag">
                        [{name}]
                      </span>
                    ) : null
                  })}
                </div>

                <div className="template-card__actions">
                  <button
                    type="button"
                    className="brutal-button brutal-button--primary"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use Template
                  </button>
                  <button
                    type="button"
                    className="brutal-button brutal-button--secondary"
                    onClick={() => startEditingTemplate(template.id)}
                  >
                    Edit
                  </button>
                </div>

                {editingTemplateId === template.id ? (
                  <div className="template-editor">
                    <div className="setup-field-row">
                      <label className="field-label" htmlFor={`template-name-${template.id}`}>
                        Template Name
                      </label>
                      <input
                        id={`template-name-${template.id}`}
                        className="brutal-input"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                      />
                    </div>

                    <div className="tag-row">
                      {muscleGroups.map((group) => {
                        const selected = draftMuscleIds.includes(group.id)
                        return (
                          <button
                            key={group.id}
                            type="button"
                            className={`tag tag--button${selected ? ' tag--selected' : ''}`}
                            onClick={() =>
                              setDraftMuscleIds((previous) =>
                                previous.includes(group.id)
                                  ? previous.filter((item) => item !== group.id)
                                  : [...previous, group.id],
                              )
                            }
                          >
                            [{group.name}]
                          </button>
                        )
                      })}
                    </div>

                    <div className="template-card__actions">
                      <button
                        type="button"
                        className="brutal-button brutal-button--primary"
                        onClick={handleSaveTemplate}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="brutal-button brutal-button--secondary"
                        onClick={() => setEditingTemplateId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
