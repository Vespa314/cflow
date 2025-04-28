import { inlineElementParserList, blockElementParserList } from ".";
import { marked } from "..";
import { matcher } from "../matcher";
import Icon from "../../../components/Icon";
import { useState } from "react";
export const DISCLOSURE_BLOCK_REG = /^%%%([^\n]+)\n([\s\S]*?\n)%%%/;

interface Props {
  rawStr: string;
}

const OpenBlock: React.FC<Props> = (props: Props) => {
  const { rawStr } = props;
  const [is_open, setIsOpen] = useState(false);
  const matchResult = matcher(rawStr, DISCLOSURE_BLOCK_REG);
  if (!matchResult) {
    return <>{rawStr}</>;
  }
  const parsedContent = marked(matchResult[2], blockElementParserList, inlineElementParserList);
  return (
        <>
          <div className="disclosure_block flex w-full rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 focus:outline-none focus-visible:ring focus-visible:ring-purple-500/75">
            <Icon.ChevronRight
              className={`${is_open ? 'rotate-90' : ''}`}
              onClick={() => setIsOpen(!is_open)}
            />
            <span>{matchResult[1]}</span>
          </div>
          {is_open && (<div>
            {parsedContent}
          </div>)
          }
        </>
  );
};

export default {
  name: "disclosure",
  regexp: DISCLOSURE_BLOCK_REG,
  renderer: (rawStr: string) => <OpenBlock rawStr={rawStr} />,
};
