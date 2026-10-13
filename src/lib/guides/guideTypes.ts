export type SpecificGuide = { title: string; purpose: string; inputs: string; algorithm: string[]; interpretation: string; caution: string; example: string }
export type GuideEntry = readonly [purpose: string, inputs: string, algorithm: string, interpretation: string, caution: string, example: string]
export function makeGuide(title: string, entry: GuideEntry): SpecificGuide {
  const [purpose, inputs, algorithm, interpretation, caution, example] = entry
  return { title, purpose, inputs, algorithm: algorithm.split(' | '), interpretation, caution, example }
}
