import classNames from "classnames";
import { forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import TagSuggestions from "./TagSuggestions";

export interface EditorRefActions {
  focus: FunctionType;
  blur: FunctionType;
  scrollToCursor: FunctionType;
  insertText: (text: string, prefix?: string, suffix?: string) => void;
  removeText: (start: number, length: number) => void;
  setContent: (text: string) => void;
  getContent: () => string;
  getSelectedContent: () => string;
  setSelectedContent: (startPos: number, endPos?: number) => void;
  getCursorPosition: () => number;
  setCursorPosition: (startPos: number, endPos?: number) => void;
  getCursorLineNumber: () => number;
  getLine: (lineNumber: number) => string;
  setLine: (lineNumber: number, text: string) => void;
}

interface Props {
  className: string;
  initialContent: string;
  placeholder: string;
  tools?: ReactNode;
  fullscreen: boolean;
  onContentChange: (content: string) => void;
  onPaste: (event: React.ClipboardEvent) => void;
}

const Editor = forwardRef(function Editor(props: Props, ref: React.ForwardedRef<EditorRefActions>) {
  const { className, initialContent, placeholder, fullscreen, onPaste, onContentChange: handleContentChangeCallback } = props;
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.value = initialContent;
      handleContentChangeCallback(initialContent);
    }
  }, []);

  useEffect(() => {
  }, [editorRef.current?.value, fullscreen]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }
    const parent = editorRef.current?.parentElement;
    if (!parent) {
      return;
    }
  }, [fullscreen]);


  const updateEditorHeight = () => {
    if (editorRef.current) {
      editorRef.current.style.height = "auto";
      editorRef.current.style.height = (editorRef.current.scrollHeight ?? 0) + "px";
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      blur: () => {
        editorRef.current?.blur();
      },
      scrollToCursor: () => {
        if (editorRef.current) {
          editorRef.current.scrollTop = editorRef.current.scrollHeight;
        }
      },
      insertText: (content = "", prefix = "", suffix = "") => {
        if (!editorRef.current) {
          return;
        }

        const cursorPosition = editorRef.current.selectionStart;
        const endPosition = editorRef.current.selectionEnd;
        const prevValue = editorRef.current.value;
        const value =
          prevValue.slice(0, cursorPosition) +
          prefix +
          (content || prevValue.slice(cursorPosition, endPosition)) +
          suffix +
          prevValue.slice(endPosition);

        editorRef.current.value = value;
        editorRef.current.focus();
        editorRef.current.selectionEnd = endPosition + prefix.length + content.length;
        handleContentChangeCallback(editorRef.current.value);
        updateEditorHeight();
      },
      removeText: (start: number, length: number) => {
        if (!editorRef.current) {
          return;
        }

        const prevValue = editorRef.current.value;
        const value = prevValue.slice(0, start) + prevValue.slice(start + length);
        editorRef.current.value = value;
        editorRef.current.focus();
        editorRef.current.selectionEnd = start;
        handleContentChangeCallback(editorRef.current.value);
        updateEditorHeight();
      },
      setContent: (text: string) => {
        if (editorRef.current) {
          editorRef.current.value = text;
          handleContentChangeCallback(editorRef.current.value);
          updateEditorHeight();
        }
      },
      getContent: (): string => {
        return editorRef.current?.value ?? "";
      },
      getCursorPosition: (): number => {
        return editorRef.current?.selectionStart ?? 0;
      },
      getSelectedContent: () => {
        const start = editorRef.current?.selectionStart;
        const end = editorRef.current?.selectionEnd;
        return editorRef.current?.value.slice(start, end) ?? "";
      },
      setSelectedContent: (startPos: number, endPos?: number) => {
        const _endPos = isNaN(endPos as number) ? startPos : (endPos as number);
        editorRef.current?.setSelectionRange(startPos, _endPos);
      },
      setCursorPosition: (startPos: number, endPos?: number) => {
        const _endPos = isNaN(endPos as number) ? startPos : (endPos as number);
        editorRef.current?.setSelectionRange(startPos, _endPos);
      },
      getCursorLineNumber: () => {
        const cursorPosition = editorRef.current?.selectionStart ?? 0;
        const lines = editorRef.current?.value.slice(0, cursorPosition).split("\n") ?? [];
        return lines.length - 1;
      },
      getLine: (lineNumber: number) => {
        return editorRef.current?.value.split("\n")[lineNumber] ?? "";
      },
      setLine: (lineNumber: number, text: string) => {
        const lines = editorRef.current?.value.split("\n") ?? [];
        lines[lineNumber] = text;
        if (editorRef.current) {
          editorRef.current.value = lines.join("\n");
          editorRef.current.focus();
          handleContentChangeCallback(editorRef.current.value);
          updateEditorHeight();
        }
      },
    }),
    []
  );

  const handleEditorInput = useCallback(() => {
    handleContentChangeCallback(editorRef.current?.value ?? "");
    updateEditorHeight();
  }, []);

  return (
    <div className={classNames("flex flex-col justify-start items-start relative w-full h-auto bg-inherit dark:text-gray-200", className)}>
      <textarea
        className="w-full h-full my-1 text-base resize-none overflow-x-hidden overflow-y-auto bg-transparent outline-none whitespace-pre-wrap word-break"
        style={{ maxHeight: '600px' }}
        rows={1}
        placeholder={placeholder}
        ref={editorRef}
        onPaste={onPaste}
        onInput={handleEditorInput}
      ></textarea>
      <TagSuggestions editorRef={editorRef} editorActions={ref} />
    </div>
  );
});

export default Editor;
