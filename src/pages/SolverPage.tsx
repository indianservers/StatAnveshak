import { useMemo, useState } from 'react'
import { BookOpenCheck, Calculator, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Grid3X3, RotateCcw, Sigma } from 'lucide-react'

type SolverMode =
  | 'pearson'
  | 'concurrent'
  | 'trend'
  | 'regression-yx'
  | 'regression-coeff-yx'
  | 'regression-both'
  | 'spearman-rank'
  | 'correlation-summary'
  | 'sd-raw'
  | 'sd-frequency'
  | 'sd-shortcut-sums'
  | 'sd-class-frequency'
  | 'sd-less-than-cumulative'
  | 'sd-more-than-cumulative'
  | 'index-simple-aggregative'
  | 'index-weighted-aggregative'
  | 'index-simple-relative'
  | 'index-weighted-relative'
  | 'index-laspeyres'
  | 'index-paasche'
  | 'index-fisher'
  | 'index-edgeworth-marshall'
  | 'quantity-index-fisher'
  | 'mode-grouped'
  | 'correlation-from-regression-coeff'
  | 'geometric-mean-frequency'

type SolverRow = { x: string; y: string; z: string; q: string }

type Preset = {
  id: string
  title: string
  mode: SolverMode
  labels: [string, string, string?, string?]
  rows: Array<Array<number | string>>
}

function pairRows(x: number[], y: number[]) {
  return x.map((value, index) => [value, y[index]])
}

function tripleRows(x: number[], y: number[], z: number[]) {
  return x.map((value, index) => [value, y[index], z[index]])
}

function quadRows(x: number[], y: number[], z: number[], q: number[]) {
  return x.map((value, index) => [value, y[index], z[index], q[index]])
}

const presets: Preset[] = [
  { id: 'student-marks', title: 'Student marks correlation', mode: 'pearson', labels: ['Marks (Maths)', 'Marks (Statistics)'], rows: pairRows([15, 18, 21, 24, 27, 30, 36, 39, 42, 48], [25, 25, 27, 27, 31, 33, 35, 41, 41, 45]) },
  { id: 'sales-expenses-firms', title: 'Sales and expenses of 10 firms', mode: 'pearson', labels: ['Sales', 'Expenses'], rows: pairRows([50, 50, 55, 60, 65, 65, 65, 60, 60, 50], [11, 13, 14, 16, 16, 15, 15, 14, 13, 13]) },
  { id: 'price-demand', title: 'Price and demand correlation', mode: 'pearson', labels: ['Price', 'Demand'], rows: pairRows([22, 24, 26, 28, 30, 32, 34, 36, 38, 40], [60, 58, 58, 50, 48, 48, 48, 42, 36, 32]) },
  { id: 'pearson-set-three', title: 'Karl Pearson correlation set 3', mode: 'pearson', labels: ['X', 'Y'], rows: pairRows([6, 8, 12, 15, 18, 20, 24, 28, 31], [10, 12, 15, 15, 18, 25, 22, 26, 28]) },
  { id: 'perfect-linear-correlation', title: 'Karl Pearson formula linear data', mode: 'pearson', labels: ['X', 'Y'], rows: pairRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]) },
  { id: 'age-sick-days', title: 'Age and sick days correlation', mode: 'pearson', labels: ['Age', 'Sick Days'], rows: pairRows([28, 32, 38, 42, 46, 52, 54, 57, 58, 63], [0, 1, 3, 4, 2, 5, 4, 6, 7, 8]) },
  { id: 'correlation-set-six', title: 'Correlation set 6', mode: 'pearson', labels: ['X', 'Y'], rows: pairRows([35, 40, 42, 45, 52, 55, 60, 65], [20, 28, 32, 40, 45, 48, 50, 55]) },
  { id: 'correlation-set-seven', title: 'Correlation set 7', mode: 'pearson', labels: ['X', 'Y'], rows: pairRows([42, 44, 58, 55, 89, 98, 66], [56, 49, 53, 58, 65, 76, 58]) },
  { id: 'husband-wife-age', title: 'Husband and wife age correlation', mode: 'pearson', labels: ['Age of husband', 'Age of wife'], rows: pairRows([20, 30, 40, 50, 60, 70, 80], [14, 25, 30, 32, 40, 45, 65]) },
  { id: 'fertilizer-production', title: 'Fertilizer and production correlation', mode: 'pearson', labels: ['Fertilizer used', 'Production'], rows: pairRows([15, 18, 20, 24, 30, 35, 40, 160], [85, 93, 95, 105, 120, 130, 150, 160]) },
  { id: 'correlation-probable-error', title: 'Correlation with probable error', mode: 'pearson', labels: ['X', 'Y'], rows: pairRows([7, 6, 5, 4, 3, 2, 1], [18, 16, 14, 12, 10, 6, 8]) },
  { id: 'summary-correlation-15', title: 'Correlation from summarized data', mode: 'correlation-summary', labels: ['sum dx^2', 'sum dy^2', 'sum dxdy', 'N'], rows: [[136, 138, 122, 15]] },
  { id: 'summary-correlation-10', title: 'Correlation from summary values', mode: 'correlation-summary', labels: ['sum dx^2', 'sum dy^2', 'sum dxdy', 'N'], rows: [[28, 96, 42, 10]] },
  { id: 'advertising-sales', title: 'Advertising expenses and sales', mode: 'pearson', labels: ["Advertising expenses (Rs. '000)", 'Sales (Rs. lakhs)'], rows: pairRows([39, 65, 62, 90, 82, 75, 25, 98, 36, 78], [47, 53, 58, 86, 62, 68, 60, 91, 51, 84]) },
  { id: 'father-son-height', title: 'Father and son height correlation', mode: 'pearson', labels: ['Height (F)', 'Height (S)'], rows: pairRows([65, 66, 57, 67, 68, 69, 70, 72], [67, 56, 65, 68, 72, 72, 69, 71]) },
  { id: 'price-supply', title: 'Price and supply correlation', mode: 'pearson', labels: ['Price', 'Supply'], rows: pairRows([20, 40, 60, 80, 100, 120, 140], [400, 200, 500, 1000, 400, 1100, 1200]) },
  { id: 'sugar-production-trend', title: 'Sugar factory production trend', mode: 'trend', labels: ['Year', 'Production'], rows: pairRows([1999, 2000, 2001, 2002, 2003, 2004, 2005], [77, 88, 94, 85, 91, 98, 90]) },
  { id: 'supply-demand-concurrent', title: 'Supply and demand concurrent deviation', mode: 'concurrent', labels: ['Supply', 'Demand'], rows: pairRows([125, 160, 164, 174, 155, 170, 165, 162, 172, 175], [115, 125, 192, 190, 165, 174, 124, 127, 152, 169]) },
  { id: 'rank-correlation', title: 'Spearman rank correlation', mode: 'spearman-rank', labels: ['X', 'Y'], rows: pairRows([415, 434, 420, 430, 424, 428], [330, 332, 328, 331, 327, 325]) },
  { id: 'beauty-competition-ranks', title: 'Beauty competition rank correlation', mode: 'spearman-rank', labels: ['Judge X rank', 'Judge Y rank'], rows: pairRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [12, 9, 6, 10, 3, 5, 4, 7, 8, 2, 11, 1]) },
  { id: 'accountancy-statistics-ranks', title: 'Accountancy and Statistics ranks', mode: 'spearman-rank', labels: ['Accountancy rank', 'Statistics rank'], rows: pairRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 3, 5, 6, 7, 4, 8, 10, 9, 2]) },
  { id: 'rank-correlation-r1-r2', title: 'R1 and R2 rank correlation', mode: 'spearman-rank', labels: ['R1', 'R2'], rows: pairRows([5, 6, 8, 10, 9, 1, 2, 4, 3, 7], [8, 7, 5, 6, 3, 2, 1, 4, 10, 9]) },
  { id: 'two-regression-equations', title: 'Two regression equations from paired data', mode: 'regression-both', labels: ['X', 'Y'], rows: pairRows([1, 5, 3, 2, 1, 2, 7, 3], [6, 1, 0, 0, 1, 2, 1, 5]) },
  { id: 'sd-raw', title: 'Standard deviation raw data', mode: 'sd-raw', labels: ['Value', ''], rows: [25, 50, 45, 30, 70, 42, 36, 48, 34, 60].map((x) => [x]) },
  { id: 'sd-shortcut-sums', title: 'Standard deviation from sums', mode: 'sd-shortcut-sums', labels: ['sum X', 'sum X^2', 'N'], rows: [[235, 6750, 10], [250, 6840, 10]] },
  { id: 'sd-frequency-size', title: 'Standard deviation frequency data', mode: 'sd-frequency', labels: ['Size', 'Frequency'], rows: pairRows([4, 5, 6, 7, 8, 9, 10], [6, 12, 15, 28, 20, 14, 5]) },
  { id: 'sd-value-frequency', title: 'Mean and SD for value-frequency data', mode: 'sd-frequency', labels: ['Value', 'Frequency'], rows: pairRows([140, 145, 150, 155, 160, 165, 170, 175], [1, 4, 15, 30, 36, 24, 8, 2]) },
  { id: 'sd-class-marks', title: 'Mean and SD for grouped marks', mode: 'sd-class-frequency', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([0, 4, 8, 12], [4, 8, 12, 16], [4, 8, 2, 1]) },
  { id: 'sd-class-age', title: 'SD for grouped age distribution', mode: 'sd-class-frequency', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([50, 45, 40, 35, 30, 25], [55, 50, 45, 40, 35, 30], [22, 29, 31, 47, 51, 70]) },
  { id: 'sd-less-than-height', title: 'SD from less-than cumulative data', mode: 'sd-less-than-cumulative', labels: ['Less than upper', 'Cumulative frequency'], rows: pairRows([62.5, 65.5, 68.5, 71.5, 74.5], [5, 23, 65, 92, 100]) },
  { id: 'sd-more-than-marks', title: 'Mean and SD from more-than cumulative data', mode: 'sd-more-than-cumulative', labels: ['More than lower', 'Cumulative frequency'], rows: pairRows([20, 40, 80, 100, 120], [50, 47, 41, 21, 9]) },
  { id: 'sd-coefficient-class', title: 'SD and coefficient for class data', mode: 'sd-class-frequency', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([10, 20, 30, 40, 50], [19, 29, 39, 49, 59], [4, 2, 6, 3, 5]) },
  { id: 'simple-aggregative-index', title: 'Simple aggregative price index', mode: 'index-simple-aggregative', labels: ['Base Price', 'Current Price'], rows: pairRows([39, 48, 23, 29, 31], [58, 69, 37, 44, 47]) },
  { id: 'weighted-aggregative-index', title: 'Weighted aggregative price index', mode: 'index-weighted-aggregative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows([32, 25, 90, 120, 35], [50, 25, 100, 140, 40], [8, 6, 7, 3, 5]) },
  { id: 'price-relative-index', title: 'Simple and weighted average of price relatives', mode: 'index-weighted-relative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows([4.5, 3.2, 4.5, 1.8], [2, 2.5, 3, 1], [5, 7, 6, 2]) },
  { id: 'laspeyres-index', title: "Laspeyres' price index", mode: 'index-laspeyres', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([2, 5, 4, 2], [4, 6, 5, 2], [8, 10, 14, 19], [6, 5, 10, 13]) },
  { id: 'fisher-index', title: "Laspeyres, Paasche and Fisher index", mode: 'index-fisher', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([9.3, 6.4, 5.1], [4.5, 3.7, 2.7], [100, 11, 5], [90, 10, 3]) },
  { id: 'edgeworth-marshall', title: "Edgeworth-Marshall and Fisher's ideal index", mode: 'index-edgeworth-marshall', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([10, 7, 5, 16], [12, 5, 9, 14], [12, 15, 24, 5], [15, 20, 20, 5]) },
  { id: 'fisher-quantity-index', title: 'Fisher ideal quantity index', mode: 'quantity-index-fisher', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([5, 8, 6], [4, 7, 5], [10, 6, 3], [12, 7, 4]) },
  { id: 'grouped-mode', title: 'Mode for grouped data', mode: 'mode-grouped', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([0, 10, 20, 30, 40, 50, 60], [10, 20, 30, 40, 50, 60, 70], [4, 13, 21, 44, 33, 22, 7]) },
  { id: 'correlation-regression-coeff', title: 'Correlation from regression coefficients', mode: 'correlation-from-regression-coeff', labels: ['bxy', 'byx'], rows: [[0.30, 3.25]] },
  { id: 'geometric-mean-frequency', title: 'Geometric mean with frequency', mode: 'geometric-mean-frequency', labels: ['X', 'Frequency'], rows: pairRows([10, 20, 30, 40, 50, 60], [12, 15, 25, 10, 6, 2]) },
  { id: 'sd-raw-extra-1', title: 'Raw SD practice: daily output', mode: 'sd-raw', labels: ['Value', ''], rows: [18, 22, 25, 20, 28, 31, 24, 27].map((x) => [x]) },
  { id: 'sd-frequency-wages', title: 'Frequency SD practice: wages', mode: 'sd-frequency', labels: ['Wage', 'Frequency'], rows: pairRows([100, 120, 140, 160, 180, 200], [4, 8, 15, 18, 10, 5]) },
  { id: 'sd-class-test-scores', title: 'Grouped SD practice: test scores', mode: 'sd-class-frequency', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([0, 10, 20, 30, 40, 50], [10, 20, 30, 40, 50, 60], [3, 7, 12, 18, 9, 4]) },
  { id: 'sd-less-than-income', title: 'Less-than cumulative SD practice', mode: 'sd-less-than-cumulative', labels: ['Less than upper', 'Cumulative frequency'], rows: pairRows([10, 20, 30, 40, 50], [6, 18, 36, 47, 50]) },
  { id: 'sd-more-than-income', title: 'More-than cumulative SD practice', mode: 'sd-more-than-cumulative', labels: ['More than lower', 'Cumulative frequency'], rows: pairRows([0, 10, 20, 30, 40], [60, 54, 40, 22, 8]) },
  { id: 'geometric-mean-sales', title: 'Geometric mean practice: sales relatives', mode: 'geometric-mean-frequency', labels: ['Relative', 'Frequency'], rows: pairRows([80, 90, 100, 110, 120], [3, 7, 12, 9, 4]) },
  { id: 'mode-grouped-extra', title: 'Grouped mode practice: income classes', mode: 'mode-grouped', labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows([100, 200, 300, 400, 500], [200, 300, 400, 500, 600], [8, 19, 31, 22, 10]) },
  { id: 'sd-shortcut-extra', title: 'Shortcut SD practice: two variables', mode: 'sd-shortcut-sums', labels: ['sum X', 'sum X^2', 'N'], rows: [[420, 18200, 12], [360, 11240, 10]] },
  { id: 'index-simple-grocery', title: 'Simple aggregative index: groceries', mode: 'index-simple-aggregative', labels: ['Base Price', 'Current Price'], rows: pairRows([12, 18, 25, 30, 45], [15, 21, 28, 36, 54]) },
  { id: 'index-weighted-food', title: 'Weighted aggregative index: food basket', mode: 'index-weighted-aggregative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows([20, 35, 40, 55], [24, 42, 46, 66], [5, 8, 4, 3]) },
  { id: 'index-simple-relative-extra', title: 'Simple average price relatives practice', mode: 'index-simple-relative', labels: ['Base Price', 'Current Price'], rows: pairRows([50, 80, 120, 200], [60, 100, 132, 250]) },
  { id: 'index-weighted-relative-extra', title: 'Weighted average price relatives practice', mode: 'index-weighted-relative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows([40, 60, 90, 110], [44, 72, 99, 121], [6, 5, 8, 3]) },
  { id: 'index-laspeyres-extra', title: "Laspeyres' index practice: market basket", mode: 'index-laspeyres', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([8, 12, 20, 25], [10, 15, 24, 30], [30, 25, 18, 12], [28, 20, 16, 10]) },
  { id: 'index-paasche-extra', title: "Paasche's index practice: current basket", mode: 'index-paasche', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([14, 22, 30, 45], [18, 26, 36, 54], [10, 8, 6, 4], [12, 9, 7, 5]) },
  { id: 'index-fisher-extra', title: "Fisher's ideal index practice", mode: 'index-fisher', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([30, 50, 75], [36, 55, 90], [20, 10, 8], [18, 12, 7]) },
  { id: 'index-edgeworth-extra', title: 'Edgeworth-Marshall index practice', mode: 'index-edgeworth-marshall', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([5, 9, 15, 24], [6, 10, 18, 30], [40, 25, 14, 9], [42, 22, 16, 10]) },
  { id: 'quantity-fisher-extra', title: 'Fisher quantity index practice', mode: 'quantity-index-fisher', labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows([11, 15, 20], [12, 18, 22], [50, 30, 20], [55, 33, 18]) },
  { id: 'index-weighted-aggregative-extra-2', title: 'Weighted aggregative index: industrial goods', mode: 'index-weighted-aggregative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows([70, 85, 100, 130, 150], [77, 94, 115, 143, 171], [3, 5, 4, 6, 2]) },
  { id: 'index-simple-aggregative-extra-2', title: 'Simple aggregative index: fuel items', mode: 'index-simple-aggregative', labels: ['Base Price', 'Current Price'], rows: pairRows([95, 110, 125, 140], [120, 132, 150, 168]) },
]

type SolverCategory = {
  id: string
  title: string
  description: string
  examples: Preset[]
}

const CATEGORY_BLUEPRINTS: Array<{ id: string; title: string; description: string; mode: SolverMode }> = [
  { id: 'pearson-correlation', title: 'Pearson Correlation', description: 'Paired X-Y problems for product moment correlation.', mode: 'pearson' },
  { id: 'rank-correlation', title: 'Rank Correlation', description: 'Spearman rank problems with paired ranks or marks.', mode: 'spearman-rank' },
  { id: 'concurrent-deviation', title: 'Concurrent Deviation', description: 'Same-direction movement problems for two time series.', mode: 'concurrent' },
  { id: 'regression-equations', title: 'Regression Equations', description: 'Y on X, X on Y, and two-equation regression practice.', mode: 'regression-both' },
  { id: 'trend-analysis', title: 'Trend Analysis', description: 'Least-squares straight-line trend fitting.', mode: 'trend' },
  { id: 'correlation-summary', title: 'Correlation Summary Values', description: 'Correlation from supplied deviation totals.', mode: 'correlation-summary' },
  { id: 'raw-standard-deviation', title: 'Raw Standard Deviation', description: 'Ungrouped one-column standard deviation problems.', mode: 'sd-raw' },
  { id: 'frequency-standard-deviation', title: 'Frequency Standard Deviation', description: 'Value-frequency mean and standard deviation problems.', mode: 'sd-frequency' },
  { id: 'grouped-standard-deviation', title: 'Grouped Standard Deviation', description: 'Class interval problems using midpoints and frequencies.', mode: 'sd-class-frequency' },
  { id: 'cumulative-standard-deviation', title: 'Cumulative Frequency SD', description: 'Less-than and more-than cumulative frequency conversion practice.', mode: 'sd-less-than-cumulative' },
  { id: 'geometric-mean', title: 'Geometric Mean', description: 'Frequency-weighted geometric mean examples.', mode: 'geometric-mean-frequency' },
  { id: 'grouped-mode', title: 'Grouped Mode', description: 'Modal class and grouped mode formula practice.', mode: 'mode-grouped' },
  { id: 'simple-index-numbers', title: 'Simple Index Numbers', description: 'Simple aggregative and simple relative index examples.', mode: 'index-simple-aggregative' },
  { id: 'weighted-index-numbers', title: 'Weighted Index Numbers', description: 'Weighted aggregative and weighted relative price index examples.', mode: 'index-weighted-aggregative' },
  { id: 'ideal-quantity-indexes', title: 'Ideal and Quantity Indexes', description: 'Laspeyres, Paasche, Fisher, Edgeworth-Marshall, and quantity index examples.', mode: 'index-fisher' },
]

const solverCategories: SolverCategory[] = CATEGORY_BLUEPRINTS.map((category) => ({
  ...category,
  examples: Array.from({ length: 25 }, (_, index) => generatedPreset(category.id, category.title, category.mode, index + 1)),
}))

const allSolverExamples = solverCategories.flatMap((category) => category.examples)

function generatedPreset(categoryId: string, categoryTitle: string, mode: SolverMode, serial: number): Preset {
  const suffix = serial.toString().padStart(2, '0')
  const title = `${categoryTitle} Example ${suffix}`
  if (categoryId === 'grouped-and-cumulative-standard-deviation') {
    const sdMode = (['sd-class-frequency', 'sd-less-than-cumulative', 'sd-more-than-cumulative'] as SolverMode[])[serial % 3]
    if (sdMode === 'sd-less-than-cumulative') {
      const upper = Array.from({ length: 6 }, (_, index) => 10 + serial + index * 10)
      let total = 0
      const cumulative = upper.map((_, index) => {
        total += 4 + ((serial + index * 3) % 11)
        return total
      })
      return { id: `${categoryId}-${suffix}`, title, mode: sdMode, labels: ['Less than upper', 'Cumulative frequency'], rows: pairRows(upper, cumulative) }
    }
    if (sdMode === 'sd-more-than-cumulative') {
      const lower = Array.from({ length: 6 }, (_, index) => serial + index * 10)
      let remaining = 70 + serial
      const cumulative = lower.map((_, index) => {
        const value = remaining
        remaining -= 5 + ((serial + index * 2) % 10)
        return Math.max(value, 0)
      })
      return { id: `${categoryId}-${suffix}`, title, mode: sdMode, labels: ['More than lower', 'Cumulative frequency'], rows: pairRows(lower, cumulative) }
    }
  }
  if (categoryId === 'cumulative-standard-deviation') {
    const cumulativeMode: SolverMode = serial % 2 ? 'sd-less-than-cumulative' : 'sd-more-than-cumulative'
    if (cumulativeMode === 'sd-more-than-cumulative') {
      const lower = Array.from({ length: 6 }, (_, index) => serial + index * 10)
      let remaining = 70 + serial
      const cumulative = lower.map((_, index) => {
        const value = remaining
        remaining -= 5 + ((serial + index * 2) % 10)
        return Math.max(value, 0)
      })
      return { id: `${categoryId}-${suffix}`, title, mode: cumulativeMode, labels: ['More than lower', 'Cumulative frequency'], rows: pairRows(lower, cumulative) }
    }
  }
  if (mode === 'sd-raw') {
    const start = 18 + serial
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Value', ''], rows: Array.from({ length: 8 }, (_, index) => [start + index * 3 + ((serial + index) % 4)]) }
  }
  if (mode === 'sd-frequency' || mode === 'geometric-mean-frequency') {
    const start = mode === 'geometric-mean-frequency' ? 20 + serial : 40 + serial * 2
    const x = Array.from({ length: 6 }, (_, index) => start + index * (mode === 'geometric-mean-frequency' ? 10 : 5))
    const f = Array.from({ length: 6 }, (_, index) => 3 + ((serial + index * 2) % 12))
    return { id: `${categoryId}-${suffix}`, title, mode, labels: [mode === 'geometric-mean-frequency' ? 'X' : 'Value', 'Frequency'], rows: pairRows(x, f) }
  }
  if (mode === 'sd-class-frequency' || mode === 'mode-grouped') {
    const lower = Array.from({ length: 6 }, (_, index) => serial * 2 + index * 10)
    const upper = lower.map((value) => value + 10)
    const frequency = lower.map((_, index) => mode === 'mode-grouped' ? [5, 11, 18 + serial % 7, 14, 9, 4][index] : 4 + ((serial + index * 3) % 18))
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Class lower', 'Class upper', 'Frequency'], rows: tripleRows(lower, upper, frequency) }
  }
  if (mode === 'sd-less-than-cumulative') {
    const upper = Array.from({ length: 6 }, (_, index) => 10 + serial + index * 10)
    let total = 0
    const cumulative = upper.map((_, index) => {
      total += 4 + ((serial + index * 3) % 11)
      return total
    })
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Less than upper', 'Cumulative frequency'], rows: pairRows(upper, cumulative) }
  }
  if (mode === 'correlation-summary') {
    const sumX2 = 90 + serial * 7
    const sumY2 = 110 + serial * 6
    const sumXY = Math.round(Math.sqrt(sumX2 * sumY2) * (0.35 + (serial % 10) / 25))
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['sum dx^2', 'sum dy^2', 'sum dxdy', 'N'], rows: [[sumX2, sumY2, sumXY, 8 + (serial % 12)]] }
  }
  if (mode.startsWith('index-') || mode === 'quantity-index-fisher') {
    const p0 = Array.from({ length: 5 }, (_, index) => 12 + serial + index * 8)
    const p1 = p0.map((value, index) => Math.round(value * (1.08 + ((serial + index) % 5) / 20)))
    if (categoryId === 'index-numbers') {
      const indexMode = (['index-simple-aggregative', 'index-simple-relative', 'index-weighted-aggregative', 'index-weighted-relative', 'index-laspeyres', 'index-paasche', 'index-fisher', 'index-edgeworth-marshall', 'quantity-index-fisher'] as SolverMode[])[serial % 9]
      const q0 = Array.from({ length: 5 }, (_, index) => 4 + ((serial + index * 2) % 10))
      const q1 = q0.map((value, index) => value + ((serial + index) % 4) - 1)
      if (indexMode === 'index-simple-aggregative' || indexMode === 'index-simple-relative') return { id: `${categoryId}-${suffix}`, title, mode: indexMode, labels: ['Base Price', 'Current Price'], rows: pairRows(p0, p1) }
      if (indexMode === 'index-weighted-aggregative' || indexMode === 'index-weighted-relative') return { id: `${categoryId}-${suffix}`, title, mode: indexMode, labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows(p0, p1, q0) }
      return { id: `${categoryId}-${suffix}`, title, mode: indexMode, labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows(p0, p1, q0, q1) }
    }
    if (mode === 'index-simple-aggregative') return { id: `${categoryId}-${suffix}`, title, mode: serial % 2 ? mode : 'index-simple-relative', labels: ['Base Price', 'Current Price'], rows: pairRows(p0, p1) }
    const q0 = Array.from({ length: 5 }, (_, index) => 4 + ((serial + index * 2) % 10))
    const q1 = q0.map((value, index) => value + ((serial + index) % 4) - 1)
    if (mode === 'index-weighted-aggregative') return { id: `${categoryId}-${suffix}`, title, mode: serial % 2 ? mode : 'index-weighted-relative', labels: ['Base Price', 'Current Price', 'Weight'], rows: tripleRows(p0, p1, q0) }
    const idealMode: SolverMode = (['index-laspeyres', 'index-paasche', 'index-fisher', 'index-edgeworth-marshall', 'quantity-index-fisher'] as SolverMode[])[serial % 5]
    return { id: `${categoryId}-${suffix}`, title, mode: idealMode, labels: ['Base Price', 'Current Price', 'Base Quantity', 'Current Quantity'], rows: quadRows(p0, p1, q0, q1) }
  }
  if (mode === 'trend') {
    const years = Array.from({ length: 7 }, (_, index) => 2017 + index)
    const values = years.map((_, index) => 60 + serial * 2 + index * (2 + serial % 4) + ((index + serial) % 3) * 2)
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Year', 'Production'], rows: pairRows(years, values) }
  }
  if (mode === 'spearman-rank') {
    const x = Array.from({ length: 8 }, (_, index) => 8 - index)
    const shift = serial % x.length
    const y = x.map((_, index) => x[(index + shift) % x.length])
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Rank X', 'Rank Y'], rows: pairRows(x, y) }
  }
  if (mode === 'concurrent') {
    const x = Array.from({ length: 9 }, (_, index) => 100 + serial * 2 + index * 4 + ((index + serial) % 3) * 5)
    const y = x.map((value, index) => Math.round(value * 0.8 + 12 + ((serial + index * 2) % 9)))
    return { id: `${categoryId}-${suffix}`, title, mode, labels: ['Series X', 'Series Y'], rows: pairRows(x, y) }
  }
  const x = Array.from({ length: 8 }, (_, index) => 10 + serial + index * 5)
  const y = x.map((value, index) => Math.round(value * (1.1 + (serial % 4) / 10) + 8 + ((index + serial) % 5) * 3))
  return { id: `${categoryId}-${suffix}`, title, mode, labels: ['X', 'Y'], rows: pairRows(x, y) }
}

const modeCopy: Record<SolverMode, { label: string; formula: string; guide: string[] }> = {
  pearson: {
    label: "Karl Pearson's correlation",
    formula: 'r = sum(dx dy) / sqrt(sum(dx^2) sum(dy^2))',
    guide: ['Enter paired X and Y values.', 'Find mean of X and mean of Y.', 'Calculate dx, dy, dx^2, dy^2, and dxdy.', 'Substitute sums into the product moment formula.', 'Interpret sign and strength.'],
  },
  concurrent: {
    label: 'Concurrent deviation',
    formula: 'r_c = +/- sqrt(|2C - N| / N)',
    guide: ['Compare each value with the previous value.', 'Mark + for increase and - for decrease in both series.', 'Count C, the number of concurrent or same-direction deviations.', 'Use N = number of comparisons = n - 1.', 'Use positive sign if 2C > N and negative sign if 2C < N.'],
  },
  trend: {
    label: 'Least squares straight-line trend',
    formula: 'Yc = a + bX, where b = sum(xy) / sum(x^2)',
    guide: ['Use time or year as X and production/sales as Y.', 'Code X around the middle year when possible.', 'Find a = mean(Y).', 'Find b = sum(xy) / sum(x^2).', 'Compute trend values Yc for each X.'],
  },
  'regression-yx': {
    label: 'Regression equation of Y on X',
    formula: 'Y - mean(Y) = b_yx [X - mean(X)]',
    guide: ['Enter paired X and Y values.', 'Find mean(X), mean(Y), sum(dx^2), and sum(dxdy).', 'Calculate b_yx = sum(dxdy) / sum(dx^2).', 'Find intercept a = mean(Y) - b_yx mean(X).', 'Write equation Y = a + bX.'],
  },
  'regression-coeff-yx': {
    label: 'Regression coefficient of Y on X',
    formula: 'b_yx = sum(dxdy) / sum(dx^2)',
    guide: ['Enter paired X and Y values.', 'Calculate deviations from means.', 'Divide sum(dxdy) by sum(dx^2).', 'The sign tells direction and the magnitude tells change in Y per one unit X.'],
  },
  'regression-both': {
    label: 'Both regression equations',
    formula: 'Y - mean(Y) = b_yx[X - mean(X)]; X - mean(X) = b_xy[Y - mean(Y)]',
    guide: ['Enter paired X and Y values.', 'Find mean(X), mean(Y), sum(dx^2), sum(dy^2), and sum(dxdy).', 'Calculate b_yx and b_xy.', 'Write both equations in centered or straight-line form.'],
  },
  'spearman-rank': {
    label: 'Spearman rank correlation',
    formula: 'rho = 1 - [6 sum(d^2)] / [n(n^2 - 1)]',
    guide: ['Enter paired X and Y values.', 'Rank X and rank Y.', 'Find d = rank X - rank Y.', 'Square d and add.', 'Substitute into Spearman rank formula.'],
  },
  'correlation-summary': {
    label: 'Correlation from summary data',
    formula: 'r = sum(dxdy) / sqrt(sum(dx^2) sum(dy^2)); PE = 0.6745(1-r^2)/sqrt(N)',
    guide: ['Enter sum(dx^2), sum(dy^2), sum(dxdy), and N in one row.', 'The solver calculates Pearson r from the summarized deviations.', 'If N is supplied, it also calculates probable error.', 'Use this when the question gives summary totals instead of raw pairs.'],
  },
  'sd-raw': {
    label: 'Standard deviation',
    formula: 'sigma = sqrt(sum((x - mean)^2) / N)',
    guide: ['Enter one value per row.', 'Find arithmetic mean.', 'Find deviations and square them.', 'Divide sum of squares by N.', 'Take square root.'],
  },
  'sd-frequency': {
    label: 'Standard deviation with frequency',
    formula: 'sigma = sqrt(sum(f d^2) / N)',
    guide: ['Enter values or midpoints in X and frequencies in Y.', 'Find N = sum(f).', 'Find mean = sum(fx) / N.', 'Find d = x - mean.', 'Calculate sqrt(sum(f d^2) / N).'],
  },
  'sd-shortcut-sums': {
    label: 'Standard deviation from sums',
    formula: 'sigma = sqrt((sum X^2 / N) - (sum X / N)^2)',
    guide: ['Enter one row per variable.', 'Column 1 is sum X.', 'Column 2 is sum X^2.', 'Column 3 is N.', 'The solver returns mean and standard deviation for each row.'],
  },
  'sd-class-frequency': {
    label: 'Grouped SD and coefficient',
    formula: 'mean = sum(fm)/N; sigma = sqrt(sum(f(m-mean)^2)/N); CV = sigma/mean x 100',
    guide: ['Enter class lower limit, class upper limit, and frequency.', 'The solver uses class midpoint m.', 'It calculates mean, standard deviation, and coefficient of variation.', 'Use this for regular class interval tables.'],
  },
  'sd-less-than-cumulative': {
    label: 'SD from less-than cumulative data',
    formula: 'Convert cumulative frequencies to class frequencies, then use grouped SD',
    guide: ['Enter upper class boundary and less-than cumulative frequency.', 'The solver converts cumulative frequencies into class frequencies.', 'It infers equal class width from boundary spacing.', 'Then it calculates grouped mean and SD.'],
  },
  'sd-more-than-cumulative': {
    label: 'SD from more-than cumulative data',
    formula: 'Convert more-than cumulative frequencies to class frequencies, then use grouped SD',
    guide: ['Enter lower class boundary and more-than cumulative frequency.', 'The solver subtracts adjacent cumulative frequencies to get class frequencies.', 'It infers equal class width from boundary spacing.', 'Then it calculates grouped mean and SD.'],
  },
  'index-simple-aggregative': {
    label: 'Simple aggregative index',
    formula: 'P01 = sum(P1) / sum(P0) x 100',
    guide: ['Enter base prices in X and current prices in Y.', 'Add all current prices.', 'Add all base prices.', 'Divide current total by base total and multiply by 100.'],
  },
  'index-weighted-aggregative': {
    label: 'Weighted aggregative index',
    formula: 'P01 = sum(P1 W) / sum(P0 W) x 100',
    guide: ['Enter base price, current price, and weight.', 'Calculate P1W and P0W for each commodity.', 'Add both columns.', 'Divide sum(P1W) by sum(P0W) and multiply by 100.'],
  },
  'index-simple-relative': {
    label: 'Simple average of price relatives',
    formula: 'P01 = sum((P1 / P0) x 100) / N',
    guide: ['Enter base and current prices.', 'Calculate price relative for each row.', 'Average the relatives.'],
  },
  'index-weighted-relative': {
    label: 'Weighted average of price relatives',
    formula: 'P01 = sum(W R) / sum(W), R = (P1 / P0) x 100',
    guide: ['Enter base price, current price, and weight.', 'Calculate relative R for each row.', 'Multiply R by W.', 'Divide sum(WR) by sum(W).'],
  },
  'index-laspeyres': {
    label: "Laspeyres' index",
    formula: 'P01 = sum(P1 Q0) / sum(P0 Q0) x 100',
    guide: ['Enter base price, current price, base quantity, and current quantity.', 'Use base-year quantity as weight.', 'Divide sum(P1Q0) by sum(P0Q0) and multiply by 100.'],
  },
  'index-paasche': {
    label: "Paasche's index",
    formula: 'P01 = sum(P1 Q1) / sum(P0 Q1) x 100',
    guide: ['Enter base price, current price, base quantity, and current quantity.', 'Use current-year quantity as weight.', 'Divide sum(P1Q1) by sum(P0Q1) and multiply by 100.'],
  },
  'index-fisher': {
    label: "Fisher's ideal index",
    formula: 'P01 = sqrt(Laspeyres x Paasche)',
    guide: ['Calculate Laspeyres index.', 'Calculate Paasche index.', 'Take the geometric mean of both indexes.'],
  },
  'index-edgeworth-marshall': {
    label: 'Edgeworth-Marshall index',
    formula: 'P01 = sum(P1(Q0+Q1)) / sum(P0(Q0+Q1)) x 100',
    guide: ['Enter base price, current price, base quantity, and current quantity.', 'Add Q0 and Q1 for each commodity.', 'Use Q0+Q1 as the weight.', 'Compare the result with Fisher index.'],
  },
  'quantity-index-fisher': {
    label: 'Fisher ideal quantity index',
    formula: 'Q01 = sqrt([sum(Q1P0)/sum(Q0P0)] x [sum(Q1P1)/sum(Q0P1)]) x 100',
    guide: ['Enter base/current price and base/current quantity.', 'Calculate Laspeyres quantity index using base prices.', 'Calculate Paasche quantity index using current prices.', 'Take their geometric mean.'],
  },
  'mode-grouped': {
    label: 'Mode for grouped data',
    formula: 'Mode = L + [(fm - f1) / (2fm - f1 - f2)] h',
    guide: ['Enter class lower limit, class upper limit, and frequency.', 'Find modal class with highest frequency.', 'Use previous and next class frequencies.', 'Substitute in grouped mode formula.'],
  },
  'correlation-from-regression-coeff': {
    label: 'Correlation from regression coefficients',
    formula: 'r = +/- sqrt(bxy x byx)',
    guide: ['Enter bxy in first column and byx in second column.', 'Multiply both regression coefficients.', 'Take square root.', 'Use common sign of coefficients for r.'],
  },
  'geometric-mean-frequency': {
    label: 'Geometric mean with frequency',
    formula: 'GM = antilog(sum(f log x) / N)',
    guide: ['Enter X and frequency.', 'Take log of each X.', 'Multiply frequency by log X.', 'Divide sum(f log X) by N.', 'Take antilog.'],
  },
}

const fmt = (value: number, digits = 4) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '-'
const fmtList = (values: number[], digits = 4) => values.map((value) => fmt(value, digits)).join(' + ')
const fmtPairs = (a: number[], b: number[], operator = 'x') => a.map((value, index) => `${fmt(value)} ${operator} ${fmt(b[index] ?? 0)}`).join(' + ')
const emptyRow = (): SolverRow => ({ x: '', y: '', z: '', q: '' })
const rowsFromPreset = (preset: Preset): SolverRow[] => preset.rows.map((row) => ({ x: String(row[0] ?? ''), y: String(row[1] ?? ''), z: String(row[2] ?? ''), q: String(row[3] ?? '') }))

export function SolverPage() {
  const first = allSolverExamples[0] ?? presets[0]
  const [mode, setMode] = useState<SolverMode>(first.mode)
  const [labels, setLabels] = useState<[string, string, string, string]>([first.labels[0], first.labels[1], first.labels[2] ?? '', first.labels[3] ?? ''])
  const [rows, setRows] = useState(rowsFromPreset(first))
  const [activeTab, setActiveTab] = useState<'solve' | 'steps'>('solve')
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => ({ [solverCategories[0]?.id ?? '']: true }))

  const parsed = useMemo(() => {
    const pairs = rows
      .map((row) => ({ x: Number(row.x), y: Number(row.y), z: Number(row.z), q: Number(row.q) }))
      .filter((row) => Number.isFinite(row.x))
    return {
      x: pairs.map((row) => row.x),
      y: pairs.filter((row) => Number.isFinite(row.y)).map((row) => row.y),
      z: pairs.filter((row) => Number.isFinite(row.z)).map((row) => row.z),
      q: pairs.filter((row) => Number.isFinite(row.q)).map((row) => row.q),
    }
  }, [rows])

  const result = useMemo(() => solve(mode, parsed.x, parsed.y, parsed.z, parsed.q), [mode, parsed])
  const copy = modeCopy[mode]

  const loadPreset = (preset: Preset) => {
    setMode(preset.mode)
    setLabels([preset.labels[0], preset.labels[1], preset.labels[2] ?? '', preset.labels[3] ?? ''])
    setRows(rowsFromPreset(preset))
    setActiveTab('solve')
  }

  const columns = getColumns(mode, labels)

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Calculator size={24} className="text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Solver</h1>
              </div>
              <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                Dedicated solver for exam-style statistics problems: Pearson correlation, concurrent deviation, least-squares trend, and regression.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Examples" value={allSolverExamples.length} />
              <Metric label="Rows" value={parsed.x.length} />
              <Metric label="Mode" value={copy.label} />
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <Sigma size={20} className="mt-0.5 text-blue-700 dark:text-blue-300" />
            <div>
              <h2 className="font-bold text-blue-950 dark:text-blue-100">How to solve problems like these</h2>
              <ol className="mt-2 grid gap-2 text-sm text-blue-800 dark:text-blue-200 md:grid-cols-2">
                {copy.guide.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
              </ol>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList size={17} className="text-indigo-500" />
                <h2 className="font-bold text-slate-800 dark:text-white">Problem Type</h2>
              </div>
              <select value={mode} onChange={(event) => setMode(event.target.value as SolverMode)} className="input-select">
                {Object.entries(modeCopy).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
              </select>
              <div className="mt-4 rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">{copy.formula}</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <BookOpenCheck size={17} className="text-indigo-500" />
                <h2 className="font-bold text-slate-800 dark:text-white">Categorized Examples</h2>
              </div>
              <div className="space-y-4">
                {solverCategories.map((category) => {
                  const isOpen = openCategories[category.id]
                  return (
                    <div key={category.id} className="rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setOpenCategories((state) => ({ ...state, [category.id]: !state[category.id] }))}
                        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      >
                        <span className="flex min-w-0 gap-2">
                          {isOpen ? <ChevronDown size={16} className="mt-0.5 shrink-0 text-slate-400" /> : <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-400" />}
                          <span>
                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-100">{category.title}</span>
                            <span className="block text-xs text-slate-400">{category.description}</span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{category.examples.length} examples</span>
                      </button>
                      {isOpen && (
                        <div className="max-h-80 space-y-2 overflow-auto border-t border-slate-100 p-3 pr-2 dark:border-slate-700">
                          {category.examples.map((preset) => (
                            <button key={preset.id} onClick={() => loadPreset(preset)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                              <span className="block font-medium">{preset.title}</span>
                              <span className="text-xs text-slate-400">{modeCopy[preset.mode].label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <main className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['solve', 'Solve'],
                  ['steps', 'Steps'],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'solve' ? (
              <>
                <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Grid3X3 size={17} className="text-indigo-500" />
                      <h2 className="font-bold text-slate-800 dark:text-white">Input Grid</h2>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setRows((items) => [...items, emptyRow()])} className="rounded-md bg-indigo-600 px-3 py-2 text-xs text-white hover:bg-indigo-700">Add row</button>
                      <button onClick={() => setRows(rows.slice(0, -1))} disabled={rows.length <= 2} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">Remove row</button>
                      <button onClick={() => setRows([emptyRow(), emptyRow(), emptyRow(), emptyRow()])} className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><RotateCcw size={13} /></button>
                    </div>
                  </div>

                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    {columns.map((column) => (
                      <label key={column.key} className="text-xs text-slate-500">
                        {column.name} label
                        <input value={labels[column.index]} onChange={(event) => setLabels(updateLabel(labels, column.index, event.target.value))} className="input-select mt-1" />
                      </label>
                    ))}
                  </div>

                  <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="w-16 px-3 py-2 text-left text-slate-500">No.</th>
                          {columns.map((column) => <th key={column.key} className="px-3 py-2 text-left text-slate-500">{column.name}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {rows.map((row, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                            {columns.map((column) => (
                              <td key={column.key} className="px-3 py-2">
                                <input value={row[column.key]} onChange={(event) => setRows(updateRow(rows, index, column.key, event.target.value))} className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <ResultPanel result={result} mode={mode} labels={labels} />
              </>
            ) : (
              <StepsPanel result={result} mode={mode} labels={labels} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function getColumns(mode: SolverMode, labels: [string, string, string, string]) {
  const count = ['index-weighted-aggregative', 'index-weighted-relative'].includes(mode) ? 3
    : ['mode-grouped', 'sd-shortcut-sums', 'sd-class-frequency'].includes(mode) ? 3
      : ['index-laspeyres', 'index-paasche', 'index-fisher', 'index-edgeworth-marshall', 'quantity-index-fisher', 'correlation-summary'].includes(mode) ? 4
      : mode === 'sd-raw' ? 1
        : 2
  return ([
    { key: 'x' as const, index: 0, name: labels[0] || 'X' },
    { key: 'y' as const, index: 1, name: labels[1] || 'Y' },
    { key: 'z' as const, index: 2, name: labels[2] || 'Weight / Frequency' },
    { key: 'q' as const, index: 3, name: labels[3] || 'Current Quantity' },
  ]).slice(0, count)
}

function updateLabel(labels: [string, string, string, string], index: number, value: string): [string, string, string, string] {
  const next: [string, string, string, string] = [...labels]
  next[index] = value
  return next
}

function updateRow(rows: SolverRow[], index: number, key: keyof SolverRow, value: string) {
  return rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row)
}

function solve(mode: SolverMode, x: number[], y: number[], z: number[], q: number[]) {
  if (mode === 'sd-raw') return solveSdRaw(x)
  if (mode === 'sd-frequency') return solveSdFrequency(x, y)
  if (mode === 'sd-shortcut-sums') return solveSdFromSums(x, y, z)
  if (mode === 'sd-class-frequency') return solveClassFrequencySd(x, y, z)
  if (mode === 'sd-less-than-cumulative') return solveLessThanCumulativeSd(x, y)
  if (mode === 'sd-more-than-cumulative') return solveMoreThanCumulativeSd(x, y)
  if (mode === 'mode-grouped') return solveGroupedMode(x, y, z)
  if (mode === 'spearman-rank') return solveSpearmanRank(x, y)
  if (mode === 'correlation-summary') return solveCorrelationSummary(x, y, z, q)
  if (mode === 'correlation-from-regression-coeff') return solveCorrelationFromRegressionCoefficients(x, y)
  if (mode === 'geometric-mean-frequency') return solveGeometricMeanFrequency(x, y)
  if (mode.startsWith('index-')) return solveIndex(mode, x, y, z, q)
  if (mode === 'quantity-index-fisher') return solveIndex(mode, x, y, z, q)
  if (x.length !== y.length || x.length < 2) return { error: 'Enter at least two valid paired rows.' }
  const base = pairedStats(x, y)
  if (!base) return { error: 'Could not calculate. Check the values.' }

  if (mode === 'concurrent') {
    const signs = x.slice(1).map((value, index) => ({
      x: Math.sign(value - x[index]),
      y: Math.sign(y[index + 1] - y[index]),
    }))
    const concurrent = signs.filter((item) => item.x === item.y && item.x !== 0).length
    const comparisons = signs.filter((item) => item.x !== 0 && item.y !== 0).length
    const raw = comparisons ? (2 * concurrent - comparisons) / comparisons : NaN
    const coefficient = Number.isFinite(raw) ? Math.sign(raw) * Math.sqrt(Math.abs(raw)) : NaN
    return { ...base, concurrent, comparisons, coefficient, signs }
  }

  if (mode === 'trend') {
    const center = base.meanX
    const codedX = x.map((value) => value - center)
    const trendStats = pairedStats(codedX, y)
    const slope = trendStats ? trendStats.sumXY / trendStats.sumX2 : NaN
    const intercept = base.meanY - slope * center
    const trendValues = x.map((value) => intercept + slope * value)
    return { ...base, slope, intercept, trendValues, centeredIntercept: base.meanY, centeredSlope: slope, center }
  }

  const slope = base.sumXY / base.sumX2
  const slopeXOnY = base.sumXY / base.sumY2
  const intercept = base.meanY - slope * base.meanX
  const interceptXOnY = base.meanX - slopeXOnY * base.meanY
  return { ...base, slope, intercept, slopeXOnY, interceptXOnY }
}

function pairedStats(x: number[], y: number[]) {
  const n = x.length
  const sumX = x.reduce((sum, value) => sum + value, 0)
  const sumY = y.reduce((sum, value) => sum + value, 0)
  const meanX = sumX / n
  const meanY = sumY / n
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  const dx: number[] = []
  const dy: number[] = []
  const dxdy: number[] = []
  const dx2: number[] = []
  const dy2: number[] = []
  x.forEach((value, index) => {
    const currentDx = value - meanX
    const currentDy = y[index] - meanY
    dx.push(currentDx)
    dy.push(currentDy)
    dxdy.push(currentDx * currentDy)
    dx2.push(currentDx * currentDx)
    dy2.push(currentDy * currentDy)
    sumXY += currentDx * currentDy
    sumX2 += currentDx * currentDx
    sumY2 += currentDy * currentDy
  })
  const r = sumXY / Math.sqrt(sumX2 * sumY2)
  return { n, x, y, sumX, sumY, meanX, meanY, dx, dy, dxdy, dx2, dy2, sumXY, sumX2, sumY2, r }
}

function solveSdRaw(x: number[]) {
  if (x.length < 2) return { error: 'Enter at least two values.' }
  const n = x.length
  const sumX = x.reduce((sum, value) => sum + value, 0)
  const mean = sumX / n
  const d2 = x.map((value) => (value - mean) ** 2)
  const sumD2 = d2.reduce((sum, value) => sum + value, 0)
  const variance = sumD2 / n
  return { kind: 'sd' as const, x, n, sumX, mean, d2, sumD2, variance, sd: Math.sqrt(variance) }
}

function solveSdFrequency(x: number[], f: number[]) {
  if (x.length !== f.length || x.length < 2) return { error: 'Enter valid value-frequency pairs.' }
  const n = f.reduce((sum, value) => sum + value, 0)
  const fx = x.map((value, index) => value * f[index])
  const sumFx = fx.reduce((sum, value) => sum + value, 0)
  const mean = sumFx / n
  const fd2 = x.map((value, index) => f[index] * (value - mean) ** 2)
  const sumFd2 = fd2.reduce((sum, value) => sum + value, 0)
  const variance = sumFd2 / n
  return { kind: 'sd-frequency' as const, x, f, n, fx, mean, sumFx, fd2, sumD2: sumFd2, variance, sd: Math.sqrt(variance) }
}

function solveSdFromSums(sumX: number[], sumX2: number[], nValues: number[]) {
  if (sumX.length < 1 || sumX.length !== sumX2.length || sumX.length !== nValues.length) return { error: 'Enter sum X, sum X^2, and N for each row.' }
  const rows = sumX.map((sx, index) => {
    const n = nValues[index]
    const mean = sx / n
    const variance = sumX2[index] / n - mean ** 2
    return { sumX: sx, sumX2: sumX2[index], n, mean, variance, sd: Math.sqrt(Math.max(0, variance)) }
  })
  return { kind: 'sd-sums' as const, rows }
}

function solveClassFrequencySd(lower: number[], upper: number[], f: number[]) {
  if (lower.length !== upper.length || lower.length !== f.length || lower.length < 1) return { error: 'Enter class lower, class upper, and frequency rows.' }
  const midpoints = lower.map((value, index) => (value + upper[index]) / 2)
  return { kind: 'grouped-sd' as const, ...groupedStats(midpoints, f), lower, upper, frequency: f, midpoints }
}

function solveLessThanCumulativeSd(upper: number[], cumulative: number[]) {
  if (upper.length !== cumulative.length || upper.length < 2) return { error: 'Enter upper boundaries and less-than cumulative frequencies.' }
  const width = upper[1] - upper[0]
  const lower = upper.map((value) => value - width)
  const frequency = cumulative.map((value, index) => value - (cumulative[index - 1] ?? 0))
  const midpoints = lower.map((value, index) => (value + upper[index]) / 2)
  return { kind: 'grouped-sd' as const, ...groupedStats(midpoints, frequency), lower, upper, frequency, midpoints }
}

function solveMoreThanCumulativeSd(lower: number[], cumulative: number[]) {
  if (lower.length !== cumulative.length || lower.length < 2) return { error: 'Enter lower boundaries and more-than cumulative frequencies.' }
  const sorted = lower.map((value, index) => ({ lower: value, cumulative: cumulative[index] })).sort((a, b) => a.lower - b.lower)
  const width = sorted[1].lower - sorted[0].lower
  const uppers = sorted.map((item) => item.lower + width)
  const frequency = sorted.map((item, index) => item.cumulative - (sorted[index + 1]?.cumulative ?? 0))
  const midpoints = sorted.map((item, index) => (item.lower + uppers[index]) / 2)
  return { kind: 'grouped-sd' as const, ...groupedStats(midpoints, frequency), lower: sorted.map((item) => item.lower), upper: uppers, frequency, midpoints }
}

function groupedStats(x: number[], f: number[]) {
  const n = f.reduce((sum, value) => sum + value, 0)
  const fx = x.map((value, index) => value * f[index])
  const sumFx = fx.reduce((sum, value) => sum + value, 0)
  const mean = sumFx / n
  const fd2 = x.map((value, index) => f[index] * (value - mean) ** 2)
  const sumD2 = fd2.reduce((sum, value) => sum + value, 0)
  const variance = sumD2 / n
  const sd = Math.sqrt(variance)
  const cv = mean ? sd / mean * 100 : NaN
  return { n, mean, fx, sumFx, fd2, sumD2, variance, sd, cv }
}

function solveIndex(mode: SolverMode, p0: number[], p1: number[], w: number[], q1: number[]) {
  if (p0.length !== p1.length || p0.length < 1) return { error: 'Enter valid base and current price rows.' }
  const sumP0 = p0.reduce((sum, value) => sum + value, 0)
  const sumP1 = p1.reduce((sum, value) => sum + value, 0)
  const relatives = p0.map((value, index) => p1[index] / value * 100)
  const sumW = w.reduce((sum, value) => sum + value, 0)
  const weighted = w.length === p0.length && sumW ? sumProduct(relatives, w) / sumW : NaN
  const simpleRelative = relatives.reduce((sum, value) => sum + value, 0) / relatives.length
  const simpleAggregative = sumP1 / sumP0 * 100
  const weightedAggregative = w.length === p0.length ? sumProduct(p1, w) / sumProduct(p0, w) * 100 : NaN
  const laspeyres = w.length === p0.length ? sumProduct(p1, w) / sumProduct(p0, w) * 100 : NaN
  const paasche = q1.length === p0.length ? sumProduct(p1, q1) / sumProduct(p0, q1) * 100 : NaN
  const fisher = Math.sqrt(laspeyres * paasche)
  const edgeworthMarshall = w.length === p0.length && q1.length === p0.length
    ? p1.reduce((sum, value, index) => sum + value * (w[index] + q1[index]), 0) / p0.reduce((sum, value, index) => sum + value * (w[index] + q1[index]), 0) * 100
    : NaN
  const quantityLaspeyres = w.length === p0.length && q1.length === p0.length ? sumProduct(q1, p0) / sumProduct(w, p0) * 100 : NaN
  const quantityPaasche = w.length === p0.length && q1.length === p0.length ? sumProduct(q1, p1) / sumProduct(w, p1) * 100 : NaN
  const quantityFisher = Math.sqrt(quantityLaspeyres * quantityPaasche)
  const value = mode === 'index-simple-aggregative' ? simpleAggregative
    : mode === 'index-weighted-aggregative' ? weightedAggregative
      : mode === 'index-simple-relative' ? simpleRelative
        : mode === 'index-weighted-relative' ? weighted
          : mode === 'index-laspeyres' ? laspeyres
            : mode === 'index-paasche' ? paasche
              : mode === 'index-edgeworth-marshall' ? edgeworthMarshall
                : mode === 'quantity-index-fisher' ? quantityFisher
                  : fisher
  return { kind: 'index' as const, n: p0.length, p0, p1, w, q1, sumP0, sumP1, simpleAggregative, simpleRelative, weightedAggregative, weightedRelative: weighted, laspeyres, paasche, fisher, edgeworthMarshall, quantityLaspeyres, quantityPaasche, quantityFisher, value, relatives }
}

function solveGroupedMode(lower: number[], upper: number[], frequency: number[]) {
  if (lower.length !== upper.length || lower.length !== frequency.length || lower.length < 2) return { error: 'Enter class lower, class upper, and frequency rows.' }
  const modalIndex = frequency.reduce((best, value, index) => value > frequency[best] ? index : best, 0)
  const l = lower[modalIndex]
  const h = upper[modalIndex] - lower[modalIndex]
  const fm = frequency[modalIndex]
  const f1 = frequency[modalIndex - 1] ?? 0
  const f2 = frequency[modalIndex + 1] ?? 0
  const mode = l + ((fm - f1) / (2 * fm - f1 - f2)) * h
  return { kind: 'mode' as const, lower, upper, frequency, modalIndex, l, h, fm, f1, f2, mode }
}

function solveSpearmanRank(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return { error: 'Enter at least two valid paired rows.' }
  const rankX = ranksDescending(x)
  const rankY = ranksDescending(y)
  const d2 = rankX.map((rank, index) => (rank - rankY[index]) ** 2)
  const sumD2 = d2.reduce((sum, value) => sum + value, 0)
  const n = x.length
  const rho = 1 - (6 * sumD2) / (n * (n ** 2 - 1))
  return { kind: 'spearman' as const, x, y, n, rankX, rankY, d2, sumD2, rho }
}

function ranksDescending(values: number[]) {
  return values.map((value) => {
    const positions = values
      .map((candidate, index) => ({ candidate, rank: index + 1 }))
      .sort((a, b) => b.candidate - a.candidate)
      .filter((item) => item.candidate === value)
      .map((item) => item.rank)
    return positions.reduce((sum, rank) => sum + rank, 0) / positions.length
  })
}

function solveCorrelationFromRegressionCoefficients(bxy: number[], byx: number[]) {
  if (!Number.isFinite(bxy[0]) || !Number.isFinite(byx[0])) return { error: 'Enter bxy and byx in the first row.' }
  const product = bxy[0] * byx[0]
  const sign = bxy[0] < 0 && byx[0] < 0 ? -1 : 1
  const r = product >= 0 ? sign * Math.sqrt(product) : NaN
  return { kind: 'regression-correlation' as const, bxy: bxy[0], byx: byx[0], product, r }
}

function solveCorrelationSummary(sumX2: number[], sumY2: number[], sumXY: number[], nValues: number[]) {
  if (!Number.isFinite(sumX2[0]) || !Number.isFinite(sumY2[0]) || !Number.isFinite(sumXY[0])) return { error: 'Enter sum dx^2, sum dy^2, and sum dxdy in the first row.' }
  const n = nValues[0]
  const r = sumXY[0] / Math.sqrt(sumX2[0] * sumY2[0])
  const probableError = Number.isFinite(n) && n > 0 ? 0.6745 * (1 - r ** 2) / Math.sqrt(n) : NaN
  return { kind: 'correlation-summary' as const, sumX2: sumX2[0], sumY2: sumY2[0], sumXY: sumXY[0], n, r, probableError }
}

function solveGeometricMeanFrequency(x: number[], f: number[]) {
  if (x.length !== f.length || x.some((value) => value <= 0)) return { error: 'Enter positive X values and matching frequencies.' }
  const n = f.reduce((sum, value) => sum + value, 0)
  const sumFLog = x.reduce((sum, value, index) => sum + f[index] * Math.log10(value), 0)
  const gm = 10 ** (sumFLog / n)
  const fLogX = x.map((value, index) => f[index] * Math.log10(value))
  return { kind: 'gm-frequency' as const, x, f, n, fLogX, sumFLog, gm }
}

function sumProduct(a: number[], b: number[]) {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0)
}

function StepsPanel({ result, mode, labels }: { result: ReturnType<typeof solve>; mode: SolverMode; labels: [string, string, string, string] }) {
  const steps = getWorkedSteps(result, mode, labels)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Sigma size={17} className="text-indigo-500" />
        <h2 className="font-bold text-slate-800 dark:text-white">Steps</h2>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{modeCopy[mode].label}</p>
        <p className="mt-2 font-mono text-sm text-slate-700 dark:text-slate-200">{modeCopy[mode].formula}</p>
      </div>
      <div className="mt-5 grid gap-4">
        {steps.map((step, index) => (
          <div key={`${index}-${step.title}`} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{index + 1}</span>
              <h3 className="font-semibold text-slate-800 dark:text-white">{step.title}</h3>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function getWorkedSteps(result: ReturnType<typeof solve>, mode: SolverMode, labels: [string, string, string, string]) {
  const baseSteps = modeCopy[mode].guide.map((detail, index) => ({ title: `Method step ${index + 1}`, detail }))

  if ('error' in result) {
    return [
      ...baseSteps,
      { title: 'Enter complete data', detail: result.error },
    ]
  }

  if ('kind' in result) {
    if (result.kind === 'sd' || result.kind === 'sd-frequency') {
      return [
        { title: 'Count observations', detail: `N = ${fmt(result.n)}.` },
        { title: 'Find the mean', detail: `Mean = ${fmt(result.mean)}.` },
        { title: 'Add squared deviations', detail: `sum d^2 = ${fmt(result.sumD2)}.` },
        { title: 'Calculate variance and SD', detail: `Variance = ${fmt(result.variance)}; standard deviation = sqrt(${fmt(result.variance)}) = ${fmt(result.sd)}.` },
      ]
    }
    if (result.kind === 'sd-sums') {
      return result.rows.flatMap((row, index) => [
        { title: `Variable ${index + 1}: find mean`, detail: `Mean = sum X / N = ${fmt(row.mean)}.` },
        { title: `Variable ${index + 1}: find SD`, detail: `Variance = sum X^2 / N - mean^2 = ${fmt(row.variance)}; SD = ${fmt(row.sd)}.` },
      ])
    }
    if (result.kind === 'grouped-sd') {
      return [
        { title: 'Convert classes to midpoints', detail: `Use each class midpoint with its frequency. Total frequency N = ${fmt(result.n)}.` },
        { title: 'Find grouped mean', detail: `Mean = sum(fm) / N = ${fmt(result.sumFx)} / ${fmt(result.n)} = ${fmt(result.mean)}.` },
        { title: 'Find grouped SD', detail: `sum f(m - mean)^2 = ${fmt(result.sumD2)}; SD = ${fmt(result.sd)}.` },
        { title: 'Find coefficient', detail: `Coefficient of variation = SD / Mean x 100 = ${fmt(result.cv)}%.` },
      ]
    }
    if (result.kind === 'index') {
      return [
        { title: 'Calculate price relatives and totals', detail: `Simple aggregative index = sum(P1) / sum(P0) x 100 = ${fmt(result.simpleAggregative)}.` },
        { title: 'Apply weights if given', detail: `Weighted aggregative or Laspeyres value = ${fmt(result.weightedAggregative)}; weighted average relative = ${fmt(result.weightedRelative)}.` },
        { title: 'Use current quantities if required', detail: `Paasche = ${fmt(result.paasche)}; Edgeworth-Marshall = ${fmt(result.edgeworthMarshall)}.` },
        { title: 'Pick the selected answer', detail: `${modeCopy[mode].label} = ${fmt(result.value)}.` },
      ]
    }
    if (result.kind === 'mode') {
      return [
        { title: 'Find modal class', detail: `Highest frequency is fm = ${fmt(result.fm)}. Its lower limit L = ${fmt(result.l)} and class width h = ${fmt(result.h)}.` },
        { title: 'Find neighboring frequencies', detail: `Previous frequency f1 = ${fmt(result.f1)} and next frequency f2 = ${fmt(result.f2)}.` },
        { title: 'Substitute in formula', detail: `Mode = L + [(fm - f1) / (2fm - f1 - f2)]h = ${fmt(result.mode)}.` },
      ]
    }
    if (result.kind === 'spearman') {
      return [
        { title: 'Rank both series', detail: `Assign ranks to both columns and find d = rank X - rank Y for each pair.` },
        { title: 'Square rank differences', detail: `sum d^2 = ${fmt(result.sumD2)} for n = ${result.n}.` },
        { title: 'Apply Spearman formula', detail: `rho = 1 - [6 x ${fmt(result.sumD2)}] / [${result.n}(${result.n}^2 - 1)] = ${fmt(result.rho)}.` },
      ]
    }
    if (result.kind === 'correlation-summary') {
      return [
        { title: 'Use the given summary totals', detail: `sum dx^2 = ${fmt(result.sumX2)}, sum dy^2 = ${fmt(result.sumY2)}, sum dxdy = ${fmt(result.sumXY)}.` },
        { title: 'Calculate correlation', detail: `r = ${fmt(result.sumXY)} / sqrt(${fmt(result.sumX2)} x ${fmt(result.sumY2)}) = ${fmt(result.r)}.` },
        { title: 'Calculate probable error', detail: `PE = 0.6745(1 - r^2) / sqrt(N) = ${fmt(result.probableError)}.` },
      ]
    }
    if (result.kind === 'regression-correlation') {
      return [
        { title: 'Multiply regression coefficients', detail: `bxy x byx = ${fmt(result.bxy)} x ${fmt(result.byx)} = ${fmt(result.product)}.` },
        { title: 'Take square root', detail: `r = +/- sqrt(${fmt(result.product)}) = ${fmt(result.r)}. The sign follows the common sign of the coefficients.` },
      ]
    }
    if (result.kind === 'gm-frequency') {
      return [
        { title: 'Take logs', detail: `Multiply each log(X) by its frequency and add: sum(f log X) = ${fmt(result.sumFLog)}.` },
        { title: 'Divide by total frequency', detail: `N = ${fmt(result.n)}; mean log = ${fmt(result.sumFLog / result.n)}.` },
        { title: 'Take antilog', detail: `Geometric mean = ${fmt(result.gm)}.` },
      ]
    }
  }

  if (mode === 'concurrent' && 'coefficient' in result) {
    return [
      { title: 'Compare movement row by row', detail: `Ignore the first row, then mark each later row as increase or decrease for both series.` },
      { title: 'Count concurrent deviations', detail: `C = ${result.concurrent}; comparisons N = ${result.comparisons}.` },
      { title: 'Apply formula', detail: `Coefficient = +/- sqrt(|2C - N| / N) = ${fmt(result.coefficient)}.` },
    ]
  }

  if (mode === 'trend' && 'trendValues' in result) {
    return [
      { title: 'Code the time series', detail: `Use ${labels[0] || 'X'} around center ${fmt(result.center)} and keep ${labels[1] || 'Y'} as the observed values.` },
      { title: 'Find slope and intercept', detail: `Slope b = ${fmt(result.slope)}; intercept a = ${fmt(result.intercept)}.` },
      { title: 'Write trend equation', detail: `Yc = ${fmt(result.intercept)} + ${fmt(result.slope)}X.` },
      { title: 'Calculate trend values', detail: `Substitute each X value into the equation to get the fitted trend values.` },
    ]
  }

  if ((mode === 'regression-yx' || mode === 'regression-coeff-yx' || mode === 'regression-both') && 'slope' in result && 'slopeXOnY' in result && 'interceptXOnY' in result) {
    const steps = [
      { title: 'Find means', detail: `Mean ${labels[0] || 'X'} = ${fmt(result.meanX)}; Mean ${labels[1] || 'Y'} = ${fmt(result.meanY)}.` },
      { title: 'Calculate deviation sums', detail: `sum dxdy = ${fmt(result.sumXY)}; sum dx^2 = ${fmt(result.sumX2)}; sum dy^2 = ${fmt(result.sumY2)}.` },
      { title: 'Find Y on X equation', detail: `b_yx = ${fmt(result.slope)} and a = ${fmt(result.intercept)}; equation: Y = ${fmt(result.intercept)} + ${fmt(result.slope)}X.` },
    ]
    if (mode === 'regression-both' && 'slopeXOnY' in result && 'interceptXOnY' in result) steps.push({ title: 'Find X on Y equation', detail: `b_xy = ${fmt(result.slopeXOnY)} and a = ${fmt(result.interceptXOnY)}; equation: X = ${fmt(result.interceptXOnY)} + ${fmt(result.slopeXOnY)}Y.` })
    return steps
  }

  return [
    { title: 'Find means', detail: `Mean ${labels[0] || 'X'} = ${fmt(result.meanX)}; Mean ${labels[1] || 'Y'} = ${fmt(result.meanY)}.` },
    { title: 'Calculate deviation totals', detail: `sum dxdy = ${fmt(result.sumXY)}, sum dx^2 = ${fmt(result.sumX2)}, sum dy^2 = ${fmt(result.sumY2)}.` },
    { title: 'Apply Pearson formula', detail: `r = ${fmt(result.sumXY)} / sqrt(${fmt(result.sumX2)} x ${fmt(result.sumY2)}) = ${fmt(result.r)}.` },
    { title: 'Interpret answer', detail: interpret(mode, result.r) },
  ]
}

function ResultPanel({ result, mode, labels }: { result: ReturnType<typeof solve>; mode: SolverMode; labels: [string, string, string, string] }) {
  if ('error' in result) {
    return <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{result.error}</section>
  }

  if ('kind' in result && (result.kind === 'sd' || result.kind === 'sd-frequency')) return <SdResult result={result} />
  if ('kind' in result && result.kind === 'sd-sums') return <SdSumsResult result={result} />
  if ('kind' in result && result.kind === 'grouped-sd') return <GroupedSdResult result={result} />
  if ('kind' in result && result.kind === 'index') return <IndexResult result={result} mode={mode} />
  if ('kind' in result && result.kind === 'mode') return <ModeResult result={result} />
  if ('kind' in result && result.kind === 'spearman') return <SpearmanResult result={result} />
  if ('kind' in result && result.kind === 'correlation-summary') return <CorrelationSummaryResult result={result} />
  if ('kind' in result && result.kind === 'regression-correlation') return <RegressionCorrelationResult result={result} />
  if ('kind' in result && result.kind === 'gm-frequency') return <GeometricMeanResult result={result} />

  const trendResult = mode === 'trend' && 'trendValues' in result ? result : null
  const concurrentResult = mode === 'concurrent' && 'coefficient' in result ? result : null
  const regressionResult = (mode === 'regression-yx' || mode === 'regression-coeff-yx' || mode === 'regression-both') && 'slope' in result && 'intercept' in result && 'slopeXOnY' in result && 'interceptXOnY' in result ? result : null

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 size={17} className="text-emerald-500" />
        <h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="n" value={result.n} detail={`${labels[0] || 'X'} values: ${fmtList(result.x)}. ${labels[1] || 'Y'} values: ${fmtList(result.y)}. Valid paired rows = ${result.n}.`} />
        <Metric label={`Mean ${labels[0] || 'X'}`} value={fmt(result.meanX)} detail={`sum ${labels[0] || 'X'} = ${fmtList(result.x)} = ${fmt(result.sumX)}; mean = ${fmt(result.sumX)} / ${result.n} = ${fmt(result.meanX)}.`} />
        <Metric label={`Mean ${labels[1] || 'Y'}`} value={fmt(result.meanY)} detail={`sum ${labels[1] || 'Y'} = ${fmtList(result.y)} = ${fmt(result.sumY)}; mean = ${fmt(result.sumY)} / ${result.n} = ${fmt(result.meanY)}.`} />
        {!concurrentResult && !trendResult && <Metric label="Pearson r" value={fmt(result.r)} detail={`dxdy values: ${fmtList(result.dxdy)} = ${fmt(result.sumXY)}. dx^2 values: ${fmtList(result.dx2)} = ${fmt(result.sumX2)}. dy^2 values: ${fmtList(result.dy2)} = ${fmt(result.sumY2)}. r = ${fmt(result.sumXY)} / sqrt(${fmt(result.sumX2)} x ${fmt(result.sumY2)}) = ${fmt(result.r)}.`} />}
        {concurrentResult && <Metric label="Concurrent coefficient" value={fmt(concurrentResult.coefficient)} detail={`Input pairs: ${result.x.map((value, index) => `(${fmt(value)}, ${fmt(result.y[index])})`).join(', ')}. Same-direction changes C = ${concurrentResult.concurrent}; usable comparisons N = ${concurrentResult.comparisons}; coefficient = +/- sqrt(|2C - N| / N) = ${fmt(concurrentResult.coefficient)}.`} />}
        {trendResult && <Metric label="Trend equation" value={`Yc = ${fmt(trendResult.intercept)} + ${fmt(trendResult.slope)}X`} detail={`Using years ${fmtList(result.x)} and values ${fmtList(result.y)}. Center = ${fmt(trendResult.center)}; slope b = ${fmt(trendResult.slope)}; intercept a = ${fmt(result.meanY)} - ${fmt(trendResult.slope)} x ${fmt(trendResult.center)} = ${fmt(trendResult.intercept)}.`} />}
        {regressionResult && <Metric label="Regression equation" value={`Y = ${fmt(regressionResult.intercept)} + ${fmt(regressionResult.slope)}X`} detail={`From input X: ${fmtList(result.x)} and Y: ${fmtList(result.y)}. b_yx = sum(dxdy) / sum(dx^2) = ${fmt(result.sumXY)} / ${fmt(result.sumX2)} = ${fmt(regressionResult.slope)}; a = ${fmt(result.meanY)} - ${fmt(regressionResult.slope)} x ${fmt(result.meanX)} = ${fmt(regressionResult.intercept)}.`} />}
        {mode === 'regression-both' && regressionResult && <Metric label="X on Y equation" value={`X = ${fmt(regressionResult.interceptXOnY)} + ${fmt(regressionResult.slopeXOnY)}Y`} detail={`b_xy = sum(dxdy) / sum(dy^2) = ${fmt(result.sumXY)} / ${fmt(result.sumY2)} = ${fmt(regressionResult.slopeXOnY)}; a = ${fmt(result.meanX)} - ${fmt(regressionResult.slopeXOnY)} x ${fmt(result.meanY)} = ${fmt(regressionResult.interceptXOnY)}.`} />}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Working</p>
        <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {!concurrentResult && <li>sum(dxdy) = {fmt(result.sumXY)}, sum(dx^2) = {fmt(result.sumX2)}, sum(dy^2) = {fmt(result.sumY2)}.</li>}
          {mode === 'pearson' && <li>r = {fmt(result.sumXY)} / sqrt({fmt(result.sumX2)} x {fmt(result.sumY2)}) = {fmt(result.r)}.</li>}
          {concurrentResult && <li>C = {concurrentResult.concurrent}, N = {concurrentResult.comparisons}; coefficient = +/- sqrt(|2C - N| / N) = {fmt(concurrentResult.coefficient)}.</li>}
          {trendResult && <li>Least-squares line: Yc = {fmt(trendResult.intercept)} + {fmt(trendResult.slope)}X. With centered years, Yc = {fmt(trendResult.centeredIntercept)} + {fmt(trendResult.centeredSlope)}x.</li>}
          {regressionResult && <li>b_yx = sum(dxdy) / sum(dx^2) = {fmt(regressionResult.slope)}; a = mean(Y) - b mean(X) = {fmt(regressionResult.intercept)}.</li>}
          {mode === 'regression-both' && regressionResult && <li>b_xy = sum(dxdy) / sum(dy^2) = {fmt(regressionResult.slopeXOnY)}; X = {fmt(regressionResult.interceptXOnY)} + {fmt(regressionResult.slopeXOnY)}Y.</li>}
          <li>{interpret(mode, concurrentResult ? concurrentResult.coefficient : result.r)}</li>
        </ol>
      </div>

      {trendResult && (
        <div className="mt-4 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900"><tr><th className="px-3 py-2 text-left">S.no</th><th className="px-3 py-2 text-left">Trend value</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {trendResult.trendValues.map((value, index) => <tr key={index}><td className="px-3 py-2">{index + 1}</td><td className="px-3 py-2">{fmt(value)}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function interpret(mode: SolverMode, value: number) {
  if (mode === 'trend') return 'Trend values show the fitted straight-line movement over time.'
  const strength = Math.abs(value) >= 0.8 ? 'strong' : Math.abs(value) >= 0.5 ? 'moderate' : 'weak'
  const direction = value >= 0 ? 'positive' : 'negative'
  return `Interpretation: ${strength} ${direction} relationship.`
}

function SdResult({ result }: { result: ReturnType<typeof solveSdRaw> | ReturnType<typeof solveSdFrequency> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="N" value={fmt(result.n)} detail={result.kind === 'sd-frequency' ? `Frequencies: ${fmtList(result.f)}; N = ${fmtList(result.f)} = ${fmt(result.n)}.` : `Values: ${fmtList(result.x)}; N = ${result.x.length}.`} />
        <Metric label="Mean" value={fmt(result.mean)} detail={result.kind === 'sd-frequency' ? `fx values: ${fmtList(result.fx)} = ${fmt(result.sumFx)}; mean = ${fmt(result.sumFx)} / ${fmt(result.n)} = ${fmt(result.mean)}.` : `sum X = ${fmtList(result.x)} = ${fmt(result.sumX)}; mean = ${fmt(result.sumX)} / ${fmt(result.n)} = ${fmt(result.mean)}.`} />
        <Metric label="Variance" value={fmt(result.variance)} detail={result.kind === 'sd-frequency' ? `f(x - mean)^2 values: ${fmtList(result.fd2)} = ${fmt(result.sumD2)}; variance = ${fmt(result.sumD2)} / ${fmt(result.n)} = ${fmt(result.variance)}.` : `(x - mean)^2 values: ${fmtList(result.d2)} = ${fmt(result.sumD2)}; variance = ${fmt(result.sumD2)} / ${fmt(result.n)} = ${fmt(result.variance)}.`} />
        <Metric label="Standard deviation" value={fmt(result.sd)} detail={`Standard deviation = sqrt(${fmt(result.variance)}) = ${fmt(result.sd)}.`} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        sum of squared deviations = {fmt(result.sumD2)}; standard deviation = sqrt({fmt(result.variance)}) = {fmt(result.sd)}.
      </div>
    </section>
  )
}

function SdSumsResult({ result }: { result: ReturnType<typeof solveSdFromSums> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {result.rows.map((row, index) => (
          <div key={index} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Variable {index + 1}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Metric label="Mean" value={fmt(row.mean)} detail={`Input sum X = ${fmt(row.sumX)}, N = ${fmt(row.n)}; mean = ${fmt(row.sumX)} / ${fmt(row.n)} = ${fmt(row.mean)}.`} />
              <Metric label="Variance" value={fmt(row.variance)} detail={`Input sum X^2 = ${fmt(row.sumX2)}; variance = (${fmt(row.sumX2)} / ${fmt(row.n)}) - ${fmt(row.mean)}^2 = ${fmt(row.variance)}.`} />
              <Metric label="SD" value={fmt(row.sd)} detail={`SD = sqrt(${fmt(row.variance)}) = ${fmt(row.sd)}.`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function GroupedSdResult({ result }: { result: ReturnType<typeof solveClassFrequencySd> | ReturnType<typeof solveLessThanCumulativeSd> | ReturnType<typeof solveMoreThanCumulativeSd> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="N" value={fmt(result.n)} detail={`Frequencies used: ${fmtList(result.frequency)}; N = ${fmtList(result.frequency)} = ${fmt(result.n)}.`} />
        <Metric label="Mean" value={fmt(result.mean)} detail={`Midpoints: ${fmtList(result.midpoints)}. f x midpoint values: ${fmtList(result.fx)} = ${fmt(result.sumFx)}; mean = ${fmt(result.sumFx)} / ${fmt(result.n)} = ${fmt(result.mean)}.`} />
        <Metric label="Variance" value={fmt(result.variance)} detail={`f(midpoint - mean)^2 values: ${fmtList(result.fd2)} = ${fmt(result.sumD2)}; variance = ${fmt(result.sumD2)} / ${fmt(result.n)} = ${fmt(result.variance)}.`} />
        <Metric label="SD" value={fmt(result.sd)} detail={`SD = sqrt(${fmt(result.variance)}) = ${fmt(result.sd)}.`} />
        <Metric label="Coefficient" value={`${fmt(result.cv)}%`} detail={`Coefficient of variation = SD / Mean x 100 = ${fmt(result.cv)}%.`} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        Uses class midpoints and frequencies. Coefficient means coefficient of variation: SD / Mean x 100.
      </div>
    </section>
  )
}

function IndexResult({ result, mode }: { result: ReturnType<typeof solveIndex>; mode: SolverMode }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Index number" value={fmt(result.value)} detail={`Selected method is ${modeCopy[mode].label}. Base prices: ${fmtList(result.p0)}; current prices: ${fmtList(result.p1)}; calculated value = ${fmt(result.value)}.`} />
        <Metric label="Simple aggregative" value={fmt(result.simpleAggregative)} detail={`sum P0 = ${fmtList(result.p0)} = ${fmt(result.sumP0)}. sum P1 = ${fmtList(result.p1)} = ${fmt(result.sumP1)}. Index = ${fmt(result.sumP1)} / ${fmt(result.sumP0)} x 100 = ${fmt(result.simpleAggregative)}.`} />
        <Metric label="Simple avg relatives" value={fmt(result.simpleRelative)} detail={`Price relatives P1/P0 x 100: ${fmtList(result.relatives)}. Average = ${fmt(result.simpleRelative)}.`} />
        <Metric label="Fisher" value={fmt(result.fisher)} detail={`Using base quantities ${fmtList(result.w)} and current quantities ${fmtList(result.q1)}. Fisher = sqrt(Laspeyres x Paasche) = sqrt(${fmt(result.laspeyres)} x ${fmt(result.paasche)}) = ${fmt(result.fisher)}.`} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Weighted aggregative / Laspeyres" value={fmt(result.weightedAggregative)} detail={`Weights/base quantities W: ${fmtList(result.w)}. P1W = ${fmtPairs(result.p1, result.w)} = ${fmt(sumProduct(result.p1, result.w))}; P0W = ${fmtPairs(result.p0, result.w)} = ${fmt(sumProduct(result.p0, result.w))}; index = ${fmt(result.weightedAggregative)}.`} />
        <Metric label="Weighted avg relatives" value={fmt(result.weightedRelative)} detail={`Relatives: ${fmtList(result.relatives)}; weights: ${fmtList(result.w)}. sum(RW) = ${fmt(sumProduct(result.relatives, result.w))}; sum(W) = ${fmt(result.w.reduce((sum, value) => sum + value, 0))}; weighted relative = ${fmt(result.weightedRelative)}.`} />
        <Metric label="Paasche" value={fmt(result.paasche)} detail={`Current quantities Q1: ${fmtList(result.q1)}. P1Q1 = ${fmtPairs(result.p1, result.q1)} = ${fmt(sumProduct(result.p1, result.q1))}; P0Q1 = ${fmtPairs(result.p0, result.q1)} = ${fmt(sumProduct(result.p0, result.q1))}; Paasche = ${fmt(result.paasche)}.`} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Metric label="Edgeworth-Marshall" value={fmt(result.edgeworthMarshall)} detail={`Use P0 ${fmtList(result.p0)}, P1 ${fmtList(result.p1)}, Q0 ${fmtList(result.w)}, Q1 ${fmtList(result.q1)}. sum[P1(Q0 + Q1)] / sum[P0(Q0 + Q1)] x 100 = ${fmt(result.edgeworthMarshall)}.`} />
        <Metric label="Quantity Laspeyres" value={fmt(result.quantityLaspeyres)} detail={`Q1P0 = ${fmtPairs(result.q1, result.p0)} = ${fmt(sumProduct(result.q1, result.p0))}; Q0P0 = ${fmtPairs(result.w, result.p0)} = ${fmt(sumProduct(result.w, result.p0))}; index = ${fmt(result.quantityLaspeyres)}.`} />
        <Metric label="Quantity Paasche" value={fmt(result.quantityPaasche)} detail={`Q1P1 = ${fmtPairs(result.q1, result.p1)} = ${fmt(sumProduct(result.q1, result.p1))}; Q0P1 = ${fmtPairs(result.w, result.p1)} = ${fmt(sumProduct(result.w, result.p1))}; index = ${fmt(result.quantityPaasche)}.`} />
        <Metric label="Quantity Fisher" value={fmt(result.quantityFisher)} detail={`sqrt(quantity Laspeyres x quantity Paasche) = sqrt(${fmt(result.quantityLaspeyres)} x ${fmt(result.quantityPaasche)}) = ${fmt(result.quantityFisher)}.`} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        Selected method: {modeCopy[mode].label}. Index above 100 means the current price level is higher than the base level; below 100 means lower.
      </div>
    </section>
  )
}

function ModeResult({ result }: { result: ReturnType<typeof solveGroupedMode> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Modal class lower L" value={fmt(result.l)} detail={`Classes: ${result.lower.map((value, index) => `${fmt(value)}-${fmt(result.upper[index])}`).join(', ')}. Frequencies: ${fmtList(result.frequency)}. Highest frequency is at class ${fmt(result.lower[result.modalIndex])}-${fmt(result.upper[result.modalIndex])}, so L = ${fmt(result.l)}.`} />
        <Metric label="Class width h" value={fmt(result.h)} detail={`Modal class upper - lower = ${fmt(result.upper[result.modalIndex])} - ${fmt(result.lower[result.modalIndex])} = ${fmt(result.h)}.`} />
        <Metric label="fm, f1, f2" value={`${fmt(result.fm)}, ${fmt(result.f1)}, ${fmt(result.f2)}`} detail={`From frequencies ${fmtList(result.frequency)}: modal frequency fm = ${fmt(result.fm)}, previous f1 = ${fmt(result.f1)}, next f2 = ${fmt(result.f2)}.`} />
        <Metric label="Mode" value={fmt(result.mode)} detail={`Mode = ${fmt(result.l)} + [(${fmt(result.fm)} - ${fmt(result.f1)}) / (2 x ${fmt(result.fm)} - ${fmt(result.f1)} - ${fmt(result.f2)})] x ${fmt(result.h)} = ${fmt(result.mode)}.`} />
      </div>
    </section>
  )
}

function SpearmanResult({ result }: { result: ReturnType<typeof solveSpearmanRank> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="n" value={result.n} detail={`Input X: ${fmtList(result.x)}. Input Y: ${fmtList(result.y)}. Paired ranks count = ${result.n}.`} />
        <Metric label="sum d^2" value={fmt(result.sumD2)} detail={`Rank X: ${fmtList(result.rankX)}. Rank Y: ${fmtList(result.rankY)}. d^2 values: ${fmtList(result.d2)} = ${fmt(result.sumD2)}.`} />
        <Metric label="Spearman rho" value={fmt(result.rho)} detail={`Using sum d^2 = ${fmt(result.sumD2)} and n = ${result.n}: rho = 1 - [6 x ${fmt(result.sumD2)}] / [${result.n}(${result.n}^2 - 1)] = ${fmt(result.rho)}.`} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        rho = 1 - [6 x {fmt(result.sumD2)}] / [{result.n}({result.n}^2 - 1)] = {fmt(result.rho)}.
      </div>
    </section>
  )
}

function RegressionCorrelationResult({ result }: { result: ReturnType<typeof solveCorrelationFromRegressionCoefficients> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="bxy" value={fmt(result.bxy)} detail={`Input first row bxy = ${fmt(result.bxy)}.`} />
        <Metric label="byx" value={fmt(result.byx)} detail={`Input first row byx = ${fmt(result.byx)}.`} />
        <Metric label="bxy x byx" value={fmt(result.product)} detail={`${fmt(result.bxy)} x ${fmt(result.byx)} = ${fmt(result.product)}.`} />
        <Metric label="Correlation r" value={fmt(result.r)} detail={`r = +/- sqrt(${fmt(result.product)}) = ${fmt(result.r)}.`} />
      </div>
    </section>
  )
}

function CorrelationSummaryResult({ result }: { result: ReturnType<typeof solveCorrelationSummary> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="sum dxdy" value={fmt(result.sumXY)} detail={`Input summary value sum dxdy = ${fmt(result.sumXY)}.`} />
        <Metric label="sum dx^2" value={fmt(result.sumX2)} detail={`Input summary value sum dx^2 = ${fmt(result.sumX2)}.`} />
        <Metric label="sum dy^2" value={fmt(result.sumY2)} detail={`Input summary value sum dy^2 = ${fmt(result.sumY2)}.`} />
        <Metric label="Correlation r" value={fmt(result.r)} detail={`r = ${fmt(result.sumXY)} / sqrt(${fmt(result.sumX2)} x ${fmt(result.sumY2)}) = ${fmt(result.r)}.`} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Metric label="N" value={fmt(result.n)} detail={`Input summary N = ${fmt(result.n)}.`} />
        <Metric label="Probable error" value={fmt(result.probableError)} detail={`Using r = ${fmt(result.r)} and N = ${fmt(result.n)}: PE = 0.6745(1 - r^2) / sqrt(N) = ${fmt(result.probableError)}.`} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
        r = {fmt(result.sumXY)} / sqrt({fmt(result.sumX2)} x {fmt(result.sumY2)}) = {fmt(result.r)}.
      </div>
    </section>
  )
}

function GeometricMeanResult({ result }: { result: ReturnType<typeof solveGeometricMeanFrequency> }) {
  if ('error' in result) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /><h2 className="font-bold text-slate-800 dark:text-white">Calculated Answer</h2></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="N" value={fmt(result.n)} detail={`Frequencies: ${fmtList(result.f)}; N = ${fmtList(result.f)} = ${fmt(result.n)}.`} />
        <Metric label="sum(f log X)" value={fmt(result.sumFLog)} detail={`X values: ${fmtList(result.x)}. f log X values: ${fmtList(result.fLogX)} = ${fmt(result.sumFLog)}.`} />
        <Metric label="Geometric mean" value={fmt(result.gm)} detail={`GM = antilog(${fmt(result.sumFLog)} / ${fmt(result.n)}) = ${fmt(result.gm)}.`} />
      </div>
    </section>
  )
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  const [open, setOpen] = useState(false)
  const content = (
    <>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="break-words text-sm font-bold text-slate-800 dark:text-white">{value}</p>
      {open && detail && <p className="mt-2 border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-300">{detail}</p>}
    </>
  )
  if (detail) {
    return (
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        title="Click to show how this value was calculated"
      >
        {content}
      </button>
    )
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      {content}
    </div>
  )
}
