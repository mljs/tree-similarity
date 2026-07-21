import { convert } from 'jcampconverter';

export interface PreparedSpectrum {
  x: number[];
  y: number[];
}

/**
 * Parse a JCAMP-DX string into an x,y spectrum and normalize the tallest peak to
 * 100 so the default `threshold` of `createTree` behaves consistently across
 * spectra of very different intensity scales. The axis order is left untouched:
 * `createTree` reverses descending (NMR ppm) axes itself.
 * @param jcamp - the JCAMP-DX content.
 * @returns the prepared spectrum.
 */
export function parseSpectrum(jcamp: string): PreparedSpectrum {
  const parsed = convert(jcamp);
  const spectrum = parsed.flatten[0]?.spectra[0];
  if (!spectrum) {
    throw new Error('no spectrum found in the jcamp');
  }
  const { data } = spectrum;

  const x = Array.from(data.x as ArrayLike<number>);
  const y = Array.from(data.y as ArrayLike<number>);

  let max = 0;
  for (const value of y) {
    if (value > max) max = value;
  }
  if (max > 0) {
    const factor = 100 / max;
    for (let i = 0; i < y.length; i++) {
      y[i] = (y[i] as number) * factor;
    }
  }

  return { x, y };
}
