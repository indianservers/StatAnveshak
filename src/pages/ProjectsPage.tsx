import { useState } from 'react'
import { FolderOpen, Plus, Trash2, Download, Upload } from 'lucide-react'
import { saveProject, deleteProject } from '../lib/storage'
import { useStore } from '../store/useStore'
import type { Project } from '../types'
import { isProject } from '../lib/validation'
import { useToast } from '../components/ui/toastContext'
import { PageBack } from '../components/ui/PageBack'
import { EmptyState } from '../components/ui/AppStates'

export function ProjectsPage() {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { activeProject, setActiveProject, activeDataset, projects, addProject, removeProject, updateProject } = useStore()
  const { notify } = useToast()

  const createProject = async () => {
    const name = newName.trim()
    if (!name) {
      setError('Enter a project name to create a project.')
      return
    }
    if (creating) return
    if (projects.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setError(`A project named "${name}" already exists.`)
      return
    }
    setCreating(true)
    const p: Project = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      datasetIds: activeDataset ? [activeDataset.id] : [],
      notes: '',
    }
    try {
      await saveProject(p)
      addProject(p)
      setError(null)
      setNewName('')
      notify(`Project created: ${p.name}`, 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the project in browser storage.')
      notify('Project creation failed.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteProject(id)
      removeProject(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this project.')
    }
  }

  const exportProject = (p: Project) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${p.name}.anveshak.json`
    a.click()
    URL.revokeObjectURL(url)
    notify(`Export complete: ${p.name}.anveshak.json`, 'success')
  }

  const importProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      if (!isProject(parsed)) throw new Error('That file is not a valid StatAnveshak project export.')
      await saveProject(parsed)
      addProject(parsed)
      setError(null)
      notify(`Imported project: ${parsed.name}`, 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project import failed.')
    } finally {
      e.target.value = ''
    }
  }

  const updateNotes = async (project: Project, notes: string) => {
    const next = { ...project, notes, updatedAt: Date.now() }
    try {
      await saveProject(next)
      updateProject(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save project notes.')
    }
  }

  const attachActiveDataset = async (project: Project) => {
    if (!activeDataset || project.datasetIds.includes(activeDataset.id)) return
    const next = { ...project, datasetIds: [...project.datasetIds, activeDataset.id], updatedAt: Date.now() }
    try {
      await saveProject(next)
      updateProject(next)
      setActiveProject(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach the dataset to this project.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <PageBack fallback="/" label="Back" />
          <h1 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">Projects</h1>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
          <Upload size={12} /> Import
          <input type="file" accept=".json" className="sr-only" onChange={importProject} />
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="text"
          placeholder="New project name…"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && void createProject()}
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={() => void createProject()}
          disabled={creating}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          <Plus size={14} /> {creating ? 'Creating…' : 'Create Project'}
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No project selected."
          description="No projects yet. Create your first project above."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`cursor-pointer rounded-xl border bg-white p-4 transition-all dark:bg-slate-800 ${
                activeProject?.id === p.id
                  ? 'border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
              }`}
              onClick={() => setActiveProject(p)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FolderOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.datasetIds.length} dataset(s) · Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {activeProject?.id === p.id && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">Active</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); exportProject(p) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                  <Download size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); void remove(p.id) }} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                  <Trash2 size={14} />
                </button>
              </div>
              {activeProject?.id === p.id && (
                <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                  <textarea
                    value={p.notes}
                    onChange={(event) => void updateNotes(p, event.target.value)}
                    placeholder="Project notes, decisions, or analysis questions"
                    className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    disabled={!activeDataset || p.datasetIds.includes(activeDataset.id)}
                    onClick={() => void attachActiveDataset(p)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {activeDataset && p.datasetIds.includes(activeDataset.id) ? 'Active dataset attached' : 'Attach active dataset'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
