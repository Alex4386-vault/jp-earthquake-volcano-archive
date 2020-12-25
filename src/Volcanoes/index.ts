import axios from 'axios';
import { JSDOM } from 'jsdom';
import { htmlStripper, jmaRoot, LatitudeLongitude, meterToFeet } from '../common';
import * as geolib from 'geolib';

export enum AreaIdentifier {
  GLOBAL = 0,
  HOKKAIDO = 1,
  TOHOKU = 2,
  KANTO_CHUBU = 3,
  IZU_OGASAWARA = 4,
  CHUGOKU = 5,
  KYUSHU = 6,
  OKINAWA = 7,
  MAX = 7,
}

enum VolcanoType {
  VOLCANO = 'volcano',
  SUBMARINE_VOLCANO = 'submarineVolcano',
}

enum VolcanoAlertType {
  VOLCANIC_ALERT = 'volcanicAlert',
  NON_VOLCANIC_ALERT = 'nonVolcanicAlert',
  SUBMARINE_ALERT = 'submarineAlert',
}

type VolcanoAlertLevels = VolcanicAlertLevel | NonVolcanicAlertLevel | SubmarineVolcanoWarningLevel;

enum VolcanicAlertLevel {
  POTENTIAL_ACTIVITY = 1,
  DO_NOT_APPROACH_THE_CRATER = 2,
  DO_NOT_APPROACH_THE_VOLCANO = 3,
  PREPARE_TO_EVACUATE = 4,
  EVACUATE = 5,
}

enum NonVolcanicAlertLevel {
  POTENTIAL_ACTIVITY = 1,
  NEAR_CRATER_WARNING = 2,
  NON_RESIDENTIAL_WARNING = 3,
  RESIDENTIAL_WARNING = 4,
}

enum SubmarineVolcanoWarningLevel {
  POTENTIAL_ACTIVITY = 0,
  VOLCANIC_WARNING = 1,
}

const englishVolcanoList = `${jmaRoot}/en/volcano`;

// oh love of :facepalm:-ing gosh,
// What the actual heck is this code:
// javascript:jump('//www.data.jma.go.jp/svd/vois/data/sapporo/eng/153/153-eng.htm');

const javascriptJibberishJumpRegex = /^javascript:jump\(\'(http:|https:|)\/\/([A-Za-z0-9\.\:\/-]+)\'\);$/gi;

const volcanoDetailPageUrlParsing = /data\/([A-Za-z0-9]+)\/eng\/([0-9A-Za-z]+)\/([0-9A-Za-z\-]+).htm$/gi;
// [1] region, [2] volcano identifier, [3] same as [2] but some volcanoes has different value :facepalm:

interface MapNode {
  lastUpdate: Date;
  body: string;
}

const maps: MapNode[] = [];
const MAPS_CACHE_THRESHOLD = 10 * 1000;

export async function getMapsLastUpdate(area: AreaIdentifier) {
  if (maps[area] === undefined) await getMaps(area);
  return maps[area].lastUpdate;
}

export async function getMaps(area: AreaIdentifier) {
  if (maps[area] === undefined) {
    console.log('[Debug] Cache Missing at ' + area + '! Updating...');
    const res = await axios.get(getVolcanoMapAreaURL(area));
    const serverLastUpdate =
      res.headers['Last-Modified'] === undefined ? new Date() : new Date(res.headers['Last-Modified']);
    maps[area] = {
      lastUpdate: serverLastUpdate,
      body: res.data,
    };
    console.log('[Debug] Generated Cache at ' + area + '!');
  } else {
    const lastUpdate = maps[area].lastUpdate;
    if (new Date().getTime() - lastUpdate.getTime() > MAPS_CACHE_THRESHOLD) {
      try {
        const res = await axios(getVolcanoMapAreaURL(area), {
          headers: {
            'If-Modified-Since': lastUpdate.toUTCString(),
          },
        });
      } catch (e) {
        if (e.response !== undefined) {
          if (e.response.status === 304) {
            console.log('[Debug] Not modified! Cache hit at ' + area + '!');
          }
        }
      }
    } else {
      console.log('[Debug] Cache Threshold hit at ' + area + '!');
    }
  }

  return maps[area].body;
}

interface ParsedVolcanoAlert {
  type: VolcanoType;
  alert: {
    type: VolcanoAlertType;
    level: VolcanoAlertLevels;
  };
}

function classifyVolcanoViaWarning(warningMsg: string): ParsedVolcanoAlert | null {
  warningMsg = warningMsg.trim().toLowerCase();

  if (warningMsg.includes('level')) {
    if (warningMsg.includes('level 5')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.VOLCANIC_ALERT,
          level: VolcanicAlertLevel.EVACUATE,
        },
      };
    } else if (warningMsg.includes('level 4')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.VOLCANIC_ALERT,
          level: VolcanicAlertLevel.PREPARE_TO_EVACUATE,
        },
      };
    } else if (warningMsg.includes('level 3')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.VOLCANIC_ALERT,
          level: VolcanicAlertLevel.DO_NOT_APPROACH_THE_VOLCANO,
        },
      };
    } else if (warningMsg.includes('level 2')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.VOLCANIC_ALERT,
          level: VolcanicAlertLevel.DO_NOT_APPROACH_THE_CRATER,
        },
      };
    } else if (warningMsg.includes('level 1')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.VOLCANIC_ALERT,
          level: VolcanicAlertLevel.POTENTIAL_ACTIVITY,
        },
      };
    }
  } else if (!warningMsg.includes('sea') && warningMsg.includes('warning')) {
    if (warningMsg.includes('crater') && warningMsg.includes('non-residential')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.NON_VOLCANIC_ALERT,
          level: NonVolcanicAlertLevel.NON_RESIDENTIAL_WARNING,
        },
      };
    } else if (warningMsg.includes('crater') && warningMsg.includes('residential')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.NON_VOLCANIC_ALERT,
          level: NonVolcanicAlertLevel.RESIDENTIAL_WARNING,
        },
      };
    } else if (warningMsg.includes('crater')) {
      return {
        type: VolcanoType.VOLCANO,
        alert: {
          type: VolcanoAlertType.NON_VOLCANIC_ALERT,
          level: NonVolcanicAlertLevel.NEAR_CRATER_WARNING,
        },
      };
    }
  } else if (warningMsg.includes('sea')) {
    return {
      type: VolcanoType.SUBMARINE_VOLCANO,
      alert: {
        type: VolcanoAlertType.SUBMARINE_ALERT,
        level: SubmarineVolcanoWarningLevel.VOLCANIC_WARNING,
      },
    };
  } else if (warningMsg.includes('potential for increased activity')) {
    return {
      type: VolcanoType.VOLCANO,
      alert: {
        type: VolcanoAlertType.NON_VOLCANIC_ALERT,
        level: VolcanicAlertLevel.POTENTIAL_ACTIVITY,
      },
    };
  } else {
    return null;
  }

  return null;
}

function getVolcanoMapAreaURL(area: AreaIdentifier): string {
  if (area === AreaIdentifier.GLOBAL) {
    return englishVolcanoList;
  }
  return `${englishVolcanoList}/map_${area}.html`;
}

interface AreaURL {
  area: AreaIdentifier;
  url: string;
}

export async function loadVolcanoesDataByArea(area: AreaIdentifier): Promise<AreaURL[]> {
  if (area === AreaIdentifier.GLOBAL) {
    const volcanoes: AreaURL[] = [];
    for (let i = 1; i <= AreaIdentifier.MAX; i++) {
      let areaVolcanoes = await loadVolcanoesDataByArea(i);
      areaVolcanoes = areaVolcanoes.filter((n) => volcanoes.map((m) => m.url === n.url).indexOf(true) < 0);
      volcanoes.push(...areaVolcanoes);
    }
    return volcanoes;
  }

  const body = await getMaps(area);
  const {
    window: { document },
    ...dom
  } = new JSDOM(body);

  const volcanoURLs: AreaURL[] = [];

  // what? a map tag? is this 2010s South Korean Internet or something?
  const map = document.getElementsByTagName('map')[0];
  const volcanoIcons = (map.getElementsByTagName('area') as unknown) as HTMLAreaElement[];

  for (const volcanoIcon of volcanoIcons) {
    const javascriptJibberishJump = volcanoIcon.href.trim().normalize('NFC');
    javascriptJibberishJumpRegex.lastIndex = 0;

    const result = javascriptJibberishJumpRegex.exec(javascriptJibberishJump);
    if (result === null) continue;

    let protocol = result[1];
    let url = result[2];

    if (protocol === '') protocol = 'https';

    url = protocol + '://' + url.trim();

    if (volcanoURLs.filter((n) => n.url === url).length === 0) {
      volcanoURLs.push({
        area,
        url: url,
      });
    }
  }

  return volcanoURLs;
}

export function parseRegionAndId(url: string) {
  volcanoDetailPageUrlParsing.lastIndex = 0;
  const parsed = volcanoDetailPageUrlParsing.exec(url);
  if (parsed === null) return {};

  const region = parsed[1];
  const idString = parsed[2];

  const isValidId = /[0-9]+/gi.test(idString);

  return {
    region,
    id: isValidId ? parseInt(idString) : undefined,
  };
}

export interface VolcanoModel {
  id?: number;

  region?: string;
  area: AreaIdentifier;

  name: string;
  lastUpdate: Date;

  location: string;
  craters: CraterModel[];

  metadata: {
    img?: string;
    memo?: string;
    page: string;
  };

  alerts?: {
    data: VolcanoStatus[];
    lastUpdate: Date;
  };
}

interface CraterLocation extends LatitudeLongitude {
  elevation?: {
    meter: number;
    feet: number;
  };
}

interface CraterModel {
  name?: string;
  location: CraterLocation;
}

export async function getVolcanoMetadata(areaUrl: AreaURL, cache?: VolcanoModel): Promise<VolcanoModel> {
  const url = areaUrl.url;
  const area = areaUrl.area;

  // get directory for image referencing
  const volcanoDir = url.substring(0, url.lastIndexOf('/')).replace(/((\?|#).*)?$/, '');
  const regionData = parseRegionAndId(url);

  let volcanoInfoWeb;
  if (cache !== undefined) {
    try {
      volcanoInfoWeb = await axios(url, {
        headers: {
          'If-Modified-Since': cache.lastUpdate.toUTCString(),
        },
      });
      console.log('[Debug] Non Cache hit at ' + areaUrl.url);
    } catch (e) {
      if (e.response !== undefined) {
        if (e.response.status === 304) {
          console.log('[Debug] Cache hit at ' + areaUrl.url);
          return cache;
        }
      }

      throw e;
    }
  } else {
    volcanoInfoWeb = await axios(url);
  }

  let lastUpdate =
    volcanoInfoWeb.headers['Last-Modified'] !== undefined
      ? new Date(volcanoInfoWeb.headers['Last-Modified'])
      : new Date();

  const volcanoInfoData = volcanoInfoWeb.data;
  const { window: volcanoInfoDataDomWindow } = new JSDOM(volcanoInfoData);
  const document = volcanoInfoDataDomWindow.document;

  const isFormatNew = document.getElementsByClassName('titleL').length > 0;
  const hasMemo = document.getElementsByClassName('memo').length > 0;
  const hasMemoOld = document.getElementsByTagName('tr').length > 1;

  let memo = undefined;
  if (hasMemo || hasMemoOld) {
    if (hasMemo) {
      memo = htmlStripper(document.getElementsByClassName('memo')[0].innerHTML);
    } else {
      memo = htmlStripper(document.getElementsByTagName('tr')[1].innerHTML);
    }

    const tmp = memo.split('\n');
    for (let i = 0; i < tmp.length; i++) {
      tmp[i] = tmp[i].trim();
    }
    memo = tmp.join('\n');
    memo.trim();
  }

  let volcanoData;

  if (!isFormatNew) {
    volcanoData = document.getElementsByTagName('table')[0].getElementsByTagName('td')[0].innerHTML;
  } else {
    // new format!
    const volName = document.getElementsByClassName('titleL')[0].innerHTML;
    const volLocation = document.getElementsByClassName('title2')[0].innerHTML;

    volcanoData = volName + '\n(' + volLocation + ')\n';

    const volCraterLocs = (document.getElementsByClassName('pos') as unknown) as HTMLDivElement[];
    for (const volCraterLoc of volCraterLocs) {
      volcanoData += volCraterLoc.innerHTML;
    }
  }

  const volcanoImage = volcanoDir + '/' + document.getElementsByTagName('img')[0].src;

  // remove <br> and trim the spaces
  let plainTextRaw = htmlStripper(volcanoData.replace(/\<br\>/gi, ''));
  plainTextRaw = plainTextRaw.replace(/′/g, "'").replace(/″/g, '"').replace(/�@/g, ' ').replace(/;/g, '');

  const plainTextRawLineSplit = plainTextRaw.split('\n');

  for (let i = 0; i < plainTextRawLineSplit.length; i++) {
    plainTextRawLineSplit[i] = plainTextRawLineSplit[i].trim();
  }
  const plainText = plainTextRawLineSplit.join('\n');

  // get two linereturns and split using that
  const craterText = plainText.split('\n\n').filter((n) => n !== '');

  // parse the human readable data with regex
  const volcanoParser = /([A-Za-z0-9\-\(\) ]+)\n\(([A-Za-z\(\)0-9\,\.\- ]+|)\)/gi;
  const craterParser = /(?:\(([A-Za-z0-9\- \,\.]+)\)\n|())Lat(?:\.:|:|\. |\.|)(?: |)([0-9°'"\. NS]+)\nLon(?:.|):(?: |)([0-9°'"\. WE]+)\nSummit(?: |)Elevation(?:: | |)([0-9,\- ]+|submarine)(?: m|m|)/gi;
  volcanoParser.lastIndex = 0;

  // parse volcano data
  const volcanoInfoRaw = volcanoParser.exec(craterText[0]);
  if (volcanoInfoRaw === null) {
    console.log(url);
    console.log(volcanoInfoData);
    console.log(craterText);

    throw new Error('Unparsable volcano data');
  }

  const name = volcanoInfoRaw[1];

  // parse crater data
  const craterInfo: CraterModel[] = [];
  const craterInfoText = craterText.splice(1);
  for (const craterText of craterInfoText) {
    craterParser.lastIndex = 0;

    const craterParsed = craterParser.exec(craterText);
    if (craterParsed === null) {
      continue;
    }

    const name = craterParsed[2] === '' ? undefined : craterParsed[1];

    craterParsed[3] = craterParsed[3].replace(/ /, '').replace(/""/g, '"');
    craterParsed[4] = craterParsed[4].replace(/ /, '').replace(/""/g, '"');
    craterParsed[5] = craterParsed[5].replace(/--/g, '-');

    let latitudeDec, longitudeDec;
    try {
      latitudeDec = geolib.sexagesimalToDecimal(craterParsed[3]);
      longitudeDec = geolib.sexagesimalToDecimal(craterParsed[4]);
    } catch (e) {
      if (craterParsed[3].includes('.') || !craterParsed[3].includes('"')) {
        const degrees = craterParsed[3].split('°')[0];
        const minutes = craterParsed[3].split("'")[0];

        const way = craterParsed[3].includes('N') ? 1 : -1;
        latitudeDec = (parseInt(degrees) + parseFloat(minutes) / 60) * way;
        craterParsed[3] = geolib.decimalToSexagesimal(latitudeDec);
      }
      if (craterParsed[4].includes('.') || !craterParsed[4].includes('"')) {
        const degrees = craterParsed[4].split('°')[0];
        const minutes = craterParsed[4].split("'")[0];

        const way = craterParsed[4].includes('E') ? 1 : -1;
        longitudeDec = (parseInt(degrees) + parseFloat(minutes) / 60) * way;
        craterParsed[4] = geolib.decimalToSexagesimal(longitudeDec);
      }
      continue;
    }
    const elevation =
      craterParsed[5].toLowerCase().trim() !== 'submarine'
        ? parseInt(craterParsed[5].replace(/([^0-9\-])/gi, ''))
        : undefined;

    const craterData = {
      name,
      location: {
        decimal: {
          latitude: latitudeDec,
          longitude: longitudeDec,
        },
        sexagesimal: {
          latitude: craterParsed[3],
          longitude: craterParsed[4],
        },
        elevation:
          elevation !== undefined
            ? {
                meter: elevation,
                feet: meterToFeet(elevation),
              }
            : undefined,
      },
    };

    craterInfo.push(craterData);
  }

  let id = regionData.id;

  if (name.toLowerCase() === 'tenchozan') {
    id = 119;
  } else if (name.toLowerCase() === 'oakandake') {
    id = 120;
  }

  const region = regionData.region;
  const location = volcanoInfoRaw[2];
  const craters = craterInfo;

  const volcanoTmpInfo = {
    id,
    region,
    area,
    name,
    location,
    craters,
    metadata: {
      img: volcanoImage,
      memo,
      page: url,
    },
  };

  if (cache !== undefined) {
    if (JSON.stringify(volcanoTmpInfo) === JSON.stringify(cache)) {
      lastUpdate = new Date(cache.lastUpdate);
    } else {
      cache.id = volcanoTmpInfo.id;
      cache.region = volcanoTmpInfo.region;
      cache.area = volcanoTmpInfo.area;
      cache.name = volcanoTmpInfo.name;
      cache.location = volcanoTmpInfo.location;
      cache.craters = volcanoTmpInfo.craters;
      cache.metadata = volcanoTmpInfo.metadata;
      cache.lastUpdate = lastUpdate;
    }
  }

  const volcanoInfo = {
    lastUpdate,
    ...volcanoTmpInfo,
  };

  return volcanoInfo;
}

interface VolcanoStatus {
  issuedTo: string;
  issuedAt?: string;
  alert: {
    parsed?: ParsedVolcanoAlert | null;
    raw: {
      keyword: string;
      code?: string;
      info?: {
        contents?: string;
        link?: string;
      };
    };
  };
}

export async function getVolcanoStatus(area: AreaIdentifier) {
  const volcanoesStatus: VolcanoStatus[] = [];
  if (area < 0) {
    for (let i = 0; i < AreaIdentifier.MAX; i++) {
      let tmpStatus = await getVolcanoStatus(i);

      tmpStatus = tmpStatus.filter((n) => !volcanoesStatus.map((j) => j.issuedTo === n.issuedTo).includes(true));
      volcanoesStatus.push(...tmpStatus);
    }

    return volcanoesStatus;
  }

  const body = await getMaps(area);
  const {
    window: { document },
    ...dom
  } = new JSDOM(body);

  const regionalCurrent = document.getElementsByClassName('infotable').length;
  const infotable = document.getElementsByClassName('infotable')[regionalCurrent - 1];

  const data = (infotable.getElementsByTagName('tr') as unknown) as HTMLTableRowElement[];

  if (area === AreaIdentifier.GLOBAL) {
    for (const datum of data) {
      const details = datum.getElementsByTagName('td');
      if (details.length === 0) continue;
      const infoLocation = details[0].getElementsByTagName('a')[0].href;

      const infoURL = getVolcanoMapAreaURL(AreaIdentifier.GLOBAL) + '/' + infoLocation;

      // information uses Global URL in any case.
      const info = await axios.get(infoURL);
      const infodom = new JSDOM(info.data);

      const infoObj = infodom.window.document.getElementsByClassName('textframe')[0];
      const infoText = htmlStripper(infoObj.innerHTML.replace(/<br>/g, '\n'));

      const data = {
        issuedTo: details[2].innerHTML.trim(),
        issuedAt: details[3].innerHTML.trim(),
        alert: {
          raw: {
            keyword: details[1].innerHTML.trim(),
            code: htmlStripper(details[0].innerHTML),
            info: {
              contents: infoText,
              link: infoURL,
            },
          },
          parsed: await classifyVolcanoViaWarning(details[1].innerHTML.trim()),
        },
      };

      volcanoesStatus.push(data);
    }
  } else {
    for (const datum of data) {
      const details = datum.getElementsByTagName('td');
      if (details.length === 0) continue;

      const issuedTo = htmlStripper(details[0].innerHTML);
      const volcanoAlert = htmlStripper(details[1].innerHTML);

      const data = {
        issuedTo: issuedTo.trim(),
        issuedAt: undefined,
        alert: {
          raw: {
            keyword: volcanoAlert,
            code: undefined,
          },
          parsed: await classifyVolcanoViaWarning(volcanoAlert),
        },
      };

      volcanoesStatus.push(data);
    }
  }

  return volcanoesStatus;
}
