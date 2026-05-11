import { describe, it, expect } from 'vitest';

import { similarity } from '../similarity';

describe('similarity', () => {
  it('rates identical DataXY at least as high as a perturbed version (default)', () => {
    const x = [0, 1, 2, 3, 4, 5, 6];
    const y = [0, 0, 1, 0, 0, 1, 0];
    const data = { x, y };

    const perturbed = { x, y: y.map((v, i) => (i === 2 ? v + 0.5 : v)) };

    const sSame = similarity(data, data, { depth: 3 });
    const sPerturbed = similarity(data, perturbed, { depth: 3 });

    expect(sSame).toBeGreaterThanOrEqual(sPerturbed);
    expect(sSame).toBeCloseTo(1);
  });

  it('returns 0 when either input is null', () => {
    const x = [0, 1];
    const y = [1, 2];
    const data = { x, y };

    expect(similarity(null, data)).toBe(0);
    expect(similarity(data, null)).toBe(0);
    expect(similarity(null, null)).toBe(0);
  });

  it('is symmetric for different spectra', () => {
    const x = [0, 1, 2, 3, 4];
    const y1 = [0, 0, 1, 0, 0];
    const y2 = [0, 1, 0, 1, 0];
    const a = { x, y: y1 };
    const b = { x, y: y2 };

    const s1 = similarity(a, b);
    const s2 = similarity(b, a);
    console.log(s1);
    expect(s1).toBeCloseTo(s2);
  });
});
