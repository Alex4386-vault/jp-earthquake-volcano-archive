export interface NengoInterface {
  name: string;
  kanjiName: string;
  baseYear: number;
  years?: number;
}

export interface NengoYearInterface {
  nengo: NengoInterface;
  year: {
    number: number;
    kanji: string;
  };
  month: number;
  date: number;

  hours: number;
  minutes: number;
}

const nengos: NengoInterface[] = [
  { name: 'reiwa', kanjiName: '令和', baseYear: 2019 },
  { name: 'heisei', kanjiName: '平成', baseYear: 1989 },
];

function inNengoRange(baseYear: number, year: number, years?: number) {
  const workYear = years === undefined ? 30 : years;
  return baseYear <= year && year < baseYear + workYear;
}

export function getNengo(date: Date): NengoYearInterface | undefined {
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
        month: date.getMonth(),
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
      };
    }
  }

  // Why am i doing this
  return undefined;
}
