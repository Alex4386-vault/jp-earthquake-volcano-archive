import { saveJSON } from './common/fileSystem';
import { createReportFile, updateEarthquakes, updateFile, updateVolcanoes } from './update';

(async () => {
  const [earthquakeUpdates, volcanoesUpdates] = await Promise.all([updateEarthquakes(), updateVolcanoes()]);

  const isThereUpdates = earthquakeUpdates.length + volcanoesUpdates.length > 0;
  const updates = {
    lastUpdate: new Date(),
    earthquakes: earthquakeUpdates,
    volcanoes: volcanoesUpdates,
  };

  if (isThereUpdates) {
    saveJSON(updateFile, updates);
    createReportFile(updates);
  }
})();
