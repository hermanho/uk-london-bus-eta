import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Eta } from "hk-bus-eta";
import AppContext from "../AppContext";
import { isRouteAvaliable } from "../timetable";
import { fetchEtas } from "../data-layer/tfl";

interface useStopEtasProps {
  stopKeys: string[][];
  disabled?: boolean;
}

// stopKey in format "<co>|<stopId>", e.g., "lightRail|LR140"
export const useStopEtas = ({
  stopKeys,
  disabled = false,
}: useStopEtasProps) => {
  const {
    db: { routeList, stopList, serviceDayMap },
    isVisible,
    refreshInterval,
    isRouteFilter,
    isTodayHoliday,
  } = useContext(AppContext);

  const isLightRail = useMemo(
    () => stopKeys.reduce((acc, [co]) => co === "lightRail", false),
    [stopKeys]
  );

  const routeKeys = useMemo(() => {
    return (
      Object.entries(routeList)
        .reduce((acc, [routeId, { stops, freq }]) => {
          if (
            isRouteFilter &&
            !isRouteAvaliable(routeId, freq, isTodayHoliday, serviceDayMap)
          ) {
            return acc;
          }
          stopKeys.forEach(([co, stopId]) => {
            stops[co]?.forEach((_stopId, seq) => {
              if (_stopId === stopId) {
                acc.push([routeId, seq]);
              }
            });
          });
          return acc;
        }, [])
        // uniquify routeKeys
        .map((v) => v.join("|"))
        .filter((value, idx, self) => self.indexOf(value) === idx)
        .map((v) => v.split("|"))
    );
  }, [stopKeys, routeList, isRouteFilter, isTodayHoliday, serviceDayMap]);

  const [stopEtas, setStopEtas] = useState<Array<[string, Eta[]]>>([]);
  const {
    i18n: { language },
  } = useTranslation();
  const isMounted = useRef<boolean>(false);

  const fetchData = useCallback(() => {
    if (!isVisible || disabled || navigator.userAgent === "prerendering") {
      // skip if prerendering
      setStopEtas([]);
      return new Promise((resolve) => resolve([]));
    }
    return Promise.all(
      routeKeys.map(([id, seq]) =>
        fetchEtas({
          ...routeList[id],
          seq: parseInt(seq, 10),
          stopList,
          // @ts-ignore
          language,
        })
      )
    ).then((_etas) => {
      if (isMounted.current) {
        setStopEtas(
          _etas
            .map((e, idx) => [
              routeKeys[idx].join("#####"),
              e,
            ])
            .sort(([keyA, a], [keyB, b]) => {
              if (a.length === 0) return 1;
              if (b.length === 0) return -1;
              if (a[0].eta === b[0].eta) {
                return keyA < keyB ? -1 : 1;
              }
              return a[0].eta < b[0].eta ? -1 : 1;
            }) as Array<[string, Eta[]]>
        );
      }
    });
  }, [
    isVisible,
    disabled,
    language,
    routeList,
    stopList,
    routeKeys,
    isLightRail,
  ]);

  useEffect(() => {
    isMounted.current = true;
    const fetchEtaInterval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    fetchData();

    return () => {
      isMounted.current = false;
      clearInterval(fetchEtaInterval);
    };
  }, [fetchData, refreshInterval]);

  return stopEtas;
};
