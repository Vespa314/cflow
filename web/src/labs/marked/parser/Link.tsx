import { marked } from "..";
import { Tooltip, Box } from "@mui/joy";
import { useEffect, useState} from "react";
import { matcher } from "../matcher";
import { useMemoCacheStore } from "@/store/v1";
import MemoContent from "../../../components/MemoContent";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";

export const LINK_REG = /\[([^\]]+)\]\(([^\)]+)\)/;

interface Props {
  memo_id: string;
}

const Memo: React.FC<Props> = (props: Props) => {
  const { memo_id } = props;
  const memoCacheStore = useMemoCacheStore();
  const [memo_content, set_memo_content] = useState<string>("");

  useEffect(() => {
    const fn = async () => {
      const memo = await memoCacheStore.getOrFetchMemoById(parseInt(memo_id));
      set_memo_content(memo.content);
    };
    fn();
  }, []);

  if (!memo_content) {
    return <span className="flex flex-row">
        ...
      </span>;
  }
  return <>
    <MemoContent content={memo_content} />
  </>;
}

interface Prop {
  rawStr: string;
}


const Link: React.FC<Prop> = (props: Prop) => {
  const { rawStr } = props;
  const matchResult = matcher(rawStr, LINK_REG);
  if (!matchResult) {
    return rawStr;
  }
  const parsedContent = marked(matchResult[1], [], []);
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;
  const refPreview = userSetting?.refPreview ?? true;

  if (matchResult[2].startsWith("/m/")) {
    const memo_id = matchResult[2].split("/")[matchResult[2].split("/").length - 1]
    return (
      refPreview ? <Tooltip title={
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            maxWidth: 400,
          }}
        >
            <Memo memo_id={memo_id} />
        </Box>
      } arrow variant="outlined" color="danger" >
        <a className="cardlink" target="_blank" href={matchResult[2]}>
          {parsedContent}
        </a>
      </Tooltip> : <a className="cardlink" target="_blank" href={matchResult[2]}>
          {parsedContent}
        </a>
    );
  }
  else {
    return (
      <a className="link" target="_blank" href={matchResult[2]}>
        {parsedContent}
      </a>
    );
  }
};

export default {
  name: "link",
  regexp: LINK_REG,
  renderer: (rawStr: string) => <Link rawStr={rawStr} />,
};
