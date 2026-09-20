import { describe, expect, it } from 'vitest'
import { CURRICULUM_AREAS, curriculumPath, curriculumTopicById } from './curriculum'
import { LEARNING_PATH_FLOW } from './learningPaths'
import { getLab, getStudio } from './statisticsStudios'

describe('curriculum map', () => {
  it('every topic has a real href and optional studio/lab that exists', () => {
    expect(CURRICULUM_AREAS.length).toBeGreaterThanOrEqual(5)
    for (const area of CURRICULUM_AREAS) {
      expect(curriculumPath(area.id)).toBe(`/learn/curriculum/${area.id}`)
      for (const topic of area.topics) {
        expect(topic.href.length).toBeGreaterThan(1)
        if (topic.studioSlug && topic.labSlug) {
          expect(getLab(topic.studioSlug, topic.labSlug)).toBeTruthy()
        } else if (topic.studioSlug) {
          expect(getStudio(topic.studioSlug)).toBeTruthy()
        }
        expect(curriculumTopicById(topic.id)?.topic.id).toBe(topic.id)
      }
    }
  })
})

describe('learning paths', () => {
  it('each path is a sequence of existing routes', () => {
    expect(LEARNING_PATH_FLOW.map((path) => path.id)).toEqual([
      'beginner',
      'data',
      'inference',
      'regression',
      'ml',
      'research',
    ])
    for (const path of LEARNING_PATH_FLOW) {
      expect(path.nodes.length).toBeGreaterThanOrEqual(5)
      for (const node of path.nodes) {
        expect(node.href.startsWith('/')).toBe(true)
      }
    }
  })
})
