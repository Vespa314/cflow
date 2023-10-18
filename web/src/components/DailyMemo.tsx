import { getTimeString } from "@/helpers/datetime";
import { Link } from "react-router-dom";
import MemoContent from "./MemoContent";
import MemoResourceListView from "./MemoResourceListView";
import MemoRelationListView from "./MemoRelationListView";
import "@/less/daily-memo.less";

interface Props {
  memo: Memo;
}

const DailyMemo: React.FC<Props> = (props: Props) => {
  const { memo } = props;
  const displayTimeStr = getTimeString(memo.displayTs);

  return (
    <div className="daily-memo-wrapper">
      <div className="time-wrapper">
      <Link to={`/m/${memo.id}`}>
        <span className="normal-text" >{displayTimeStr}</span>
      </Link>
      </div>
      <div className="memo-container">
        <MemoContent content={memo.content} />
        <MemoRelationListView relationList={memo.relationList} />
        <MemoResourceListView resourceList={memo.resourceList} />
      </div>
      <div className="split-line"></div>
    </div>
  );
};

export default DailyMemo;
