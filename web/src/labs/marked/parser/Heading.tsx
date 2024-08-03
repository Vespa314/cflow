import { marked } from "..";
import { matcher } from "../matcher";

export const HEADING_REG = /^(#+) ([^\n]+)*/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, HEADING_REG);
  if (!matchResult) {
    return rawStr;
  }

  const level = matchResult[1].length;
  const parsedContent = marked(matchResult[2], [], []);
  if (level === 1) {
    return <h1>{parsedContent}</h1>;
  } else if (level === 2) {
    return <h2>{parsedContent}</h2>;
  } else if (level === 3) {
    return <h3>{parsedContent}</h3>;
  } else if (level === 4) {
    return <h4>{parsedContent}</h4>;
  } else {
    return <h5>{parsedContent}</h5>;
  }
};

export default {
  name: "heading",
  regexp: HEADING_REG,
  renderer,
};
