# Data Format

## Volcanoes

```json
{
  // last time when volcano's metadata has been updated
  // ex: id, region, area, name, location, craters
  "lastUpdate": "2020-12-25T12:30:12.920Z", 

  // unique id given by JMA
  "id": 505,

  // JMA specified region id of volcano
  "region": "fukuoka",

  // JMA specified area code of volcano
  //
  // 1 = hokkaido, 2 = tohoku, 3 = kanto/chubu
  // 4 = izu/ogasawara, 5 = chugoku, 6 = kyushu
  // 7 = okinawa
  "area": 6,

  // name of the volcano
  "name": "Kirishimayama",
  
  // location of the volcanor
  "location": "(Kyushu, Japan)",

  // list of craters or subgroup volcanoes
  "craters": [
    {
      // name of the subgroup volcano,
      // if this volcano consists of one crater,
      // this field can be undefined.
      "name": "Karakunidake",

      // latitude, longitude and elevation
      // of this crater/subgroup volcano
      "location": {
        "decimal": {
          "latitude": 31.934166666666666,
          "longitude": 130.86166666666665
        },
        "sexagesimal": {
          "latitude": "31°56'03\"N",
          "longitude": "130°51'42\"E"
        },
        "elevation": {
          "meter": 1700,
          "feet": 5577.428
        }
      }
    },
    {
      "name": "Shinmoedake",
      "location": {
        "decimal": {
          "latitude": 31.909444444444443,
          "longitude": 130.8863888888889
        },
        "sexagesimal": {
          "latitude": "31°54'34\"N",
          "longitude": "130°53'11\"E"
        },
        "elevation": {
          "meter": 1421,
          "feet": 4662.07364
        }
      }
    },
    {
      "name": "Takachihonomine",
      "location": {
        "decimal": {
          "latitude": 31.886388888888888,
          "longitude": 130.9188888888889
        },
        "sexagesimal": {
          "latitude": "31°53'11\"N",
          "longitude": "130°55'08\"E"
        },
        "elevation": {
          "meter": 1574,
          "feet": 5164.04216
        }
      }
    },
    {
      "name": "Ioyama",
      "location": {
        "decimal": {
          "latitude": 31.946944444444444,
          "longitude": 130.8538888888889
        },
        "sexagesimal": {
          "latitude": "31°56'49\"N",
          "longitude": "130°51'14\"E"
        },
        "elevation": {
          "meter": 1317,
          "feet": 4320.86628
        }
      }
    }
  ],

  // JMA's metadata of this volcano.
  //
  // img: image of volcano
  // memo: brief explanation of volcano
  // page: raw page of metadata location
  "metadata": {
    "img": "https://www.data.jma.go.jp/svd/vois/data/fukuoka/eng/505/505_pic1.jpg",
    "page": "https://www.data.jma.go.jp/svd/vois/data/fukuoka/eng/505/505-eng.htm"
  },

  // currently/previously active alerts of volcano
  "alerts": {
    "data": [
      {
        // issued target
        "issuedTo": "Kirishimayama (Ohachi)",
        // if it has detailed info.contents,
        // issuedAt is when JMA issued it.
        // if else, it shows when it was last crawled.
        "issuedAt": "2020-12-25T13:12:36.591Z",
        "data": {
          // raw crawl result
          "raw": {
            "keyword": "Level 1 (Potential for increased activity)"
          },
          // parsed result of the raw crawled data
          "parsed": {
            "type": "volcano",
            "alert": {
              "type": "volcanicAlert",
              "level": 1
            }
          }
        }
      },
      {
        "issuedTo": "Kirishimayama",
        "issuedAt": "2020-12-25T12:42:46.313Z",
        "data": {
          "raw": {
            "keyword": "Potential for increased activity"
          },
          "parsed": {
            "type": "volcano",
            "alert": {
              "type": "nonVolcanicAlert",
              "level": 1
            }
          }
        }
      },
      {
        "issuedTo": "Kirishimayama (Shinmoedake)",
        "issuedAt": "2020-12-25T12:00:00.000Z",
        "data": {
          "raw": {
            "keyword": "Level 2 (Do not approach the crater)",
            "code": "Near-crater warning",
            "info": {
              // JMA's briefing of issuing of this 
              // alert code
              "contents": "Kirishimayama (Shinmoedake) Volcanic Warning (Near the crater)\n21:00 JST, 25 December 2020\n\nNear-crater Warning (Level 2, Do not approach the crater) issued for Kirishimayama (Shinmoedake).\nVolcanic Alert Level upgraded from 1 to 2.\n\nRefrain from approaching the crater in the following local municipalities.\nMiyazaki:Kobayashi-shiKagoshima:Kirishima-shi\n** (Reference : Description of Volcanic Alert Levels) **\nLevel 5 (Evacuate) : Evacuate from the danger zone.\nLevel 4 (Prepare to evacuate) : Prepare to evacuate from alert areas. Have disabled people evacuate.\nLevel 3 (Do not approach the volcano) : Refrain from entering the danger zone. (Target areas are determined in line with current volcanic activity.)\nLevel 2 (Do not approach the crater) : Refrain from approaching the crater.\nLevel 1 (Potential for increased activity)\n\n\n",
              // link to briefing
              "link": "https://www.jma.go.jp/en/volcano/forecast_05_20201225120019.html"
            }
          },
          "parsed": {
            "type": "volcano",
            "alert": {
              "type": "volcanicAlert",
              "level": 2
            }
          }
        }
      },
      {
        "issuedTo": "Kirishimayama (Ebino Highland)",
        "issuedAt": "2020-12-25T13:12:36.591Z",
        "data": {
          "raw": {
            "keyword": "Level 1 (Potential for increased activity)"
          },
          "parsed": {
            "type": "volcano",
            "alert": {
              "type": "volcanicAlert",
              "level": 1
            }
          }
        }
      }
    ],
    // when this alerts are last updated
    "lastUpdate": "2020-12-25T12:29:47.733Z"
  }
}
```

## Earthquakes

```json
{
  // max intensity defined by JMA.
  // not number only
  "maxIntensity": "5 Lower",

  // when this report was issued by JMA
  "issuedAt": "2020-12-20T17:28:00.000Z",

  // uuid of this earthquake
  "uuid": "20201220172819393-21022329",

  // region name of the epicenter
  "regionName": "Aomori-ken Toho-oki",

  // magnitude of earthquake
  "magnitude": 6.3,

  // when this earthquake did occurr
  "occurredAt": "2020-12-20T17:23:00.000Z",

  // location of the epicenter
  "location": {
    "decimal": {
      "latitude": 40.7,
      "longitude": 142.7
    },
    "sexagesimal": {
      "latitude": "40° 42' 00\"",
      "longitude": "142° 42' 00\""
    },
    // depth in km
    "depth": 10
  },

  // when was this earthquake data last crawled
  "lastUpdate": "2020-12-25T13:33:37.877Z",

  // list of the intensity by city
  "intensityByCity": [
    {
      "prefecture": "Iwate",
      "intensity": "5 Lower",
      "city": "Morioka-shi"
    },
    {
      "prefecture": "Iwate",
      "intensity": "4",
      "city": "Ninohe-shi"
    },
    {
      "prefecture": "Iwate",
      "intensity": "4",
      "city": "Hachimantai-shi"
    }, ...
  ],

  // list of the intensity by region
  "intensityByRegion": [
    {
      "intensity": "5 Lower",
      "regionName": "Iwate-ken Nairiku-hokubu"
    },
    {
      "intensity": "4",
      "regionName": "Oshima-chiho Tobu"
    },
    {
      "intensity": "4",
      "regionName": "Aomori-ken Sampachi-Kamikita"
    }, ...
  ],

  // location of the report
  "url": "https://www.jma.go.jp/en/quake/20201220172819393-21022329.html"
}
```

## Updates
```json
{
  // when was the data on repository were last updated
  "lastUpdate": "2020-12-25T13:12:36.640Z",

  // updated earthquake data since lastupdate
  "earthquakes": [],

  // updated volcanoes data since lastupdate
  "volcanoes": [],
}
```
