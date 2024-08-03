import mermaid from "mermaid";
import { useEffect, useRef } from "react";

interface Props {
  content: string;
}

const MermaidBlock: React.FC<Props> = ({ content }: Props) => {
  const mermaidDockBlock = useRef<null>(null);

  useEffect(() => {
    if (!mermaidDockBlock.current) {
      return;
    }

    mermaid.run({
      nodes: [mermaidDockBlock.current],
    });
  });

  return (
    <pre ref={mermaidDockBlock} dangerouslySetInnerHTML={{ __html: content }}></pre>
  );
};

export default MermaidBlock;
