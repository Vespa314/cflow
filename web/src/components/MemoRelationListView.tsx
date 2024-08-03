import { useEffect, useState } from "react";
import { useMemoCacheStore } from "@/store/v1";
import Icon from "./Icon";

interface Props {
  memo: Memo;
  relationList: MemoRelation[];
}

const MemoRelationListView = (props: Props) => {
  const { memo, relationList } = props;
  const memoCacheStore = useMemoCacheStore();
  const [referencingMemoList, setReferencingMemoList] = useState<Memo[]>([]);
  const [referencedMemoList, setReferencedMemoList] = useState<Memo[]>([]);

  useEffect(() => {
    (async () => {
      const referencingMemoList = await Promise.all(
        relationList
          .filter((relation) => relation.memoId === memo.id && relation.relatedMemoId !== memo.id && relation.type == "REFERENCE")
          .map((relation) => memoCacheStore.getOrFetchMemoById(relation.relatedMemoId))
      );
      setReferencingMemoList(referencingMemoList);
      const referencedMemoList = await Promise.all(
        relationList
          .filter((relation) => relation.memoId !== memo.id && relation.relatedMemoId === memo.id && relation.type == "REFERENCE")
          .map((relation) => memoCacheStore.getOrFetchMemoById(relation.memoId))
      );
      setReferencedMemoList(referencedMemoList);
    })();
  }, [memo, relationList]);

  const handleGotoMemoDetail = (memo: Memo) => {
    window.open(`/m/${memo.id}`);
  };

  const ref_style = {
    background: "#bfd4b2",
  };

  const refed_style = {
    background: "#d4e7fa",
  };

  return (
    <>
      {referencingMemoList.length + referencedMemoList.length > 0 && (
        <div className="w-full max-w-full overflow-hidden grid grid-cols-1 gap-1 mt-2">
          {referencingMemoList
          .sort((a, b) => {
            let indexA = memo.content.indexOf('m/' + a.id);
            let indexB = memo.content.indexOf('m/' + b.id);
            return indexA - indexB;
        })
          .map((memo) => {
            return (
              <div
                key={memo.id}
                className="w-auto flex flex-row justify-start items-center hover:bg-gray-100 rounded text-sm p-1 text-gray-500 cursor-pointer"
                onClick={() => handleGotoMemoDetail(memo)}
                style={ref_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 rounded-full">
                  <Icon.ArrowRightFromLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 w-auto truncate">#{memo.id}:{memo.content}</span>
              </div>
            );
          })}

          {referencedMemoList
          .sort((a, b) => a.id - b.id)
          .map((memo) => {
            return (
              <div
                key={memo.id}
                className="w-auto flex flex-row justify-start items-center hover:bg-gray-100 rounded text-sm p-1 text-gray-500 cursor-pointer"
                onClick={() => handleGotoMemoDetail(memo)}
                style={refed_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 rounded-full">
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
