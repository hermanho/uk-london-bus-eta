import React, { useContext, useMemo, useCallback, useState, useEffect, memo } from "react";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import memorize from "memoize-one";
import { useTranslation } from "react-i18next";
import { Box, SxProps, Theme, Typography } from "@mui/material";
import { Virtual, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide, SwiperClass } from 'swiper/react';

import AppContext from "../../AppContext";
import { isHoliday, isRouteAvaliable } from "../../timetable";
import { BOARD_TAB, type BoardTabType } from "../../typing";
import { TRANSPORT_SEARCH_OPTIONS, TRANSPORT_ORDER } from "../../constants";
import RouteRowList from "./RouteRowList";
import { routeSortFunc } from "../../utils";
import { RouteListEntry } from "hk-bus-eta";

interface SwipeableRouteBoardProps {
  boardTab: BoardTabType;
  onChangeTab: (v: string) => void;
}


interface ItemData { routeList: [string, RouteListEntry][]; vibrateDuration: number; tab: string }

const RouteList = memo(({ itemData, itemHeight, tabName, searchRoute }: {
  itemData: ItemData,
  itemHeight: number,
  tabName: string,
  searchRoute: string
}) => {
  const { t } = useTranslation();

  console.log(tabName, itemData?.routeList.length);
  return <React.Fragment>
    {itemData && itemData.routeList.length > 0 ? (
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height * 0.98}
            itemCount={itemData.routeList.length}
            itemSize={itemHeight}
            width={width}
            itemData={itemData}
          >
            {RouteRowList}
          </FixedSizeList>
        )}
      </AutoSizer>
    ) : (
      <Box sx={noResultSx}>
        <SentimentVeryDissatisfiedIcon fontSize="small" />
        <Box>
          {Boolean(itemData) && Boolean(searchRoute) ? (
            <>
              <Typography variant="h6">"{searchRoute}"</Typography>
              <Typography variant="h6">
                {t("route-search-no-result")}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6">{t("no-recent-search")}</Typography>
            </>
          )}
        </Box>
      </Box>
    )}
  </React.Fragment>;
});


const SwipeableRoutesBoard = memo(({
  boardTab,
  onChangeTab,
}: SwipeableRouteBoardProps) => {
  const {
    searchRoute,
    db: { holidays, routeList, serviceDayMap },
    isRouteFilter,
    busSortOrder,
    routeSearchHistory,
    vibrateDuration,
    isRecentSearchShown,
  } = useContext(AppContext);
  const isTodayHoliday = useMemo(
    () => isHoliday(holidays, new Date()),
    [holidays]
  );
  const coItemDataList = useMemo(() => {
    const baseRouteList = Object.entries(routeList)
      // filter by route no
      .filter(
        ([routeNo, { stops, co }]) =>
          routeNo.startsWith(searchRoute.toUpperCase()) &&
          (stops[co[0]] == null || stops[co[0]].length > 0)
      )
      // filter non available route
      .filter(
        ([routeNo, { freq }]) =>
          !isRouteFilter ||
          isRouteAvaliable(routeNo, freq, isTodayHoliday, serviceDayMap)
      )
      .sort((a, b) => routeSortFunc(a, b, TRANSPORT_ORDER[busSortOrder]));
    return Object.entries(TRANSPORT_SEARCH_OPTIONS)
      .filter(([key]) => isRecentSearchShown || key !== "recent")
      .map(([tab, searchOptions], idx) => {
        return createItemData(
          tab === "recent"
            ? routeSearchHistory
              .filter((routeNo) =>
                routeNo.startsWith(searchRoute.toUpperCase())
              )
              .filter((routeNo) => routeList[routeNo])
              .map((routeNo) => [routeNo, routeList[routeNo]])
            : baseRouteList.filter(([routeNo, { co }]) =>
              co.some((c) => searchOptions.includes(c))
            ),
          vibrateDuration,
          tab
        );
      });
  }, [
    routeList,
    isTodayHoliday,
    searchRoute,
    isRouteFilter,
    vibrateDuration,
    busSortOrder,
    routeSearchHistory,
    isRecentSearchShown,
    serviceDayMap,
  ]);

  const itemHeight = useMemo(() => {
    const baseFontSize = parseInt(getComputedStyle(document.body).fontSize, 10);
    if (baseFontSize <= 18) {
      return 64;
    } else if (baseFontSize <= 22) {
      return 78;
    } else if (baseFontSize <= 26) {
      return 92;
    } else if (baseFontSize <= 30) {
      return 98;
    }
    return 110;
  }, []);

  const availableBoardTab = useMemo(
    () => BOARD_TAB.filter((tab) => isRecentSearchShown || tab !== "recent"),
    [isRecentSearchShown]
  );


  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  useEffect(() => {
    if (boardTab) {
      setTimeout(() => {
        if (swiper) {
          swiper.slideTo(availableBoardTab.indexOf(boardTab));
        }
      }, 10);
    }
  }, [availableBoardTab, boardTab, swiper]);

  return useMemo(
    () => (
      <>
        {navigator.userAgent === "prerendering" ? (
          <Box sx={prerenderListSx}>
            {coItemDataList[0].routeList.map((data, idx) => (
              <RouteRowList
                data={coItemDataList[0]}
                key={`route-${idx}`}
                index={idx}
                style={null} // required by react-window
              />
            ))}
          </Box>
        ) : (
          <div style={{ height: '100%', width: '100%' }}>
            <Swiper style={{ height: '100%' }} modules={[Virtual, Keyboard]} virtual onSwiper={setSwiper} onSlideChange={(swiper) => {
              const idx = swiper.activeIndex;
              onChangeTab(availableBoardTab[idx]);
            }}
            >
              {coItemDataList.map((d, index) => (
                <SwiperSlide key={d.tab} virtualIndex={index}>
                  <RouteList key={String(index)} tabName={availableBoardTab[index]} itemData={d} itemHeight={itemHeight} searchRoute={searchRoute} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </>
    ),
    [coItemDataList, onChangeTab, boardTab, availableBoardTab]
  );
});

const createItemData = memorize((routeList, vibrateDuration, tab) => ({
  routeList,
  vibrateDuration,
  tab,
}));

export default SwipeableRoutesBoard;

const prerenderListSx: SxProps<Theme> = {
  height: "100%",
  overflowY: "scroll",
};

const noResultSx: SxProps<Theme> = {
  height: "140px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  [`& .MuiSvgIcon-root`]: {
    fontSize: "4em",
    mr: 2,
  },
};
