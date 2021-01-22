import { convertDateToHumanStrings, getMapLink } from './common';
import { saveLatestReport, saveReportFile } from './common/fileSystem';
import { UpdateModel } from './update';
import fs from 'fs';

export function createReportFile(updates: UpdateModel): void {
  let markdown = '';

  const lastUpdateDate = updates.lastUpdate;

  const humanTime = convertDateToHumanStrings(lastUpdateDate);

  markdown += `# ${humanTime.ymdString} ${humanTime.timeString} Report\n`;
  markdown += humanTime.nengoString !== undefined ? `${humanTime.nengoString}\n` : '';

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
          } ${date.timeString} UTC  
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
        [Report Link](${quake.url})  
[epicenter @ ${quake.location.depth}km](${getMapLink(quake.location)})`;
      })
      .join('\n');
  }

  saveReportFile(humanTime.fileSafeString + '.md', markdown);
  saveLatestReport(markdown);
}

export function createCommitMessage(updates: UpdateModel): void {
  let commitMessage = '';

  const lastUpdateDate = updates.lastUpdate;

  if (updates.volcanoes.length > 0 && updates.earthquakes.length > 0) {
    // ooh- dual updates.
    commitMessage = 'build: updated multiple volcanoes and earthquakes alerts';
  } else if (updates.volcanoes.length > 0) {
    if (updates.volcanoes.length === 1) {
      const updatedVolcano = updates.volcanoes[0];
      commitMessage = 'build: updated volcano ' + updatedVolcano.name;
    } else {
      commitMessage = 'build: updated multiple volcano alerts';
    }
  } else if (updates.earthquakes.length > 0) {
    if (updates.earthquakes.length === 1) {
      const updatedEarthquake = updates.earthquakes[0];
      commitMessage = 'build: updated earthquake at ' + updatedEarthquake.regionName;
    } else {
      commitMessage = 'build: updated multiple earthquake alerts';
    }
  } else {
    commitMessage = '';

    return;
  }

  fs.writeFileSync('.COMMIT_MSG', commitMessage);
}
