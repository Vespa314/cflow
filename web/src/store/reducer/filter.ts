import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Duration {
  from: number;
  to: number;
}

interface State {
  tag?: string;
  duration?: Duration;
  text?: string;
  visibility?: Visibility;
  full_tag?: boolean;
  only_orphan?: boolean;
  only_todo?: boolean;
  only_unfinish?: boolean;
  only_resource?: boolean;
  only_no_resource?: boolean;
  only_ref?: boolean;
  only_refed?: boolean;
  only_tag?: boolean;
  only_no_tag?: boolean;
  only_link?: boolean;
  only_public?: boolean;
  only_private?: boolean;
}

export type Filter = State;

const filterSlice = createSlice({
  name: "filter",
  initialState: {} as State,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<State>>) => {
      if (JSON.stringify(action.payload) === state) {
        return state;
      }

      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { setFilter } = filterSlice.actions;

export default filterSlice.reducer;
