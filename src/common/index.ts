import { getNengo, NengoYearInterface } from './nengo';

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

export function getMapLink(coord: LatitudeLongitude): string {
  return `https://www.google.com/maps/place/${coord.sexagesimal.latitude
    .replace(/"/g, '%22')
    .replace(/ /g, '')}+${coord.sexagesimal.longitude.replace(/"/g, '%22').replace(/ /g, '')}/@${
    coord.decimal.latitude
  },${coord.decimal.longitude},17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d${coord.decimal.latitude}!4d${
    coord.decimal.longitude
  }`;
}

interface HumanDateCollection {
  year: {
    westernYear: number;
    nengo?: NengoYearInterface;
  };
  month: string;
  date: string;
  ymdString: string;
  nengoString?: string;
  timeString: string;
  fileSafeString: string;
}

export function convertDateToHumanStrings(date: Date): HumanDateCollection {
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

  const nengoHours = nengo?.hours;
  const nengoMinutes = nengo?.minutes;

  const nengoHoursPad = nengoHours?.toString().padStart(2, '0');
  const nengoMinutesPad = nengoMinutes?.toString().padStart(2, '0');

  return {
    year: {
      westernYear,
      nengo,
    },
    month,
    date: dateCal,

    ymdString: westernYear + '-' + monthPad + '-' + datePad,
    nengoString:
      nengo !== undefined
        ? `${nengo.nengo.kanjiName} ${nengo.year.kanji} ${nengo.month}月 ${nengo.date}日 ${nengoHoursPad}:${nengoMinutesPad}`
        : undefined,
    timeString: hoursPad + ':' + minutesPad,

    fileSafeString: westernYear + monthPad + datePad + hoursPad + minutesPad,
  };
}
