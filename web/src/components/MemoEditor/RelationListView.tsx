import { useEffect, useState } from "react";
import { useMemoCacheStore } from "@/store/v1";
import Icon from "../Icon";

interface Props {
  memoId?: MemoId;
  content?: string;
  relationList: MemoRelation[];
  setRelationList: (relationList: MemoRelation[]) => void;
}

interface FormatedMemoRelation extends MemoRelation {
  relatedMemo: Memo;
  curMemo: Memo;
}

const RelationListView = (props: Props) => {
  const { memoId, content, relationList, setRelationList } = props;
  const memoCacheStore = useMemoCacheStore();
  const [formatedMemoRelationList, setFormatedMemoRelationList] = useState<FormatedMemoRelation[]>([]);

  useEffect(() => {
    (async () => {
      const requests = relationList
        .map(async (relation) => {
          const relatedMemo = await memoCacheStore.getOrFetchMemoById(relation.relatedMemoId);
          const curMemo = await memoCacheStore.getOrFetchMemoById(relation.memoId);
          return {
            ...relation,
            relatedMemo,
            curMemo,
          };
        });
      const list = await Promise.all(requests);
      setFormatedMemoRelationList(list);
    })();
  }, [relationList]);

  const ref_style = {
    background: "#bfd4b2",
  };

  const refed_style = {
    background: "#d4e7fa",
  };

  return (
    <>
      {formatedMemoRelationList.length > 0 && (
        <div className="w-full flex flex-row gap-2 mt-2 flex-wrap">
          {formatedMemoRelationList.filter((relation) => relation.memoId == memoId)
            .sort((a, b) => {
              let indexA = content?content.indexOf('m/' + a.relatedMemoId):-1;
              let indexB = content?content.indexOf('m/' + b.relatedMemoId):-1;
              return indexA - indexB;
          })
          .map((memoRelation) => {
            return (
              <div
                key={memoRelation.relatedMemoId}
                className="w-full overflow-hidden flex flex-row justify-start items-center bg-gray-100 dark:bg-zinc-800 hover:opacity-80 rounded text-sm p-1 px-2 text-gray-500 cursor-pointer"
                style={ref_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Icon.ArrowRightFromLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 max-w-full text-ellipsis font-mono whitespace-nowrap overflow-hidden">
                  #{memoRelation.relatedMemoId}:{memoRelation.relatedMemo.content}
                </span>
              </div>
            );
          })}
          {formatedMemoRelationList.filter((relation) => relation.relatedMemoId == memoId).map((memoRelation) => {
            return (
              <div
                key={memoRelation.memoId}
                className="w-full overflow-hidden flex flex-row justify-start items-center bg-gray-100 dark:bg-zinc-800 hover:opacity-80 rounded text-sm p-1 px-2 text-gray-500 cursor-pointer"
                style={refed_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Icon.ArrowLeftToLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 max-w-full text-ellipsis font-mono whitespace-nowrap overflow-hidden">
                #{memoRelation.memoId}:{memoRelation.curMemo.content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default RelationListView;