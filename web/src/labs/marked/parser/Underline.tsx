import { marked } from "..";
import { matcher } from "../matcher";
export const UNDERLINE_REG = /___(.+?)___/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, UNDERLINE_REG);
  if (!matchResult) {
    return <>{rawStr}</>;
  }

  const parsedContent = marked(matchResult[1], [], []);
  return <u>{parsedContent}</u>;
};

export default {
  name: "underline",
  regexp: UNDERLINE_REG,
  renderer,
};