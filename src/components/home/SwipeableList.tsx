import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import AppContext from "../../AppContext";
import type { HomeTabType } from "./HomeTabbar";
import SearchRangeController from "./SearchRangeController";
import NearbyRouteList from "./lists/NearbyRouteList";
import SavedRouteList from "./lists/SavedRouteList";
import SmartCollectionRouteList from "./lists/SmartCollectionRouteList";
import CollectionRouteList from "./lists/CollectionRouteList";
import { Swiper, SwiperSlide, SwiperClass } from 'swiper/react';

interface SwipeableListProps {
  homeTab: HomeTabType;
  onChangeTab: (v: string) => void;
}

interface SwipeableListRef {
  changeTab: (v: HomeTabType) => void;
}

const SwipeableList = React.forwardRef<SwipeableListRef, SwipeableListProps>(
  ({ homeTab, onChangeTab }, ref) => {
    const { collections } = useContext(AppContext);

    const defaultHometab = useRef(homeTab);

    useImperativeHandle(ref, () => ({
      changeTab: (v) => {
        defaultHometab.current = v;
      },
    }));

    const getViewIdx = useCallback(() => {
      let ret = HOME_TAB.indexOf(defaultHometab.current);
      if (ret !== -1) return ret;
      for (let i = 0; i < collections.length; ++i) {
        if (collections[i].name === defaultHometab.current) {
          return i + HOME_TAB.length;
        }
      }
      return -1;
    }, [collections]);

    const [swiper, setSwiper] = useState<SwiperClass | null>(null);
    useEffect(() => {
      setTimeout(() => {
        if (swiper) {
          swiper.slideTo(getViewIdx());
        }
      }, 10);
    }, [getViewIdx]);


    return (
      <>
        {homeTab === "nearby" ? <SearchRangeController /> : null}
        <Swiper

          onSwiper={setSwiper}
          onSlideChange={(swiper) => {
            const idx = swiper.activeIndex;
            onChangeTab(
              idx < HOME_TAB.length
                ? HOME_TAB[idx]
                : collections[idx - HOME_TAB.length].name
            );
          }}

        >
          <SwiperSlide>
            <NearbyRouteList isFocus={homeTab === "nearby"} />
          </SwiperSlide>
          <SwiperSlide>
            <SavedRouteList isFocus={homeTab === "saved"} />
          </SwiperSlide>
          <SwiperSlide>
            <SmartCollectionRouteList isFocus={homeTab === "collections"} />
          </SwiperSlide>
          {collections.map((collection) => (
            <SwiperSlide key={`list-${collection.name}`}>
              <CollectionRouteList
                key={`list-${collection.name}`}
                collection={collection}
                isFocus={homeTab === collection.name}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </>
    );
  }
);

export default SwipeableList;

const HOME_TAB = ["nearby", "saved", "collections"];
