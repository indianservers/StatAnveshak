import Dexie, { type Table } from 'dexie'
import type { Dataset, Project } from '../types'

class AnveshakDB extends Dexie {
  datasets!: Table<Dataset>
  projects!: Table<Project>

  constructor() {
    super('AnveshakDB')
    this.version(1).stores({
      datasets: 'id, name, createdAt',
      projects: 'id, name, createdAt, updatedAt',
    })
  }
}

export const db = new AnveshakDB()

export const saveDataset = (ds: Dataset) => db.datasets.put(ds)
export const loadDatasets = () => db.datasets.toArray()
export const deleteDataset = (id: string) => db.datasets.delete(id)
export const getDataset = (id: string) => db.datasets.get(id)

export const saveProject = (p: Project) => db.projects.put(p)
export const loadProjects = () => db.projects.toArray()
export const deleteProject = (id: string) => db.projects.delete(id)
export const getProject = (id: string) => db.projects.get(id)
