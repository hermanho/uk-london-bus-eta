import React, {
  useContext,
  useMemo,
  useRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useState,
} from "react";
import AppContext from "../../AppContext";
import StopRouteList from "./StopRouteList";
import { Swiper, SwiperSlide, SwiperClass } from 'swiper/react';

interface SwipeableStopListProps {
  stopTab: string;
  onChangeTab: (v: string) => void;
}

export interface SwipeableStopListRef {
  changeTab: (v: string) => void;
}

const SwipeableStopList = React.forwardRef<
  SwipeableStopListRef,
  SwipeableStopListProps
>(({ stopTab, onChangeTab }, ref) => {
  const {
    db: { stopList, stopMap },
    savedStops,
  } = useContext(AppContext);
  const defaultStoptab = useRef<string>(stopTab);

  useImperativeHandle(ref, () => ({
    changeTab: (v: string) => {
      defaultStoptab.current = v;
    },
  }));

  const availableTabs = useMemo(
    () =>
      savedStops.filter((stopId) => {
        return stopId.split("|")[1] in stopList;
      }),
    [savedStops, stopList]
  );

  const getViewIdx = useCallback(() => {
    let ret = availableTabs.indexOf(defaultStoptab.current);
    if (ret !== -1) return ret;
    return -1;
  }, [availableTabs]);

  const tabStops = useMemo(
    () =>
      availableTabs.map((stopTab) => {
        if (stopTab === "") return [];
        const ret = [stopTab.split("|")];
        stopMap[ret[0][1]]?.forEach((v) => ret.push(v));
        return ret;
      }),
    [availableTabs, stopMap]
  );

  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  useEffect(() => {
    setTimeout(() => {
      if (swiper) {
        swiper.slideTo(getViewIdx());
      }
    }, 10);
  }, [getViewIdx]);

  return (
    <Swiper
      onSwiper={setSwiper}
      onSlideChange={(swiper) => {
        const idx = swiper.activeIndex;
        onChangeTab(availableTabs[idx]);
      }}
    >
      {tabStops.map((stops, idx) => (
        <SwiperSlide key={`savedStops-${idx}`}>
          <StopRouteList
            key={`savedStops-${idx}`}
            stops={stops}
            isFocus={getViewIdx() === idx}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
});

export default SwipeableStopList;
