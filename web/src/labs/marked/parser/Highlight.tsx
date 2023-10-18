import { matcher } from "../matcher";

export const HIGHLIGHT_REG = /==(.+?)==/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, HIGHLIGHT_REG);
  if (!matchResult) {
    return rawStr;
  }

  return <span className="highlight">{matchResult[1]}</span>;
};

export default {
  name: "Highlight",
  regexp: HIGHLIGHT_REG,
  renderer,
};
