import { Tooltip, Box, Checkbox, Divider } from "@mui/joy";
import { useEffect, useRef, useState } from "react";
import useDebounce from "react-use/lib/useDebounce";
import { useFilterStore } from "@/store/module";
import { useTranslate } from "@/utils/i18n";
import Icon from "./Icon";

interface Props {
  hide_setting?: boolean;
}

const SearchBar: React.FC<Props> = (props: Props) => {
  const { hide_setting } = props;
  const t = useTranslate();
  const filterStore = useFilterStore();
  const [queryText, setQueryText] = useState("");
  const [show_setting, set_show_setting] = useState(false);

  const [search_orphan, set_search_orphan] = useState(false);
  const [search_orphan_disable, set_search_orphan_disable] = useState(false);
  const [search_ref, set_search_ref] = useState(false);
  const [search_ref_disable, set_search_ref_disable] = useState(false);
  const [search_refed, set_search_refed] = useState(false);
  const [search_refed_disable, set_search_refed_disable] = useState(false);

  const [search_todo, set_search_todo] = useState(false);
  const [search_unfinish, set_search_unfinish] = useState(false);

  const [search_resource, set_search_resource] = useState(false);
  const [search_no_resource, set_search_no_resource] = useState(false);
  const [search_resource_disable, set_search_resource_disable] = useState(false);
  const [search_no_resource_disable, set_search_no_resource_disable] = useState(false);

  const [search_tag, set_search_tag] = useState(false);
  const [search_no_tag, set_search_no_tag] = useState(false);
  const [search_tag_disable, set_search_tag_disable] = useState(false);
  const [search_no_tag_disable, set_search_no_tag_disable] = useState(false);

  const [search_link, set_search_link] = useState(false);

  const [search_public, set_search_public] = useState(false);
  const [search_public_disable, set_search_public_disable] = useState(false);
  const [search_private, set_search_private] = useState(false);
  const [search_private_disable, set_search_private_disable] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const text = filterStore.getState().text;
    setQueryText(text === undefined ? "" : text);
  }, [filterStore.state.text]);

  useDebounce(
    () => {
      filterStore.setTextFilter(queryText.length === 0 ? undefined : queryText);
    },
    100,
    [queryText]
  );

  const handleTextQueryInput = (event: React.FormEvent<HTMLInputElement>) => {
    setQueryText(event.currentTarget.value);
  };

  const toggle_show_setting = () => {
    set_show_setting(!show_setting);
  }

  const search_orphan_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_orphan(e.target.checked);
    filterStore.setOrphan(e.target.checked);
    if(e.target.checked) {
      set_search_ref_disable(true);
      set_search_refed_disable(true);
    } else {
      set_search_ref_disable(false);
      set_search_refed_disable(false);
    }
  }

  const search_ref_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_ref(e.target.checked);
    filterStore.setRef(e.target.checked);
    if(e.target.checked) {
      set_search_orphan_disable(true);
    } else {
      set_search_orphan_disable(false);
    }
  }

  const search_refed_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_refed(e.target.checked);
    filterStore.setReded(e.target.checked);
    if(e.target.checked) {
      set_search_orphan_disable(true);
    } else {
      set_search_orphan_disable(false);
    }
  }

  const search_todo_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_todo(e.target.checked);
    filterStore.setTodo(e.target.checked);
  }

  const search_link_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_link(e.target.checked);
    filterStore.setLink(e.target.checked);
  }

  const search_public_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_public(e.target.checked);
    filterStore.setPublic(e.target.checked);
    if(e.target.checked) {
      set_search_private_disable(true);
    } else {
      set_search_private_disable(false);
    }
  }

  const search_private_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_private(e.target.checked);
    filterStore.setPrivate(e.target.checked);
    if(e.target.checked) {
      set_search_public_disable(true);
    } else {
      set_search_public_disable(false);
    }
  }

  const search_unfinish_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_unfinish(e.target.checked);
    filterStore.setUnfinish(e.target.checked);
  }

  const search_resource_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_resource(e.target.checked);
    filterStore.setResource(e.target.checked);
    if (e.target.checked) {
      set_search_no_resource_disable(true);
    } else {
      set_search_no_resource_disable(false);
    }
  }

  const search_no_resource_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_no_resource(e.target.checked);
    filterStore.setNoResource(e.target.checked);
    if (e.target.checked) {
      set_search_resource_disable(true);
    } else {
      set_search_resource_disable(false);
    }
  }

  const search_tag_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_tag(e.target.checked);
    filterStore.setTag(e.target.checked);
    if (e.target.checked) {
      set_search_no_tag_disable(true);
    } else {
      set_search_no_tag_disable(false);
    }
  }

  const search_no_tag_changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_search_no_tag(e.target.checked);
    filterStore.setNoTag(e.target.checked);
    if (e.target.checked) {
      set_search_tag_disable(true);
    } else {
      set_search_tag_disable(false);
    }
  }


  return (
    <div className="w-full h-9 flex flex-row justify-start items-center py-2 px-3 rounded-md bg-gray-200 dark:bg-zinc-700">
      <div className="group">
        <Icon.Search className="w-4 h-auto opacity-30" />
        <div className="hidden flex-row justify-start items-start flex-wrap absolute mt-1 p-1 z-1 rounded h-auto overflow-y-auto shadow bg-zinc-100 group-hover:block">
          <div className="w-full text-xs text-gray-600">搜索语法：</div>
          <div className="w-full text-xs text-gray-400">1.  #xxx:标签搜索<b>包含</b>xxx</div>
          <div className="w-full text-xs text-gray-400">2.  <u>.</u>(即英文句号):孤儿卡片</div>
          <div className="w-full text-xs text-gray-400">3.  $todo$:待办</div>
          <div className="w-full text-xs text-gray-400">4.  $unfinish$:未完成待办</div>
          <div className="w-full text-xs text-gray-400">5.  $pic$:包含资源</div>
          <div className="w-full text-xs text-gray-400">6.  $nopic$:不包含资源</div>
          <div className="w-full text-xs text-gray-400">7.  $ref$:包含引用</div>
          <div className="w-full text-xs text-gray-400">8.  $refed$:存在被引用</div>
          <div className="w-full text-xs text-gray-400">9.  $tag$:有标签</div>
          <div className="w-full text-xs text-gray-400">10. $notag$:无标签</div>
          <div className="w-full text-xs text-gray-400">11. $link$:包含链接</div>
          <div className="w-full text-xs text-gray-400">12. reg:xx匹配正则表达式</div>
          <div className="w-full text-xs text-gray-400">13. $public$:公开卡片</div>
          <div className="w-full text-xs text-gray-400">14. $private$:私有卡片</div>
          <div className="w-full text-xs text-gray-400">15. word:xxx:字数多于xxx</div>
          <div className="w-full text-xs text-gray-400 pb-2">非以上：文本匹配</div>
          <hr />
          <div className="w-full text-xs text-gray-600 pt-2">以上均可通过<u><b>与或非</b></u>组合：</div>
          <div className="w-full text-xs text-gray-400">与：空格隔开，如:<u>a b .</u></div>
          <div className="w-full text-xs text-gray-400">或：|间隔，如:<u>$todo$|a|b</u></div>
          <div className="w-full text-xs text-gray-400 pb-2">非：!开头，如:<u>!tag:xx</u></div>
          <hr />
          <div className="w-full text-xs text-gray-400 pt-2">搜索过程忽略大小写</div>
        </div>
      </div>
      <input
        className="flex ml-2 w-24 grow text-sm outline-none bg-transparent"
        type="text"
        placeholder={t("memo.search-placeholder")}
        ref={inputRef}
        value={queryText}
        onChange={handleTextQueryInput}
      />
      {!hide_setting &&
        <Tooltip title={
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              maxWidth: 500,
            }}
          >
            <div className="w-full">
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.SquareStack className="w-4 h-auto opacity-80" />
                  <span>孤儿卡片</span>
                </div>
                <Checkbox className="ml-2" disabled={search_orphan_disable} checked={search_orphan} onChange={(e) => search_orphan_changed(e)}/>
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.RedoDot className="w-4 h-auto opacity-80" />
                  <span>有引用</span>
                </div>
                <Checkbox className="ml-2" disabled={search_ref_disable} checked={search_ref} onChange={(e) => search_ref_changed(e)}/>
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.UndoDot className="w-4 h-auto opacity-80" />
                  <span>被引用</span>
                </div>
                <Checkbox className="ml-2" disabled={search_refed_disable} checked={search_refed} onChange={(e) => search_refed_changed(e)}/>
              </div>
              <Divider />
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.ListTodo className="w-4 h-auto opacity-80" />
                  <span>包含待办</span>
                </div>
                <Checkbox className="ml-2" checked={search_todo} onChange={(e) => search_todo_changed(e)}/>
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.LayoutList className="w-4 h-auto opacity-80" />
                  <span>包含未完成待办</span>
                </div>
                <Checkbox className="ml-2" checked={search_unfinish} onChange={(e) => search_unfinish_changed(e)} />
              </div>
              <Divider />
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.Image className="w-4 h-auto opacity-80" />
                  <span>包含资源</span>
                </div>
                <Checkbox className="ml-2" disabled={search_resource_disable} checked={search_resource} onChange={(e) => search_resource_changed(e)} />
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.ImageOff className="w-4 h-auto opacity-80" />
                  <span>无资源</span>
                </div>
                <Checkbox className="ml-2" disabled={search_no_resource_disable} checked={search_no_resource} onChange={(e) => search_no_resource_changed(e)} />
              </div>
              <Divider />
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.BookmarkCheck className="w-4 h-auto opacity-80" />
                  <span>有标签</span>
                </div>
                <Checkbox className="ml-2" disabled={search_tag_disable} checked={search_tag} onChange={(e) => search_tag_changed(e)} />
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.BookmarkX className="w-4 h-auto opacity-80" />
                  <span>无标签</span>
                </div>
                <Checkbox className="ml-2" disabled={search_no_tag_disable} checked={search_no_tag} onChange={(e) => search_no_tag_changed(e)} />
              </div>
              <Divider />
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.Link className="w-4 h-auto opacity-80" />
                  <span>包含链接</span>
                </div>
                <Checkbox className="ml-2" checked={search_link} onChange={(e) => search_link_changed(e)}/>
              </div>
              <Divider />
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.User className="w-4 h-auto opacity-80" />
                  <span>公开卡片</span>
                </div>
                <Checkbox className="ml-2" checked={search_public} disabled={search_public_disable} onChange={(e) => search_public_changed(e)}/>
              </div>
              <div className="flex flex-row justify-between items-center mx-1 w-full">
                <div className="flex flex-row">
                  <Icon.EyeOff className="w-4 h-auto opacity-80" />
                  <span>私有卡片</span>
                </div>
                <Checkbox className="ml-2" checked={search_private} disabled={search_private_disable} onChange={(e) => search_private_changed(e)}/>
              </div>
            </div>
          </Box>
        } arrow variant="outlined" open={show_setting} placement="bottom-end">
        <span className="w-4 h-4">
          <Icon.Settings2 className={`w-4 h-auto`} onClick={toggle_show_setting}/>
        </span>
      </Tooltip>
      }
    </div>
  );
};

export default SearchBar;
