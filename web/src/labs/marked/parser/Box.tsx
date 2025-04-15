import { marked } from "..";
import { matcher } from "../matcher";

export const BOX_REG = /\[\[\[(.+?)\]\]\]/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, BOX_REG);
  if (!matchResult) {
    return <>{rawStr}</>;
  }

  const parsedContent = marked(matchResult[1], [], []);
  return <span className="custom-box border-2 rounded border-green-600">{parsedContent}</span>;
};

export default {
  name: "box",
  regexp: BOX_REG,
  renderer,
};