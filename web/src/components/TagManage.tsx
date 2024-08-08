import { Button, Divider } from "@mui/joy";
import React, { useEffect, useState } from "react";
import { tagServiceClient } from "@/grpcweb";
import useCurrentUser from "@/hooks/useCurrentUser";
import { matcher } from "@/labs/marked/matcher";
import Tag from "@/labs/marked/parser/Tag";
import { useTagStore } from "@/store/module";
import { useTranslate } from "@/utils/i18n";
import Icon from "./Icon";
import OverflowTip from "./kit/OverflowTip";

interface Props {
}

const validateTagName = (tagName: string): boolean => {
  const matchResult = matcher(`#${tagName}`, Tag.regexp);
  if (!matchResult || matchResult[1] !== tagName) {
    return false;
  }
  return true;
};

const TagManagerDialog: React.FC<Props> = (props: Props) => {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const tagStore = useTagStore();
  const tagCounts = tagStore.state.tagCounts;
  const [tagCountsDict, setTagCountsDict] = useState<Record<string, number>>({});

  const [showColor, setShowColor] = useState<boolean>(true);
  const [sortTagCnt, setSortTagCnt] = useState<boolean>(false);
  const [tagArray, setTagArray] = useState<string[]>([]);
  const [suggestTagNameList, setSuggestTagNameList] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const tagNameList = tagStore.state.tags;
  const shownSuggestTagNameList = suggestTagNameList.filter((tag) => !tagNameList.includes(tag));

  const ToggleSortTagCnt = () => {
    setSortTagCnt(!sortTagCnt);
  }

  const ToggleShowColor = () => {
    setShowColor(!showColor);
  }

  useEffect(() => {
    if (tagCounts) {
      setTagCountsDict(tagCounts);
    }
  }, []);

  useEffect(() => {
    if (tagCounts) {
      if (sortTagCnt) {
        let tags = Array.from(tagNameList);
        setTagArray(tags.sort((a, b) => (tagCountsDict[b]||0) - (tagCountsDict[a]||0) || a.localeCompare(b)));
      } else {
        let tags = Array.from(tagNameList);
        setTagArray(tags.sort());
      }
    }
  }, [tagNameList, tagCountsDict, sortTagCnt]);


  useEffect(() => {
    tagServiceClient
      .getTagSuggestions({
        user: currentUser.name,
      })
      .then(({ tags }) => {
        setSuggestTagNameList(tags.filter((tag) => validateTagName(tag)));
      });
  }, [tagNameList]);

  const handleUpsertTag = async (tagName: string) => {
    await tagStore.upsertTag(tagName);
  };

  const handleToggleShowSuggestionTags = () => {
    setShowTagSuggestions((state) => !state);
  };

  const handleDeleteTag = async (tag: string) => {
    await tagStore.deleteTag(tag);
  };

  const handleSaveSuggestTagList = async () => {
    for (const tagName of suggestTagNameList) {
      if (validateTagName(tagName)) {
        await tagStore.upsertTag(tagName);
      }
    }
  };

  return (
    <>
      <div className="dialog-content-container max-w-6xl">
        {tagNameList.length > 0 && (
          <>
            <div className="w-full flex flex-row justify-between items-center">
              <div className="flex">
                <p className="w-full text-base" >{t("tag-list.all-tags")}：</p>
              </div>
              <div className="flex">
                <button
                  onClick={() => ToggleSortTagCnt()}
                  className="flex flex-col justify-center items-center w-6 h-6 rounded"
                >
                  {sortTagCnt ? (<Icon.ArrowDown10 className="w-6 h-6 text-gray-400" />) : (<Icon.ArrowDownZA className="w-6 h-6 text-gray-400" />) }
                </button>
                <button
                  onClick={() => ToggleShowColor()}
                  className="flex flex-col justify-center items-center w-5 h-5 rounded ml-2 mr-2"
                >
                  {showColor ? (<Icon.Palette className="w-6 h-6 text-green-400" />) : (<Icon.Palette className="w-6 h-6 text-gray-400" />) }
                </button>
              </div>
            </div>
            <div className="w-full flex flex-row justify-start items-start flex-wrap">
              {tagArray
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-sm mr-2 mt-1 font-mono cursor-pointer hover:opacity-60 hover:line-through"
                  >
                    {
                      tagCountsDict[tag] >= 120 ?
                      <span className={`w-full ${showColor ? 'text-red-600' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 105 ?
                      <span className={`w-full ${showColor ? 'text-red-500' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 91 ?
                      <span className={`w-full ${showColor ? 'text-red-400' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 78 ?
                      <span className={`w-full ${showColor ? 'text-orange-500' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 66 ?
                      <span className={`w-full ${showColor ? 'text-green-600' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 55 ?
                      <span className={`w-full ${showColor ? 'text-green-500' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 45 ?
                      <span className={`w-full ${showColor ? 'text-green-400' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 36 ?
                      <span className={`w-full ${showColor ? 'text-blue-600' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 28 ?
                      <span className={`w-full ${showColor ? 'text-blue-400' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 21 ?
                      <span className={`w-full ${showColor ? 'text-gray-900' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 15 ?
                      <span className={`w-full ${showColor ? 'text-gray-800' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 10 ?
                      <span className={`w-full ${showColor ? 'text-gray-700' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 6 ?
                      <span className={`w-full ${showColor ? 'text-gray-600' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 3 ?
                      <span className={`w-full ${showColor ? 'text-gray-500' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> : tagCountsDict[tag] >= 1 ?
                      <span className={`w-full ${showColor ? 'text-gray-400' : 'text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}({tagCountsDict[tag]})</span> :
                      <span className={`w-full ${showColor ? 'line-through' : 'line-through text-gray-500'}`} onClick={() => handleDeleteTag(tag)}>#{tag}</span>
                    }
                  </span>
                ))}
            </div>
          </>
        )}

        {shownSuggestTagNameList.length > 0 && (
          <>
            <Divider className="!mt-3 !mb-3" />
            <div className="mb-1 text-sm w-full flex flex-row justify-start items-center">
              <span className="text-base mr-2">{t("tag-list.tag-suggestions")}</span>
              <span
                className="text-xs border border-gray-200 rounded-md px-1 leading-5 cursor-pointer text-gray-600 hover:shadow "
                onClick={handleToggleShowSuggestionTags}
              >
                {showTagSuggestions ? t("tag-list.hide") : t("tag-list.show")}
              </span>
            </div>
            {showTagSuggestions && (
              <>
                <div className="w-full flex flex-row justify-start items-start flex-wrap mb-2">
                  {shownSuggestTagNameList.map((tag) => (
                    <OverflowTip
                      key={tag}
                      className="text-sm mr-2 mt-1 font-mono cursor-pointer hover:opacity-60"
                    >
                      <span className="w-full" onClick={() => handleUpsertTag(tag)}>
                        #{tag}
                      </span>
                    </OverflowTip>
                  ))}
                </div>
                <Button size="sm" variant="outlined" onClick={handleSaveSuggestTagList}>
                  {t("tag-list.save-all")}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default TagManagerDialog;