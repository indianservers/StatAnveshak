import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Trash2, Download, Upload } from 'lucide-react'
import { loadProjects, saveProject, deleteProject } from '../lib/storage'
import { useStore } from '../store/useStore'
import type { Project } from '../types'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newName, setNewName] = useState('')
  const { activeProject, setActiveProject, activeDataset } = useStore()

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  const createProject = async () => {
    if (!newName.trim()) return
    const p: Project = {
      id: `proj_${Date.now()}`,
      name: newName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      datasetIds: activeDataset ? [activeDataset.id] : [],
      notes: '',
    }
    await saveProject(p)
    setProjects((ps) => [...ps, p])
    setActiveProject(p)
    setNewName('')
  }

  const removeProject = async (id: string) => {
    await deleteProject(id)
    setProjects((ps) => ps.filter((p) => p.id !== id))
    if (activeProject?.id === id) setActiveProject(null)
  }

  const exportProject = (p: Project) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${p.name}.anveshak.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const p = JSON.parse(text) as Project
    await saveProject(p)
    setProjects((ps) => [...ps.filter((x) => x.id !== p.id), p])
    e.target.value = ''
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Projects</h1>
        <label className="flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <Upload size={12} /> Import
          <input type="file" accept=".json" className="sr-only" onChange={importProject} />
        </label>
      </div>

      {/* Create new */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 flex gap-3">
        <input
          type="text"
          placeholder="New project name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createProject()}
          className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        <button
          onClick={createProject}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-40" />
          <p>No projects yet. Create your first project above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer transition-all ${
                activeProject?.id === p.id
                  ? 'border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveProject(p)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <FolderOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.datasetIds.length} dataset(s) · Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {activeProject?.id === p.id && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Active</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); exportProject(p) }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Download size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeProject(p.id) }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
