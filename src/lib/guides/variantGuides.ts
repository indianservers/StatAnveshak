import { toolGuide } from './toolGuides'
import { makeGuide, type SpecificGuide } from './guideTypes'
import { getDistributionLesson } from '../distributionLessons'
import { getDistributionExperience } from '../distributionExperiences'
import { getDistributionLearnExtras } from '../distributionLearnExtras'
import type { Distribution } from '../distributions'
import { COMPUTING_MODULES } from '../computingModules'
import { HASH_METHODS, COLLISION_METHODS } from '../hashingLab'

const PREPARATION: Record<string, Record<string, [algorithm: string, caution: string, example: string]>> = {
  impute: {
    mean: ['Average observed finite target values and replace only missing cells with that mean.', 'Mean filling reduces observed variation and can shift correlations.', 'For 2,4,blank the replacement is 3.'],
    median: ['Sort finite target values and use the middle value or average of the two middle values.', 'Median filling is robust to extremes but still understates imputation uncertainty.', 'For 1,2,100,blank the replacement is 2.'],
    group: ['Compute observed means separately inside each selected group and fill missing target values with their group mean.', 'A group with no observed target values cannot supply a mean.', 'Fill a missing score using the mean of observed scores in its own class.'],
    constant: ['Replace only missing target values with the supplied finite constant.', 'A constant may encode an arbitrary value rather than an estimate; do not treat it as observed.', 'Use 0 only when zero is a substantively justified missing-value replacement.'],
  },
  outliers: {
    iqr: ['Calculate Q1 and Q3; flag x<Q1−threshold×IQR or x>Q3+threshold×IQR within the selected numeric column.', 'Asymmetric populations can have many legitimate upper-fence observations.', 'Use threshold 1.5, then compare the count with threshold 3.'],
    z: ['Compute sample mean and SD; flag |(x−mean)/SD| above the threshold.', 'Extreme observations can inflate the SD and obscure their own z scores.', 'Use threshold 3 to review observations more than three sample SDs from the mean.'],
    mad: ['Compute median and median absolute deviation; flag |0.67448975×(x−median)/MAD| above the threshold.', 'Zero MAD does not permit this standardized score; tied values can produce zero MAD.', 'Compare MAD with z-score flags after introducing one extreme observation.'],
  },
  scale: {
    z: ['Create (x−sample mean)/sample SD in the new column.', 'The sample SD must be positive; a z score does not imply the data are normal.', 'Values 10,20,30 produce z scores −1,0,1.'],
    minmax: ['Create (x−minimum)/(maximum−minimum) in the new column.', 'Constant columns cannot be normalized this way; future values can lie outside 0–1.', 'Values 10,20,30 produce 0,.5,1.'],
  },
  transform: {
    add: ['Create source + selected constant or second-column value for each row.', 'Adding a constant shifts location without changing spread when all rows use the same constant.', 'Add 273.15 to Celsius measurements.'],
    subtract: ['Create source − selected constant or second-column value.', 'Column order fixes the sign; this transform does not validate subject pairing.', 'Compute after minus before only for matched rows.'],
    multiply: ['Multiply each source value by the selected constant or second-column value.', 'Negative constants reverse order; multiplying by zero removes all variation.', 'Multiply meter measurements by 100 to create centimeters.'],
    divide: ['Divide each source value by the selected constant or second-column value.', 'Zero denominators yield undefined transformed values and must be reviewed as missing.', 'Divide distance by elapsed hours to derive a rate.'],
    log: ['Take the natural logarithm of each positive source value.', 'Nonpositive inputs have no finite real logarithm; no offset is silently added.', 'A value equal to e produces a transformed value of 1.'],
    sqrt: ['Take the square root of each nonnegative source value.', 'Negative inputs are outside the real square-root domain.', 'Values 0,4,9 become 0,2,3.'],
    square: ['Multiply each source value by itself.', 'Squaring loses the original sign and can magnify extreme values.', 'Values −2 and 2 both become 4.'],
  },
  dates: {
    year: ['Parse each timestamp and extract its UTC full year.', 'UTC year can differ from the local year near midnight on New Year’s Day.', 'Extract 2026 from an unambiguous 2026-07-01 UTC timestamp.'],
    month: ['Parse each timestamp and extract its UTC calendar month coded January=1 through December=12.', 'Month extraction does not preserve the year; compare cycles only when that is intended.', 'January and July UTC dates produce month values 1 and 7.'],
    weekday: ['Extract UTC weekday coded Sunday=0 through Saturday=6.', 'Local calendar weekday can differ from UTC weekday near midnight.', 'Compare weekday values for consecutive UTC dates.'],
    date: ['Convert valid timestamps into their UTC calendar-date representation.', 'Converting to a date discards time-of-day information.', 'Compare two timestamps on the same UTC date.'],
    days: ['Subtract the second parsed timestamp from the first and divide milliseconds by 86,400,000.', 'The signed elapsed duration can include fractional days; calendar daylight-saving rules are not applied.', 'Subtract enrollment timestamp from a follow-up timestamp.'],
  },
}
export function preparationGuide(feature: string, method: string) {
  const base = toolGuide(feature), variant = PREPARATION[feature]?.[method]
  return base && variant ? { ...base, title: `${base.title} · ${method}`, algorithm: [variant[0]], caution: variant[1], example: variant[2] } : undefined
}

export function distributionGuide(dist: Distribution): SpecificGuide {
  const l = getDistributionLesson(dist.id), e = getDistributionExperience(dist.id), limits = getDistributionLearnExtras(dist.id)
  return makeGuide(l.title, [l.description, dist.params.map(p => `${p.label}: ${p.min}–${p.max}; ${l.symbols.find(s => s.symbol === p.key)?.meaning ?? p.key}`).join('; ') || e.datasetHint, l.steps.map(s => `${s.title}: ${s.body}`).join(' | '), e.insights.join(' '), [...limits.assumptions, ...limits.misuse].join(' '), `${e.scenarioTitle}: ${e.scenarioDescription}`])
}
const COMPUTING: Record<string, [algorithm: string, read: string, caution: string, example: string]> = {
  cryptography: ['Rotate ASCII letter positions by the Caesar shift modulo 26. | Apply the inverse shift to decrypt; independently compute a SHA-256 digest with Web Crypto.', 'Caesar ciphertext is reversible with its shift; a SHA-256 digest is not ciphertext.', 'The Caesar demo is educational and insecure for protecting real messages.', 'Shift ABC by 3 to obtain DEF, then compare SHA-256 after changing one character.'],
  sorting: ['Compare adjacent values and swap out-of-order neighbors. | Repeat passes with shorter unsorted suffixes; show the first swaps.', 'The visible algorithm is bubble sort; comparison count reflects these nested passes.', 'This screen does not offer merge/quick/insertion execution despite their presence in the concept list.', 'Sort 3,1,2 and follow the adjacent swaps.'],
  searching: ['Linear search checks the original sequence from index 0. | Binary search first sorts a copy, then halves the remaining interval around its middle value.', 'Linear index belongs to original order; binary index belongs to the sorted copy.', 'Sorting the copy adds preprocessing cost; binary indices cannot identify the original row directly.', 'Find 13 in 8,3,13,1 and compare the original and sorted indices.'],
  hashing: ['Map each integer key to a home bucket with the selected hash function. | Resolve collisions with the selected chaining/probing rule.', 'Home bucket and final storage position can differ when collisions occur.', 'Bucket hashing is not encryption or a cryptographic integrity digest.', 'Use 12 and 22 with division hashing and table size 10.'],
  data_structures: ['Inspect the provided numeric sequence’s item count and endpoints. | Compare conceptual array, stack, queue, set, and map operations with their required ordering.', 'This screen displays teaching notes and sequence summaries.', 'Push/pop/enqueue/dequeue execution is not implemented on this notes screen.', 'For 2,4,6 compare array endpoints with the expected top of a conceptual stack.'],
  dynamic_programming: ['Define reusable subproblems, such as F(n)=F(n−1)+F(n−2). | Contrast storing each result once with recomputing overlapping subproblems.', 'The module is a teaching-notes screen, not an executed Fibonacci timing experiment.', 'The displayed item count is not a recursion count or memoization benchmark.', 'Work through F(0)=0, F(1)=1 and tabulate through F(5)=5 on paper.'],
  complexity: ['Relate input size to operation-count growth such as n or n². | Compare the executed linear/binary search and bubble-sort algorithms in their own modules.', 'Big-O describes asymptotic growth, not measured elapsed time on this notes screen.', 'Binary search’s O(log n) lookup assumes sorted input; building the sorted copy adds cost.', 'Compare doubling n under linear and quadratic operation-count models.'],
}
export function computingGuide(key: string) {
  const module = COMPUTING_MODULES.find(m => m.key === key), entry = COMPUTING[key]
  return module && entry ? makeGuide(module.title, [module.purpose, key === 'cryptography' ? 'Text and a Caesar shift from 1 to 25.' : key === 'hashing' ? 'Integer keys, table size, hash function, and collision rule.' : 'Comma-separated numeric sequence; target value for searching.', ...entry]) : undefined
}
export function hashingGuide(method: string, collision: string) {
  const hash = HASH_METHODS.find(m => m.id === method), rule = COLLISION_METHODS.find(m => m.id === collision)
  return hash && rule ? makeGuide(`${hash.label} · ${rule.label}`, ['Inspect bucket placement with the selected hash and collision algorithms.', 'Safe integer keys (negative keys are normalized to absolute values), table size 2–101, and universal parameters when selected.', `${hash.blurb} | ${rule.blurb}`, 'Home slot is the initial bucket; probe trace identifies visited slots and the final insertion position.', 'Open addressing can fail when probe cycles cannot reach an empty slot; chaining stores multiple keys in one bucket.', 'Insert 12,22,32 into 10 buckets and compare their home slots with their final positions.']) : undefined
}
