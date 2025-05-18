import copy from "copy-to-clipboard";
import hljs from "highlight.js";
import { matcher } from "../matcher";
import MermaidBlock from "./MermaidBlock";

export const CODE_BLOCK_REG = /^```(\S*?)\s([\s\S]*?\n)```/;
const MERMAID_LANGUAGE = "mermaid";

const renderer = (rawStr: string) => {
  const matchResult = matcher(rawStr, CODE_BLOCK_REG);
  if (!matchResult) {
    return <>{rawStr}</>;
  }

  const language = matchResult[1] || "plaintext";
  if (language === MERMAID_LANGUAGE) {
    return <MermaidBlock content={matchResult[2]} />;
  } else if (language === "__html") {
    return <div dangerouslySetInnerHTML={{ __html: matchResult[2] }} />;
  }
  let highlightedCode = hljs.highlightAuto(matchResult[2]).value;

  try {
    const temp = hljs.highlight(matchResult[2], {
      language,
    }).value;
    highlightedCode = temp;
  } catch (error) {
  }

  const handleCopyButtonClick = () => {
    copy(matchResult[2]);
  };

  return (
    <pre className="group block-code">
      <button
        className="code-language mr-1 mt-1 text-xs font-mono absolute top-0 right-0 px-2 leading-6 border btn-text rounded-lg "
        onClick={handleCopyButtonClick}
      >
        copy
      </button>
      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }}></code>
    </pre>
  );
};

export default {
  name: "code block",
  regexp: CODE_BLOCK_REG,
  renderer,
};
