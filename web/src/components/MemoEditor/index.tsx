import { isNumber, last, uniq } from "lodash-es";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { upsertMemoResource } from "@/helpers/api";
import { TAB_SPACE_WIDTH, UNKNOWN_ID } from "@/helpers/consts";
import { clearContentQueryParam } from "@/helpers/utils";
import { getMatchedNodes } from "@/labs/marked";
import { useFilterStore, useGlobalStore, useMemoStore, useResourceStore, useTagStore, useUserStore } from "@/store/module";
import { Resource } from "@/types/proto/api/v2/resource_service";
import { useTranslate } from "@/utils/i18n";
import showCreateResourceDialog from "../CreateResourceDialog";
import Icon from "../Icon";
import MemoVisibilitySelector from "./ActionButton/MemoVisibilitySelector";
import TagSelector from "./ActionButton/TagSelector";
import Editor, { EditorRefActions } from "./Editor";
import RelationListView from "./RelationListView";
import ResourceListView from "./ResourceListView";
import "@/less/memo-editor.less";

const listItemSymbolList = ["- [ ] ", "- [x] ", "- [X] ", "* ", "- "];
const emptyOlReg = /^(\d+)\. $/;
const listItemReg = /^( *)([-|\*]) (.*)/;

interface Props {
  className?: string;
  memoId?: MemoId;
  relationList?: MemoRelation[];
  onConfirm?: () => void;
}

interface State {
  memoVisibility: Visibility;
  resourceList: Resource[];
  relationList: MemoRelation[];
  isUploadingResource: boolean;
  isRequesting: boolean;
}


function calculateCursorLinePosition(lines: string[], n: number): number {
  let totalCursor = 0;

  for (let i = 0; i < lines.length; i++) {
      totalCursor += lines[i].length + 1; // 1 represents the length of the newline character '\n'

      if (totalCursor > n) {
          return i;
      }
  }

  return lines.length; // If the cursor is beyond the last line, return the total number of lines + 1
}

function findFirstPipeLine(lines: string[], currentLine: number): number {

  // 循环从当前行开始往回找
  let last_line = -1
  for (let i = currentLine; i >= 0; i--) {
    const line = lines[i].trim();

    if (!line.endsWith('|')) {
      return last_line
    }
    last_line = i
    if( i == 0) {
      return 0
    }
  }

  return -1; // 如果没有找到以“|”结尾的行，则返回 -1
}


const MemoEditor = (props: Props) => {
  const { className, memoId, onConfirm } = props;
  const { i18n } = useTranslation();
  const t = useTranslate();
  const [contentCache, setContentCache] = useLocalStorage<string>(`memo-editor-${props.memoId || "0"}`, "");
  const {
    state: { systemStatus },
  } = useGlobalStore();
  const userStore = useUserStore();
  const filterStore = useFilterStore();
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const resourceStore = useResourceStore();

  const [state, setState] = useState<State>({
    memoVisibility: "PRIVATE",
    resourceList: [],
    relationList: props.relationList ?? [],
    isUploadingResource: false,
    isRequesting: false,
  });
  const [hasContent, setHasContent] = useState<boolean>(false);
  const [isInIME, setIsInIME] = useState(false);
  const editorRef = useRef<EditorRefActions>(null);
  const user = userStore.state.user as User;
  const setting = user.setting;

  useEffect(() => {
    editorRef.current?.setContent(contentCache || "");
  }, []);

  useEffect(() => {
    let visibility = setting.memoVisibility;
    if (systemStatus.disablePublicMemos && visibility === "PUBLIC") {
      visibility = "PRIVATE";
    }
    setState((prevState) => ({
      ...prevState,
      memoVisibility: visibility,
    }));
  }, [setting.memoVisibility, systemStatus.disablePublicMemos]);

  useEffect(() => {
    if (memoId) {
      memoStore.getMemoById(memoId ?? UNKNOWN_ID).then((memo) => {
        if (memo) {
          handleEditorFocus();
          setState((prevState) => ({
            ...prevState,
            memoVisibility: memo.visibility,
            resourceList: memo.resourceList,
            relationList: memo.relationList,
          }));
          if (!contentCache) {
            editorRef.current?.setContent(memo.content ?? "");
          }
        }
      });
    }
  }, [memoId]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!editorRef.current) {
      return;
    }

    const isMetaKey = event.ctrlKey || event.metaKey;
    if (isMetaKey) {
      if (event.key === "Enter") {
        handleSaveBtnClick();
        return;
      }
    }
    if (event.key === "Enter" && !isInIME) {
      const cursorPosition = editorRef.current.getCursorPosition();
      const contentBeforeCursor = editorRef.current.getContent().slice(0, cursorPosition);
      const rowValue = last(contentBeforeCursor.split("\n"));
      if (rowValue) {
        if (listItemSymbolList.includes(rowValue) || emptyOlReg.test(rowValue)) {
          event.preventDefault();
          editorRef.current.removeText(cursorPosition - rowValue.length, rowValue.length);
        } else {
          // unordered/todo list
          let matched = false;
          for (const listItemSymbol of listItemSymbolList) {
            if (rowValue.startsWith(listItemSymbol)) {
              event.preventDefault();
              editorRef.current.insertText("", `\n${listItemSymbol}`);
              matched = true;
              break;
            }
          }

          if (!matched) {
            // ordered list
            const olMatchRes = /^(\d+)\. /.exec(rowValue);
            if (olMatchRes) {
              const order = parseInt(olMatchRes[1]);
              if (isNumber(order)) {
                event.preventDefault();
                editorRef.current.insertText("", `\n${order + 1}. `);
              }
            }
          }
          if (!matched) {
            const indent_list_match = listItemReg.exec(rowValue);
            if (indent_list_match) {
              event.preventDefault();
              const spaces = indent_list_match[1];
              const symbol = indent_list_match[2];
              const content = indent_list_match[3];
              if (content.length != 0){
                editorRef.current.insertText("", `\n${spaces}${symbol} `);
              }
              else if (rowValue) {
                editorRef.current.removeText(cursorPosition - rowValue.length, rowValue.length);
              }
            }
          }
        }
      }
      return;
    }
    if (event.key === "Tab") {
      const tabSpace = " ".repeat(TAB_SPACE_WIDTH);
      const cursorPosition = editorRef.current.getCursorPosition();
      const contentBeforeCursor = editorRef.current.getContent().slice(0, cursorPosition);
      const rowValue = last(contentBeforeCursor.split("\n"));
      if(event.shiftKey) {
        if (rowValue) {
          const indent_list_match = listItemReg.exec(rowValue);
          if (indent_list_match) {
            const spaces = indent_list_match[1];
            const content = indent_list_match[3];
            if (spaces.length >= TAB_SPACE_WIDTH) {
              event.preventDefault();
              editorRef.current.removeText(cursorPosition - rowValue.length, TAB_SPACE_WIDTH);
              editorRef.current.setCursorPosition(cursorPosition - TAB_SPACE_WIDTH);
            }
            else if (spaces.length == 0 && content.length == 0) {
              event.preventDefault();
              editorRef.current.removeText(cursorPosition - rowValue.length, rowValue.length);
            }
          }
        }
      }
      else {
        if (rowValue) {
          if (listItemReg.test(rowValue)) {
            event.preventDefault();
            editorRef.current.setCursorPosition(cursorPosition - rowValue.length);
            editorRef.current.insertText(tabSpace);
            editorRef.current.setCursorPosition(cursorPosition + TAB_SPACE_WIDTH);
          }
        }
        else {
          event.preventDefault();
          const cursorPosition = editorRef.current.getCursorPosition();
          const selectedContent = editorRef.current.getSelectedContent();
          editorRef.current.insertText(tabSpace);
          if (selectedContent) {
            editorRef.current.setCursorPosition(cursorPosition + TAB_SPACE_WIDTH);
          }
        }
      }
      return;
    }
    if (isMetaKey) {
      if (event.key === "3") {
        event.preventDefault();
        handleAddTagClick();
      }
      else if (event.key === "m") {
        event.preventDefault();
        handleMarkBtnClick();
      }
      else if (event.key === "l") {
        event.preventDefault();
        handleRefBtnClick();
      }
      else if (event.key === "h") {
        const selectedContent = editorRef.current.getSelectedContent();
        if (selectedContent) {
          const cursorPosition = editorRef.current.getCursorPosition();
          event.preventDefault();
          editorRef.current.insertText("==" + selectedContent);
          editorRef.current.setCursorPosition(cursorPosition + 2 + selectedContent.length);
          editorRef.current.insertText("==");
          editorRef.current.setCursorPosition(cursorPosition + 4 + selectedContent.length);
        }
      }
      else if (event.key === "b") {
        const selectedContent = editorRef.current.getSelectedContent();
        if (selectedContent) {
          const cursorPosition = editorRef.current.getCursorPosition();
          event.preventDefault();
          editorRef.current.insertText("**" + selectedContent);
          editorRef.current.setCursorPosition(cursorPosition + 2 + selectedContent.length);
          editorRef.current.insertText("**");
          editorRef.current.setCursorPosition(cursorPosition + 4 + selectedContent.length);
        }
      }
      else if (event.key === "d") {
        const selectedContent = editorRef.current.getSelectedContent();
        if (selectedContent) {
          const cursorPosition = editorRef.current.getCursorPosition();
          event.preventDefault();
          editorRef.current.insertText("~~" + selectedContent);
          editorRef.current.setCursorPosition(cursorPosition + 2 + selectedContent.length);
          editorRef.current.insertText("~~");
          editorRef.current.setCursorPosition(cursorPosition + 4 + selectedContent.length);
        }
      }
      else if (event.key === "i") {
        const selectedContent = editorRef.current.getSelectedContent();
        if (selectedContent) {
          const cursorPosition = editorRef.current.getCursorPosition();
          event.preventDefault();
          editorRef.current.insertText("*" + selectedContent);
          editorRef.current.setCursorPosition(cursorPosition + 1 + selectedContent.length);
          editorRef.current.insertText("*");
          editorRef.current.setCursorPosition(cursorPosition + 2 + selectedContent.length);
        }
      }
      else if (event.key === "e") {
        const selectedContent = editorRef.current.getSelectedContent();
        if (selectedContent) {
          const cursorPosition = editorRef.current.getCursorPosition();
          event.preventDefault();
          editorRef.current.insertText("`" + selectedContent);
          editorRef.current.setCursorPosition(cursorPosition + 1 + selectedContent.length);
          editorRef.current.insertText("`");
          editorRef.current.setCursorPosition(cursorPosition + 2 + selectedContent.length);
        }
      }
    }
  };

  const handleAddTagClick = () => {
    if (!editorRef.current) {
      return;
    }

    const cursorPosition = editorRef.current.getCursorPosition();
    const contentBeforeCursor = editorRef.current.getContent().slice(0, cursorPosition);
    const last_line = last(contentBeforeCursor.split("\n"));
    if (!last_line) {
      editorRef.current.insertText("#");
      editorRef.current.setCursorPosition(cursorPosition + 1);
      return
    }
    const rowValue = last(last_line.split(' '))
    if (rowValue && rowValue.includes("#")) {
      const tag_content = last(rowValue.split("#"));
      if (tag_content && !tag_content.includes(" ")) {
        let full_tag = ""
        const tag_cnt_dict = tagStore.state.tagCounts
        for (let exist_tag of tagStore.state.tags) {
          if (exist_tag.toLowerCase().includes(tag_content.toLowerCase()) && (full_tag == "" || exist_tag.length < full_tag.length)) {
              full_tag = exist_tag;
          }
        }
        if (full_tag != "") {
          editorRef.current.removeText(cursorPosition - tag_content.length - 1, tag_content.length + 1);
          editorRef.current.insertText("", `#${full_tag}`);
          editorRef.current.setCursorPosition(cursorPosition + full_tag.length - tag_content.length);
        }
      }
    }
    else {
      editorRef.current.insertText("#");
      editorRef.current.setCursorPosition(cursorPosition + 1);
    }
  };

  const handleMemoVisibilityChange = (visibility: Visibility) => {
    setState((prevState) => ({
      ...prevState,
      memoVisibility: visibility,
    }));
  };

  const handleUploadFileBtnClick = () => {
    showCreateResourceDialog({
      onConfirm: (resourceList) => {
        setState((prevState) => ({
          ...prevState,
          resourceList: [...prevState.resourceList, ...resourceList],
        }));
      },
    });
  };

  const handleSetResourceList = (resourceList: Resource[]) => {
    setState((prevState) => ({
      ...prevState,
      resourceList,
    }));
  };

  const handleSetRelationList = (relationList: MemoRelation[]) => {
    setState((prevState) => ({
      ...prevState,
      relationList,
    }));
  };

  const handleUploadResource = async (file: File) => {
    setState((state) => {
      return {
        ...state,
        isUploadingResource: true,
      };
    });

    let resource = undefined;
    try {
      resource = await resourceStore.createResourceWithBlob(file);
    } catch (error: any) {
      console.error(error);
      toast.error(typeof error === "string" ? error : error.response.data.message);
    }

    setState((state) => {
      return {
        ...state,
        isUploadingResource: false,
      };
    });
    return resource;
  };

  const uploadMultiFiles = async (files: FileList) => {
    const uploadedResourceList: Resource[] = [];
    for (const file of files) {
      const resource = await handleUploadResource(file);
      if (resource) {
        uploadedResourceList.push(resource);
        if (memoId) {
          await upsertMemoResource(memoId, resource.id);
        }
      }
    }
    if (uploadedResourceList.length > 0) {
      setState((prevState) => ({
        ...prevState,
        resourceList: [...prevState.resourceList, ...uploadedResourceList],
      }));
    }
  };

  const handleDropEvent = async (event: React.DragEvent) => {
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      event.preventDefault();
      await uploadMultiFiles(event.dataTransfer.files);
    }
  };

  const handlePasteEvent = async (event: React.ClipboardEvent) => {
    if (event.clipboardData && event.clipboardData.files.length > 0) {
      event.preventDefault();
      await uploadMultiFiles(event.clipboardData.files);
    }
  };

  const handleContentChange = (content: string) => {
    setHasContent(content !== "");
    setContentCache(content);
  };

  const handleSaveBtnClick = async () => {
    if (state.isRequesting) {
      return;
    }

    setState((state) => {
      return {
        ...state,
        isRequesting: true,
      };
    });
    const content = editorRef.current?.getContent() ?? "";
    try {
      if (memoId && memoId !== UNKNOWN_ID) {
        const prevMemo = await memoStore.getMemoById(memoId ?? UNKNOWN_ID);

        if (prevMemo) {
          await memoStore.patchMemo({
            id: prevMemo.id,
            content,
            visibility: state.memoVisibility,
            resourceIdList: state.resourceList.map((resource) => resource.id),
            relationList: state.relationList,
          });
        }
      } else {
        await memoStore.createMemo({
          content,
          visibility: state.memoVisibility,
          resourceIdList: state.resourceList.map((resource) => resource.id),
          relationList: state.relationList,
        });
        filterStore.clearFilter();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response.data.message);
    }
    setState((state) => {
      return {
        ...state,
        isRequesting: false,
      };
    });

    // Upsert tag with the content.
    const matchedNodes = getMatchedNodes(content);
    const tagNameList = uniq(matchedNodes.filter((node) => node.parserName === "tag").map((node) => node.matchedContent.slice(1)));
    for (const tagName of tagNameList) {
      await tagStore.upsertTag(tagName);
    }

    setState((prevState) => ({
      ...prevState,
      resourceList: [],
      relationList: [],
    }));
    editorRef.current?.setContent("");
    clearContentQueryParam();
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCheckBoxBtnClick = () => {
    if (!editorRef.current) {
      return;
    }
    const currentPosition = editorRef.current?.getCursorPosition();
    const currentLineNumber = editorRef.current?.getCursorLineNumber();
    const currentLine = editorRef.current?.getLine(currentLineNumber);
    let newLine = "";
    let cursorChange = 0;
    if (/^- \[( |x|X)\] /.test(currentLine)) {
      newLine = currentLine.replace(/^- \[( |x|X)\] /, "");
      cursorChange = -6;
    } else if (/^\d+\. |- /.test(currentLine)) {
      const match = currentLine.match(/^\d+\. |- /) ?? [""];
      newLine = currentLine.replace(/^\d+\. |- /, "- [ ] ");
      cursorChange = -match[0].length + 6;
    } else {
      newLine = "- [ ] " + currentLine;
      cursorChange = 6;
    }
    editorRef.current?.setLine(currentLineNumber, newLine);
    editorRef.current.setCursorPosition(currentPosition + cursorChange);
    editorRef.current?.scrollToCursor();
  };

  const handleRefBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    const cursorPosition = editorRef.current.getCursorPosition();
    const prevValue = editorRef.current.getContent().slice(0, cursorPosition);
    if (prevValue === "" || prevValue.endsWith("\n")) {
      editorRef.current?.insertText("", "参考：[](", ")");
    } else {
      editorRef.current?.insertText("", "\n参考：[](", ")");
    }
  };

  const handleInsertTableBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current?.insertText("", "|", "||\n|:--:|:--:|\n|||");
  };

  const handleAddColBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    const cursorPosition = editorRef.current.getCursorPosition();
    const content_splt = editorRef.current.getContent().split("\n");
    const cursor_line_num = calculateCursorLinePosition(content_splt, cursorPosition);
    const table_first_line = findFirstPipeLine(content_splt, cursor_line_num);
    if (table_first_line == -1) {
      toast.error("请在光标置于表格中使用~")
      return
    }

    let line_end = content_splt.slice(0, table_first_line+1).join('').length + table_first_line;
    let table_line = table_first_line
    while (table_line <= content_splt.length-1) {
      const cur_line = content_splt[table_line].trim();
      if(cur_line[cur_line.length-1] != '|'){
          break
      }
      editorRef.current.setCursorPosition(line_end);
      let bias = 0
      if (cur_line.match(/^.*:-.*$/)) {
        editorRef.current.insertText("", `:--:|`);
        bias = 5
      }
      else {
        editorRef.current.insertText("", `|`);
        bias = 1
      }

      table_line += 1
      if (table_line < content_splt.length) {
        line_end += content_splt[table_line].length+bias+1
      }
    }
  };

  const handleAddRowBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    const cursorPosition = editorRef.current.getCursorPosition();
    const content_splt = editorRef.current.getContent().split("\n");
    const cursor_line_num = calculateCursorLinePosition(content_splt, cursorPosition);
    const table_first_line = findFirstPipeLine(content_splt, cursor_line_num);
    if (table_first_line == -1) {
      toast.error("请在光标置于表格中使用~")
      return
    }
    let maxCount = 0; // 最大的竖线数量

    let line_num = -1
    let empty_happend = false
    for (const str of content_splt.slice()) {
      line_num += 1
      if (line_num < table_first_line) {
        continue
      }
      const cur_line = str.trim();
      if(cur_line.length == 0 || cur_line[cur_line.length-1] != '|'){
        empty_happend = true
        break
      }

      const count = str.split('|').length - 1; // 计算当前字符串中竖线的数量
      if (count > maxCount) {
        maxCount = count; // 更新最大的竖线数量
      }
    }
    if (empty_happend) {
      line_num -= 1
    }
    if (maxCount != 0) {
      const insert_pos = content_splt.slice(0, line_num+1).join('').length + line_num + (empty_happend ? 1 : 0);
      editorRef.current.setCursorPosition(insert_pos);
      if (empty_happend) {
        editorRef.current.insertText("", "|", "|".repeat(maxCount-1) + "\n");
      }
      else {
        editorRef.current.insertText("", "\n|", "|".repeat(maxCount-1));
      }
    }
  };

  const handleMarkBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current?.insertText("", "[MEMO](/m/", ") ");
  };

  const handleConvertBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current?.insertText("", "帮我整理:");
  };

  const handleCodeBlockBtnClick = () => {
    if (!editorRef.current) {
      return;
    }

    const cursorPosition = editorRef.current.getCursorPosition();
    const prevValue = editorRef.current.getContent().slice(0, cursorPosition);
    if (prevValue === "" || prevValue.endsWith("\n")) {
      editorRef.current?.insertText("", "```\n", "\n```");
    } else {
      editorRef.current?.insertText("", "\n```\n", "\n```");
    }
  };

  const handleTagSelectorClick = useCallback((tag: string) => {
    editorRef.current?.insertText(`#${tag} `);
  }, []);

  const handleEditorFocus = () => {
    editorRef.current?.focus();
  };

  const editorConfig = useMemo(
    () => ({
      className: `memo-editor`,
      initialContent: "",
      placeholder: t("editor.placeholder"),
      onContentChange: handleContentChange,
      onPaste: handlePasteEvent,
    }),
    [i18n.language]
  );

  const allowSave = (hasContent || state.resourceList.length > 0) && !state.isUploadingResource && !state.isRequesting;

  return (
    <div
      className={`${className ?? ""} memo-editor-container`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDrop={handleDropEvent}
      onFocus={handleEditorFocus}
      onCompositionStart={() => setIsInIME(true)}
      onCompositionEnd={() => setIsInIME(false)}
    >
      <Editor ref={editorRef} {...editorConfig} />
      <div className="common-tools-wrapper">
        <div className="common-tools-container">
          <TagSelector onTagSelectorClick={(tag) => handleTagSelectorClick(tag)} />
          <button className="action-btn">
            <Icon.Tags className="icon-img" onClick={handleAddTagClick} />
          </button>
          <button className="action-btn">
            <Icon.Link className="icon-img" onClick={handleMarkBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.Copyright className="icon-img" onClick={handleRefBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.ReplaceAll  className="icon-img" onClick={handleConvertBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.Table  className="icon-img" onClick={handleInsertTableBtnClick} />
          </button>
           <button className="action-btn">
            <Icon.ArrowRightToLine   className="icon-img" onClick={handleAddColBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.ArrowDownToLine  className="icon-img" onClick={handleAddRowBtnClick} />
          </button>
          <button className="action-btn">
          <Icon.Paperclip className="icon-img" onClick={handleUploadFileBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.CheckSquare className="icon-img" onClick={handleCheckBoxBtnClick} />
          </button>
          <button className="action-btn">
            <Icon.Code className="icon-img" onClick={handleCodeBlockBtnClick} />
          </button>
        </div>
      </div>
      <ResourceListView resourceList={state.resourceList} setResourceList={handleSetResourceList} />
      <RelationListView relationList={state.relationList} setRelationList={handleSetRelationList} />
      <div className="editor-footer-container">
        <MemoVisibilitySelector value={state.memoVisibility} onChange={handleMemoVisibilityChange} />
        <div className="buttons-container">
          <button className="action-btn confirm-btn" disabled={!allowSave} onClick={handleSaveBtnClick}>
            {t("editor.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoEditor;
