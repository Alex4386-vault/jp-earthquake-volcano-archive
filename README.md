# Japan Earthquake & Volcano Database Archive
This repository will automatically parse the volcano and earthquake data into machine readable JSON format and archive it from [Japan Meteorological Agency's webpage](https://www.jma.go.jp/jma/indexe.html).  

## Data
* [Volcanoes](volcanoes.json) - [Raw](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/volcanoes.json) - [Source](https://www.jma.go.jp/en/volcano/)
* [Earthquakes](earthquakes.json) - [Raw](https://raw.githubusercontent.com/Alex4386/jp-earthquake-volcano-archive/main/earthquakes.json) - [Source](https://www.jma.go.jp/en/quake/quake_singendo_index.html) 

## Update Intervals
GitHub Actions will run every 10 minutes or every push.  
The commit will not occurr when no updates are found in the webpage.  
  
If you are going to use raw data, consider using a `If-Modified-Since` header while requesting to Raw JSON file.  

## GitHub Actions Status
The content of the `volcanoes.json` and `earthquakes.json` depends on GitHub Actions.  
Please check the following GitHub Actions status to make sure you get a latest information.  

| Name                      | Status                                                                                                         |
|---------------------------|----------------------------------------------------------------------------------------------------------------|
| Update Database           | [![Update Database](https://github.com/Alex4386/jp-earthquake-volcano-archive/workflows/Update%20Database/badge.svg)](https://github.com/Alex4386/jp-earthquake-volcano-archive/actions?query=workflow%3A%22Update+Database%22) |
| Update Alerts             | [![Update Alerts](https://github.com/Alex4386/jp-earthquake-volcano-archive/workflows/Update%20Alerts/badge.svg)](https://github.com/Alex4386/jp-earthquake-volcano-archive/actions?query=workflow%3A%22Update+Alerts%22) |

## License
The Source code is distributed under [WTFPL](LICENSE).  
  
However, `volcanoes.json` and `earthquakes.json` is distributed under separate license,  
Please check [JMA's Copyright Notice](https://www.jma.go.jp/jma/en/copyright.html) for more information while using this data.  
