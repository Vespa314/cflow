export const HORIZONTAL_RULES_REG = /^_{3}|^-{3}|^\*{3}/;

export const renderer = (rawStr: string) => {
  return <hr />;
};

export default {
  name: "horizontal rules",
  regexp: HORIZONTAL_RULES_REG,
  renderer,
};
