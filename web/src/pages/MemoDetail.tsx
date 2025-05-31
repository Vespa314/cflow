import { IconButton } from "@mui/joy";
import copy from "copy-to-clipboard";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/Icon";
import Memo from "@/components/Memo";
import MemoContent from "@/components/MemoContent";
import showMemoEditorDialog from "@/components/MemoEditor/MemoEditorDialog";
import MemoRelationListView from "@/components/MemoRelationListView";
import MemoResourceListView from "@/components/MemoResourceListView";
import showShareMemoDialog from "@/components/ShareMemoDialog";
import UserAvatar from "@/components/UserAvatar";
import { getDateTimeString } from "@/helpers/datetime";
import useCurrentUser from "@/hooks/useCurrentUser";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useGlobalStore, useMemoStore } from "@/store/module";
import { useUserV1Store, extractUsernameFromName } from "@/store/v1";
import { User } from "@/types/proto/api/v2/user_service";
import { useTranslate } from "@/utils/i18n";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import showPreviewImageDialog from "@/components/PreviewImageDialog";

const MemoDetail = () => {
  const t = useTranslate();
  const params = useParams();
  const navigateTo = useNavigateTo();
  const currentUser = useCurrentUser();
  const globalStore = useGlobalStore();
  const memoStore = useMemoStore();
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;
  const doubleClickEdit = userSetting?.doubleClickEdit;
  const memoContainerRef = useRef<HTMLDivElement>(null);
  const [creator, setCreator] = useState<User>();
  const { systemStatus } = globalStore.state;
  const memoId = Number(params.memoId);
  const memo = memoStore.state.memos.find((memo) => memo.id === memoId);

  const allowEdit = memo?.creatorUsername === extractUsernameFromName(currentUser?.name);

  const referenceRelations =
    memo?.relationList.filter(
      (relation) => relation.type === "REFERENCE" && (relation.memoId === memo?.id || relation.relatedMemoId === memo?.id)
    ) || [];

    const ref_Relations = memo?.relationList.filter((relation) => relation.memoId === memo.id && relation.type === "REFERENCE") || [];
    const relatedMemoList = ref_Relations
    .map((relation) => memoStore.state.memos.find((memo) => memo.id === relation.relatedMemoId))
    .filter((memo) => memo) as Memo[];

    const refed_Relations = memo?.relationList.filter((relation) => relation.relatedMemoId === memo.id && relation.type === "REFERENCE") || [];
    const relatedMemoList2 = refed_Relations
    .map((relation) => memoStore.state.memos.find((memo) => memo.id === relation.memoId))
    .filter((memo) => memo) as Memo[];

  useEffect(() => {
    if (memoId) {
      memoStore
        .fetchMemoById(memoId)
        .then(async (memo) => {
          const user = await userV1Store.getOrFetchUserByUsername(memo.creatorUsername);
          setCreator(user);
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.response.data.message);
        });
    } else {
      navigateTo("/404");
    }
  }, [memoId]);

  useEffect(() => {
    if (!memo) {
      return;
    }

    (async () => {
      const commentRelations = memo.relationList.filter((relation) => relation.relatedMemoId === memo.id);
      const requests = commentRelations.map((relation) => memoStore.fetchMemoById(relation.memoId));
      await Promise.all(requests);
      const refRelations = memo.relationList.filter((relation) => relation.memoId === memo.id);
      const requests2 = refRelations.map((relation) => memoStore.fetchMemoById(relation.relatedMemoId));
      await Promise.all(requests2);
    })();
  }, [memo?.relationList]);

  if (!memo) {
    return null;
  }

  const handleEditMemoClick = () => {
    showMemoEditorDialog({
      memoId: memo.id,
    });
  };

  const handleCopyLinkBtnClick = () => {
    copy(`${window.location.origin}/m/${memo.id}`);
    toast.success(t("message.succeed-copy-link"));
  };

  const handleMemoContentDoubleClick = (e: React.MouseEvent) => {
    if (!allowEdit) {
      return;
    }
    if (doubleClickEdit) {
      handleEditMemoClick();
    }
  }

  const handleMemoContentClick = async (e: React.MouseEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.classList.contains("todo-block")) {
      if (!allowEdit) {
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
    } else if (targetEl.tagName === "IMG") {
      const imgUrl = targetEl.getAttribute("src");
      if (imgUrl) {
        showPreviewImageDialog([imgUrl], 0);
      }
    }
  };

  return (
    <>
      <section className="relative top-0 w-full min-h-full overflow-x-hidden bg-zinc-100 dark:bg-zinc-900">
        <div className="relative w-full h-auto mx-auto flex flex-col justify-start items-center dark:bg-zinc-700">
          <div className="w-full flex flex-col justify-start items-center py-8">
            <Link className="" to={`/`}>
              <UserAvatar className="!w-20 !h-20 mb-2 drop-shadow" avatarUrl={systemStatus.customizedProfile.logoUrl} />
            </Link>
          </div>
          <div className="md:flex">
            <div className="relative flex-grow max-w-2xl lg:min-w-[720px] md:min-w-[512px] w-full min-h-full flex flex-col justify-start items-start px-4 pb-6">
              <div className="memo-wrapper" ref={memoContainerRef}>
                <div className="w-full flex flex-row justify-start items-center mr-1">
                  <UserAvatar className="!w-5 !h-5 mr-1" avatarUrl={creator?.avatarUrl} />
                  <span className="text-gray-400 max-w-[8em] truncate">{creator?.nickname}</span>
                  <Icon.Dot className="w-4 h-auto text-gray-400" />
                  <span className="text-gray-400 select-none">{getDateTimeString(memo.displayTs)}</span>
                  <Icon.Dot className="w-4 h-auto text-gray-400" />
                  <span className="text-gray-400">#{memo.id}</span>
                </div>
                <MemoContent content={memo.content} onMemoContentDoubleClick={handleMemoContentDoubleClick} onMemoContentClick={handleMemoContentClick} />
                <MemoResourceListView resourceList={memo.resourceList} />
                <MemoRelationListView memo={memo} relationList={referenceRelations}/>
              </div>
              <div className="w-full mt-4 flex flex-col sm:flex-row justify-start sm:justify-between sm:items-center gap-2">
                <div className="flex flex-row justify-start items-center">
                    <span className="flex flex-row justify-start items-center">
                      <span className="hidden user_nickname">{extractUsernameFromName(currentUser?.name)}</span>
                      <span className="hidden user_email">{currentUser?.email}</span>
                    </span>
                </div>
                <div className="flex flex-row sm:justify-end items-center">
                  {allowEdit && (
                    <>
                      <IconButton size="sm" onClick={handleEditMemoClick}>
                        <Icon.Edit3 className="w-4 h-auto text-gray-600" />
                      </IconButton>
                    </>
                  )}
                  <IconButton size="sm" onClick={handleCopyLinkBtnClick}>
                    <Icon.Link className="w-4 h-auto text-gray-600" />
                  </IconButton>
                  <IconButton size="sm" onClick={() => showShareMemoDialog(memo)}>
                    <Icon.Share className="w-4 h-auto text-gray-600 " />
                  </IconButton>
                </div>
              </div>
              {relatedMemoList.length > 0 && (
                <>
                  <p className="text-lg my-2 pl-1 opacity-50 flex flex-row items-center">
                    <Icon.ArrowRightFromLine className="w-4 h-auto mr-1" />
                    <span>引用的卡片</span>
                  </p>
                  {relatedMemoList.map((relatedMemo) => {
                    return (
                      <div key={relatedMemo.id} className="w-full">
                        <Memo memo={relatedMemo} showRelatedMemos />
                      </div>
                    );
                  })}
                </>
              )}
              {relatedMemoList2.length > 0 && (
                <>
                  <p className="text-lg my-2 pl-1 opacity-50 flex flex-row items-center">
                    <Icon.ArrowLeftToLine className="w-4 h-auto mr-1" />
                    <span>被引用的卡片</span>
                  </p>
                  {relatedMemoList2.map((relatedMemo) => {
                    return (
                      <div key={relatedMemo.id} className="w-full">
                        <Memo memo={relatedMemo} showRelatedMemos  />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div id="Comments" className="px-4 md:p-0 hidden min-w-[16rem]"></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MemoDetail;