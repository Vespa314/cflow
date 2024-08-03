import { create } from "zustand";
import { combine } from "zustand/middleware";
import * as api from "@/helpers/api";
import { convertResponseModelMemo } from "../module";
import { AxiosResponse } from "axios";

export const useMemoCacheStore = create(
  combine({ memoById: new Map<MemoId, Memo>(), requestById: new Map<MemoId, Promise<AxiosResponse<Memo, any>>>() }, (set, get) => ({
    getState: () => get(),
    getOrFetchMemoById: async (memoId: MemoId) => {
      const memo = get().memoById.get(memoId);
      if (memo) {
        // console.log("get", memoId, "from cache")
        return memo;
      }
      const exist_request = get().requestById.get(memoId);
      let request: Promise<AxiosResponse<Memo, any>> = Promise.resolve({} as AxiosResponse<Memo, any>);
      if (exist_request) {
        // console.log("get", memoId, "from exist request...")
        request = exist_request;
      }
      else {
        request = api.getMemoById(memoId)
        // console.log("get", memoId, "from api...")
        set((state) => {
          state.requestById.set(memoId, request);
          return state;
        });

      }
      const { data } = await request;
      const formatedMemo = convertResponseModelMemo(data);

      set((state) => {
        state.memoById.set(memoId, formatedMemo);
        state.requestById.delete(memoId);
        return state;
      });

      return formatedMemo;
    },
    getMemoById: (memoId: MemoId) => {
      return get().memoById.get(memoId);
    },
    setMemoCache: (memo: Memo) => {
      set((state) => {
        state.memoById.set(memo.id, memo);
        return state;
      });
    },
    deleteMemoCache: (memoId: MemoId) => {
      set((state) => {
        state.memoById.delete(memoId);
        return state;
      });
    },
  }))
);
