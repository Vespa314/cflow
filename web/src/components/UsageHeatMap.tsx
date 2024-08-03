import { useCallback, useEffect, useRef, useState } from "react";
import { getMemoStats } from "@/helpers/api";
import { DAILY_TIMESTAMP } from "@/helpers/consts";
import { getDateStampByDate, getDateString, getTimeStampByDate } from "@/helpers/datetime";
import * as utils from "@/helpers/utils";
import Icon from "./Icon";
import showUsageDialog from "./ShowUsageDialog";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUserV1Store, extractUsernameFromName } from "@/store/v1";
import { useTranslate, Translations } from "@/utils/i18n";
import { useFilterStore } from "../store/module";
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
  const todayTimeStamp = getDateStampByDate(Date.now());
  const weekDay = new Date(todayTimeStamp).getDay();
  const weekFromMonday = true;
  const dayTips = weekFromMonday ? ["mon", "", "wed", "", "fri", "", "sun"] : ["sun", "", "tue", "", "thu", "", "sat"];
  const todayDay = weekFromMonday ? (weekDay == 0 ? 7 : weekDay) : weekDay + 1;
  const nullCell = new Array(7 - todayDay).fill(0);
  const usedDaysAmount = (tableConfig.width - 1) * tableConfig.height + todayDay;
  const beginDayTimestamp = todayTimeStamp - usedDaysAmount * DAILY_TIMESTAMP;
  const [memoAmount, setMemoAmount] = useState(0);
  const [createdDays, setCreatedDays] = useState(0);
  const [allStat, setAllStat] = useState<DailyUsageStat[]>(getInitialUsageStat(usedDaysAmount, beginDayTimestamp));
  const [currentStat, setCurrentStat] = useState<DailyUsageStat | null>(null);
  const containerElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    userV1Store.getOrFetchUserByUsername(extractUsernameFromName(user.name)).then((user) => {
      if (!user) {
        return;
      }
      setCreatedDays(Math.ceil((Date.now() - getTimeStampByDate(user.createTime)) / 1000 / 3600 / 24));
    });
  }, [user.name]);

  useEffect(() => {
    getMemoStats(extractUsernameFromName(user.name))
      .then(({ data }) => {
        setMemoAmount(data.length);
        setCreatedDays(Math.ceil((Date.now() - (Math.floor(data[data.length-1]/86400)*86400)*1000) / 1000 / 3600 / 24));
        const newStat: DailyUsageStat[] = getInitialUsageStat(usedDaysAmount, beginDayTimestamp);
        for (const record of data) {
          const index = (getDateStampByDate(record * 1000) - beginDayTimestamp) / (1000 * 3600 * 24) - 1;
          if (index >= 0) {
            const exactIndex = +index.toFixed(0);
            newStat[exactIndex].count += 1;
          }
        }
        setAllStat([...newStat]);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [user.name]);

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
          {dayTips.map((v, i) => (
            <span className="tip-text" key={i}>
              {v && t(("days." + v) as Translations)}
            </span>
          ))}
        </div>
      </div>
      <p className="flex flex-row w-full pl-4 text-xs -mt-2 mb-3 text-gray-400 ">
        <span className="font-medium text-gray-500 ">{createdDays} </span>
        天写了
        <span className="font-medium text-gray-500 number">{memoAmount} </span>
        张卡片
        <Icon.ScatterChart className="cursor-pointer text-gray-500 ml-2 w-4 h-auto" onClick={() => showUsageDialog()}/>
      </p>
    </>
  );
};

export default UsageHeatMap;
