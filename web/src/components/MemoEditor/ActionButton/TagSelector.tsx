import { useEffect } from "react";
import Icon from "@/components/Icon";
import OverflowTip from "@/components/kit/OverflowTip";
import { useTagStore } from "@/store/module";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import { IconButton } from "@mui/joy";

interface Props {
  onTagSelectorClick: (tag: string) => void;
  fullScreen: boolean;
}

const TagSelector = (props: Props) => {
  const { onTagSelectorClick, fullScreen } = props;
  const tagStore = useTagStore();
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;
  let fav_tags = userSetting.favTag.split(",");
  let tags = Array.from(tagStore.state.tags);

  useEffect(() => {
    (async () => {
      try {
        await tagStore.fetchTags();
      } catch (error) {
      }
    })();
  }, []);

  const handle_tag_fav_change = async (tag: string, save: boolean) => {
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
    <IconButton className="relative group flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow">
      <Icon.Hash className="w-5 h-5 mx-auto" />
      <div className={`hidden flex-row justify-start items-start flex-wrap absolute ${fullScreen ? "bottom-9" : "top-8"} left-0 mt-1 p-1 z-1 rounded h-auto max-h-48 overflow-y-auto font-mono shadow bg-zinc-200 group-hover:flex`}>
        {tags.length > 0 ? (
          tags.sort(
            (a, b) => {
              if (fav_tags.includes(a) && !fav_tags.includes(b)) {
                return -1;
              } else if (fav_tags.includes(b) && !fav_tags.includes(a)) {
                return 1;
              }
              return a.localeCompare(b);
            }
          ).map((tag) => {
            const slashes = fav_tags.includes(tag)?1:tag.split('/').length;
            const padding_style = {
              paddingLeft: `${slashes-0.5}rem`,
            } as React.CSSProperties;;
            return (
              <div
                className="w-full max-w-full truncate text-black cursor-pointer rounded text-sm leading-6 hover:bg-zinc-300 shrink-0"
                onClick={() => onTagSelectorClick(tag)}
                key={tag}
                style={padding_style}
              >
                <OverflowTip className="flex justify-between">
                  {fav_tags.includes(tag) ? <span className="text-green-600">#{tag}</span> : <span>#{tag}</span>}
                  {fav_tags.includes(tag) ? <Icon.Star fill="#16a34a" className="h-auto text-green-600 hover:shadow hover:bg-white hover:border-gray-200 rounded-sm pl-1 pr-1" onClick={(e) => {e.stopPropagation(); handle_tag_fav_change(tag, false);}} /> : <Icon.Star className="h-auto text-gray-600 hover:shadow hover:bg-white hover:border-gray-200 rounded-sm pl-1 pr-1" onClick={(e) => {e.stopPropagation(); handle_tag_fav_change(tag, true);}}/>}
                </OverflowTip>

              </div>
            );
          })
        ) : (
          <p className="italic text-sm ml-2" onClick={(e) => e.stopPropagation()}>
            No tags found
          </p>
        )}
      </div>
    </IconButton>
  );
};

export default TagSelector;
