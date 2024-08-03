import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import MemoFilter from "@/components/MemoFilter";
import { DEFAULT_MEMO_LIMIT } from "@/helpers/consts";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useFilterStore, useMemoStore } from "@/store/module";
import { extractUsernameFromName } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import Empty from "./Empty";
import Memo from "./Memo";
import { getTimeStampByDate } from "@/helpers/datetime";

interface Props {
  showFilterDesc?: boolean;
}

const cal_valid_word_cnt = (content: string) => {
  let _tmp = content
  _tmp = _tmp.replace(/\[(.+?)\]\(.*?\)/g, '$1');
  _tmp = _tmp.replace(/ *- \[[ xX]\] (.+)/g, '$1');
  _tmp = _tmp.replace(/ *[-+] (.+)/g, '$1');
  _tmp = _tmp.replace(/ *\d+\. (.+)/g, '$1');
  _tmp = _tmp.replace(/#+ (.+)/g, '$1');
  _tmp = _tmp.replace(/> (.+)/g, '$1');
  _tmp = _tmp.replace(/\|[:\-\|]+\| *(?!.)/g, '');
  _tmp = _tmp.replace(/\*\*\*(.+)\*\*\*/g, '$1');
  _tmp = _tmp.replace(/\*\*(.+)\*\*/g, '$1');
  _tmp = _tmp.replace(/\*(.+)\*/g, '$1');
  _tmp = _tmp.replace(/==(.+)==/g, '$1');
  _tmp = _tmp.replace(/^\s+|\s+$/g, '');
  _tmp = _tmp.replace(/\n|\s+/g, '');
  return _tmp.length
};


const hasTag = (content: string, target_tag: string) => {
  const tag_reg = /#([^\s]+)/;
  for (const t of Array.from(content.match(new RegExp(tag_reg, "gu")) ?? [])) {
    const tag = t.replace(tag_reg, "$1").trim();
    if (tag.toLowerCase().includes(target_tag.toLowerCase())) {
      return true;
    }
  }
  return false;
};


const matchSearchItem = (memo: Memo, word: string): boolean => {
  word = word.toLowerCase();
  if (word.length == 0) {
    return false;
  }
  if (word.startsWith("!")) {
    return !matchSearchItem(memo, word.slice(1));
  } else if (word.startsWith("#") && word.length > 1) {
    const tag = word.slice(1);
    return hasTag(memo.content, tag);
  } else if(word == ".") {
    return memo.relationList.length == 0;
  } else if(word == "$todo$") {
    return memo.content.includes("- [ ] ") || memo.content.includes("- [x] ");
  } else if(word == "$unfinish$") {
    return memo.content.includes("- [ ] ");
  } else if (word == "$pic$") {
    return memo.resourceList.length > 0;
  } else if (word == "$nopic$") {
    return memo.resourceList.length == 0;
  } else if (word == "$ref$") {
    return memo.relationList.filter((r) => r.memoId == memo.id).length > 0;
  } else if (word == "$refed$") {
    return memo.relationList.filter((r) => r.relatedMemoId == memo.id).length > 0;
  } else if (word == "$tag$") {
    const tag_reg = /#([^\s]+)/;
    return memo.content.match(new RegExp(tag_reg, "gu")) !== null;
  } else if (word == "$notag$") {
    const tag_reg = /#([^\s]+)/;
    return memo.content.match(new RegExp(tag_reg, "gu")) === null;
  } else if (word == "$link$") {
    const LINK_REG = /\[([^\]\[]+)\]\((http[^ \[]+)\)/
    return memo.content.match(new RegExp(LINK_REG, "gu")) !== null;
  } else if (word.startsWith("reg:") && word.length > 4) {
    const regExp = new RegExp(word.slice(4), "u");
    return regExp.test(memo.content);
  } else if (word == "$public$") {
    return memo.visibility == "PUBLIC";
  } else if (word == "$private$") {
    return memo.visibility == "PRIVATE";
  } else if (word.startsWith("word:") && word.length > 5 && !isNaN(parseInt(word.slice(5)))) {
    const thred = parseInt(word.slice(5));
    return cal_valid_word_cnt(memo.content) > thred;
  }
  return memo.content.toLowerCase().includes(word);
}

const memoMatchRule = (memo: Memo, rule: string): boolean => {
  const queryWords = rule.toLowerCase().trim().split(/\s+/);
  for (let word of queryWords) {
    if (word.includes("|")) {
      const orWords = word.split("|");
      let match = false;
      for (const orWord of orWords) {
        if (orWord.trim().length === 0) {
          continue;
        }
        if (matchSearchItem(memo, orWord)) {
          match = true;
          break;
        }
      }
      if (!match) {
        return false;
      }
    }
    else if (!matchSearchItem(memo, word)) {
      return false;
    }
  }
  return true;
}

const MemoList: React.FC<Props> = (props: Props) => {
  const t = useTranslate();
  const params = useParams();
  const memoStore = useMemoStore();
  const filterStore = useFilterStore();
  const filter = filterStore.state;
  const { loadingStatus, memos } = memoStore.state;
  const user = useCurrentUser();
  const { tag: tagQuery, duration, text: textQuery, visibility, full_tag, only_orphan, only_todo, only_resource, only_unfinish, only_no_resource, only_tag, only_no_tag, only_ref, only_refed, only_link, only_public, only_private } = filter;
  const showMemoFilter = Boolean(tagQuery || (duration && duration.from < duration.to) || textQuery || visibility || only_orphan || only_todo || only_resource || only_unfinish || only_no_resource || only_tag || only_no_tag || only_ref || only_refed || only_link || only_public || only_private);
  const username = params.username || extractUsernameFromName(user.name);
  const fetchMoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tag = url.searchParams.get("tag");
    if (tag) {
      filterStore.setTagFilter(tag);
    }
    const tag_mode = url.searchParams.get("tag_mode");
    if (tag_mode == 'full') {
      filterStore.setTagMode(true);
    } else if (tag_mode == 'exact') {
      filterStore.setTagMode(false);
    }
  }, []);

  const shownMemos = (
    showMemoFilter
      ? memos.filter((memo) => {
          let shouldShow = true;
          if (tagQuery) {
            const tag_reg = /#([^\s]+)/;
            const tagsSet = new Set<string>();
            for (const t of Array.from(memo.content.match(new RegExp(tag_reg, "gu")) ?? [])) {
              const tag = t.replace(tag_reg, "$1").trim();
              if (full_tag) {
                const items = tag.split("/");
                let temp = "";
                for (const i of items) {
                  temp += i;
                  tagsSet.add(temp);
                  temp += "/";
                }
              }
              else {
                tagsSet.add(tag);
              }
            }
            if (!tagsSet.has(tagQuery)) {
              shouldShow = false;
            }
          }
          if (
            duration &&
            duration.from < duration.to &&
            (getTimeStampByDate(memo.displayTs) < duration.from || getTimeStampByDate(memo.displayTs) > duration.to)
          ) {
            shouldShow = false;
          }
          if (textQuery) {
            shouldShow = memoMatchRule(memo, textQuery);
          }
          if (only_orphan && !matchSearchItem(memo, ".")) {
            shouldShow = false;
          }
          if (only_todo && !matchSearchItem(memo, "$todo$")) {
            shouldShow = false;
          }
          if (only_unfinish && !matchSearchItem(memo, "$unfinish$")) {
            shouldShow = false;
          }
          if (only_resource && !matchSearchItem(memo, "$pic$")) {
            shouldShow = false;
          }
          if (only_no_resource && !matchSearchItem(memo, "$nopic$")) {
            shouldShow = false;
          }
          if (only_tag && !matchSearchItem(memo, "$tag$")) {
            shouldShow = false;
          }
          if (only_no_tag && !matchSearchItem(memo, "$notag$")) {
            shouldShow = false;
          }
          if (only_ref && !matchSearchItem(memo, "$ref$")) {
            shouldShow = false;
          }
          if (only_refed && !matchSearchItem(memo, "$refed$")) {
            shouldShow = false;
          }
          if (only_link && !matchSearchItem(memo, "$link$")) {
            shouldShow = false;
          }
          if (only_public && !matchSearchItem(memo, "$public$")) {
            shouldShow = false;
          }
          if (only_private && !matchSearchItem(memo, "$private$")) {
            shouldShow = false;
          }
          if (visibility) {
            shouldShow = memo.visibility === visibility;
          }
          return shouldShow;
        })
      : memos
  ).filter((memo) => memo.creatorUsername === username && memo.rowStatus === "NORMAL");

  const pinnedMemos = shownMemos.filter((m) => m.pinned);
  const unpinnedMemos = shownMemos.filter((m) => !m.pinned);
  const memoSort = (mi: Memo, mj: Memo) => {
    return mj.displayTs - mi.displayTs;
  };
  pinnedMemos.sort(memoSort);
  unpinnedMemos.sort(memoSort);
  const sortedMemos = pinnedMemos.concat(unpinnedMemos).filter((m) => m.rowStatus === "NORMAL");

  useEffect(() => {
    const root = document.body.querySelector("#root");
    if (root) {
      root.scrollTo(0, 0);
    }
  }, [filter]);

  useEffect(() => {
    memoStore.setLoadingStatus("incomplete");
  }, []);

  useEffect(() => {
    if (!fetchMoreRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      handleFetchMoreClick();
    });
    observer.observe(fetchMoreRef.current);

    return () => observer.disconnect();
  }, [loadingStatus]);

  const handleFetchMoreClick = async () => {
    let limit = DEFAULT_MEMO_LIMIT;
    try {
      await memoStore.fetchMemos(username, limit, memos.length);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="flex flex-col justify-start items-start w-full max-w-full overflow-y-scroll pb-28 hide-scrollbar">
      {(props.showFilterDesc ?? true) && <MemoFilter memo_cnt={sortedMemos.length}/>}
      {sortedMemos.map((memo) => (
        <Memo key={memo.id} memo={memo} lazyRendering showVisibility showPinnedStyle showParent/>
      ))}

      {loadingStatus === "fetching" ? (
        <div className="flex flex-col justify-start items-center w-full mt-2 mb-1">
          <p className="text-sm text-gray-400 italic">{t("memo.fetching-data")}</p>
        </div>
      ) : (
        <div className="flex flex-col justify-start items-center w-full my-6">
          <div className="text-gray-400 italic">
            {loadingStatus === "complete" ? (
              sortedMemos.length === 0 && (
                <div className="w-full mt-12 mb-8 flex flex-col justify-center items-center italic">
                  <Empty />
                  <p className="mt-2 text-gray-600">{t("message.no-data")}</p>
                </div>
              )
            ) : (
              <span ref={fetchMoreRef} className="cursor-pointer hover:text-green-600" onClick={handleFetchMoreClick}>
                {t("memo.fetch-more")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoList;
export { memoMatchRule}