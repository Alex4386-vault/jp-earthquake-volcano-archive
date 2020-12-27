import fs from 'fs';
import { EarthquakeCache } from '../Earthquake';
import { VolcanoModel } from '../Volcanoes';

export const volcanoesFile = './data/volcanoes.json';
export const earthquakesFile = './data/earthquakes.json';

export function loadVolcanoesFile(): VolcanoModel[] | null {
  if (!fs.existsSync(volcanoesFile)) return null;

  const volcanoes = JSON.parse(fs.readFileSync(volcanoesFile, { encoding: 'utf-8' })) as VolcanoModel[];
  for (const volcano of volcanoes) {
    volcano.lastUpdate = new Date(volcano.lastUpdate);

    if (volcano.alerts?.lastUpdate) volcano.alerts.lastUpdate = new Date(volcano.alerts.lastUpdate);
    if (volcano.alerts?.data) {
      for (let i = 0; i < volcano.alerts.data.length; i++) {
        volcano.alerts.data[i].issuedAt = new Date(volcano.alerts.data[i].issuedAt);
      }
    }
  }

  return volcanoes;
}

export function loadEarthquakesFile(): EarthquakeCache | null {
  if (!fs.existsSync(earthquakesFile)) return null;

  const earthquakes = JSON.parse(fs.readFileSync(earthquakesFile, { encoding: 'utf-8' })) as EarthquakeCache;
  earthquakes.lastUpdate = new Date(earthquakes.lastUpdate);

  for (const earthquake of earthquakes.data) {
    earthquake.lastUpdate = new Date(earthquake.lastUpdate);
    earthquake.issuedAt = new Date(earthquake.issuedAt);
  }

  return earthquakes;
}

export function saveVolcanoesFile(data: VolcanoModel[]): void {
  data.sort((a, b) => (a.id === undefined || b.id === undefined ? -1 : a.id - b.id));
  saveJSON(volcanoesFile, data);
}

export function saveEarthquakesFile(data: EarthquakeCache): void {
  data.data.sort((a, b) => parseInt(b.uuid.split('-')[1]) - parseInt(a.uuid.split('-')[1]));
  saveJSON(earthquakesFile, data);
}

export function saveJSON(fileName: string, data: unknown): void {
  const dotIdx = fileName.lastIndexOf('.');

  let pureFilename: string;
  let pureExtension = '';

  if (dotIdx < 0) {
    pureFilename = fileName;
  } else {
    pureFilename = fileName.slice(0, dotIdx);
    pureExtension = fileName.slice(dotIdx);
  }

  const minified = pureFilename + '.min' + pureExtension;

  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  fs.writeFileSync(minified, JSON.stringify(data));
}

export function saveReportFile(fileName: string, data: string): void {
  fs.writeFileSync('./reports/' + fileName, data);
}

const latestReportFile = './reports/latest.md';

export function saveLatestReport(data: string): void {
  if (fs.existsSync(latestReportFile)) {
    fs.unlinkSync(latestReportFile);
  }
  fs.writeFileSync(latestReportFile, data);
}
