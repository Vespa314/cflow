import { useRef } from "react";
import { marked } from "@/labs/marked";
import { useFilterStore } from "@/store/module";
import highlightText from "@/labs/marked/parser/SearchHighLight";
import "@/less/memo-content.less";


interface Props {
  content: string;
  className?: string;
  onMemoContentClick?: (e: React.MouseEvent) => void;
  onMemoContentDoubleClick?: (e: React.MouseEvent) => void;
}

const MemoContent: React.FC<Props> = (props: Props) => {
  const { className, content, onMemoContentClick, onMemoContentDoubleClick } = props;
  const memoContentContainerRef = useRef<HTMLDivElement>(null);

  const filterStore = useFilterStore();
  const filter = filterStore.state;
  const { text: textQuery} = filter;

  const handleMemoContentClick = async (e: React.MouseEvent) => {
    if (onMemoContentClick) {
      onMemoContentClick(e);
    }
  };

  const handleMemoContentDoubleClick = async (e: React.MouseEvent) => {
    if (onMemoContentDoubleClick) {
      onMemoContentDoubleClick(e);
    }
  };

  return (
    <div className={`memo-content-wrapper ${className || ""}`}>
      <div
        ref={memoContentContainerRef}
        className="memo-content-text"
        onClick={handleMemoContentClick}
        onDoubleClick={handleMemoContentDoubleClick}
      >
        {textQuery ? highlightText(marked(content), textQuery) : marked(content)}
      </div>
    </div>
  );
};

export default MemoContent;
