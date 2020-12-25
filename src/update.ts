import { LatitudeLongitude } from './common';
import {
  loadEarthquakesFile,
  saveEarthquakesFile,
  loadVolcanoesFile,
  saveVolcanoesFile,
  saveReportFile,
} from './common/fileSystem';
import { EarthquakeData, EarthquakeCache, getEarthquakes } from './Earthquake';
import {
  VolcanoModel,
  loadVolcanoesDataByArea,
  AreaIdentifier,
  getVolcanoMetadata,
  getVolcanoStatus,
  getMapsLastUpdate,
  VolcanoStatus,
} from './Volcanoes';

export const updateFile = './data/updates.json';

export interface UpdateModel {
  volcanoes: VolcanoModel[];
  earthquakes: EarthquakeData[];
  lastUpdate: Date;
}

export async function updateEarthquakes(): Promise<EarthquakeData[]> {
  const updates = [];

  let cache: EarthquakeCache | null;
  cache = loadEarthquakesFile();

  if (cache !== null) {
    const updatesTmp = await getEarthquakes(cache);
    if (updatesTmp !== null) {
      updates.push(...updatesTmp);
    }
  } else {
    cache = {
      lastUpdate: new Date(),
      data: (await getEarthquakes()) as EarthquakeData[],
    };
    updates.push(...cache.data);
  }

  saveEarthquakesFile(cache);
  return updates;
}

export async function updateVolcanoes(updateMetadata?: boolean): Promise<VolcanoModel[]> {
  const cache = loadVolcanoesFile();
  const volcanoes: VolcanoModel[] = [];

  const updated: VolcanoModel[] = [];

  if (cache !== null) {
    volcanoes.push(...cache);
  } else {
    const volcanoesURL = await loadVolcanoesDataByArea(AreaIdentifier.GLOBAL);

    for (const volcanoURL of volcanoesURL) {
      const volcano = await getVolcanoMetadata(volcanoURL);
      if (volcano === null) continue;
      volcanoes.push(volcano);
      volcano?.craters.length == 0
        ? console.log(
            '[Volca] Error while processing volcano ' + volcano.name + ' at ' + volcano.region + '#' + volcano.id,
          )
        : console.log('[Volca] Processed volcano ' + volcano?.name + '!');
    }
  }

  const alerts = await getVolcanoStatus(-1);

  for (const volcano of volcanoes) {
    if (updateMetadata) {
      const data = await getVolcanoMetadata(
        {
          area: volcano.area,
          url: volcano.metadata.page,
        },
        volcano,
      );

      if (data !== null) {
        updated.push(volcano);
      }
    }
  }

  for (const alert of alerts) {
    const issuedTo = alert.issuedTo;

    let volcanoIdx = volcanoes.map((n) => n.name === issuedTo).indexOf(true);
    if (volcanoIdx < 0) {
      volcanoIdx = volcanoes.map((n) => issuedTo.includes(n.name)).indexOf(true);

      if (volcanoIdx < 0) {
        continue;
      }
    }

    const volcano = volcanoes[volcanoIdx];
    if (volcano.alerts === undefined) {
      volcano.alerts = {
        data: [],
        lastUpdate: await getMapsLastUpdate(volcano.area),
      };
    }

    const latestAlert = volcano.alerts.data
      .filter((a) => a.issuedTo === alert.issuedTo)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())[0];
    const duplicateFound = latestAlert !== undefined && volcanoAlertIsDuplicateWithoutIssuedAt(latestAlert, alert);

    if (!duplicateFound) {
      updated.push(volcano);
      volcano.alerts.data.push(alert);
    }
  }

  saveVolcanoesFile(volcanoes);
  return updated;
}

function volcanoAlertIsDuplicateWithoutIssuedAt(a: VolcanoStatus, b: VolcanoStatus) {
  const aTmp = {
    issuedTo: a.issuedTo,
    data: a.data,
  };
  const bTmp = {
    issuedTo: b.issuedTo,
    data: b.data,
  };

  return JSON.stringify(aTmp) === JSON.stringify(bTmp);
}

function convertDateToHumanStrings(date: Date) {
  const westernYear = date.getFullYear();
  const nengo = getNengo(date);

  const month = (date.getMonth() + 1).toString();
  const monthPad = month.padStart(2, '0');
  const dateCal = date.getDate().toString();
  const datePad = dateCal.padStart(2, '0');

  const hours = date.getHours();
  const hoursPad = hours.toString().padStart(2, '0');
  const minutes = date.getMinutes();
  const minutesPad = minutes.toString().padStart(2, '0');

  return {
    year: {
      westernYear,
      nengo,
    },
    month,
    date: dateCal,

    ymdString: westernYear + '-' + monthPad + '-' + datePad,
    nengoString:
      nengo !== undefined ? `${nengo.nengo.kanjiName} ${nengo.year.kanji} ${month}月 ${dateCal}日` : undefined,
    timeString: hoursPad + ':' + minutesPad,

    fileSafeString: westernYear + monthPad + datePad + hoursPad + minutesPad,
  };
}

export function getMapLink(coord: LatitudeLongitude): string {
  return `https://www.google.com/maps/place/${coord.sexagesimal.latitude
    .replace(/"/g, '%22')
    .replace(/ /g, '')}+${coord.sexagesimal.longitude.replace(/"/g, '%22').replace(/ /g, '')}/@${
    coord.decimal.latitude
  },${coord.decimal.longitude},17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d${coord.decimal.latitude}!4d${
    coord.decimal.longitude
  }`;
}

export function createReportFile(updates: UpdateModel): void {
  let markdown = '';

  const lastUpdateDate = updates.lastUpdate;

  const humanTime = convertDateToHumanStrings(lastUpdateDate);

  markdown += `# ${humanTime.ymdString} ${humanTime.timeString} Report\n`;
  markdown += humanTime.nengoString !== undefined ? `${humanTime.nengoString} ${humanTime.timeString}\n` : '';

  markdown += '\n';

  if (updates.volcanoes.length > 0) {
    markdown += `## Volcanoes\n`;

    markdown += updates.volcanoes
      .map((n) => {
        return `### **[${n.name}](${n.metadata.page})**
${n.metadata.img !== undefined ? `![${n.name} volcano image](${n.metadata.img})` : ''}  
${n.metadata.memo !== undefined ? `${n.metadata.memo}` : ''}  

#### Craters / Sub-Volcanoes
${n.craters
  .map(
    (crater) =>
      `* [${crater.name !== undefined ? crater.name : n.name} @ ${crater.location.elevation?.meter}m](${getMapLink(
        crater.location,
      )})`,
  )
  .join('\n')}

#### Alerts
${
  n.alerts !== undefined
    ? n.alerts.data
        .map((alert) => {
          const date = convertDateToHumanStrings(alert.issuedAt);
          return `* ${alert.issuedTo} - ${date.ymdString}${
            date.nengoString !== undefined ? ' (' + date.nengoString + ' ' + date.timeString + ')' : ''
          } ${date.timeString}  
**${alert.data.raw.keyword}**  
          ${
            alert.data.raw.info !== undefined
              ? '\n```' + alert.data.raw.info.contents + '```  \n[Link](' + alert.data.raw.info.link + ')  \n'
              : ''
          }
`;
        })
        .join('\n')
    : ''
}
`;
      })
      .join('\n');
  }

  if (updates.earthquakes.length > 0) {
    markdown += '## Earthquakes\n';
    markdown += updates.earthquakes
      .map((quake) => {
        const humanTime = convertDateToHumanStrings(quake.occurredAt);
        return `### ${quake.regionName} @ M${quake.magnitude}
${humanTime.ymdString} ${humanTime.timeString} ${
          humanTime.nengoString !== undefined ? `(${humanTime.nengoString} ${humanTime.timeString})\n` : ''
        }  
[epicenter @ ${quake.location.depth}km](${getMapLink(quake.location)})`;
      })
      .join('\n');
  }

  saveReportFile(humanTime.fileSafeString + '.md', markdown);
}

interface NengoInterface {
  name: string;
  kanjiName: string;
  baseYear: number;
  years?: number;
}

interface NengoYearInterface {
  nengo: NengoInterface;
  year: {
    number: number;
    kanji: string;
  };
}

const nengos: NengoInterface[] = [
  { name: 'reiwa', kanjiName: '令和', baseYear: 2019 },
  { name: 'heisei', kanjiName: '平成', baseYear: 1989 },
];

function inNengoRange(baseYear: number, year: number, years?: number) {
  const workYear = years === undefined ? 30 : years;
  return baseYear <= year && year < baseYear + workYear;
}

function getNengo(date: Date): NengoYearInterface | undefined {
  // First, Convert to JST
  const jpDate = new Date(date.setMinutes(date.getMinutes() + (date.getTimezoneOffset() - -540)));

  // get Year and Months
  let year = jpDate.getFullYear();
  const month = jpDate.getMonth() + 1; // counting from 0

  if (month > 4) {
    // new Nengo System is used. Dafaq
  } else {
    // prev Nengo System is used.
    year--;
  }

  const kanjiIdx = ' 一二三四五六七八九';

  for (const nengo of nengos) {
    if (inNengoRange(nengo.baseYear, year, nengo.years)) {
      const nengoYear = year - nengo.baseYear + 1;

      let kanji = '';
      if (nengoYear === 1) {
        kanji = '元';
      } else {
        if (nengoYear > 10) {
          if (nengoYear / 10 >= 2) {
            kanji += kanjiIdx.charAt(Math.floor(nengoYear / 10));
          }
          kanji += '十';
        }

        if (nengoYear % 10 !== 0) {
          kanji += kanjiIdx.charAt(Math.floor(nengoYear % 10));
        }
      }

      kanji += '年';

      return {
        nengo,
        year: {
          number: nengoYear,
          kanji,
        },
      };
    }
  }

  // Why am i doing this
  return undefined;
}
