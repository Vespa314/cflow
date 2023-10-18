import { useEffect, useState } from "react";
import { useMemoCacheStore } from "@/store/v1";
import Icon from "./Icon";

interface Props {
  relationList: MemoRelation[];
}

const MemoRelationListView = (props: Props) => {
  const memoCacheStore = useMemoCacheStore();
  const [relatedMemoList, setRelatedMemoList] = useState<Memo[]>([]);
  const [relatedMemoList2, setRelatedMemoList2] = useState<Memo[]>([]); // 添加 relatedMemoList2 状态
  const relationList = props.relationList;

  useEffect(() => {
    const fetchRelatedMemoList = async () => {
      const requests = relationList.filter((relation) => relation.type === 'REFERENCE').map((relation) => memoCacheStore.getOrFetchMemoById(relation.relatedMemoId));
      const memoList = await Promise.all(requests);
      setRelatedMemoList(memoList);
    };

    fetchRelatedMemoList();
  }, [relationList]);

  useEffect(() => {
    const fetchRelatedMemoList2 = async () => {
      const requests = relationList.filter((relation) => relation.type === 'REFERENCED').map((relation) => memoCacheStore.getOrFetchMemoById(relation.relatedMemoId));
      const memoList = await Promise.all(requests);
      setRelatedMemoList2(memoList);
    };

    fetchRelatedMemoList2();
  }, [relationList]);

  const handleGotoMemoDetail = (memo: Memo) => {
    window.open(`/m/${memo.id}`, "_blank");
  };

  const ref_style = {
    background: "#bfd4b2",
  };

  const refed_style = {
    background: "#d4e7fa",
  };

  return (
    <>
      {relatedMemoList.length + relatedMemoList2.length > 0 && (
        <div className="w-full max-w-full overflow-hidden grid grid-cols-1 gap-1 mt-2">
          {relatedMemoList.map((memo) => {
            return (
              <div
                key={memo.id}
                className="w-auto flex flex-row justify-start items-center hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-sm p-1 text-gray-500 dark:text-gray-400 cursor-pointer"
                onClick={() => handleGotoMemoDetail(memo)}
                style={ref_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Icon.ArrowRightFromLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 w-auto truncate">#{memo.id}:{memo.content}</span>
              </div>
            );
          })}

          {relatedMemoList2.map((memo) => {
            return (
              <div
                key={memo.id}
                className="w-auto flex flex-row justify-start items-center hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-sm p-1 text-gray-500 dark:text-gray-400 cursor-pointer"
                onClick={() => handleGotoMemoDetail(memo)}
                style={refed_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Icon.ArrowLeftToLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 w-auto truncate">#{memo.id}:{memo.content}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default MemoRelationListView;
