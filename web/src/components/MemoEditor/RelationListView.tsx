import { useEffect, useState } from "react";
import { useMemoCacheStore } from "@/store/v1";
import Icon from "../Icon";

interface Props {
  relationList: MemoRelation[];
  setRelationList: (relationList: MemoRelation[]) => void;
}

interface FormatedMemoRelation extends MemoRelation {
  relatedMemo: Memo;
}

const RelationListView = (props: Props) => {
  const { relationList, setRelationList } = props;
  const memoCacheStore = useMemoCacheStore();
  const [formatedMemoRelationList, setFormatedMemoRelationList] = useState<FormatedMemoRelation[]>([]);

  useEffect(() => {
    const fetchRelatedMemoList = async () => {
      const requests = relationList.map(async (relation) => {
        const relatedMemo = await memoCacheStore.getOrFetchMemoById(relation.relatedMemoId);
        return {
          ...relation,
          relatedMemo,
        };
      });
      const list = await Promise.all(requests);
      setFormatedMemoRelationList(list);
    };
    fetchRelatedMemoList();
  }, [relationList]);

  const handleDeleteRelation = async (memoRelation: FormatedMemoRelation) => {
    const newRelationList = relationList.filter((relation) => relation.relatedMemoId !== memoRelation.relatedMemoId);
    setRelationList(newRelationList);
  };

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
          {formatedMemoRelationList.filter((relation) => relation.type === 'REFERENCE').map((memoRelation) => {
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
                {/* <Icon.X className="w-4 h-auto hover:opacity-80 shrink-0" onClick={() => handleDeleteRelation(memoRelation)} /> */}
              </div>
            );
          })}
          {formatedMemoRelationList.filter((relation) => relation.type === 'REFERENCED').map((memoRelation) => {
            return (
              <div
                key={memoRelation.relatedMemoId}
                className="w-full overflow-hidden flex flex-row justify-start items-center bg-gray-100 dark:bg-zinc-800 hover:opacity-80 rounded text-sm p-1 px-2 text-gray-500 cursor-pointer"
                style={refed_style}
              >
                <div className="w-5 h-5 flex justify-center items-center shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Icon.ArrowLeftToLine className="w-3 h-auto" />
                </div>
                <span className="mx-1 max-w-full text-ellipsis font-mono whitespace-nowrap overflow-hidden">
                #{memoRelation.relatedMemoId}:{memoRelation.relatedMemo.content}
                </span>
                {/* <Icon.X className="w-4 h-auto hover:opacity-80 shrink-0" onClick={() => handleDeleteRelation(memoRelation)} /> */}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default RelationListView;
