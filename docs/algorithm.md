# The tree-similarity algorithm

This document explains what `ml-tree-similarity` does, where it comes from, how the
implementation maps onto the original publication, and the known limitations — in
particular around **noise** and **reproducibility**.

## 1. Origin

The method was introduced by A. M. Castillo, L. Uribe, L. Patiny and J. Wist:

- **Fast and shift-insensitive similarity comparisons of NMR using a tree-representation
  of spectra**, _Chemometrics and Intelligent Laboratory Systems_ **127** (2013) 1–6.
  <https://doi.org/10.1016/j.chemolab.2013.05.009> — the method itself.
- **A new method for the comparison of 1H NMR predictors based on tree-similarity of
  spectra**, _J. Cheminform._ **6**:9 (2014).
  <https://doi.org/10.1186/1758-2946-6-9> — an application (comparing NMR predictors).

The goal is to encode a spectrum into a small structure that (a) needs **no peak picking
and no pre-treatment**, (b) is **compact and fast** to compare, and (c) is **insensitive
to peak shifts** caused by different experimental conditions (temperature, pH, solvent).
`createTree` implements the encoding of Code Fragment 1 of the 2013 paper essentially
verbatim, and `treeSimilarity` implements its recursive comparison (§2.2 of the paper).

## 2. Representation — `createTree`

A spectrum is turned into a **binary tree of centers of mass** (barycenters). Each node
stores two numbers:

- `sum` — the integral (Σy) of the sub-region it covers,
- `center` — the intensity-weighted mean position `Σ(x·y) / Σy` of that sub-region.

The construction is a top-down recursion on the x-axis:

```
createTree(from, to):
  if (to - from < minWindow) return null            # too narrow
  sum    = Σ y over [from, to]
  if (sum < threshold) return null                  # noisy / empty region -> pruned
  center = Σ (x·y) / sum                             # center of mass
  if (center is within minWindow/4 of a boundary):  # broad-peak tail correction
      recurse on the non-degenerate side only (no node created here)
  else:
      node = { sum, center }
      node.left  = createTree(from, center)
      node.right = createTree(center, to)
      return node
```

Key properties:

- **The split is the center of mass.** The tree's nodes converge towards the crowded
  (signal-rich) regions of the spectrum.
- **`threshold` prunes noise.** A sub-region whose integral is below `threshold` produces
  no node and stops the recursion. This is what lets the method ignore blank and noisy
  zones — _"since the noisy regions are excluded from this division scheme"_ (2013 paper).
- **`minWindow` bounds the resolution** and, with the `minWindow/4` **coalescing** rule,
  prevents a broad peak whose tail crosses into a neighboring region from spawning a child
  node right next to its parent (Fig. 1C of the paper).
- **The tree is sparse and of variable depth** — it is not a fixed `2^depth − 1` vector.
  The number of nodes grows roughly linearly with the number of peaks (Fig. 3 of the paper).

### Options and defaults

| option      | default    | meaning                                         |
| ----------- | ---------- | ----------------------------------------------- |
| `threshold` | `0.01`     | minimum integral (Σy) for a node to be created  |
| `minWindow` | `0.16`     | minimum sub-region width (in x units, e.g. ppm) |
| `from`      | `x[0]`     | lower x bound of the tree                       |
| `to`        | `x.at(-1)` | upper x bound of the tree                       |

### Axis order — "ensure growing"

`createTree` always normalizes the x axis to be **strictly increasing** before building
the tree:

1. NMR spectra are usually stored with **decreasing ppm**; such spectra are reversed.
2. `xyEnsureGrowingX` (from `ml-spectra-processing`, a runtime dependency) then drops any
   non strictly-growing points.

This is why the library depends on `ml-spectra-processing`, and why descending real-world
JCAMP spectra can be fed to `createTree` directly.

## 3. Comparison — `treeSimilarity`

Two trees are compared with a recursive similarity in roughly `[0, 1]` (higher = more
alike):

```
s(a, b) = β · C(a, b) + (1 − β) · ½ · ( s(a.left, b.left) + s(a.right, b.right) )
C(a, b) = α · min(Iₐ, I_b) / max(Iₐ, I_b) + (1 − α) · exp(−γ · |δₐ − δ_b|)
```

where `I` is a node's `sum` (integral) and `δ` its `center` (chemical shift). A `null`
node contributes `0`.

| option  | default | meaning                                                         |
| ------- | ------- | --------------------------------------------------------------- |
| `alpha` | `0.1`   | weight of the intensity match vs. the shift match inside a node |
| `beta`  | `0.33`  | weight of a node vs. its children (shift tolerance — see below) |
| `gamma` | `0.001` | decay of the shift penalty `exp(−γ·\|Δcenter\|)`                |

- **`beta = 0.33` is the shift-tolerance knob.** Each generation contributes a third of
  the remaining weight, so a small positional error deep in the tree only mildly affects
  the score — _"this avoids small shifts to dramatically affect the overall similarity"_
  (2013 paper). This, together with encoding relative barycenters, is the paper's
  "shift-insensitive" comparison.
- The 2013 paper used **`γ = 0.01`**; the current default here is `0.001` (an even gentler
  shift penalty).

### The metric is **not** self-normalized

`treeSimilarity(a, a) ≠ 1`. Because a leaf's `null` children contribute `0` to the
`(1 − β)` term, a tree compared with itself scores below 1 (≈ 0.78 for the synthetic
3-peak example). To obtain a comparable measure with a self-similarity of exactly 1,
normalize:

```
normalized(a, b) = s(a, b) / sqrt( s(a, a) · s(b, b) )
```

The test suite (`src/__tests__/similarityGrid.test.ts`) uses this normalized form.

## 4. Why the center of mass — and the noise trade-off

Every location estimator sits on a spectrum between the **mean** and the **median** of the
intensity distribution:

- **center of mass = the mean** — smooth and continuous (a small peak nudges it a little),
  but it has _leverage_: a point contributes `x·y`, so mass far from the center pulls hard.
- **equal-integration split = the median** — robust to outliers, but _discontinuous_: in a
  flat region the cumulative-integral curve is nearly horizontal, so a tiny peak crossing
  the 50% line makes the split jump.

The center of mass is dragged by a broad, noisy baseline. If `y = signal + noise` with
zero-mean noise `n`, the error on the estimated center is

```
δμ = Σ (xᵢ − μ)·nᵢ / Σ yᵢ         std(δμ) ≈ σ · √( Σ (xᵢ − μ)² ) / Σ yᵢ
```

The noise **cancels in expectation** (no bias) but its **variance** grows with the spread
of the kept region and with the number of baseline points, and is divided by the (small)
signal integral. So a long noisy baseline moves the barycenter run-to-run even though each
run is a "perfect" balance point.

The paper's defense against this is exactly the **`threshold` + `minWindow` + coalescing**
machinery of `createTree`: they stop the tree from subdividing into noise and keep each
barycenter window small and signal-centered. This is a **region-level** noise defense — it
is _not_ a per-point baseline subtraction.

## 5. Reproducibility findings (synthetic grid)

`src/__tests__/similarityGrid.test.ts` builds trees for 10 generated spectra (3 gaussian
peaks, fwhm 0.1, x ∈ [0, 10], 10001 points, seeded gaussian noise) plus real NMR spectra,
and compares all of them. With the **default parameters**:

- The metric is **weakly discriminating**: most normalized pairs fall in `~0.80–0.96`.
- Two noisy realizations of the **same** peaks score `~0.956` — the strongest off-diagonal
  value, as hoped.
- But **clean-vs-shifted (0.93) > clean-vs-noisy (0.88)**: with these defaults, 5% noise
  degrades the similarity _more_ than a 1 ppm global shift. Shift-insensitivity works;
  noise-insensitivity is weaker.
- Noise also perturbs the **number of tree nodes** (structural instability), because the
  default `threshold` is an **absolute** value (`0.01`) applied to the raw intensities.

## 6. Known limitations & future improvements

- **Peak order.** The recursion matches children by canonical left/right position. Peaks
  that appear in a different order between two spectra are not matched to each other. A
  future version should compare nodes by best match rather than strictly by side.
- **Absolute vs. relative threshold.** The 2013 paper used `threshold = 1% of the total
integral` — a **per-spectrum, auto-scaling** value. This implementation defaults to an
  absolute `0.01`. A per-spectrum adaptive threshold (a fraction of the total integral, or
  `k · noiseσ` using `xNoiseStandardDeviation`) would make the tree structure reproducible
  across spectra with different noise/scale.
- **Per-point noise clipping.** `threshold` prunes whole regions, but the barycenter of a
  kept region is still computed on raw `y`. A `wᵢ = max(0, yᵢ − k·σ)` clip would also clean
  the baseline _inside_ a kept window.
- **`gamma`.** The default `0.001` makes the shift penalty almost flat; the paper used
  `0.01`. Tune per nucleus / expected shift range.
- **Self-normalization.** Expose a normalized similarity (self-similarity = 1) so callers
  don't have to divide by `√(s(a,a)·s(b,b))` themselves.

## 7. The explorer (`npm run dev`)

`npm run dev` starts a Vite dev server (`scripts/`) that loads every spectrum committed
under `src/__tests__/data/` and shows:

- an **interactive similarity matrix** with the value in every cell — click a cell to pick
  a pair;
- the **two selected spectra** with their center-of-mass **tree** drawn on top, and
  **synchronized zoom**: drag to zoom X (both plots), double-click to reset, scroll wheel to
  zoom Y.

Regenerate the synthetic JCAMP-DX data (compressed with DIFDUP) with `npm run generate-data`.
