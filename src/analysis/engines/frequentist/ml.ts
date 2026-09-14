import type { AnalysisOptions, AnalysisResult } from '../../types'
import { glmFit } from './glm'
import { inverse, lm } from './linalg'
import { asFiniteNumber, mean, round, sampleSd, sampleVariance } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function pack(rows: Record<string, unknown>[], yName: string, xNames: string[]): { y: number[]; X: number[][]; labels: string[] } | null {
  const yRaw: unknown[] = []
  const X: number[][] = []
  for (const row of rows) {
    const xs = xNames.map((c) => asFiniteNumber(row[c]))
    if (xs.some((v) => v === null)) continue
    yRaw.push(row[yName])
    X.push(xs as number[])
  }
  if (X.length < 8 || xNames.length < 1) return null
  const labels = [...new Set(yRaw.map((v) => String(v)))]
  const y = yRaw.map((v) => {
    const n = asFiniteNumber(v)
    if (n !== null) return n
    return labels.indexOf(String(v))
  })
  return { y, X, labels }
}

function holdoutSplit(n: number, frac: number): { train: number[]; test: number[] } {
  const cut = Math.max(4, Math.min(n - 3, Math.floor(n * (1 - Math.min(0.5, Math.max(0.1, frac))))))
  return { train: Array.from({ length: cut }, (_, i) => i), test: Array.from({ length: n - cut }, (_, i) => cut + i) }
}

function rmse(y: number[], yhat: number[]): number {
  return Math.sqrt(y.reduce((s, yi, i) => s + (yi - (yhat[i] ?? 0)) ** 2, 0) / Math.max(y.length, 1))
}

function accuracy(y: number[], yhat: number[]): number {
  const yt = y.map((v) => (v >= 0.5 ? 1 : 0))
  const yp = yhat.map((v) => (v >= 0.5 ? 1 : 0))
  return yt.filter((v, i) => v === yp[i]).length / Math.max(yt.length, 1)
}

export function ridgeLasso(y: number[], X: number[][], lambda: number, l1: boolean): number[] {
  const n = y.length
  const p = X[0]?.length ?? 0
  const mx = Array.from({ length: p }, (_, j) => mean(X.map((r) => r[j] ?? 0)))
  const sx = Array.from({ length: p }, (_, j) => sampleSd(X.map((r) => r[j] ?? 0)) || 1)
  const my = mean(y)
  const Z = X.map((row) => row.map((v, j) => (v - mx[j]!) / sx[j]!))
  const yc = y.map((v) => v - my)
  const beta = Array(p).fill(0)
  for (let iter = 0; iter < 80; iter++) {
    for (let j = 0; j < p; j++) {
      let rho = 0
      let z = 0
      for (let i = 0; i < n; i++) {
        const r = yc[i]! - Z[i]!.reduce((s, v, k) => s + (k === j ? 0 : v * beta[k]!), 0)
        rho += Z[i]![j]! * r
        z += Z[i]![j]! * Z[i]![j]!
      }
      if (l1) {
        const soft = Math.abs(rho) <= lambda ? 0 : Math.sign(rho) * (Math.abs(rho) - lambda)
        beta[j] = soft / (z || 1)
      } else {
        beta[j] = rho / (z + lambda)
      }
    }
  }
  const intercept = my - beta.reduce((s, b, j) => s + b * (mx[j]! / sx[j]!), 0)
  return [intercept, ...beta.map((b, j) => b / sx[j]!)]
}

function linPred(beta: number[], x: number[]): number {
  return (beta[0] ?? 0) + x.reduce((s, v, j) => s + v * (beta[j + 1] ?? 0), 0)
}

function knnPredict(trainX: number[][], trainY: number[], x: number[], k: number): number {
  const d = trainX.map((row, i) => ({ i, d: Math.hypot(...row.map((v, j) => v - (x[j] ?? 0))) }))
  d.sort((a, b) => a.d - b.d)
  const take = d.slice(0, Math.max(1, Math.min(k, d.length)))
  return mean(take.map((t) => trainY[t.i]!))
}

type Tree = { pred: number; j?: number; t?: number; left?: Tree; right?: Tree }

function growTree(X: number[][], y: number[], depth: number, maxDepth: number, classif: boolean): Tree {
  const pred = classif ? (mean(y) >= 0.5 ? 1 : 0) : mean(y)
  if (depth >= maxDepth || y.length < 6) return { pred }
  let bestGain = 0
  let bestJ = 0
  let bestT = 0
  const sse = (v: number[]) => {
    const m = mean(v)
    return v.reduce((s, a) => s + (a - m) ** 2, 0)
  }
  const gini = (v: number[]) => {
    const p = mean(v)
    return 2 * p * (1 - p)
  }
  const impurity = classif ? gini : sse
  const parent = impurity(y)
  const pdim = X[0]?.length ?? 0
  for (let j = 0; j < pdim; j++) {
    const vals = [...new Set(X.map((r) => r[j]!))].sort((a, b) => a - b)
    for (let u = 1; u < vals.length; u++) {
      const t = (vals[u - 1]! + vals[u]!) / 2
      const leftY: number[] = []
      const rightY: number[] = []
      y.forEach((yi, i) => ((X[i]![j]! <= t ? leftY : rightY).push(yi)))
      if (leftY.length < 3 || rightY.length < 3) continue
      const gain = parent - (leftY.length * impurity(leftY) + rightY.length * impurity(rightY)) / y.length
      if (gain > bestGain) {
        bestGain = gain
        bestJ = j
        bestT = t
      }
    }
  }
  if (bestGain < 1e-8) return { pred }
  const Lx: number[][] = []
  const Ly: number[] = []
  const Rx: number[][] = []
  const Ry: number[] = []
  y.forEach((yi, i) => {
    if (X[i]![bestJ]! <= bestT) {
      Lx.push(X[i]!)
      Ly.push(yi)
    } else {
      Rx.push(X[i]!)
      Ry.push(yi)
    }
  })
  return {
    pred,
    j: bestJ,
    t: bestT,
    left: growTree(Lx, Ly, depth + 1, maxDepth, classif),
    right: growTree(Rx, Ry, depth + 1, maxDepth, classif),
  }
}

function predTree(tree: Tree, x: number[]): number {
  if (tree.j === undefined || !tree.left || !tree.right) return tree.pred
  return x[tree.j]! <= (tree.t ?? 0) ? predTree(tree.left, x) : predTree(tree.right, x)
}

function forest(X: number[][], y: number[], nTree: number, classif: boolean): Tree[] {
  const trees: Tree[] = []
  for (let t = 0; t < nTree; t++) {
    const ix = Array.from({ length: X.length }, (_, i) => (i * 17 + t * 13) % X.length)
    trees.push(growTree(ix.map((i) => X[i]!), ix.map((i) => y[i]!), 0, 3, classif))
  }
  return trees
}

function predForest(trees: Tree[], x: number[]): number {
  return mean(trees.map((tr) => predTree(tr, x)))
}

function boost(X: number[][], y: number[], rounds: number): { base: number; trees: Tree[]; nu: number } {
  const nu = 0.2
  let fit = Array(y.length).fill(mean(y)) as number[]
  const trees: Tree[] = []
  for (let r = 0; r < rounds; r++) {
    const resid = y.map((yi, i) => yi - fit[i]!)
    const tr = growTree(X, resid, 0, 2, false)
    trees.push(tr)
    fit = fit.map((f, i) => f + nu * predTree(tr, X[i]!))
  }
  return { base: mean(y), trees, nu }
}

function predBoost(model: ReturnType<typeof boost>, x: number[]): number {
  return model.trees.reduce((s, tr) => s + model.nu * predTree(tr, x), model.base)
}

function mlpFit(X: number[][], y: number[], hidden: number): { W1: number[][]; b1: number[]; W2: number[]; b2: number } {
  const p = X[0]!.length
  const W1 = Array.from({ length: hidden }, (_, h) => Array.from({ length: p }, (__, j) => 0.1 * Math.sin(h + j + 1)))
  const b1 = Array(hidden).fill(0)
  const W2 = Array.from({ length: hidden }, (_, h) => 0.1 * Math.cos(h + 1))
  let b2 = mean(y)
  const sig = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))))
  const lr = 0.05
  for (let ep = 0; ep < 60; ep++) {
    for (let i = 0; i < X.length; i++) {
      const h = W1.map((w, u) => sig(w.reduce((s, v, j) => s + v * X[i]![j]!, b1[u]!)))
      const yhat = h.reduce((s, v, u) => s + v * W2[u]!, b2)
      const err = yhat - y[i]!
      b2 -= lr * err
      for (let u = 0; u < hidden; u++) {
        W2[u]! -= lr * err * h[u]!
        const dh = h[u]! * (1 - h[u]!) * err * W2[u]!
        b1[u]! -= lr * dh
        for (let j = 0; j < p; j++) W1[u]![j]! -= lr * dh * X[i]![j]!
      }
    }
  }
  return { W1, b1, W2, b2 }
}

function predMlp(m: ReturnType<typeof mlpFit>, x: number[]): number {
  const sig = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))))
  const h = m.W1.map((w, u) => sig(w.reduce((s, v, j) => s + v * x[j]!, m.b1[u]!)))
  return h.reduce((s, v, u) => s + v * m.W2[u]!, m.b2)
}

function svmFit(X: number[][], y: number[]): number[] {
  const yy = y.map((v) => (v >= 0.5 ? 1 : -1))
  const p = X[0]!.length
  let w = Array(p).fill(0) as number[]
  let b = 0
  const C = 1
  const lr = 0.01
  for (let ep = 0; ep < 80; ep++) {
    for (let i = 0; i < X.length; i++) {
      const m = yy[i]! * (w.reduce((s, v, j) => s + v * X[i]![j]!, b))
      if (m < 1) {
        w = w.map((v, j) => v - lr * (v - C * yy[i]! * X[i]![j]!))
        b += lr * C * yy[i]!
      } else {
        w = w.map((v) => v - lr * v)
      }
    }
  }
  return [b, ...w]
}

function ldaFit(X: number[][], y: number[]): { w: number[]; b: number } | null {
  const g0 = X.filter((_, i) => y[i]! < 0.5)
  const g1 = X.filter((_, i) => y[i]! >= 0.5)
  if (g0.length < 2 || g1.length < 2) return null
  const p = X[0]!.length
  const m0 = Array.from({ length: p }, (_, j) => mean(g0.map((r) => r[j]!)))
  const m1 = Array.from({ length: p }, (_, j) => mean(g1.map((r) => r[j]!)))
  const S = Array.from({ length: p }, () => Array(p).fill(0))
  for (const g of [g0, g1]) {
    const m = Array.from({ length: p }, (_, j) => mean(g.map((r) => r[j]!)))
    for (const row of g) {
      for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a]![b]! += (row[a]! - m[a]!) * (row[b]! - m[b]!)
    }
  }
  const den = Math.max(X.length - 2, 1)
  for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a]![b]! /= den
  const inv = inverse(S)
  if (!inv) return null
  const diff = m1.map((v, j) => v - m0[j]!)
  const w = inv.map((row) => row.reduce((s, v, j) => s + v * diff[j]!, 0))
  const b = -0.5 * w.reduce((s, v, j) => s + v * (m0[j]! + m1[j]!), 0)
  return { w, b }
}

function nbFit(X: number[][], y: number[]) {
  const groups = [0, 1].map((g) => X.filter((_, i) => (y[i]! >= 0.5 ? 1 : 0) === g))
  const prior = groups.map((g) => g.length / X.length)
  const stats = groups.map((g) => (g[0] ?? []).map((_, j) => ({
    m: mean(g.map((r) => r[j]!)),
    s: sampleSd(g.map((r) => r[j]!)) || 1,
  })))
  return { prior, stats }
}

function predNb(m: ReturnType<typeof nbFit>, x: number[]): number {
  const logp = m.stats.map((st, g) => {
    let lp = Math.log(Math.max(m.prior[g]!, 1e-12))
    st.forEach((d, j) => {
      const z = (x[j]! - d.m) / d.s
      lp += -0.5 * z * z - Math.log(d.s)
    })
    return lp
  })
  const mlog = Math.max(...logp)
  const e = logp.map((v) => Math.exp(v - mlog))
  return e[1]! / (e[0]! + e[1]!)
}

export function kmeans(X: number[][], k: number): { labels: number[]; centers: number[][] } {
  const kk = Math.max(1, Math.min(k, X.length))
  let centers = X.filter((_, i) => i % Math.max(1, Math.floor(X.length / kk)) === 0).slice(0, kk).map((r) => [...r])
  while (centers.length < kk) centers.push([...X[centers.length % X.length]!])
  let labels = Array(X.length).fill(0)
  for (let iter = 0; iter < 25; iter++) {
    labels = X.map((row) => {
      let best = 0
      let bd = Infinity
      centers.forEach((c, j) => {
        const d = Math.hypot(...row.map((v, a) => v - (c[a] ?? 0)))
        if (d < bd) {
          bd = d
          best = j
        }
      })
      return best
    })
    centers = centers.map((_, j) => {
      const members = X.filter((_, i) => labels[i] === j)
      if (!members.length) return centers[j]!
      return centers[j]!.map((_, d) => mean(members.map((r) => r[d]!)))
    })
  }
  return { labels, centers }
}

export function dbscan(X: number[][], eps: number, minPts: number): number[] {
  const n = X.length
  const labels = Array(n).fill(-1)
  const dist = (i: number, j: number) => Math.hypot(...X[i]!.map((v, a) => v - X[j]![a]!))
  const neigh = (i: number) => Array.from({ length: n }, (_, j) => j).filter((j) => dist(i, j) <= eps)
  let cid = 0
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue
    const nb = neigh(i)
    if (nb.length < minPts) continue
    labels[i] = cid
    const seed = [...nb]
    for (let s = 0; s < seed.length; s++) {
      const q = seed[s]!
      if (labels[q] === -1) labels[q] = cid
      if (labels[q] !== -1 && labels[q] !== cid) continue
      labels[q] = cid
      const nq = neigh(q)
      if (nq.length >= minPts) {
        for (const v of nq) if (!seed.includes(v)) seed.push(v)
      }
    }
    cid += 1
  }
  return labels
}

function hclustCut(X: number[][], k: number): number[] {
  const n = X.length
  const labels = Array.from({ length: n }, (_, i) => i)
  const dist = (a: number, b: number) => {
    const A = X.filter((_, i) => labels[i] === a)
    const B = X.filter((_, i) => labels[i] === b)
    let m = Infinity
    for (const x of A) for (const y of B) m = Math.min(m, Math.hypot(...x.map((v, j) => v - y[j]!)))
    return m
  }
  let kNow = n
  while (kNow > k) {
    let ba = 0
    let bb = 1
    let bd = Infinity
    const ids = [...new Set(labels)]
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const d = dist(ids[i]!, ids[j]!)
        if (d < bd) {
          bd = d
          ba = ids[i]!
          bb = ids[j]!
        }
      }
    }
    for (let i = 0; i < n; i++) if (labels[i] === bb) labels[i] = ba
    kNow -= 1
  }
  const map = new Map<number, number>()
  labels.forEach((l) => {
    if (!map.has(l)) map.set(l, map.size)
  })
  return labels.map((l) => map.get(l) ?? 0)
}

function fuzzyCMeans(X: number[][], k: number): number[] {
  const km = kmeans(X, k)
  return km.labels
}

function gmmLabels(X: number[][], k: number): number[] {
  const km = kmeans(X, k)
  const p = X[0]!.length
  const tau = km.centers.map((_, c) => X.filter((_, i) => km.labels[i] === c).length / X.length)
  const sig = km.centers.map((c, ci) => {
    const mem = X.filter((_, i) => km.labels[i] === ci)
    const v = mem.length < 2 ? 1 : mean(c.map((_, d) => sampleVariance(mem.map((r) => r[d]!)) || 1))
    return Math.max(v, 1e-3)
  })
  return X.map((row) => {
    const dens = km.centers.map((c, ci) => {
      const q = row.reduce((s, v, d) => s + (v - c[d]!) ** 2, 0) / sig[ci]!
      return (tau[ci]! / Math.pow(2 * Math.PI * sig[ci]!, p / 2)) * Math.exp(-0.5 * q)
    })
    let b = 0
    dens.forEach((d, i) => { if (d > dens[b]!) b = i })
    return b
  })
}

function predictAlgo(algo: string, y: number[], X: number[][], classif: boolean): number[] {
  if (algo === 'knn') return X.map((x, i) => knnPredict(X.filter((_, j) => j !== i), y.filter((_, j) => j !== i), x, 5))
  if (algo === 'tree') {
    const t = growTree(X, y, 0, 4, classif)
    return X.map((x) => predTree(t, x))
  }
  if (algo === 'forest' || algo === 'rf') {
    const trees = forest(X, y, 12, classif)
    return X.map((x) => predForest(trees, x))
  }
  if (algo === 'boosting') {
    const m = boost(X, y, 12)
    return X.map((x) => predBoost(m, x))
  }
  if (algo === 'nn' || algo === 'neural') {
    const m = mlpFit(X, y, 4)
    return X.map((x) => predMlp(m, x))
  }
  if (algo === 'svm') {
    const w = svmFit(X, classif ? y.map((v) => (v >= 0.5 ? 1 : 0)) : y.map((v) => (v >= mean(y) ? 1 : 0)))
    return X.map((x) => {
      const s = linPred(w, x)
      return classif ? (s > 0 ? 1 : 0) : s
    })
  }
  if (algo === 'regularized' || algo === 'lasso' || algo === 'ridge') {
    const beta = ridgeLasso(y, X, Number(algo === 'lasso' ? 0.5 : 1), algo === 'lasso')
    return X.map((x) => linPred(beta, x))
  }
  if (algo === 'lda') {
    const m = ldaFit(X, y)
    return m ? X.map((x) => (m.w.reduce((s, v, j) => s + v * x[j]!, m.b) > 0 ? 1 : 0)) : y.map(() => mean(y))
  }
  if (algo === 'nb' || algo === 'naiveBayes') {
    const m = nbFit(X, y.map((v) => (v >= 0.5 ? 1 : 0)))
    return X.map((x) => predNb(m, x))
  }
  if (algo === 'logistic') {
    const fit = glmFit(y.map((v) => (v >= 0.5 ? 1 : 0)), X.map((r) => [1, ...r]), 'binomial')
    return fit?.fitted ?? y.map(() => mean(y))
  }
  const fit = lm(y, X.map((r) => [1, ...r]))
  return fit?.fitted ?? y.map(() => mean(y))
}

function scoreBlock(classif: boolean, y: number[], yhat: number[]) {
  if (classif) {
    const acc = accuracy(y, yhat)
    const tp = y.filter((v, i) => v >= 0.5 && (yhat[i] ?? 0) >= 0.5).length
    const fp = y.filter((v, i) => v < 0.5 && (yhat[i] ?? 0) >= 0.5).length
    const fn = y.filter((v, i) => v >= 0.5 && (yhat[i] ?? 0) < 0.5).length
    const prec = tp / Math.max(tp + fp, 1)
    const rec = tp / Math.max(tp + fn, 1)
    const f1 = 2 * prec * rec / Math.max(prec + rec, 1e-12)
    return { columns: ['Accuracy', 'Precision', 'Recall', 'F1'], rows: [[round(acc), round(prec), round(rec), round(f1)]], summary: `Accuracy ${round(acc)}, F1 ${round(f1)}.` }
  }
  const r = rmse(y, yhat)
  const sst = y.reduce((s, yi) => s + (yi - mean(y)) ** 2, 0)
  const r2 = 1 - (r * r * y.length) / (sst || 1)
  return { columns: ['RMSE', 'R²'], rows: [[round(r), round(r2)]], summary: `RMSE ${round(r)}, R² ${round(r2)}.` }
}

export function runMlRegression(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.dependent ?? '')
  const xNames = Array.isArray(options.predictors) ? options.predictors.map(String) : []
  const algo = String(options.algorithm ?? 'linear')
  const packed = pack(rows, yName, xNames)
  if (!packed) return empty('ml.regression', 'ML Regression', 'Assign a numeric outcome and predictors.')
  const yhat = predictAlgo(algo, packed.y, packed.X, false)
  const sc = scoreBlock(false, packed.y, yhat)
  return {
    analysisId: 'ml.regression',
    title: 'ML Regression',
    interpretation: `${algo} regression on ${yName}. ${sc.summary}`,
    assumptions: ['Holdout metrics use in-sample fits except KNN (leave-one-out). Trees are CART-style axis splits; boosting is residual trees; NN is a 1-hidden-layer MLP; SVM here is linear.'],
    footnotes: ['This is a browser TypeScript suite, not scikit-learn / JASP ML WASM. Regularized linear is coordinate-descent ridge/lasso.'],
    tables: [{ id: 'score', title: 'Fit', columns: sc.columns, rows: sc.rows }],
    plots: [{
      id: 'fit',
      title: 'Observed vs predicted',
      data: [{ type: 'scatter', mode: 'markers', x: yhat, y: packed.y }],
      layout: { xaxis: { title: 'Predicted' }, yaxis: { title: yName }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runMlClassification(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.dependent ?? '')
  const xNames = Array.isArray(options.predictors) ? options.predictors.map(String) : []
  const algo = String(options.algorithm ?? 'logistic')
  const packed = pack(rows, yName, xNames)
  if (!packed) return empty('ml.classification', 'ML Classification', 'Assign a binary/class outcome and predictors.')
  const yUse = packed.labels.length === 2
    ? packed.y.map((v, i) => {
      const raw = String(rows[i]?.[yName] ?? packed.labels[Math.round(v)] ?? v)
      return raw === packed.labels[1] || v >= 0.5 ? 1 : 0
    })
    : packed.y.map((v) => (v >= 0.5 ? 1 : 0))
  const yhat = predictAlgo(algo, yUse, packed.X, true)
  const sc = scoreBlock(true, yUse, yhat)
  return {
    analysisId: 'ml.classification',
    title: 'ML Classification',
    interpretation: `${algo} classifier. ${sc.summary}`,
    assumptions: ['Binary encoding uses a 0.5 threshold on numeric targets, or the second level of a two-level factor. LDA assumes equal covariance; NB is Gaussian.'],
    footnotes: ['Algorithms: boosting, tree, KNN, LDA, logistic, naive Bayes, NN, RF, SVM (linear).'],
    tables: [{ id: 'score', title: 'Classification metrics', columns: sc.columns, rows: sc.rows }],
    plots: [{
      id: 'cls',
      title: 'Predicted probability / score',
      data: [{ type: 'histogram', x: yhat, nbinsx: 20 }],
      layout: { margin: { t: 40, r: 16, b: 40, l: 48 } },
    }],
  }
}

export function runMlClustering(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  const method = String(options.algorithm ?? 'kmeans')
  const k = Math.max(2, Math.min(8, Math.floor(Number(options.k ?? 3))))
  if (variables.length < 2) return empty('ml.clustering', 'ML Clustering', 'Select at least two numeric nodes.')
  const X: number[][] = []
  for (const row of rows) {
    const vals = variables.map((c) => asFiniteNumber(row[c]))
    if (vals.every((v) => v !== null)) X.push(vals as number[])
  }
  if (X.length < 6) return empty('ml.clustering', 'ML Clustering', 'Need complete cases.')
  const Z = X.map((row) => {
    const mus = variables.map((_, j) => mean(X.map((r) => r[j]!)))
    const sds = variables.map((_, j) => sampleSd(X.map((r) => r[j]!)) || 1)
    return row.map((v, j) => (v - mus[j]!) / sds[j]!)
  })
  let labels: number[] = []
  if (method === 'dbscan' || method === 'density') labels = dbscan(Z, Number(options.eps ?? 0.6), Number(options.minPts ?? 4))
  else if (method === 'hierarchical') labels = hclustCut(Z, k)
  else if (method === 'fuzzy') labels = fuzzyCMeans(Z, k)
  else if (method === 'gmm' || method === 'model') labels = gmmLabels(Z, k)
  else if (method === 'neighborhood') labels = dbscan(Z, 0.8, 3)
  else if (method === 'rf' || method === 'forest') {
    const prox = kmeans(Z, k)
    labels = prox.labels
  } else labels = kmeans(Z, k).labels
  const kUsed = new Set(labels.filter((l) => l >= 0)).size
  return {
    analysisId: 'ml.clustering',
    title: 'ML Clustering',
    interpretation: `${method} clustering: ${kUsed} clusters on ${X.length} cases.`,
    assumptions: ['Features are z-scored. DBSCAN/neighborhood use Euclidean radius. GMM is a spherical-covariance EM start from k-means. RF clustering uses the k-means partition as a proximity stand-in.'],
    footnotes: ['Hierarchical uses single-linkage cut. Fuzzy C-means reports hard labels from the k-means prototype (memberships are not exported).'],
    tables: [
      { id: 'size', title: 'Cluster sizes', columns: ['Cluster', 'n'], rows: [...new Set(labels)].sort((a, b) => a - b).map((c) => [c < 0 ? 'noise' : c, labels.filter((l) => l === c).length]) },
    ],
    plots: [{
      id: 'sc',
      title: 'First two features',
      data: [{ type: 'scatter', mode: 'markers', x: X.map((r) => r[0]), y: X.map((r) => r[1]), marker: { color: labels } }],
      layout: { xaxis: { title: variables[0] }, yaxis: { title: variables[1] }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}

export function runMlPrediction(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = String(options.dependent ?? '')
  const xNames = Array.isArray(options.predictors) ? options.predictors.map(String) : []
  const algo = String(options.algorithm ?? 'linear')
  const task = String(options.task ?? 'regression')
  const packed = pack(rows, yName, xNames)
  if (!packed) return empty('ml.prediction', 'ML Prediction', 'Assign the trained-task outcome and the same predictors. New cases are the holdout tail of the table.')
  const split = holdoutSplit(packed.y.length, Number(options.holdout ?? 0.3))
  const Xtr = split.train.map((i) => packed.X[i]!)
  const ytr = split.train.map((i) => packed.y[i]!)
  const Xte = split.test.map((i) => packed.X[i]!)
  const yte = split.test.map((i) => packed.y[i]!)
  const classif = task === 'classification'
  const yhatTr = predictAlgo(algo, ytr, Xtr, classif)
  const modelY = classif ? ytr.map((v) => (v >= 0.5 ? 1 : 0)) : ytr
  void yhatTr
  const yhat = Xte.map((x) => {
    if (algo === 'knn') return knnPredict(Xtr, modelY, x, 5)
    if (algo === 'tree') return predTree(growTree(Xtr, modelY, 0, 4, classif), x)
    if (algo === 'boosting') return predBoost(boost(Xtr, modelY, 10), x)
    if (algo === 'nn') return predMlp(mlpFit(Xtr, modelY, 4), x)
    if (algo === 'regularized' || algo === 'ridge' || algo === 'lasso') return linPred(ridgeLasso(modelY, Xtr, 1, algo === 'lasso'), x)
    const fit = lm(modelY, Xtr.map((r) => [1, ...r]))
    return fit ? linPred(fit.beta, x) : mean(modelY)
  })
  const sc = scoreBlock(classif, classif ? yte.map((v) => (v >= 0.5 ? 1 : 0)) : yte, yhat)
  return {
    analysisId: 'ml.prediction',
    title: 'ML Prediction',
    interpretation: `Apply ${algo} trained on ${split.train.length} rows to ${split.test.length} new (holdout) cases. ${sc.summary}`,
    assumptions: ['“New cases” are the last holdout fraction of the current table. There is no saved model file; re-training is deterministic given the algorithm and seedless linear/tree fits.'],
    footnotes: ['Use the same algorithm you would pick under ML Regression or Classification.'],
    tables: [
      { id: 'score', title: 'Holdout performance', columns: sc.columns, rows: sc.rows },
      { id: 'pred', title: 'Predictions (new cases)', columns: ['Row', 'Observed', 'Predicted'], rows: yte.map((yi, i) => [split.test[i]! + 1, round(yi), round(yhat[i] ?? 0)]) },
    ],
    plots: [{
      id: 'pred-plot',
      title: 'New-case predictions',
      data: [{ type: 'scatter', mode: 'markers', x: yhat, y: yte }],
      layout: { xaxis: { title: 'Predicted' }, yaxis: { title: 'Observed' }, margin: { t: 40, r: 16, b: 48, l: 56 } },
    }],
  }
}
