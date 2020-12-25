export const jmaRoot = 'https://www.jma.go.jp';

export interface LatitudeLongitude {
  decimal: {
    latitude: number;
    longitude: number;
  };
  sexagesimal: {
    latitude: string;
    longitude: string;
  };
}

export function htmlStripper(string: string): string {
  return string.replace(/(<([^>]+)>)/gi, '');
}

export function meterToFeet(meter: number): number {
  return meter * 3.28084;
}

export function convertDate(string: string): Date {
  const f = string.split('JST');
  f[0] = f[0].trim();
  f[1] = f[1].trim();
  const n = f.join(' ') + ' GMT+0900';

  return new Date(n);
}
