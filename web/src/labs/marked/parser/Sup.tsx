import { matcher } from "../matcher";

export const SUP_REG = /\^(.+)\^/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, SUP_REG);
  if (!matchResult) {
    return rawStr;
  }
  return <sup>{matchResult[1]}</sup>;
};

export default {
  name: "sup",
  regexp: SUP_REG,
  renderer,
};
