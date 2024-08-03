import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useFilterStore } from "@/store/module";
import Icon from "./Icon";

interface Props {
  memo_cnt: number;
}

const MemoFilter = (props: Props) => {
  const location = useLocation();
  const filterStore = useFilterStore();
  const filter = { full_tag: true, ...filterStore.state };
  const { tag: tagQuery, duration, text: textQuery, visibility, full_tag } = filter;
  const showFilter = Boolean(tagQuery || (duration && duration.from < duration.to) || textQuery || visibility);

  useEffect(() => {
    filterStore.clearFilter();
  }, [location]);

  let textQuery_format = ""
  if(textQuery) {
    const queryWords = textQuery.trim().split(/\s+/);
    for (let word of queryWords) {
      if (textQuery_format != "") {
        textQuery_format += "且"
      }
      if(word.includes("|")){
        const w_list = word.split("|")
        let w_format = ""
        for(let w of w_list){
          if (w == '') {
            continue
          }
          if(w_format != ""){
            w_format += "或"
          }
          if (w.startsWith('!')) {
            w = w.substring(1)
            if (w.startsWith("#") && w.length > 1) {
              const tag = w.slice(1);
              w_format += "没标签包含" + tag
            } else if (w == '.') {
              w_format += '非孤儿卡片'
            } else if (w == '$todo$') {
              w_format += '不包含todo'
            } else if (w == '$unfinish$') {
              w_format += '不包含未完成todo'
            } else if (w == '$pic$') {
              w_format += '无图片'
            } else if (w == '$nopic$') {
              w_format += '有图片'
            } else if (w == '$tag$') {
              w_format += '无标签'
            } else if (w == '$notag$') {
              w_format += '有标签'
            } else if (w == '$ref$') {
              w_format += '无引用'
            } else if (w == '$refed$') {
              w_format += '没被引用'
            } else if (w == '$link$') {
              w_format += '无链接'
            } else if (w.startsWith("reg:") && w.length > 4) {
              const regexp = w.slice(4);
              w_format += "没命中正则表达式" + regexp
            } else if (w == "$public$") {
              w_format += '非公开卡片'
            } else if (w == "$private$") {
              w_format += '非私有卡片'
            } else if (w.startsWith("word:") && w.length > 5 && !isNaN(parseInt(w.slice(5)))) {
              const thred = parseInt(word.slice(5));
              w_format += "字数不多于" + thred
            } else {
              w_format += "不包含" + w + ""
            }
          }
          else {
            if (w.startsWith("#") && w.length > 1) {
              const tag = w.slice(1);
              w_format += "标签包含" + tag
            } else if (w == '.') {
              w_format += '孤儿卡片'
            } else if (w == '$todo$') {
              w_format += '包含todo'
            } else if (w == '$unfinish$') {
              w_format += '包含未完成todo'
            } else if (w == '$pic$') {
              w_format += '包含图片'
            } else if (w == '$nopic$') {
              w_format += '不包含图片'
            } else if (w == '$tag$') {
              w_format += '有标签'
            } else if (w == '$notag$') {
              w_format += '无标签'
            } else if (w == '$ref$') {
              w_format += '有引用'
            } else if (w == '$refed$') {
              w_format += '有被引用'
            } else if (w == '$link$') {
              w_format += '包含链接'
            } else if (w.startsWith("reg:") && w.length > 4) {
              const regexp = w.slice(4);
              w_format += "命中正则表达式" + regexp
            } else if (w == '$public$') {
              w_format += '公开卡片'
            } else if (w == '$private$') {
              w_format += '私有卡片'
            } else if (w.startsWith("word:") && w.length > 5 && !isNaN(parseInt(w.slice(5)))) {
              const thred = parseInt(word.slice(5));
              w_format += "字数多于" + thred
            } else {
              w_format += "包含" + w
            }
          }
        }
        textQuery_format += "『" + w_format + "』"
      }
      else if (word.startsWith('!')) {
        const real_word = word.substring(1)
        if (real_word.startsWith("#") && real_word.length > 1) {
          const tag = real_word.slice(1);
          textQuery_format += "没标签包含" + tag
        } else if (real_word == '.') {
          textQuery_format += '非孤儿卡片'
        } else if (real_word == '$todo$') {
          textQuery_format += '不包含todo'
        } else if (real_word == '$unfinish$') {
          textQuery_format += '不包含未完成todo'
        } else if (real_word == '$pic$') {
          textQuery_format += '不包含图片'
        } else if (real_word == '$nopic$') {
          textQuery_format += '包含图片'
        } else if (real_word == '$tag$') {
          textQuery_format += '无标签'
        } else if (real_word == '$notag$') {
          textQuery_format += '有标签'
        } else if (real_word == '$ref$') {
          textQuery_format += '没有引用'
        } else if (real_word == '$refed$') {
          textQuery_format += '没被引用'
        } else if (real_word == '$link$') {
          textQuery_format += '无链接'
        } else if (real_word.startsWith("reg:") && real_word.length > 4) {
          const regexp = real_word.slice(4);
          textQuery_format += "没命中正则表达式" + regexp
        } else if (real_word == '$public$') {
          textQuery_format += '非公开卡片'
        } else if (real_word == '$private$') {
          textQuery_format += '非私有卡片'
        } else if (real_word.startsWith("word:") && real_word.length > 5 && !isNaN(parseInt(real_word.slice(5)))) {
          const thred = parseInt(real_word.slice(5));
          textQuery_format += "字数不多于" + thred
        } else {
          textQuery_format += "不包含" + real_word
        }
      }
      else if (word.startsWith("#") && word.length > 1) {
        const tag = word.slice(1);
        textQuery_format += "标签包含" + tag
      } else if (word == '.') {
        textQuery_format += '孤儿卡片'
      } else if (word == '$todo$') {
        textQuery_format += '包含todo'
      } else if (word == '$unfinish$') {
        textQuery_format += '包含未完成todo'
      } else if (word == '$pic$') {
        textQuery_format += '包含图片'
      } else if (word == '$nopic$') {
        textQuery_format += '不包含图片'
      } else if (word == '$tag$') {
        textQuery_format += '有标签'
      } else if (word == '$notag$') {
        textQuery_format += '无标签'
      } else if (word == '$ref$') {
        textQuery_format += '有引用'
      } else if (word == '$refed$') {
        textQuery_format += '有被引用'
      } else if (word == '$link$') {
        textQuery_format += '包含链接'
      } else if (word.startsWith("reg:") && word.length > 4) {
        const regexp = word.slice(4);
        textQuery_format += "命中正则表达式" + regexp
      } else if (word == '$public$') {
        textQuery_format += '公开卡片'
      } else if (word == '$private$') {
        textQuery_format += '私有卡片'
      } else if (word.startsWith("word:") && word.length > 5 && !isNaN(parseInt(word.slice(5)))) {
        const thred = parseInt(word.slice(5));
        textQuery_format += "字数多于" + thred
      } else {
        textQuery_format += "包含" + word
      }
    }
  }

  return (
    <div
      className={`flex flex-row justify-start items-start w-full flex-wrap px-2 pb-2 text-sm font-mono leading-7 ${
        showFilter ? "" : "!hidden"
      }`}
    >
      <span className="mx-2 text-gray-400">搜索结果({props.memo_cnt}):</span>

      <div
        className={
          "max-w-xs flex flex-row justify-start items-center px-2 mr-2 cursor-pointer bg-gray-200 rounded whitespace-nowrap truncate " +
          (tagQuery ? "" : "!hidden")
        }
      >
        {full_tag ?
          <Icon.Tags className="w-4 h-auto mr-1 text-gray-500 " onClick={() => {filterStore.toggleTagMode();}} /> :
          <Icon.Tag className="w-3 h-auto mr-2 text-gray-500 " onClick={() => {filterStore.toggleTagMode();}} />
        }
        <span>{tagQuery}</span>
        <Icon.X className="w-4 h-auto ml-1 opacity-40 " onClick={() => {filterStore.setTagFilter(undefined);}}/>
      </div>
      {textQuery && <div
        className={
          "flex flex-row justify-start items-center px-2 mr-2 cursor-pointer bg-gray-200 rounded" +
          (textQuery ? "" : "!hidden")
        }
      >
        <Icon.Search className="w-4 h-auto mr-1 text-gray-500 " /> {textQuery_format}
        <Icon.X className="w-4 h-auto ml-1 opacity-40" onClick={() => {
          filterStore.setTextFilter(undefined);
        }}/>
      </div>}
    </div>
  );
};

export default MemoFilter;
