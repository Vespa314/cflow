import { Divider, Tooltip } from "@mui/joy";
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getRelativeTimeString } from "@/helpers/datetime";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useFilterStore, useMemoStore } from "@/store/module";
import { useUserV1Store, extractUsernameFromName } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import showChangeMemoCreatedTsDialog from "./ChangeMemoCreatedTsDialog";
import { showCommonDialog } from "./Dialog/CommonDialog";
import Icon from "./Icon";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import MemoContent from "./MemoContent";
import showMemoEditorDialog from "./MemoEditor/MemoEditorDialog";
import MemoRelationListView from "./MemoRelationListView";
import MemoResourceListView from "./MemoResourceListView";
import showShareMemoDialog from "./ShareMemoDialog";
import UserAvatar from "./UserAvatar";
import VisibilityIcon from "./VisibilityIcon";
import { CustomCardStyleType } from "./Settings/CustomCardStyleType";
import {memoMatchRule} from "./MemoList"
import "@/less/memo.less";

interface Props {
  memo: Memo;
  showCreator?: boolean;
  showParent?: boolean;
  showVisibility?: boolean;
  showRelatedMemos?: boolean;
  showPinnedStyle?: boolean;
  lazyRendering?: boolean;
}



const Memo: React.FC<Props> = (props: Props) => {
  const { memo, showRelatedMemos, lazyRendering } = props;
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const { i18n } = useTranslation();
  const filterStore = useFilterStore();
  const memoStore = useMemoStore();
  const userV1Store = useUserV1Store();
  const user = useCurrentUser();
  const userSetting = userV1Store.userSetting as UserSetting;
  const markWithTag = userSetting?.markWithTag;
  const doubleClickEdit = userSetting?.doubleClickEdit;
  const cardStyleRule: CustomCardStyleType[] = userSetting?.customCardStyle ? JSON.parse(userSetting.customCardStyle) : [];
  const [shouldRender, setShouldRender] = useState<boolean>(!lazyRendering);
  const [displayTime, setDisplayTime] = useState<string>(getRelativeTimeString(memo.displayTs));
  const memoContainerRef = useRef<HTMLDivElement>(null);
  const readonly = memo.creatorUsername !== extractUsernameFromName(user?.name);
  const [creator, setCreator] = useState(userV1Store.getUserByUsername(memo.creatorUsername));
  const referenceRelations = memo.relationList.filter((relation) => relation.type === "REFERENCE");

  const [extraStyles, setExtraStyles] = useState<Record<string, string>>({});
  const [extra_logo, setExtraLogo] = useState<string>("");
  const [extra_logo_tips, setExtraLogoTips] = useState<string[]>([]);

  useEffect(() => {
    let extraStyles: Record<string, string> = {};
    let _extra_logo: string = "";
    let _extra_logo_tips: string[] = [];
    cardStyleRule.forEach(config => {
      if (memoMatchRule(memo, config.rule)) {
        if (config.style) {
          config.style.split(';').forEach(style => {
            const [style_key, value] = style.split(':').map(item => item.trim());
            if (style_key && value) {
              extraStyles[style_key] = value;
            }
          });
        }
        if (config.icon) {
          _extra_logo += config.icon;
          _extra_logo_tips.push(config.icon+": "+config.name);
        }
      }
    });
    setExtraStyles(extraStyles);
    setExtraLogo(_extra_logo);
    setExtraLogoTips(_extra_logo_tips);
  }, [memo]);

  useEffect(() => {
    if (creator) {
      return;
    }

    const fn = async () => {
      const user = await userV1Store.getOrFetchUserByUsername(memo.creatorUsername);
      setCreator(user);
    };

    fn();
  }, [memo.creatorUsername]);

  useEffect(() => {
    let intervalFlag: any = -1;
    if (Date.now() - memo.displayTs < 1000 * 60 * 60 * 24) {
      intervalFlag = setInterval(() => {
        setDisplayTime(getRelativeTimeString(memo.displayTs));
      }, 1000 * 1);
    }

    return () => {
      clearInterval(intervalFlag);
    };
  }, [i18n.language]);

  useEffect(() => {
    if (shouldRender) {
      return;
    }
    if (!memoContainerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }
      observer.disconnect();

      setShouldRender(true);
    });
    observer.observe(memoContainerRef.current);

    return () => observer.disconnect();
  }, [lazyRendering, filterStore.state]);

  if (!shouldRender) {
    return <div className={`w-full h-32 !bg-transparent ${"memos-" + memo.id}`} ref={memoContainerRef} />;
  }

  const handleEditCreateTime = (event: React.MouseEvent<HTMLDivElement>) => {
    showChangeMemoCreatedTsDialog(memo.id);
  };

  const handleTogglePinMemoBtnClick = async () => {
    try {
      if (memo.pinned) {
        await memoStore.unpinMemo(memo.id);
      } else {
        await memoStore.pinMemo(memo.id);
      }
    } catch (error) {
    }
  };

  const handleEditMemoClick = () => {
    showMemoEditorDialog({
      memoId: memo.id,
    });
  };

  const handleMarkMemoClick = () => {
    if (markWithTag) {
      handleMarkTagMemoClick()
      return
    }
    showMemoEditorDialog({
      init_content: "[MEMO](/m/" + memo.id + ") ",
    });
  };

  const handleMarkTagMemoClick = () => {
    const regex = /#([^\s#,]+)/g;
    const matches = memo.content.match(regex);
    let tag_content = ""
    if (matches) {
      tag_content = matches.join(" ")
      tag_content += " "
    }
    showMemoEditorDialog({
      init_content: "[MEMO](/m/" + memo.id + ") " + tag_content,
    });
  };

  const handleArchiveMemoClick = async () => {
    try {
      await memoStore.patchMemo({
        id: memo.id,
        rowStatus: "ARCHIVED",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response.data.message);
    }
  };

  const handleDeleteMemoClick = async () => {
    showCommonDialog({
      title: t("memo.delete-memo"),
      content: t("memo.delete-confirm"),
      style: "danger",
      dialogName: "delete-memo-dialog",
      onConfirm: async () => {
        await memoStore.deleteMemoById(memo.id);
      },
    });
  };

  const handleMemoContentClick = async (e: React.MouseEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.className === "tag-span") {
      const tagName = targetEl.innerText.startsWith("#") ? targetEl.innerText.slice(1) : targetEl.innerText.slice(0);
      const currTagQuery = filterStore.getState().tag;
      if (currTagQuery === tagName) {
        filterStore.setTagFilter(undefined);
      } else {
        filterStore.setTagFilter(tagName);
      }
    } else if (targetEl.classList.contains("todo-block")) {
      if (readonly) {
        return;
      }

      const status = targetEl.dataset?.value;
      const todoElementList = [...(memoContainerRef.current?.querySelectorAll(`span.todo-block[data-value=${status}]`) ?? [])];
      for (const element of todoElementList) {
        if (element === targetEl) {
          const index = todoElementList.indexOf(element);
          const tempList = memo.content.split(status === "DONE" ? /- \[x\] / : /- \[ \] /);
          let finalContent = "";

          for (let i = 0; i < tempList.length; i++) {
            if (i === 0) {
              finalContent += `${tempList[i]}`;
            } else {
              if (i === index + 1) {
                finalContent += status === "DONE" ? "- [ ] " : "- [x] ";
              } else {
                finalContent += status === "DONE" ? "- [x] " : "- [ ] ";
              }
              finalContent += `${tempList[i]}`;
            }
          }
          await memoStore.patchMemo({
            id: memo.id,
            content: finalContent,
          });
          break;
        }
      }
    }
  };

  const handleMemoContentDoubleClick = (e: React.MouseEvent) => {
    if (readonly) {
      return;
    }
    if (doubleClickEdit) {
      handleEditMemoClick();
    }
  };

  return (
    <div
      className={`group memo-wrapper ${"memos-" + memo.id} ${memo.pinned && props.showPinnedStyle ? "pinned" : ""}`}
      ref={memoContainerRef}
      style={extraStyles}
    >
      <div className="memo-top-wrapper">
        <div className="w-full max-w-[calc(100%-20px)] flex flex-row justify-start items-center mr-1">
          {extra_logo && (
            <>
              <Tooltip title={extra_logo_tips.join(', ')} placement="top" arrow>
                <span className="text-sm">{extra_logo}</span>
              </Tooltip>
            </>
          )}
          {props.showCreator && creator && (
            <>
              <Link to={`/u/${encodeURIComponent(memo.creatorUsername)}`}>
                <Tooltip title={"Creator"} placement="top">
                  <span className="flex flex-row justify-start items-center">
                    <UserAvatar className="!w-5 !h-5 mr-1" avatarUrl={creator.avatarUrl} />
                    <span className="text-sm text-gray-600 max-w-[8em] truncate">
                      {creator.nickname || extractUsernameFromName(creator.name)}
                    </span>
                  </span>
                </Tooltip>
              </Link>
              <Icon.Dot className="w-4 h-auto text-gray-400 " />
            </>
          )}
          <span className="text-sm text-gray-400 select-none" onClick={handleEditCreateTime}>
            {displayTime}
          </span>
          {props.showPinnedStyle && memo.pinned && (
            <>
              <Icon.Dot className="w-4 h-auto text-gray-400 " />
              <Tooltip title={"Pinned"} placement="top">
                <Icon.Bookmark className="w-4 h-auto text-green-600" />
              </Tooltip>
            </>
          )}
          <div className="w-auto flex flex-row justify-between items-center">
            <Icon.Dot className="w-4 h-auto text-gray-400 " />
            <Link className="flex flex-row justify-start items-center" to={`/m/${memo.id}`}>
              <span className="text-sm text-gray-500 ">#{memo.id}</span>
            </Link>
            {props.showVisibility && memo.visibility !== "PRIVATE" && (
              <>
                <Icon.Dot className="w-4 h-auto text-gray-400 " />
                <Tooltip title={t(`memo.visibility.${memo.visibility.toLowerCase()}` as any)} placement="top">
                  <span>
                    <VisibilityIcon visibility={memo.visibility} />
                  </span>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        <div className="btns-container space-x-2">
          {!readonly && (
            <>
              <span className="btn more-action-btn">
                <Icon.MoreVertical className="icon-img" />
              </span>
              <div className="more-action-btns-wrapper">
                <div className="more-action-btns-container min-w-[6em]">
                  {!memo.parent && (
                    <span className="btn" onClick={handleTogglePinMemoBtnClick}>
                      {memo.pinned ? <Icon.BookmarkMinus className="w-4 h-auto mr-2" /> : <Icon.BookmarkPlus className="w-4 h-auto mr-2" />}
                      {memo.pinned ? t("common.unpin") : t("common.pin")}
                    </span>
                  )}
                  <span className="btn" onClick={handleEditMemoClick}>
                    <Icon.Edit3 className="w-4 h-auto mr-2" />
                    {t("common.edit")}
                  </span>
                  {!memo.parent && (
                    <span className="btn" onClick={handleMarkMemoClick}>
                      <Icon.Link className="w-4 h-auto mr-2" />
                      {t("common.mark")}
                    </span>
                  )}
                  <span className="btn" onClick={() => showShareMemoDialog(memo)}>
                    <Icon.Share className="w-4 h-auto mr-2" />
                    {t("common.share")}
                  </span>
                  <span className="btn" onClick={handleArchiveMemoClick}>
                    <Icon.Archive className="w-4 h-auto mr-2" />
                    {t("common.archive")}
                  </span>
                  <span className="btn text-red-500" onClick={handleDeleteMemoClick}>
                    <Icon.Trash className="w-4 h-auto mr-2" />
                    {t("common.delete")}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {props.showParent && memo.parent && (
        <div className="w-auto max-w-full mt-1">
          <Link
            className="px-2 py-0.5 border rounded-full max-w-xs w-auto text-xs flex flex-row justify-start items-center flex-nowrap text-gray-600 hover:shadow hover:opacity-80"
            to={`/m/${memo.parent.id}`}
          >
            <Icon.ArrowUpRightFromCircle className="w-3 h-auto shrink-0 opacity-60" />
            <span className="mx-1 opacity-60">#{memo.parent.id}</span>
            <span className="truncate">{memo.parent.content}</span>
          </Link>
        </div>
      )}
      <MemoContent
        content={memo.content}
        onMemoContentClick={handleMemoContentClick}
        onMemoContentDoubleClick={handleMemoContentDoubleClick}
      />
      <MemoResourceListView resourceList={memo.resourceList} />
      <MemoRelationListView
        memo={memo}
        relationList={referenceRelations}
      />
    </div>
  );
};

export default memo(Memo);