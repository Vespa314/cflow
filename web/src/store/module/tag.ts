import * as api from "@/helpers/api";
import store, { useAppSelector } from "..";
import { deleteTag, setTags, upsertTag, setTagsCnt } from "../reducer/tag";

export const useTagStore = () => {
  const state = useAppSelector((state) => state.tag);

  return {
    state,
    getState: () => {
      return store.getState().tag;
    },
    fetchTags: async () => {
      const { data } = await api.getTagList();
      store.dispatch(setTags(data));
    },
    fetchTagsCnt: async () => {
      const tagFind: TagFind = {};
      const { data } = await api.getTagCnt(tagFind);
      store.dispatch(setTagsCnt(data));
    },
    upsertTag: async (tagName: string) => {
      await api.upsertTag(tagName);
      store.dispatch(upsertTag(tagName));
    },
    deleteTag: async (tagName: string) => {
      await api.deleteTag(tagName);
      store.dispatch(deleteTag(tagName));
    },
  };
};
