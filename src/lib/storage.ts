import Dexie, { type Table } from 'dexie'
import type { Dataset, Project } from '../types'
import { storageFailureMessage } from './safeStorage'

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

async function withStorage<T>(kind: 'dataset' | 'project', work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    throw new Error(storageFailureMessage(error, kind))
  }
}

export const saveDataset = (ds: Dataset) => withStorage('dataset', () => db.datasets.put(ds))
export const loadDatasets = () => withStorage('dataset', () => db.datasets.toArray())
export const deleteDataset = (id: string) => withStorage('dataset', () => db.datasets.delete(id))
export const getDataset = (id: string) => withStorage('dataset', () => db.datasets.get(id))

export const saveProject = (p: Project) => withStorage('project', () => db.projects.put(p))
export const loadProjects = () => withStorage('project', () => db.projects.toArray())
export const deleteProject = (id: string) => withStorage('project', () => db.projects.delete(id))
export const getProject = (id: string) => withStorage('project', () => db.projects.get(id))
