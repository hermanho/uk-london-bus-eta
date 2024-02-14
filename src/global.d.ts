/// <reference types="hk-bus-eta" />

import { Location, Terminal, Freq } from "hk-bus-eta";
export * from 'hk-bus-eta';
import "i18next";

declare module 'hk-bus-eta' {
  export type Company = "tfl-bus" | "tfl-underground";
  export type RouteListEntry = {
    readonly route: string;
    readonly co: Company[];
    readonly orig: Terminal;
    readonly dest: Terminal;
    readonly fares: string[] | null;
    readonly faresHoliday: string[] | null;
    readonly freq: Freq | null;
    readonly jt: string | null;
    readonly seq: number;
    readonly serviceType: string;
    readonly stops: {
      [co in Company]: string[];
    };
    readonly bound: {
      [co in Company]: "O" | "I" | "OI" | "IO";
    };
    readonly gtfsId: string;
    readonly nlbId: string;
  };
  export type RouteList = Record<string, RouteListEntry>;
  export type StopListEntry2 = {
    readonly location: Location;
    readonly name: {
      en: string;
      zh: string;
    };
    readonly Naptan_Atco: string;
    readonly virtual: boolean;
  };
  export type StopList2 = Record<string, StopListEntry2>;
  export type EtaDb = {
    holidays: string[];
    routeList: RouteList;
    stopList: StopList2;
    stopMap: StopMap;
    serviceDayMap: Record<string, [
      0 | 1,
      0 | 1,
      0 | 1,
      0 | 1,
      0 | 1,
      0 | 1,
      0 | 1
    ]>;
  };
  export type Eta = {
    eta: string;
    remark: {
      zh: string;
      en: string;
    };
    dest: {
      zh: string;
      en: string;
    };
    co: Company;
  };
}

declare module 'i18next' {
  interface i18n {
    language: 'zh' | 'en';
  }
}