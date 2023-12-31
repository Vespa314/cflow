import { useCallback, useEffect, useRef, useState } from "react";
import { getMemoStats } from "@/helpers/api";
import { DAILY_TIMESTAMP } from "@/helpers/consts";
import { getDateStampByDate, getDateString, getTimeStampByDate } from "@/helpers/datetime";
import * as utils from "@/helpers/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUserV1Store } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import { useFilterStore, useMemoStore } from "../store/module";
import "@/less/usage-heat-map.less";

const tableConfig = {
  width: 10,
  height: 7,
};

const getInitialUsageStat = (usedDaysAmount: number, beginDayTimestamp: number): DailyUsageStat[] => {
  const initialUsageStat: DailyUsageStat[] = [];
  for (let i = 1; i <= usedDaysAmount; i++) {
    initialUsageStat.push({
      timestamp: beginDayTimestamp + DAILY_TIMESTAMP * i,
      count: 0,
    });
  }
  return initialUsageStat;
};

interface DailyUsageStat {
  timestamp: number;
  count: number;
}

const UsageHeatMap = () => {
  const t = useTranslate();
  const filterStore = useFilterStore();
  const userV1Store = useUserV1Store();
  const user = useCurrentUser();
  const memoStore = useMemoStore();
  const todayTimeStamp = getDateStampByDate(Date.now());  // 今天零点的时间戳乘1000
  const todayDay = (new Date(todayTimeStamp).getDay() + 6) % 7 + 1;  // 星期天为0， 所以才会在第一行
  const nullCell = new Array(7 - todayDay).fill(0);
  const usedDaysAmount = (tableConfig.width - 1) * tableConfig.height + todayDay;  // 总共需要格子数，最后一周占一列
  const beginDayTimestamp = todayTimeStamp - usedDaysAmount * DAILY_TIMESTAMP;  // 第一天再前一天零点的时间戳乘1000
  const memos = memoStore.state.memos;
  const [memoAmount, setMemoAmount] = useState(0);
  const [createdDays, setCreatedDays] = useState(0);
  const [allStat, setAllStat] = useState<DailyUsageStat[]>(getInitialUsageStat(usedDaysAmount, beginDayTimestamp));
  const [currentStat, setCurrentStat] = useState<DailyUsageStat | null>(null);
  const containerElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    userV1Store.getOrFetchUserByUsername(user.username).then((user) => {
      if (!user) {
        return;
      }
      setCreatedDays(Math.ceil((Date.now() - getTimeStampByDate(user.createTime)) / 1000 / 3600 / 24));
    });
  }, [user.username]);

  useEffect(() => {
    if (memos.length === 0) {
      return;
    }

    getMemoStats(user.username)
      .then(({ data }) => {
        setMemoAmount(data.length);
        const newStat: DailyUsageStat[] = getInitialUsageStat(usedDaysAmount, beginDayTimestamp);
        for (const record of data) {  // memo时间戳，精确到s
          const index = (getDateStampByDate(record * 1000) - beginDayTimestamp) / (1000 * 3600 * 24) - 1;
          if (index >= 0) {
            // because of dailight savings, some days may be 23 hours long instead of 24 hours long
            // this causes the calculations to yield weird indices such as 40.93333333333
            // rounding them may not give you the exact day on the heat map, but it's not too bad
            const exactIndex = +index.toFixed(0);
            newStat[exactIndex].count += 1;
          }
        }
        setAllStat([...newStat]);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [memos.length, user.username]);

  const handleUsageStatItemMouseEnter = useCallback((event: React.MouseEvent, item: DailyUsageStat) => {
    const tempDiv = document.createElement("div");
    tempDiv.className = "usage-detail-container pop-up";
    const bounding = utils.getElementBounding(event.target as HTMLElement);
    tempDiv.style.left = bounding.left + "px";
    tempDiv.style.top = bounding.top - 2 + "px";
    const tMemoOnOpts = { amount: item.count, date: getDateString(item.timestamp as number) };
    tempDiv.innerHTML = item.count === 1 ? t("heatmap.memo-on", tMemoOnOpts) : t("heatmap.memos-on", tMemoOnOpts);
    document.body.appendChild(tempDiv);

    if (tempDiv.offsetLeft - tempDiv.clientWidth / 2 < 0) {
      tempDiv.style.left = bounding.left + tempDiv.clientWidth * 0.4 + "px";
      tempDiv.className += " offset-left";
    }
  }, []);

  const handleUsageStatItemMouseLeave = useCallback(() => {
    document.body.querySelectorAll("div.usage-detail-container.pop-up").forEach((node) => node.remove());
  }, []);

  const handleUsageStatItemClick = useCallback((item: DailyUsageStat) => {
    if (filterStore.getState().duration?.from === item.timestamp) {
      filterStore.setFromAndToFilter();
      setCurrentStat(null);
    } else if (item.count > 0) {
      filterStore.setFromAndToFilter(item.timestamp, item.timestamp + DAILY_TIMESTAMP);
      setCurrentStat(item);
    }
  }, []);

  // This interpolation is not being used because of the current styling,
  // but it can improve translation quality by giving it a more meaningful context
  const tMemoInOpts = { amount: memoAmount, period: "", date: "" };

  return (
    <>
      <div className="usage-heat-map-wrapper" ref={containerElRef}>
        <div className="usage-heat-map">
          {allStat.map((v, i) => {
            const count = v.count;
            const colorLevel =
              count <= 0
                ? ""
                : count <= 1
                ? "stat-day-l1-bg"
                : count <= 3
                ? "stat-day-l2-bg"
                : count <= 6
                ? "stat-day-l3-bg"
                : count <= 10
                ? "stat-day-l4-bg"
                : count <= 15
                ? "stat-day-l5-bg"
                : "stat-day-l6-bg"

            return (
              <div
                className="stat-wrapper"
                key={i}
                onMouseEnter={(e) => handleUsageStatItemMouseEnter(e, v)}
                onMouseLeave={handleUsageStatItemMouseLeave}
                onClick={() => handleUsageStatItemClick(v)}
              >
                <span
                  className={`stat-container ${colorLevel} ${currentStat === v ? "current" : ""} ${
                    todayTimeStamp === v.timestamp ? "today" : ""
                  }`}
                ></span>
              </div>
            );
          })}
          {nullCell.map((_, i) => (
            <div className="stat-wrapper" key={i}>
              <span className="stat-container null"></span>
            </div>
          ))}
        </div>
        <div className="day-tip-text-container">
          <span className="tip-text">{t("days.mon")}</span>
          <span className="tip-text"></span>
          <span className="tip-text">{t("days.wed")}</span>
          <span className="tip-text"></span>
          <span className="tip-text">{t("days.fri")}</span>
          <span className="tip-text"></span>
          <span className="tip-text">{t("days.sun")}</span>
        </div>
      </div>
      <p className="w-full pl-4 text-xs -mt-2 mb-3 text-gray-400 dark:text-zinc-400">
        <span className="font-medium text-gray-500 dark:text-zinc-300">{createdDays} </span>
        天写了
        <span className="font-medium text-gray-500 dark:text-zinc-300 number">{memoAmount} </span>
        张卡片
      </p>
    </>
  );
};

export default UsageHeatMap;
