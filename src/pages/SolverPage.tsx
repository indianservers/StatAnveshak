import { useMemo, useState } from 'react'
import { BookOpenCheck, Calculator, CheckCircle2, ClipboardList, Grid3X3, RotateCcw, Sigma } from 'lucide-react'

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

type PresetCategory = 'Correlation & Regression' | 'Standard Deviation & Averages' | 'Index Numbers'

const CATEGORY_ORDER: PresetCategory[] = ['Correlation & Regression', 'Standard Deviation & Averages', 'Index Numbers']

function categoryForMode(mode: SolverMode): PresetCategory {
  if (mode.startsWith('index-') || mode === 'quantity-index-fisher') return 'Index Numbers'
  if (mode.startsWith('sd-') || mode === 'mode-grouped' || mode === 'geometric-mean-frequency') return 'Standard Deviation & Averages'
  return 'Correlation & Regression'
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
const emptyRow = (): SolverRow => ({ x: '', y: '', z: '', q: '' })
const rowsFromPreset = (preset: Preset): SolverRow[] => preset.rows.map((row) => ({ x: String(row[0] ?? ''), y: String(row[1] ?? ''), z: String(row[2] ?? ''), q: String(row[3] ?? '') }))

export function SolverPage() {
  const first = presets[2]
  const [mode, setMode] = useState<SolverMode>(first.mode)
  const [labels, setLabels] = useState<[string, string, string, string]>([first.labels[0], first.labels[1], first.labels[2] ?? '', first.labels[3] ?? ''])
  const [rows, setRows] = useState(rowsFromPreset(first))

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
  const groupedPresets = useMemo(() => CATEGORY_ORDER.map((category) => ({
    category,
    items: presets.filter((preset) => categoryForMode(preset.mode) === category),
  })), [])

  const loadPreset = (preset: Preset) => {
    setMode(preset.mode)
    setLabels([preset.labels[0], preset.labels[1], preset.labels[2] ?? '', preset.labels[3] ?? ''])
    setRows(rowsFromPreset(preset))
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
              <Metric label="Presets" value={presets.length} />
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
                {groupedPresets.map(({ category, items }) => (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</p>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{items.length} examples</span>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                      {items.map((preset) => (
                        <button key={preset.id} onClick={() => loadPreset(preset)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                          <span className="block font-medium">{preset.title}</span>
                          <span className="text-xs text-slate-400">{modeCopy[preset.mode].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <main className="space-y-5">
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
  const meanX = x.reduce((sum, value) => sum + value, 0) / n
  const meanY = y.reduce((sum, value) => sum + value, 0) / n
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0
  x.forEach((value, index) => {
    const dx = value - meanX
    const dy = y[index] - meanY
    sumXY += dx * dy
    sumX2 += dx * dx
    sumY2 += dy * dy
  })
  const r = sumXY / Math.sqrt(sumX2 * sumY2)
  return { n, meanX, meanY, sumXY, sumX2, sumY2, r }
}

function solveSdRaw(x: number[]) {
  if (x.length < 2) return { error: 'Enter at least two values.' }
  const n = x.length
  const mean = x.reduce((sum, value) => sum + value, 0) / n
  const sumD2 = x.reduce((sum, value) => sum + (value - mean) ** 2, 0)
  const variance = sumD2 / n
  return { kind: 'sd' as const, n, mean, sumD2, variance, sd: Math.sqrt(variance) }
}

function solveSdFrequency(x: number[], f: number[]) {
  if (x.length !== f.length || x.length < 2) return { error: 'Enter valid value-frequency pairs.' }
  const n = f.reduce((sum, value) => sum + value, 0)
  const sumFx = x.reduce((sum, value, index) => sum + value * f[index], 0)
  const mean = sumFx / n
  const sumFd2 = x.reduce((sum, value, index) => sum + f[index] * (value - mean) ** 2, 0)
  const variance = sumFd2 / n
  return { kind: 'sd-frequency' as const, n, mean, sumFx, sumD2: sumFd2, variance, sd: Math.sqrt(variance) }
}

function solveSdFromSums(sumX: number[], sumX2: number[], nValues: number[]) {
  if (sumX.length < 1 || sumX.length !== sumX2.length || sumX.length !== nValues.length) return { error: 'Enter sum X, sum X^2, and N for each row.' }
  const rows = sumX.map((sx, index) => {
    const n = nValues[index]
    const mean = sx / n
    const variance = sumX2[index] / n - mean ** 2
    return { n, mean, variance, sd: Math.sqrt(Math.max(0, variance)) }
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
  const sumFx = x.reduce((sum, value, index) => sum + value * f[index], 0)
  const mean = sumFx / n
  const sumD2 = x.reduce((sum, value, index) => sum + f[index] * (value - mean) ** 2, 0)
  const variance = sumD2 / n
  const sd = Math.sqrt(variance)
  const cv = mean ? sd / mean * 100 : NaN
  return { n, mean, sumFx, sumD2, variance, sd, cv }
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
  return { kind: 'index' as const, n: p0.length, sumP0, sumP1, simpleAggregative, simpleRelative, weightedAggregative, weightedRelative: weighted, laspeyres, paasche, fisher, edgeworthMarshall, quantityLaspeyres, quantityPaasche, quantityFisher, value, relatives }
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
  return { kind: 'mode' as const, modalIndex, l, h, fm, f1, f2, mode }
}

function solveSpearmanRank(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return { error: 'Enter at least two valid paired rows.' }
  const rankX = ranksDescending(x)
  const rankY = ranksDescending(y)
  const d2 = rankX.map((rank, index) => (rank - rankY[index]) ** 2)
  const sumD2 = d2.reduce((sum, value) => sum + value, 0)
  const n = x.length
  const rho = 1 - (6 * sumD2) / (n * (n ** 2 - 1))
  return { kind: 'spearman' as const, n, rankX, rankY, d2, sumD2, rho }
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
  return { kind: 'gm-frequency' as const, n, sumFLog, gm }
}

function sumProduct(a: number[], b: number[]) {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0)
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
        <Metric label="n" value={result.n} />
        <Metric label={`Mean ${labels[0] || 'X'}`} value={fmt(result.meanX)} />
        <Metric label={`Mean ${labels[1] || 'Y'}`} value={fmt(result.meanY)} />
        {!concurrentResult && !trendResult && <Metric label="Pearson r" value={fmt(result.r)} />}
        {concurrentResult && <Metric label="Concurrent coefficient" value={fmt(concurrentResult.coefficient)} />}
        {trendResult && <Metric label="Trend equation" value={`Yc = ${fmt(trendResult.intercept)} + ${fmt(trendResult.slope)}X`} />}
        {regressionResult && <Metric label="Regression equation" value={`Y = ${fmt(regressionResult.intercept)} + ${fmt(regressionResult.slope)}X`} />}
        {mode === 'regression-both' && regressionResult && <Metric label="X on Y equation" value={`X = ${fmt(regressionResult.interceptXOnY)} + ${fmt(regressionResult.slopeXOnY)}Y`} />}
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
        <Metric label="N" value={fmt(result.n)} />
        <Metric label="Mean" value={fmt(result.mean)} />
        <Metric label="Variance" value={fmt(result.variance)} />
        <Metric label="Standard deviation" value={fmt(result.sd)} />
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
              <Metric label="Mean" value={fmt(row.mean)} />
              <Metric label="Variance" value={fmt(row.variance)} />
              <Metric label="SD" value={fmt(row.sd)} />
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
        <Metric label="N" value={fmt(result.n)} />
        <Metric label="Mean" value={fmt(result.mean)} />
        <Metric label="Variance" value={fmt(result.variance)} />
        <Metric label="SD" value={fmt(result.sd)} />
        <Metric label="Coefficient" value={`${fmt(result.cv)}%`} />
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
        <Metric label="Index number" value={fmt(result.value)} />
        <Metric label="Simple aggregative" value={fmt(result.simpleAggregative)} />
        <Metric label="Simple avg relatives" value={fmt(result.simpleRelative)} />
        <Metric label="Fisher" value={fmt(result.fisher)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Weighted aggregative / Laspeyres" value={fmt(result.weightedAggregative)} />
        <Metric label="Weighted avg relatives" value={fmt(result.weightedRelative)} />
        <Metric label="Paasche" value={fmt(result.paasche)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Metric label="Edgeworth-Marshall" value={fmt(result.edgeworthMarshall)} />
        <Metric label="Quantity Laspeyres" value={fmt(result.quantityLaspeyres)} />
        <Metric label="Quantity Paasche" value={fmt(result.quantityPaasche)} />
        <Metric label="Quantity Fisher" value={fmt(result.quantityFisher)} />
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
        <Metric label="Modal class lower L" value={fmt(result.l)} />
        <Metric label="Class width h" value={fmt(result.h)} />
        <Metric label="fm, f1, f2" value={`${fmt(result.fm)}, ${fmt(result.f1)}, ${fmt(result.f2)}`} />
        <Metric label="Mode" value={fmt(result.mode)} />
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
        <Metric label="n" value={result.n} />
        <Metric label="sum d^2" value={fmt(result.sumD2)} />
        <Metric label="Spearman rho" value={fmt(result.rho)} />
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
        <Metric label="bxy" value={fmt(result.bxy)} />
        <Metric label="byx" value={fmt(result.byx)} />
        <Metric label="bxy x byx" value={fmt(result.product)} />
        <Metric label="Correlation r" value={fmt(result.r)} />
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
        <Metric label="sum dxdy" value={fmt(result.sumXY)} />
        <Metric label="sum dx^2" value={fmt(result.sumX2)} />
        <Metric label="sum dy^2" value={fmt(result.sumY2)} />
        <Metric label="Correlation r" value={fmt(result.r)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Metric label="N" value={fmt(result.n)} />
        <Metric label="Probable error" value={fmt(result.probableError)} />
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
        <Metric label="N" value={fmt(result.n)} />
        <Metric label="sum(f log X)" value={fmt(result.sumFLog)} />
        <Metric label="Geometric mean" value={fmt(result.gm)} />
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="break-words text-sm font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  )
}
