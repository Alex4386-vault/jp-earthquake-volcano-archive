import fs from 'fs';
import { EarthquakeCache } from '../Earthquake';
import { VolcanoModel } from '../Volcanoes';

export const volcanoesFile = './volcanoes.json';
export const earthquakesFile = './earthquakes.json';

export function loadVolcanoesFile(): VolcanoModel[] | null {
  if (!fs.existsSync(volcanoesFile)) return null;

  const volcanoes = JSON.parse(fs.readFileSync(volcanoesFile, { encoding: 'utf-8' })) as VolcanoModel[];
  for (const volcano of volcanoes) {
    volcano.lastUpdate = new Date(volcano.lastUpdate);
    if (volcano.alerts?.lastUpdate) volcano.alerts.lastUpdate = new Date(volcano.alerts.lastUpdate);
  }

  return volcanoes;
}

export function loadEarthquakesFile(): EarthquakeCache | null {
  if (!fs.existsSync(earthquakesFile)) return null;

  const earthquakes = JSON.parse(fs.readFileSync(earthquakesFile, { encoding: 'utf-8' })) as EarthquakeCache;
  earthquakes.lastUpdate = new Date(earthquakes.lastUpdate);

  for (const earthquake of earthquakes.data) {
    earthquake.lastUpdate = new Date(earthquake.lastUpdate);
  }

  return earthquakes;
}

export function saveVolcanoesFile(data: VolcanoModel[]): void {
  data.sort((a, b) => (a.id === undefined || b.id === undefined ? -1 : a.id - b.id));
  saveJSON(volcanoesFile, data);
}

export function saveEarthquakesFile(data: EarthquakeCache): void {
  data.data.sort((a, b) => a.lastUpdate.getTime() - b.lastUpdate.getTime());
  saveJSON(earthquakesFile, data);
}

export function saveJSON(fileName: string, data: unknown): void {
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
}
