import { Dropdown, Menu, MenuButton} from "@mui/joy";
import { useEffect, useState } from "react";
import useToggle from "react-use/lib/useToggle";
import { useFilterStore, useTagStore } from "@/store/module";
import { useTranslate } from "@/utils/i18n";
import showTagManagerDialog from "./TagManagerMainDialog";
import showRenameTagDialog from "./RenameTagDialog";
import Icon from "./Icon";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";

interface Tag {
  key: string;
  text: string;
  subTags: Tag[];
  cnt: number;
}

const TagList = () => {
  const t = useTranslate();
  const filterStore = useFilterStore();
  const tagStore = useTagStore();
  const tagsText = tagStore.state.tags;
  const tagCounts = tagStore.state.tagCounts;
  const filter = filterStore.state;
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    tagStore.fetchTags();
    tagStore.fetchTagsCnt();
  }, []);

  useEffect(() => {
    const sortedTags = Array.from(tagsText).sort();
    const root: KVObject<any> = {
      subTags: [],
    };
    for (const tag of sortedTags) {
      const subtags = tag.split("/");
      let tempObj = root;
      let tagText = "";

      for (let i = 0; i < subtags.length; i++) {
        const key = subtags[i];
        if (i === 0) {
          tagText += key;
        } else {
          tagText += "/" + key;
        }

        let obj = null;

        for (const t of tempObj.subTags) {
          if (t.text === tagText) {
            obj = t;
            break;
          }
        }

        if (!obj) {
          obj = {
            key,
            text: tagText,
            subTags: [],
            cnt: Object.keys(tagCounts).length > 0 ? tagCounts[tagText] : 0,
          };
          tempObj.subTags.push(obj);
        }

        tempObj = obj;
      }
    }

    setTags(root.subTags as Tag[]);
  }, [tagsText, tagCounts]);

  return (
    <div className="flex flex-col justify-start w-full mt-2 h-auto shrink-0 flex-nowrap hide-scrollbar">
      <div className="flex flex-row justify-start items-center w-full px-4">
        <span className="text-sm leading-6 font-mono text-gray-400">{t("common.tag_manager")}</span>
        <button
          onClick={() => showTagManagerDialog()}
          className="flex flex-col justify-center items-center w-5 h-5 bg-gray-200 rounded ml-2 hover:shadow"
        >
          <Icon.Plus className="w-4 h-4 text-gray-400" />
        </button>

      </div>
      <div className="flex flex-col justify-start relative w-full h-auto flex-nowrap mb-2">
        {tags.map((t, idx) => (
          <TagItemContainer key={t.text + "-" + idx} tag={t} tagQuery={filter.tag} />
        ))}
      </div>
    </div>
  );
};

interface TagItemContainerProps {
  tag: Tag;
  tagQuery?: string;
}

const TagItemContainer: React.FC<TagItemContainerProps> = (props: TagItemContainerProps) => {
  const filterStore = useFilterStore();
  const { tag, tagQuery} = props;
  const isActive = tagQuery === tag.text;
  const hasSubTags = tag.subTags.length > 0;
  const [showSubTags, toggleSubTags] = useToggle(false);
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;
  let fav_tags = userSetting.favTag.split(",");

  const handleTagClick = () => {
    if (isActive) {
      filterStore.setTagFilter(undefined);
    } else {
      filterStore.setTagFilter(tag.text);
    }
  };

  const handleToggleBtnClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleSubTags();
  };

  const handleTagFav = async (tag: string, save: boolean) => {
    if (save){
      for (let i = 0; i < fav_tags.length; i++) {
        if (fav_tags[i] === tag) {
          return;
        }
      }
      fav_tags.push(tag);
    } else {
      for (let i = 0; i < fav_tags.length; i++) {
        if (fav_tags[i] === tag) {
          fav_tags.splice(i, 1);
          break;
        }
      }
    }
    await userV1Store.updateUserSetting(
      {
        favTag: fav_tags.join(",")
      },
      ["fav_tag"]
    );
  };

  return (
    <>
      <div
        className="relative flex flex-row justify-between items-center w-full h-10 py-0 px-4 mt-px first:mt-1 rounded-lg text-base cursor-pointer select-none shrink-0"
      >
        <div
          className={`flex flex-row justify-start items-center shrink leading-5 mr-1 text-black ${
            isActive && "text-green-600"
          }`}
        >
          <Dropdown>
            <MenuButton slots={{ root: "div" }}>
              <div className="group shrink-0">
                <Icon.Hash className="w-4 h-auto shrink-0 opacity-60 mr-1" />
              </div>
            </MenuButton>
            <Menu size="sm" placement="bottom-start">
              {fav_tags.includes(tag.text) ? <button className="flex flex-row p-1" onClick={() => handleTagFav(tag.text, false)}>
                <Icon.Star className="w-4 h-auto text-gray-400" />取消收藏
              </button> : <button className="flex flex-row p-1" onClick={() => handleTagFav(tag.text, true)}>
                <Icon.Star fill="#16a34a" className="w-4 h-auto text-green-600" />收藏
              </button>}
              <button className="flex flex-row p-1" onClick={() => showRenameTagDialog({ tag: tag.text })}>
                <Icon.Replace className="w-4 h-auto text-red-400" />重命名
              </button>
            </Menu>
          </Dropdown>
          <span className="truncate" onClick={handleTagClick}>{tag.key}
            <span className="text-xs text-green-600 pl-1">
              {tag.cnt && `(${tag.cnt})`}
            </span>
          </span>
        </div>
        <div className="flex flex-row justify-end items-center">
          {hasSubTags ? (
            <span
              className={`flex flex-row justify-center items-center w-6 h-6 shrink-0 transition-all rotate-0 ${showSubTags && "rotate-90"}`}
              onClick={handleToggleBtnClick}
            >
              <Icon.ChevronRight className="w-5 h-5 opacity-40" />
            </span>
          ) : null}
        </div>
      </div>
      {hasSubTags ? (
        <div
          className={`flex flex-col justify-start h-auto ml-5 pl-1 border-l-2 border-l-gray-200 ${
            !showSubTags && "!hidden"
          }`}
        >
          {tag.subTags.map((st, idx) => (
            <TagItemContainer key={st.text + "-" + idx} tag={st} tagQuery={tagQuery} />
          ))}
        </div>
      ) : null}
    </>
  );
};

export default TagList;
