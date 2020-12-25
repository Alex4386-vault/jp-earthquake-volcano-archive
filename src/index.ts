import { saveJSON } from './common/fileSystem';
import { updateEarthquakes, updateVolcanoes } from './update';

(async () => {
  const [earthquakeUpdates, volcanoesUpdates] = await Promise.all([updateEarthquakes(), updateVolcanoes(true)]);

  const isThereUpdates = earthquakeUpdates.length + volcanoesUpdates.length > 0;
  const updates = {
    lastUpdate: new Date(),
    earthquakes: earthquakeUpdates,
    volcanoes: volcanoesUpdates,
  };

  if (isThereUpdates) {
    saveJSON('updates.json', updates);
  }
})();
