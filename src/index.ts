import { convertDateToHumanStrings } from './common';
import { saveJSON } from './common/fileSystem';
import { createReportFile } from './report';
import { updateEarthquakes, updateFile, UpdateModel, updateVolcanoes } from './update';

(async () => {
  const [earthquakeUpdates, volcanoesUpdates] = await Promise.all([updateEarthquakes(), updateVolcanoes(true)]);

  const isThereUpdates = earthquakeUpdates.length + volcanoesUpdates.length > 0;
  const updates: UpdateModel = {
    lastUpdate: new Date(),
    earthquakes: earthquakeUpdates,
    volcanoes: volcanoesUpdates,
  };

  if (isThereUpdates) {
    updates.reportFile = convertDateToHumanStrings(updates.lastUpdate).fileSafeString + '.md';
    saveJSON(updateFile, updates);
    createReportFile(updates);
  }
})();
