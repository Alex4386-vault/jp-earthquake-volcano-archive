import {
  AreaIdentifier,
  getVolcanoMetadata,
  getVolcanoStatus,
  loadVolcanoesDataByArea,
  VolcanoModel,
} from './Volcanoes';
import fs from 'fs';
import { EarthquakeCache, getEarthquakes } from './Earthquake';
import { getMapsLastUpdate } from './Volcanoes';

const volcanoesFile = './volcanoes.json';
const earthquakeFile = './earthquakes.json';

(async () => {
  let cache: EarthquakeCache;

  if (fs.existsSync(earthquakeFile)) {
    cache = JSON.parse(fs.readFileSync(earthquakeFile, { encoding: 'utf-8' }));
    cache.lastUpdate = new Date(cache.lastUpdate);
    await getEarthquakes(cache);
  } else {
    cache = {
      lastUpdate: new Date(),
      data: await getEarthquakes(),
    };
  }

  fs.writeFileSync(earthquakeFile, JSON.stringify(cache, null, 2));
})();

(async () => {
  let volcanoes: VolcanoModel[] = [];

  if (!fs.existsSync(volcanoesFile)) {
    volcanoes = [];
    const volcanoesURL = await loadVolcanoesDataByArea(AreaIdentifier.GLOBAL);

    /*
    for (const volcanoURL of volcanoesURL) {
      const volcano = await getVolcanoMetadata(volcanoURL);
      volcanoes.push(volcano);
      volcano?.craters.length == 0
        ? console.log(
            '[Volca] Error while processing volcano ' + volcano.name + ' at ' + volcano.region + '#' + volcano.id,
          )
        : console.log('[Volca] Processed volcano ' + volcano?.name + '!');
    }
    */
  } else {
    volcanoes = JSON.parse(fs.readFileSync('./volcanoes.json', { encoding: 'utf-8' }));

    for (const volcano of volcanoes) {
      volcano.lastUpdate = new Date(volcano.lastUpdate);
      if (volcano.alerts?.lastUpdate) volcano.alerts.lastUpdate = new Date(volcano.alerts?.lastUpdate);

      /*
      await getVolcanoMetadata(
        {
          area: volcano.area,
          url: volcano.metadata.page,
        },
        volcano,
      );
      */
    }
  }

  const updateVolcanoStatus = async () => {
    const alerts = await getVolcanoStatus(-1);

    for (const alert of alerts) {
      let volcanoIdx = volcanoes.map((n) => n.name === alert.issuedTo).indexOf(true);
      if (volcanoIdx < 0) {
        volcanoIdx = volcanoes.map((n) => alert.issuedTo.includes(n.name)).indexOf(true);

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

      const duplicateExists = volcano.alerts.data.map((n) => n.issuedAt === alert.issuedAt).indexOf(true) >= 0;
      if (!duplicateExists) {
        console.log('[Volca] Updating volcano status ' + volcano.name);
        volcano.alerts.data.push(alert);
      }
    }
    fs.writeFileSync(volcanoesFile, JSON.stringify(volcanoes, null, 2));
  };

  await updateVolcanoStatus();
})();
