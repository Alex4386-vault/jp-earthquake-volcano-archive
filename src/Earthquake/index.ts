import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as geolib from 'geolib';
import { htmlStripper, jmaRoot, LatitudeLongitude } from '../common';

const earthquakeDir = jmaRoot + '/en/quake';
const earthquakeTableEndpoint = earthquakeDir + '/quake_singendo_index.html';

interface IntensityByRegion {
  intensity: string;
  regionName: string;
}

interface IntensityByCity {
  prefecture: string;
  intensity: string;
  city: string;
}

interface EarthquakeLocation extends LatitudeLongitude {
  depth: number;
}

interface EarthquakeMetadata {
  uuid: string;
  regionName: string;
  magnitude: number;
  occurredAt: string;
  location: EarthquakeLocation;
  lastUpdate: Date;
  intensityByCity?: IntensityByCity[];
  intensityByRegion?: IntensityByRegion[];
  url: string;
}

interface EarthquakeData extends EarthquakeMetadata {
  maxIntensity: string;
  issuedAt: string;
}

export interface EarthquakeCache {
  lastUpdate: Date;
  data: EarthquakeData[];
}

export async function getEarthquake(uuid: string, lastUpdate?: Date): Promise<EarthquakeMetadata | null> {
  const infoUrl = `${earthquakeDir}/${uuid}.html`;

  let infoData;

  if (lastUpdate === undefined) {
    infoData = (await axios(infoUrl)).data;
    console.log('[Debug] Cache hit at ' + infoUrl + '! Requesting!');
  } else {
    lastUpdate = new Date(lastUpdate);
    try {
      infoData = (
        await axios(infoUrl, {
          headers: {
            'If-Modified-Since': lastUpdate.toUTCString(),
          },
        })
      ).data;
      console.log('[Debug] Non-Cache hit at ' + infoUrl);
    } catch (e) {
      if (e.response !== undefined) {
        if (e.response.status === 304) {
          console.log('[Debug] Cache hit at ' + infoUrl);
          return null;
        }
      }

      throw e;
    }
  }
  const infoDom = new JSDOM(infoData, {
    url: infoUrl,
  });

  const infoTextFrame = infoDom.window.document.getElementsByClassName('textframe')[0];

  const tables = Array.from(infoTextFrame.getElementsByTagName('table'));
  const seismicTables = Array.from(infoTextFrame.getElementsByTagName('table')).filter((n) => n.border === '1');

  const metadataTable = tables[0];
  const metadataTableRow = metadataTable.getElementsByTagName('tr')[1].getElementsByTagName('td');
  const occurredAt = htmlStripper(metadataTableRow[0].innerHTML);
  const latitude = htmlStripper(metadataTableRow[1].innerHTML);
  const latitudeDec = parseFloat(latitude.replace(/NS/gi, '')) * (latitude.toLowerCase().indexOf('N') ? 1 : -1);

  const longitude = htmlStripper(metadataTableRow[2].innerHTML);
  const longitudeDec = parseFloat(longitude.replace(/WE/gi, '')) * (longitude.toLowerCase().indexOf('E') ? 1 : -1);

  const depth = parseInt(htmlStripper(metadataTableRow[3].innerHTML).replace(/km/gi, ''));

  const magnitude = parseFloat(htmlStripper(metadataTableRow[4].innerHTML));
  const regionName = htmlStripper(metadataTableRow[5].innerHTML);

  let intensityByRegion = undefined;
  let intensityByCity = undefined;

  if (seismicTables.length >= 1) {
    intensityByRegion = [];

    const seismicTable = seismicTables[0].getElementsByTagName('tr');
    let leftRowSpan = 0;
    let lastSeismicIntensity = '';

    for (let i = 1; i < seismicTable.length; i++) {
      const tds = seismicTable[i].getElementsByTagName('td');
      let dataIdx = 0;

      if (leftRowSpan > 0) {
        dataIdx = 0;
      } else {
        lastSeismicIntensity = htmlStripper(tds[0].innerHTML);
        leftRowSpan = tds[0].rowSpan;

        dataIdx = 1;
      }

      intensityByRegion.push({
        intensity: htmlStripper(lastSeismicIntensity).trim(),
        regionName: htmlStripper(tds[dataIdx].innerHTML).trim(),
      });

      leftRowSpan--;
    }
  }

  if (seismicTables.length >= 2) {
    intensityByCity = [];

    const seismicTable = seismicTables[1].getElementsByTagName('tr');
    const prefectureState = {
      name: '',
      rowspan: 0,
    };
    const seismicState = {
      name: '',
      rowspan: 0,
    };

    for (let i = 1; i < seismicTable.length; i++) {
      const tds = seismicTable[i].getElementsByTagName('td');

      let idx = 0;
      if (prefectureState.rowspan === 0) {
        prefectureState.rowspan = tds[idx].rowSpan;
        prefectureState.name = tds[idx].innerHTML;
        idx++;
      }
      if (seismicState.rowspan === 0) {
        seismicState.rowspan = tds[idx].rowSpan;
        seismicState.name = tds[idx].innerHTML;
        idx++;
      }

      intensityByCity.push({
        prefecture: htmlStripper(prefectureState.name).trim(),
        intensity: htmlStripper(seismicState.name).trim(),
        city: htmlStripper(tds[idx].innerHTML).trim(),
      });

      prefectureState.rowspan--;
      seismicState.rowspan--;
    }
  }

  return {
    uuid,
    regionName,
    magnitude,
    occurredAt,
    location: {
      decimal: {
        latitude: latitudeDec,
        longitude: longitudeDec,
      },
      sexagesimal: {
        latitude: geolib.decimalToSexagesimal(latitudeDec),
        longitude: geolib.decimalToSexagesimal(longitudeDec),
      },
      depth,
    },
    lastUpdate: new Date(),
    intensityByCity,
    intensityByRegion,
    url: infoUrl,
  };
}

export async function getEarthquakes(cache?: EarthquakeCache): Promise<EarthquakeData[]> {
  let res;

  if (cache === undefined) {
    res = await axios(earthquakeTableEndpoint);
  } else {
    try {
      res = await axios(earthquakeTableEndpoint, {
        headers: {
          'If-Modified-Since': cache.lastUpdate.toUTCString(),
        },
      });
    } catch (e) {
      if (e.response !== undefined) {
        if (e.response.status === 304) {
          return cache.data;
        }
      }
      throw e;
    }
  }

  const earthquakes = [];

  const {
    window: { document },
  } = new JSDOM(res.data, {
    url: earthquakeTableEndpoint,
  });

  const trs = ((document.getElementById('info') as HTMLTableElement)
    .getElementsByTagName('table')[0]
    .getElementsByTagName('tr') as unknown) as HTMLTableRowElement[];

  for (const tr of trs) {
    const tds = tr.getElementsByTagName('td');
    if (tds.length === 0) continue;

    const anchorTag = tds[0].getElementsByTagName('a')[0];

    const uuid = anchorTag.href.slice(anchorTag.href.lastIndexOf('/') + 1).split('.')[0] as string;

    const maxIntensity = htmlStripper(tds[3].innerHTML);
    const issuedAt = htmlStripper(tds[4].innerHTML);

    let idx = -1;

    if (cache !== undefined) {
      idx = cache.data.map((n) => n.uuid === uuid).indexOf(true);
    }

    const earthquakeMetadata = await getEarthquake(uuid, idx >= 0 ? cache?.data[idx].lastUpdate : undefined);

    let earthquakeData;

    if (earthquakeMetadata === null) {
      earthquakeData = cache?.data[idx] as EarthquakeData;
    } else {
      earthquakeData = {
        maxIntensity,
        issuedAt,
        ...earthquakeMetadata,
      };
    }

    if (idx >= 0 && cache !== undefined) cache.data[idx] = earthquakeData as EarthquakeData;

    earthquakes.push(earthquakeData);
  }

  if (cache !== undefined) {
    const nonDuplicates = earthquakes.filter(
      (n) => cache.data.map((j) => j.uuid === n.uuid).indexOf(true) < 0,
    ) as EarthquakeData[];
    cache.data.push(...nonDuplicates);
  }

  return earthquakes;
}
