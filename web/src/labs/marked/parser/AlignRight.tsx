import { marked } from "..";
import { matcher } from "../matcher";
import { inlineElementParserList } from ".";

export const ALIGN_Right_REG = /^>>> *([^\n]+)/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, ALIGN_Right_REG);
  if (!matchResult) {
    return rawStr;
  }

  const parsedContent = marked(matchResult[1], [], inlineElementParserList);
  return <p className="text-right">{parsedContent}</p>;
};

export default {
  name: "align right",
  regexp: ALIGN_Right_REG,
  renderer,
};