# Japan Earthquake & Volcano Database Archive
This repository will automatically parse the volcano and earthquake data into machine readable JSON format and archive it from [Japan Meteorological Agency's webpage](https://www.jma.go.jp/jma/indexe.html).  

## UPDATE REQUIRED
Since English page of JMA has been updated, This requires me to manually update the logic.  
Since [Stella IT](https://stella-it.com) connection from japan has been mitigated to South Korea due to recent M7.3 earthquake on Fukushima (due to consistency concerns / can not check it by person **due to a VIRUS**), This software will be fixed in low priority.
  
But It **seems to be a easy-task** since finally Japanese Government created the **web-application in MACHINE READABLE WAY**.  
(Providing information separately via XHR Calls.)  

## Reason why this was created
Since [Stella IT Inc.](https://stella-it.com) has abroad network POPs, It needs to monitor data centers on japan.  
Since Japanese Government does NOT provide openAPIs for these, I created pseudo-api and archiving tool for machines on GitHub.  
robvi
Therefore, data on [data/](data/) and [reports](reports/) is copyrighted by [Japanese Meteorlogical Agency](https://www.jma.go.jp/jma/indexe.html). Not by me and not covered by this software's license (WTFPL).  

## Update Intervals
GitHub Actions will run every 10 minutes or every push.  
The commit will not occurr when no updates are found in the webpage.  
  
If you are going to use raw data, consider using a `If-Modified-Since` header while requesting to Raw JSON file.  

## GitHub Actions Status
The content of the `volcanoes.json`, `earthquakes.json` and `updates.json` depends on GitHub Actions.  
Please check the following GitHub Actions status to make sure you get a latest information.  

You can check `updates.json` to check when it was last synchornized.  

| Name                      | Status                                                                                                         |
|---------------------------|----------------------------------------------------------------------------------------------------------------|
| Update Database           | [![Update Database](https://github.com/Alex4386/jp-earthquake-volcano-archive/workflows/Update%20Database/badge.svg)](https://github.com/Alex4386/jp-earthquake-volcano-archive/actions?query=workflow%3A%22Update+Database%22) |
| Update Alerts             | [![Update Alerts](https://github.com/Alex4386/jp-earthquake-volcano-archive/workflows/Update%20Alerts/badge.svg)](https://github.com/Alex4386/jp-earthquake-volcano-archive/actions?query=workflow%3A%22Update+Alerts%22) |

## Archived JSON Data
### GitHub Actions Update Data
* [Updates](data/updates.json) - [Raw](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/updates.json) ([minified](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/updates.min.json)) - [Source](https://www.jma.go.jp/en/volcano/) - [Example](DATA_FORMAT.md#Updates)

### Parsed Data Archive
* [Volcanoes](data/volcanoes.json) - [Raw](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/volcanoes.json) ([minified](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/volcanoes.min.json)) - [Source](https://www.jma.go.jp/en/volcano/) - [Example](DATA_FORMAT.md#Volcanoes)
* [Earthquakes](data/earthquakes.json) - [Raw](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/earthquakes.json) ([minified](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/data/earthquakes.min.json))- [Source](https://www.jma.go.jp/en/quake/quake_singendo_index.html)  - [Example](DATA_FORMAT.md#Earthquakes)

## Human Readable Data
**Warning. Those reports are buggy on nengo handling.**  
Human readable reports (in English) is available at: [reports/](reports/).  
Most Latest Report is available at: [reports/latest.md](reports/latest.md).

## Twitter
The automatic update for twitter of this crawl data could be found at [@JapanGeoAlert](https://twitter.com/JapanGeoAlert).  

## License
The Source code is distributed under [WTFPL](LICENSE).  
  
However, contents of `data/` and `reports/` are distributed under separate license,  
Please check [JMA's Copyright Notice](https://www.jma.go.jp/jma/en/copyright.html) for more information while using this data.  
