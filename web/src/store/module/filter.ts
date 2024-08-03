import store, { useAppSelector } from "..";
import { Filter, setFilter } from "../reducer/filter";

export const useFilterStore = () => {
  const state = useAppSelector((state) => state.filter);

  return {
    state,
    getState: () => {
      return store.getState().filter;
    },
    setFilter: (filter: Filter) => {
      store.dispatch(setFilter(filter));
    },
    clearFilter: () => {
      store.dispatch(
        setFilter({
          tag: undefined,
          duration: undefined,
          text: undefined,
          visibility: undefined,
          full_tag: true,
          only_orphan: false,
          only_todo: false,
          only_unfinish: false,
          only_resource: false,
          only_no_resource: false,
          only_ref: false,
          only_refed: false,
          only_tag: false,
          only_no_tag: false,
          only_link: false,
          only_private: false,
          only_public: false,
        })
      );
    },
    toggleTagMode: () => {
      store.dispatch(
        setFilter({
          full_tag: !state.full_tag,
        })
      );
    },
    setTagMode: (check: boolean) => {
      store.dispatch(
        setFilter({
          full_tag: check,
        })
      );
    },
    setOrphan: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_orphan: check,
        })
      );
    },
    setTodo: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_todo: check,
        })
      );
    },
    setLink: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_link: check,
        })
      );
    },
    setPublic: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_public: check,
        })
      );
    },
    setPrivate: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_private: check,
        })
      );
    },
    setUnfinish: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_unfinish: check,
        })
      );
    },
    setResource: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_resource: check,
        })
      );
    },
    setNoResource: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_no_resource: check,
        })
      );
    },
    setRef: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_ref: check,
        })
      );
    },
    setReded: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_refed: check,
        })
      );
    },
    setTag: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_tag: check,
        })
      );
    },
    setNoTag: (check: boolean) => {
      store.dispatch(
        setFilter({
          only_no_tag: check,
        })
      );
    },
    setTextFilter: (text?: string) => {
      store.dispatch(
        setFilter({
          text: text,
        })
      );
    },
    setTagFilter: (tag?: string) => {
      store.dispatch(
        setFilter({
          tag: tag,
        })
      );
    },
    setFromAndToFilter: (from?: number, to?: number) => {
      let duration = undefined;
      if (from && to && from < to) {
        duration = {
          from,
          to,
        };
      }
      store.dispatch(
        setFilter({
          duration,
        })
      );
    },
    setMemoVisibilityFilter: (visibility?: Visibility) => {
      store.dispatch(
        setFilter({
          visibility: visibility,
        })
      );
    },
  };
};
