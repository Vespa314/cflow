import { tagServiceClient } from "@/grpcweb";
import * as api from "@/helpers/api";
import useCurrentUser from "@/hooks/useCurrentUser";
import store, { useAppSelector } from "..";
import { deleteTag as deleteTagAction, setTags, upsertTag as upsertTagAction, setTagsCnt } from "../reducer/tag";

export const useTagStore = () => {
  const state = useAppSelector((state) => state.tag);
  const currentUser = useCurrentUser();

  const getState = () => {
    return store.getState().tag;
  };

  const fetchTags = async () => {
    const { tags } = await tagServiceClient.listTags({
      user: currentUser.name,
    });
    store.dispatch(setTags(tags.map((tag) => tag.name)));
  };

  const fetchTagsCnt = async () => {
    const tagFind: TagFind = {};
    const { data } = await api.getTagCnt(tagFind);
    store.dispatch(setTagsCnt(data));
  };

  const upsertTag = async (tagName: string) => {
    await tagServiceClient.upsertTag({
      name: tagName,
    });
    store.dispatch(upsertTagAction(tagName));
  };

  const deleteTag = async (tagName: string) => {
    await tagServiceClient.deleteTag({
      tag: {
        name: tagName,
        creator: currentUser.name,
      },
    });
    store.dispatch(deleteTagAction(tagName));
  };

  return {
    state,
    getState,
    fetchTags,
    fetchTagsCnt,
    upsertTag,
    deleteTag,
  };
};
