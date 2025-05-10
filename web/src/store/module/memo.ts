import { omit } from "lodash-es";
import * as api from "@/helpers/api";
import { DEFAULT_MEMO_LIMIT } from "@/helpers/consts";
import store, { useAppSelector } from "../";
import { updateLoadingStatus, createMemo, deleteMemo, patchMemo, upsertMemos, LoadingStatus } from "../reducer/memo";
import { useMemoCacheStore } from "../v1";

export const convertResponseModelMemo = (memo: Memo): Memo => {
  return {
    ...memo,
    createdTs: memo.createdTs * 1000,
    updatedTs: memo.updatedTs * 1000,
    displayTs: memo.displayTs * 1000,
  };
};


export const convertTagSuggestionResp = (resp: Record<string, number>) => {
  const tags = Object.keys(resp);
  return tags.map((tag) => {
    return {
      tag: tag,
      sim: resp[tag],
    };
  }).sort((a, b) => b.sim - a.sim);;
}

export const useMemoStore = () => {
  const state = useAppSelector((state) => state.memo);
  const memoCacheStore = useMemoCacheStore();

  const fetchMemoById = async (memoId: MemoId) => {
    const { data } = await api.getMemoById(memoId);
    const memo = convertResponseModelMemo(data);
    store.dispatch(upsertMemos([memo]));
    return memo;
  };

  return {
    state,
    getState: () => {
      return store.getState().memo;
    },
    fetchMemos: async (username = "", limit = DEFAULT_MEMO_LIMIT, offset = 0) => {
      const memoFind: MemoFind = {
        rowStatus: "NORMAL",
        limit,
        offset,
      };
      if (username) {
        memoFind.creatorUsername = username;
      }

      store.dispatch(updateLoadingStatus("fetching"));
      const { data } = await api.getMemoList(memoFind);
      const fetchedMemos = data.map((m) => convertResponseModelMemo(m));
      store.dispatch(upsertMemos(fetchedMemos));
      store.dispatch(updateLoadingStatus(fetchedMemos.length === limit ? "incomplete" : "complete"));

      for (const m of fetchedMemos) {
        memoCacheStore.setMemoCache(m);
      }

      return fetchedMemos;
    },
    fetchAllMemos: async (limit = DEFAULT_MEMO_LIMIT, offset?: number) => {
      const memoFind: MemoFind = {
        rowStatus: "NORMAL",
        limit,
        offset,
      };

      store.dispatch(updateLoadingStatus("fetching"));
      const { data } = await api.getAllMemos(memoFind);
      const fetchedMemos = data.map((m) => convertResponseModelMemo(m));
      store.dispatch(upsertMemos(fetchedMemos));
      store.dispatch(updateLoadingStatus(fetchedMemos.length === limit ? "incomplete" : "complete"));

      for (const m of fetchedMemos) {
        memoCacheStore.setMemoCache(m);
      }

      return fetchedMemos;
    },
    fetchArchivedMemos: async () => {
      const memoFind: MemoFind = {
        rowStatus: "ARCHIVED",
      };
      const { data } = await api.getMemoList(memoFind);
      const archivedMemos = data.map((m) => {
        return convertResponseModelMemo(m);
      });
      return archivedMemos;
    },
    setLoadingStatus: (status: LoadingStatus) => {
      store.dispatch(updateLoadingStatus(status));
    },
    fetchMemoById,
    getMemoById: async (memoId: MemoId) => {
      for (const m of state.memos) {
        if (m.id === memoId) {
          return m;
        }
      }

      return await fetchMemoById(memoId);
    },
    getLinkedMemos: async (memoId: MemoId): Promise<Memo[]> => {
      const regex = new RegExp(`[@(.+?)](${memoId})`);
      return state.memos.filter((m) => m.content.match(regex));
    },
    createMemo: async (memoCreate: MemoCreate) => {
      const { data } = await api.createMemo(memoCreate);
      const memo = convertResponseModelMemo(data);
      store.dispatch(createMemo(memo));
      memoCacheStore.setMemoCache(memo);
      return memo;
    },
    patchMemo: async (memoPatch: MemoPatch): Promise<Memo> => {
      const { data } = await api.patchMemo(memoPatch);
      const memo = convertResponseModelMemo(data);
      store.dispatch(patchMemo(omit(memo, "pinned")));
      memoCacheStore.setMemoCache(memo);
      localStorage.removeItem("memo-editor-" + memo.id.toString());
      return memo;
    },
    pinMemo: async (memoId: MemoId) => {
      await api.pinMemo(memoId);
      store.dispatch(
        patchMemo({
          id: memoId,
          pinned: true,
        })
      );
    },
    unpinMemo: async (memoId: MemoId) => {
      await api.unpinMemo(memoId);
      store.dispatch(
        patchMemo({
          id: memoId,
          pinned: false,
        })
      );
    },
    deleteMemoById: async (memoId: MemoId) => {
      await api.deleteMemo(memoId);
      store.dispatch(deleteMemo(memoId));
      memoCacheStore.deleteMemoCache(memoId);
    },
  };
};
