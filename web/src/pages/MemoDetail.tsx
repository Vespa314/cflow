import { Divider, Select, Tooltip, Option, IconButton } from "@mui/joy";
import copy from "copy-to-clipboard";
import { toLower } from "lodash-es";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import FloatingNavButton from "@/components/FloatingNavButton";
import Icon from "@/components/Icon";
import Memo from "@/components/Memo";
import MemoContent from "@/components/MemoContent";
import MemoRelationListView from "@/components/MemoRelationListView";
import MemoResourceListView from "@/components/MemoResourceListView";
import showShareMemoDialog from "@/components/ShareMemoDialog";
import UserAvatar from "@/components/UserAvatar";
import { VISIBILITY_SELECTOR_ITEMS } from "@/helpers/consts";
import { getDateTimeString } from "@/helpers/datetime";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useMemoStore } from "@/store/module";
import { useUserV1Store } from "@/store/v1";
import { User } from "@/types/proto/api/v2/user_service";
import { useTranslate } from "@/utils/i18n";

const MemoDetail = () => {
  const params = useParams();
  const navigateTo = useNavigateTo();
  const t = useTranslate();
  const memoStore = useMemoStore();
  const userV1Store = useUserV1Store();
  const [user, setUser] = useState<User>();
  const memoId = Number(params.memoId);
  const memo = memoStore.state.memos.find((memo) => memo.id === memoId);

  useEffect(() => {
    if (memoId && !isNaN(memoId)) {
      memoStore
        .fetchMemoById(memoId)
        .then(async (memo) => {
          const user = await userV1Store.getOrFetchUserByUsername(memo.creatorUsername);
          setUser(user);
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.response.data.message);
        });
    } else {
      navigateTo("/404");
    }
  }, [memoId]);

  if (!memo) {
    return null;
  }

  return (
    <>
      <section className="relative top-0 w-full min-h-full overflow-x-hidden bg-zinc-100 dark:bg-zinc-800">
        <div className="relative w-full min-h-full mx-auto flex flex-col justify-start items-center pb-6">
          <div className="w-full flex flex-col justify-start items-center py-8">
            <UserAvatar className="!w-20 h-auto mb-4 drop-shadow" avatarUrl={user?.avatarUrl} />
            <div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{user?.nickname}</p>
            </div>

          </div>
          <div className="md:flex">
            <div className="relative flex-grow max-w-3xl w-full min-h-full flex flex-col justify-start items-start px-4">
              <Memo memo={memo} showRelatedMemos />
            </div>
            <div id="Comments" className="md:max-w-xs px-4 md:p-0 hidden"></div>
          </div>
        </div>
    </section>
      <FloatingNavButton />
    </>
  );
};

export default MemoDetail;
