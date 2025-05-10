import { marked } from "..";
import { matcher } from "../matcher";
import classNames from "classnames";
import PlainText from "./PlainText";
import { useState } from "react";

export const SPOLIER_REG = /\|\|(.+?)\|\|/;

interface Props {
    rawStr: string;
}

const Spoiler: React.FC<Props> = (props: Props) => {
    const { rawStr } = props;
    const matchResult = matcher(rawStr, SPOLIER_REG);
    if (!matchResult) {
      return <>{rawStr}</>;
    }

    const [isRevealed, setIsRevealed] = useState(false);

    const parsedContent = marked(matchResult[1], [], [PlainText]);

    return (
      <span
        className={classNames("inline cursor-pointer", isRevealed ? "" : "bg-gray-200")}
        onClick={() => setIsRevealed(!isRevealed)}
      >
        <span className={classNames(isRevealed ? "opacity-100" : "opacity-0")}>{parsedContent}</span>
      </span>
    );
};

export default {
  name: "spoiler",
  regexp: SPOLIER_REG,
  renderer: (rawStr: string) => <Spoiler rawStr={rawStr} />,
};
