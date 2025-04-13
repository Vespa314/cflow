import { matcher } from "../matcher";

export const TAG_REG = /#([^\s#]+)/;

interface Props {
  rawStr: string;
}

const CTag: React.FC<Props> = (props: Props) => {
  const { rawStr } = props;
  const matchResult = matcher(rawStr, TAG_REG);
  if (!matchResult) {
    return rawStr;
  }
  return <span className="tag-span">#{matchResult[1]}</span>;
};

export default {
  name: "tag",
  regexp: TAG_REG,
  renderer: (rawStr: string) => <CTag rawStr={rawStr} />,
};
