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

export function htmlStripper(string: string) {
  return string.replace(/(<([^>]+)>)/gi, '');
}

export function meterToFeet(meter: number) {
  return meter * 3.28084;
}
