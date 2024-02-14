import type { Eta, EtaDb, RouteListEntry, StopList, StopList2, StopListEntry, StopListEntry2 } from "hk-bus-eta";
import { initParser, inferSchema } from "udsv";
import proj4 from 'proj4';

function nameSanitize(s) {
  return s.replace(/#|<>/ig, '').trim();
}

function BNG2GPS(Location_Easting, Location_Northing, decimals = 7) {
  // proj4.defs('EPSGnadgrids:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs +=OSTN15_NTv2_OSGBtoETRS');
  proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs');

  var point = proj4('EPSG:27700', 'EPSG:4326', [Number(Location_Easting), Number(Location_Northing)]);

  var lng = Number(point[0].toFixed(decimals));
  var lat = Number(point[1].toFixed(decimals));

  return { lat: lat, lng: lng };
}

function praseCSV(str: string): string[][] {
  const parser = initParser(inferSchema(str));
  let stringArrs = parser.stringArrs(str);
  return stringArrs;
}

export async function fetchHolidays(): Promise<string[]> {
  const r = await fetch("https://www.gov.uk/bank-holidays.json").then(r => r.json());
  return r['england-and-wales'].events.map((e) => e.date.replace('-', ''));
}

export async function fetchEtaDb(): Promise<EtaDb> {

  const holidays = await fetchHolidays();
  const routeList = await fetchRouteList();
  const stopList = await fetchStopList();

  const retObj = {
    "holidays": holidays,
    "routeList": routeList,
    stopList: stopList,
  } as EtaDb;


  return retObj;
}

export async function fetchRouteList(): Promise<Record<string, RouteListEntry>> {

  const csvStrBusSeq = await fetch("https://tfl.gov.uk/tfl/syndication/feeds/bus-sequences.csv").then(r => r.text());
  const stringArrs = praseCSV(csvStrBusSeq);

  const routeList = {} as Record<string, RouteListEntry>;

  let i = 0, j = 0;
  while (i < stringArrs.length) {
    const currRow: string[] = stringArrs[i];
    const nextRow: String[] | null = (i + 1) < stringArrs.length ? stringArrs[i + 1] : null;
    if (!nextRow || currRow[1] !== nextRow[1]) {
      const currentRoute: string[][] = stringArrs.slice(j, i + 1);
      const firstStop: string[] = currentRoute[0];
      // "1+1+CHUK YUEN ESTATE+STAR FERRY"
      const k = `${currRow[0]}+${currRow[1]}+${nameSanitize(firstStop[6])}+${nameSanitize(currRow[6])}`
      const v: RouteListEntry = {
        "co": [
          "tfl-bus"
        ],
        "dest": {
          "en": nameSanitize(currRow[6]),
          "zh": nameSanitize(currRow[6]),
        },
        "orig": {
          "en": nameSanitize(firstStop[6]),
          "zh": nameSanitize(currRow[6]),
        },
        "route": currRow[0],
        "seq": Number(currRow[2]),
        "stops": {
          "tfl-bus": currentRoute.map(r => r[3]) // Stop_Code_LBSL
        },
        fares: [],
        faresHoliday: [],
        freq: null,
        jt: null,
        serviceType: currRow[1],
        bound: null,
        gtfsId: null,
        nlbId: null
      } as any;

      routeList[k] = v;
      j = i + 1;
    }

    i++;
  }

  return routeList;
}

export async function fetchStopList(): Promise<Record<string, StopListEntry2>> {
  const csvStrBusStop = await fetch("https://tfl.gov.uk/tfl/syndication/feeds/bus-stops.csv").then(r => r.text());
  const busStopArr = praseCSV(csvStrBusStop);

  const stopList = {} as Record<string, StopListEntry2>;
  for (let i = 1; i < busStopArr.length; i++) {
    const currBusStop = busStopArr[i];
    stopList[currBusStop[0]] = {
      location: BNG2GPS(currBusStop[4], currBusStop[5]),
      name: {
        en: nameSanitize(currBusStop[3]),
        zh: nameSanitize(currBusStop[3])
      },
      Naptan_Atco: currBusStop[2],
      virtual: Boolean(currBusStop[8]),
    } as StopListEntry2;
  }
  return stopList;
}

interface fetchEtasProps extends RouteListEntry {
  stopList: StopList2;
  language: "zh" | "en";
  seq: number;
}

export async function fetchEtas({
  route,
  stops,
  bound,
  dest,
  seq,
  serviceType,
  co,
  nlbId,
  gtfsId,
  stopList,
  language,
}: fetchEtasProps): Promise<Eta[]> {

  const stopId = stops["tfl-bus"][seq];
  const stop = stopList[stopId];

  const etaObj = await fetch(`https://api.tfl.gov.uk/line/${route}/arrivals`).then(r => r.json());
  const sameStopETAs = etaObj.filter((e) => e.naptanId === stop.Naptan_Atco && dest.en === e.destinationName);

  return sameStopETAs.map((eta) => ({
    eta: eta.expectedArrival,
    remark: {
      zh: "ETA 📶",
      en: "ETA 📶",
    },
    dest: {
      zh: eta.destinationName,
      en: eta.destinationName,
    },
    co: "tfl-bus"
  }) as Eta);
}