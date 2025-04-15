export const HORIZONTAL_RULES_REG = /^-{3,}/;

export const renderer = (rawStr: string) => {
  return <hr />;
};

export default {
  name: "horizontal rules",
  regexp: HORIZONTAL_RULES_REG,
  renderer,
};
