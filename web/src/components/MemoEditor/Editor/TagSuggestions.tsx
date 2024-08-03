import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import getCaretCoordinates from "textarea-caret";
import OverflowTip from "@/components/kit/OverflowTip";
import { useTagStore } from "@/store/module";
import { EditorRefActions } from ".";
import pinyin from "pinyin";

type Props = {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  editorActions: React.ForwardedRef<EditorRefActions>;
};

type Position = { left: number; top: number; height: number };

function getPinyin(chineseText: string): string {
  const pinyinArray = pinyin(chineseText, {style: pinyin.STYLE_NORMAL});
  return pinyinArray.flat().join('');
}

function getpinyinDict(tags: string[]): Record<string, string> {
    const py_dict: Record<string, string> = {}
    tags.forEach(tag => {
      py_dict[tag] = getPinyin(tag);
    });
    return py_dict;
}


const TagSuggestions = ({ editorRef, editorActions }: Props) => {
  const [position, setPosition] = useState<Position | null>(null);
  const hide = () => setPosition(null);

  const { state } = useTagStore();
  const tagsRef = useRef(state.tags);
  tagsRef.current = state.tags;

  const [selected, select] = useState(0);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [pinyin_dict, setPinyinDict] = useState<Record<string, string>>({});

  useEffect(() => {
    setPinyinDict(getpinyinDict(state.tags));
  }, [state.tags]);


  const getCurrentWord = (): [word: string, startIndex: number] => {
    const editor = editorRef.current;
    if (!editor) return ["", 0];
    const cursorPos = editor.selectionEnd;
    const before = editor.value.slice(0, cursorPos).match(/#[^ \n]*$/) || { 0: "", index: cursorPos };
    return [before[0], before.index ?? cursorPos];
  };


  const suggestionsRef = useRef<string[]>([]);
  suggestionsRef.current = (() => {
    const input = getCurrentWord()[0].slice(1).toLowerCase();

    const score = (tag: string, input: string) => {
      const tagLowerCase = tag.toLowerCase();
      const inputLowerCase = input.toLowerCase();
      for (let i = 0; i < tagLowerCase.length; i++) {
        if (tagLowerCase[i] !== inputLowerCase[i]) {
          return i;
        }
      }
      return tagLowerCase.length;
    }

    const customMatches = (tag: string, input: string) => {
      const tagLowerCase = tag.toLowerCase();
      const inputLowerCase = input.toLowerCase();
      let inputIndex = 0;

      for (let i = 0; i < tagLowerCase.length; i++) {
        if (tagLowerCase[i] === inputLowerCase[inputIndex]) {
          inputIndex++;
          if (inputIndex === inputLowerCase.length) {
            return true;
          }
        }
      }
      if (input.length > 0 && pinyin_dict[tag] && pinyin_dict[tag].includes(input.toLowerCase().replace("'", ""))) {
        return true;
      }
      return false;
    };

    return tagsRef.current.filter((tag) => customMatches(tag, input)).sort((a, b) => {
      const s1 = score(a, input)
      const s2 = score(b, input)
      if( s1 == s2 ){
        return a.length - b.length;
      }
      return s1 > s2 ? -1 : 1;
    })
  })();

  const isVisibleRef = useRef(false);
  isVisibleRef.current = !!(position && suggestionsRef.current.length > 0);

  const autocomplete = (tag: string) => {
    if (!editorActions || !("current" in editorActions) || !editorActions.current) return;
    const [word, index] = getCurrentWord();
    editorActions.current.removeText(index, word.length);
    editorActions.current.insertText(`#${tag} `);
    hide();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisibleRef.current) return;
    const suggestions = suggestionsRef.current;
    const selected = selectedRef.current;
    if (["Escape", "ArrowLeft", "ArrowRight"].includes(e.code)) hide();
    if ("ArrowDown" === e.code) {
      select((selected + 1) % suggestions.length);
      e.preventDefault();
      e.stopPropagation();
    }
    if ("ArrowUp" === e.code) {
      select((selected - 1 + suggestions.length) % suggestions.length);
      e.preventDefault();
      e.stopPropagation();
    }
    if (["Enter", "Tab"].includes(e.code)) {
      autocomplete(suggestions[selected]);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    select(0);
    const [word, index] = getCurrentWord();
    const isActive = word.startsWith("#") && !word.slice(1).includes("#");
    isActive ? setPosition(getCaretCoordinates(editorRef.current, index)) : hide();
  };

  const listenersAreRegisteredRef = useRef(false);
  const registerListeners = () => {
    const editor = editorRef.current;
    if (!editor || listenersAreRegisteredRef.current) return;
    editor.addEventListener("click", hide);
    editor.addEventListener("blur", hide);
    editor.addEventListener("keydown", handleKeyDown);
    editor.addEventListener("input", handleInput);
    listenersAreRegisteredRef.current = true;
  };
  useEffect(registerListeners, [!!editorRef.current]);

  if (!isVisibleRef.current || !position) return null;
  return (
    <div
      className="z-20 p-1 mt-1 -ml-2 absolute rounded font-mono shadow bg-zinc-200 dark:bg-zinc-600"
      style={{ left: position.left, top: position.top + position.height }}
    >
      {suggestionsRef.current.map((tag, i) => (
        <div
          key={tag}
          onMouseDown={() => autocomplete(tag)}
          className={classNames(
            "rounded p-1 px-2 w-full truncate text-sm cursor-pointer hover:bg-zinc-300",
            i === selected ? "bg-zinc-300" : ""
          )}
        >
          <OverflowTip>#{tag}</OverflowTip>
        </div>
      ))}
    </div>
  );
};

export default TagSuggestions;