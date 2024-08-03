import { matcher } from "../matcher";

export const SUB_REG = /~(.+)~/;

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, SUB_REG);
  if (!matchResult) {
    return rawStr;
  }
  return <sub>{matchResult[1]}</sub>;
};

export default {
  name: "sub",
  regexp: SUB_REG,
  renderer,
};
