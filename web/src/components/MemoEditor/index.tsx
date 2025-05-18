import { Select, Option, Button, Tooltip, IconButton, Divider, Box } from "@mui/joy";
import { isNumber, last, uniq } from "lodash-es";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { memoServiceClient } from "@/grpcweb";
import { TAB_SPACE_WIDTH, UNKNOWN_ID, VISIBILITY_SELECTOR_ITEMS } from "@/helpers/consts";
import useCurrentUser from "@/hooks/useCurrentUser";
import { getMatchedNodes } from "@/labs/marked";
import { useGlobalStore, useMemoStore, useResourceStore, useTagStore } from "@/store/module";
import { useUserV1Store } from "@/store/v1";
import { Resource } from "@/types/proto/api/v2/resource_service";
import { UserSetting, User_Role } from "@/types/proto/api/v2/user_service";
import { useTranslate } from "@/utils/i18n";
import showCreateResourceDialog from "../CreateResourceDialog";
import Icon from "../Icon";
import VisibilityIcon from "../VisibilityIcon";
import TagSelector from "./ActionButton/TagSelector";
import InputActionSelector from "./ActionButton/InputActionSelector"
import Editor, { EditorRefActions } from "./Editor";
import RelationListView from "./RelationListView";
import ResourceListView from "./ResourceListView";
import showRenameImageDialog from "../ImageRenameDialag"
import showCreateExcalidrawDialog from "../CreateExcalidrawDialog"
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'


const listItemSymbolList = ["- [ ] ", "- [x] ", "* ", "- "];
const emptyOlReg = /^(\d+)\. $/;
const listItemReg = /^( *)([-\*]) (.*)/;
const orderItemReg = /^( *)(\d+)\. (.*)/;

const CustomIcon = ({ name }: { name: string }) => {
  const LucideIcon = (Icon.icons as { [key: string]: any })[name];
  return <LucideIcon className="w-5 h-5 mx-auto" />;
};

const cal_valid_word_cnt = (content: string) => {
  let _tmp = content
  _tmp = _tmp.replace(/\[(.+?)\]\(.*?\)/g, '$1');
  _tmp = _tmp.replace(/ *- \[[ xX]\] (.+)/g, '$1');
  _tmp = _tmp.replace(/ *[-+] (.+)/g, '$1');
  _tmp = _tmp.replace(/ *\d+\. (.+)/g, '$1');
  _tmp = _tmp.replace(/#+ (.+)/g, '$1');
  _tmp = _tmp.replace(/> (.+)/g, '$1');
  _tmp = _tmp.replace(/\|[:\-\|]+\| *(?!.)/g, '');
  _tmp = _tmp.replace(/\*\*\*(.+)\*\*\*/g, '$1');
  _tmp = _tmp.replace(/\*\*(.+)\*\*/g, '$1');
  _tmp = _tmp.replace(/\*(.+)\*/g, '$1');
  _tmp = _tmp.replace(/==(.+)==/g, '$1');
  _tmp = _tmp.replace(/^\s+|\s+$/g, '');
  _tmp = _tmp.replace(/\n|\s+/g, '');
  return _tmp.length
};

interface Props {
  className?: string;
  editorClassName?: string;
  cacheKey?: string;
  memoId?: MemoId;
  relationList?: MemoRelation[];
  init_content?: string;
  onConfirm?: () => void;
}

interface State {
  memoVisibility: Visibility;
  fullscreen: boolean;
  resourceList: Resource[];
  relationList: MemoRelation[];
  isUploadingResource: boolean;
  isRequesting: boolean;
}

type Dict = {
  name: string;
  content: string;
  shortcut: string;
  pc_show: boolean;
  mobile_show: boolean;
  tips: string;
  icon: string;
  disable: boolean;
  meta_key: string
};

function calculateCursorLinePosition(lines: string[], n: number): number {
  let totalCursor = 0;

  for (let i = 0; i < lines.length; i++) {
      totalCursor += lines[i].length + 1;

      if (totalCursor > n) {
          return i;
      }
  }

  return lines.length;
}

function findFirstPipeLine(lines: string[], currentLine: number): number {
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

  return -1;
}


const MemoEditor = (props: Props) => {
  const { className, editorClassName, cacheKey, memoId, onConfirm } = props;
  const { i18n } = useTranslation();
  const t = useTranslate();
  const contentCacheKey = `memo-editor-${cacheKey}`;
  const [contentCache, setContentCache] = useLocalStorage<string>(contentCacheKey, "");
  const {
    state: { systemStatus },
  } = useGlobalStore();
  const userV1Store = useUserV1Store();
  const memoStore = useMemoStore();
  const tagStore = useTagStore();
  const resourceStore = useResourceStore();
  const currentUser = useCurrentUser();
  const [state, setState] = useState<State>({
    memoVisibility: "PRIVATE",
    resourceList: [],
    fullscreen: false,
    relationList: props.relationList ?? [],
    isUploadingResource: false,
    isRequesting: false,
  });
  const init_content = props.init_content ?? ""
  const [hasContent, setHasContent] = useState<boolean>(false);
  const [isInIME, setIsInIME] = useState(false);
  const [has_modify, set_modify] = useState(false);
  const editorRef = useRef<EditorRefActions>(null);
  const userSetting = userV1Store.userSetting as UserSetting;
  let custom_shortcut: Dict[] = [];
  if (userSetting?.customShortcut) {
    custom_shortcut = JSON.parse(userSetting?.customShortcut);
  }
  const use_excalidraw = userSetting?.useExcalidraw ?? false;
  const pc_show_list = custom_shortcut.filter((item) => item['pc_show'] === true);
  const mobile_show_list = custom_shortcut.filter((item) => item['mobile_show'] === true);

  const paste_file_rename = userSetting?.pasteRename ?? false;
  const show_tag_selector = userSetting?.showTagSelector ?? true;
  const show_memo_public = userSetting?.showMemoPublic ?? false;

  const [word_cnt, set_word_cnt] = useState(0);
  const show_word_cnt = userSetting.showWordCnt;
  const referenceRelations = memoId
    ? state.relationList.filter(
        (relation) => (relation.memoId === memoId || relation.relatedMemoId === memoId) && relation.type === "REFERENCE"
      )
    : state.relationList.filter((relation) => relation.type === "REFERENCE");
  useEffect(() => {
    if (init_content) {
      editorRef.current?.setContent(init_content);
    }
    else {
      editorRef.current?.setContent(contentCache || "");
    }
    handleEditorFocus();
  }, []);

  useEffect(() => {
    let visibility = userSetting.memoVisibility;
    if (systemStatus.disablePublicMemos && visibility === "PUBLIC") {
      visibility = "PRIVATE";
    }
    setState((prevState) => ({
      ...prevState,
      memoVisibility: visibility as Visibility,
    }));
  }, [userSetting.memoVisibility, systemStatus.disablePublicMemos]);

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
          else if (contentCache != memo.content) {
            set_modify(true)
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
    if (isMetaKey && (event.key === "Enter" || event.key === 's')) {
      event.preventDefault();
      handleSaveBtnClick();
      return;
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
            const olMatchRes = /^(\d+)\. /.exec(rowValue);
            if (olMatchRes) {
              const order = parseInt(olMatchRes[1]);
              if (isNumber(order)) {
                event.preventDefault();
                editorRef.current.insertText("", `\n${order + 1}. `);
                matched = true;
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
              matched = true;
            }
          }
          if (!matched) {
            const indent_list_match = orderItemReg.exec(rowValue);
            if (indent_list_match) {
              event.preventDefault();
              const spaces = indent_list_match[1];
              const orderId = parseInt(indent_list_match[2]);
              const content = indent_list_match[3];
              if (content.length != 0){
                editorRef.current.insertText("", `\n${spaces}${orderId+1}. `);
              }
              else if (rowValue) {
                editorRef.current.removeText(cursorPosition - rowValue.length, rowValue.length);
              }
              matched = true;
            }
          }
        }
      }
      return;
    }
    if (event.key === "Tab") {
      if (event.shiftKey) {
        handleAntiIndent();
      }
      else {
        handleIndent();
      }
      return;
    }
    if (isMetaKey) {
      if (event.key === "m") {
        event.preventDefault();
        handleMarkBtnClick();
      }
      else {
        for (const item of custom_shortcut) {
          if (event.key === (item['shortcut'] || "undefine").toLowerCase()) {
            if (event.altKey && item.hasOwnProperty("meta_key") && item['meta_key'] === "cmd") {
              continue
            }
            if (event.metaKey && item.hasOwnProperty("meta_key") && item['meta_key'] === "ctrl") {
              continue
            }
            event.preventDefault();
            handleCustomShortcut(item['content']);
            break;
          }
        }
      }
    }
  };

  const handleBatchIndent = () => {
    if (!editorRef.current) {
      return;
    }
    const select_content = editorRef.current.getSelectedContent()
    const begin_idx = editorRef.current.getCursorPosition();
    const end_idx = begin_idx + select_content.length;
    const begin_line_number = editorRef.current.getCursorLineNumber();
    const end_line_number = (editorRef.current.getContent().slice(0, end_idx).split("\n") ?? []).length-1;
    let new_content = '';
    const lines = editorRef.current.getContent().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const end_token = i == lines.length-1 ? '' : '\n';
      if (i >= begin_line_number && i <= end_line_number) {
        new_content += "    " + lines[i] + end_token;
      } else {
        new_content += lines[i] + end_token;
      }
    }
    editorRef.current.setContent(new_content);
    editorRef.current.setSelectedContent(begin_idx + 4, end_idx + 4*(end_line_number-begin_line_number+1));
  }

  const handleIndent = () => {
    if (!editorRef.current) {
      return;
    }
    if (editorRef.current.getSelectedContent()) {
      handleBatchIndent();
      return;
    }
    const tabSpace = " ".repeat(TAB_SPACE_WIDTH);
    const cursorPosition = editorRef.current.getCursorPosition();
    const contentBeforeCursor = editorRef.current.getContent().slice(0, cursorPosition);
    const rowValue = last(contentBeforeCursor.split("\n"));

    if (rowValue === undefined) {
      return;
    }
    const cur_line_content = editorRef.current?.getLine(editorRef.current?.getCursorLineNumber());
    if (cur_line_content) {
      const indent_list_match = listItemReg.exec(cur_line_content)
      if (indent_list_match) {
        editorRef.current.setCursorPosition(cursorPosition - rowValue.length);
        editorRef.current.insertText(tabSpace);
        editorRef.current.setCursorPosition(cursorPosition + TAB_SPACE_WIDTH);
        return
      }
      else {
        const order_list_match = orderItemReg.exec(cur_line_content)
        if (order_list_match) {
          editorRef.current.setCursorPosition(cursorPosition - rowValue.length);
          editorRef.current.insertText(tabSpace);
          editorRef.current.setCursorPosition(cursorPosition + TAB_SPACE_WIDTH);
          return
        } else {
          editorRef.current.setCursorPosition(cursorPosition - rowValue.length);
          editorRef.current.insertText(tabSpace);
          editorRef.current.setCursorPosition(cursorPosition + TAB_SPACE_WIDTH);
        }
      }
    }
  }

  const handleBatchAntiIndent = () => {
    if (!editorRef.current) {
      return;
    }
    const select_content = editorRef.current.getSelectedContent()
    const begin_idx = editorRef.current.getCursorPosition();
    const end_idx = begin_idx + select_content.length;
    const begin_line_number = editorRef.current.getCursorLineNumber();
    const end_line_number = (editorRef.current.getContent().slice(0, end_idx).split("\n") ?? []).length-1;
    let new_content = '';
    const lines = editorRef.current.getContent().split('\n');
    let del_cnt = 0;
    for (let i = 0; i < lines.length; i++) {
      if (i >= begin_line_number && i <= end_line_number) {
        const line = lines[i];
        const space_before = line.match(/^( *)/);
        const space_cnt = space_before ? space_before[1].length : 0;
        const del_space_number = Math.min(4, space_cnt);
        if (del_space_number) {
          new_content += line.slice(del_space_number) + '\n';
          del_cnt += del_space_number
        } else {
          new_content += line + '\n';
        }
      } else {
        new_content += lines[i] + (i == lines.length-1 ? '' : '\n');
      }
    }
    editorRef.current.setContent(new_content);
    editorRef.current.setSelectedContent(begin_idx, end_idx - del_cnt);
  }

  const handleAntiIndent = () => {
    if (!editorRef.current) {
      return;
    }
    if (editorRef.current.getSelectedContent()) {
      handleBatchAntiIndent()
      return;
    }
    const cursorPosition = editorRef.current.getCursorPosition();
    const contentBeforeCursor = editorRef.current.getContent().slice(0, cursorPosition);
    const rowValue = last(contentBeforeCursor.split("\n"));
    if (rowValue === undefined) {
      return;
    }
    const cur_line_content = editorRef.current?.getLine(editorRef.current?.getCursorLineNumber());
    if (cur_line_content) {
      const indent_list_match = listItemReg.exec(cur_line_content);
      const order_list_match = orderItemReg.exec(cur_line_content);
      if (indent_list_match || order_list_match) {
        let spaces = ""
        if(indent_list_match) {
          spaces = indent_list_match[1]
        }
        else if (order_list_match) {
          spaces = order_list_match[1]
        }

        if (spaces.length >= TAB_SPACE_WIDTH) {
          editorRef.current.removeText(cursorPosition - rowValue.length, TAB_SPACE_WIDTH);
          editorRef.current.setCursorPosition(cursorPosition - TAB_SPACE_WIDTH);
        }
      } else {
        const space_before = cur_line_content.match(/^( *)/);
        const space_cnt = space_before ? space_before[1].length : 0;
        const del_space_number = Math.min(4, space_cnt);
        if (del_space_number) {
          editorRef.current.removeText(cursorPosition - rowValue.length, del_space_number);
        }
      }
    }
  }

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

  const handleExcalidrawClick = async () => {
    showCreateExcalidrawDialog(
      (blob: Blob) => {
        const file = new File([blob as Blob], "excalidraw.png", { type: "image/png" });
        showRenameImageDialog(file.name, file, async (new_name) => {
          const arrayBuffer = await file.arrayBuffer();
          const renamedFile = new File([arrayBuffer], new_name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(renamedFile)
          const renamedFileList = dataTransfer.files;
          uploadMultiFiles(renamedFileList);
        })
      },
      cacheKey
    );
  }

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
          await resourceStore.updateResource({
            resource: Resource.fromPartial({
              id: resource.id,
              memoId,
            }),
            updateMask: ["memo_id"],
          });
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
      if (paste_file_rename && event.clipboardData.files.length == 1 && event.clipboardData.files[0].name == 'image.png') {
        const filesArray = await Array.from(event.clipboardData.files);
        showRenameImageDialog(event.clipboardData.files[0].name, event.clipboardData.files[0], async (new_name) => {
          const renamedFilesArray = await Promise.all(
            filesArray.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              const renamedFile = new File([arrayBuffer], new_name, {
                type: file.type,
                lastModified: file.lastModified,
              });
              return renamedFile;
            })
          );
          const dataTransfer = new DataTransfer();
          renamedFilesArray.forEach(file => dataTransfer.items.add(file));

          const renamedFileList = dataTransfer.files;
          await uploadMultiFiles(renamedFileList);
        })
      } else {
        await uploadMultiFiles(event.clipboardData.files);
      }

    }
  };

  const update_memo_modify = () => {
    if (memoId) {
      memoStore.getMemoById(memoId ?? UNKNOWN_ID).then((memo) => {
        if (memo) {
          if(editorRef.current?.getContent() != memo.content) {
            set_modify(true)
          }
          else {
            set_modify(false)
          }
        }
      });
    }
  }

  const update_number_list = (content: string) => {
    let new_content: String[] = []
    const line_list = content.split("\n")
    let last_idx_dict : { [key: number]: number } = {}
    let normal_line_appear = false
    const number_regexp = /^( *)(\d+)\. (.*)$/
    const list_regexp = /^( *)([-\*]) (.*)$/

    let cursor_line = editorRef.current?.getCursorLineNumber();
    if (cursor_line == null) {
      return
    }
    let cursorPosition = editorRef.current?.getCursorPosition();
    if (cursorPosition == null) {
      return
    }

    for (let i = 0; i < line_list.length; i++) {
      const match = line_list[i].match(number_regexp)
      const match_list = line_list[i].match(list_regexp)
      if (!match && !match_list) {
        new_content.push(line_list[i])
        normal_line_appear = true
        continue
      }
      if (match) {
        const number = parseInt(match[2])
        const lv = match[1].length/TAB_SPACE_WIDTH
        const last_idx = last_idx_dict[lv] || 0
        if (last_idx == 9999 && !normal_line_appear) {
          new_content.push(match[1] + "- " + match[3])
          last_idx_dict[lv] = 9999
          if (i <= cursor_line) {
            cursorPosition -= number.toString().length
          }
        }
        else if (number == last_idx + 1 || number == 1) {
          new_content.push(line_list[i])
          last_idx_dict[lv] = number
        }
        else if (!normal_line_appear) {
          new_content.push(match[1] + (last_idx + 1).toString() + ". " + match[3])
          last_idx_dict[lv] = last_idx + 1
          if (i <= cursor_line) {
            cursorPosition += (last_idx + 1).toString().length - number.toString().length
          }
        } else {
          new_content.push(match[1] +  "1. " + match[3])
          last_idx_dict[lv] = 1
          if (i <= cursor_line) {
            cursorPosition += 1 - number.toString().length
          }
        }
        for (let key in last_idx_dict) {
          if (parseInt(key) > lv) {
            delete last_idx_dict[key]
          }
        }
      } else if (match_list) {
        const lv = match_list[1].length/TAB_SPACE_WIDTH
        const last_idx = last_idx_dict[lv]
        if (last_idx != undefined && last_idx != 9999 && !normal_line_appear)
        {
          new_content.push(match_list[1] + (last_idx + 1).toString() + ". " + match_list[3])
          last_idx_dict[lv] = last_idx + 1
          if (i <= cursor_line) {
            cursorPosition += (last_idx + 1).toString().length
          }
        }
        else {
          new_content.push(line_list[i])
          last_idx_dict[lv] = 9999
        }
        for (let key in last_idx_dict) {
          if (parseInt(key) > lv) {
            delete last_idx_dict[key]
          }
        }
      }
      normal_line_appear = false
    }
    const new_content_str = new_content.join("\n")
    if (new_content_str != content) {
      editorRef.current?.setContent(new_content_str)
      editorRef.current?.setCursorPosition(cursorPosition);
    }
  }

  const handleContentChange = (content: string) => {
    setHasContent(content !== "");
    setContentCache(content);
    update_memo_modify();
    if(show_word_cnt) {
      set_word_cnt(cal_valid_word_cnt(content))
    }
    if (content !== "") {
      setContentCache(content);
    } else {
      localStorage.removeItem(contentCacheKey);
    }
    update_number_list(content);
  };

  const check_relation_memo_exist = async (memoId: number) => {
    const id = Number(memoId);
    if (isNaN(id)) {
      return false;
    }

    try {
      const { memo } = await memoServiceClient.getMemo({id,});
      if (!memo) {
        return false;
      }
    } catch (error: any) {
      return false;
    }
    return true;

  };

  const handleSaveBtnClick = async () => {
    if (state.isRequesting) {
      return;
    }
    const content = editorRef.current?.getContent() ?? "";
    if (content == "" && state.resourceList.length == 0) {
      toast.error("内容不能为空");
      return;
    }
    setState((state) => {
      return {
        ...state,
        isRequesting: true,
      };
    });
    const LINK_REG = /\[[^\]\[]+\]\(\/m\/(\d+)\)/g;
    const matchResult = Array.from(new Set(content.match(LINK_REG)));
    let relations: MemoRelation[] = [];
    try {
      if (memoId && memoId !== UNKNOWN_ID) {
        const prevMemo = await memoStore.getMemoById(memoId ?? UNKNOWN_ID);
        if (matchResult) {
          const filteredMatchResult = await Promise.all(
            matchResult.map(async (match) => {
              const memoId = parseInt(match.split("]")[1].split("m/")[1]);
              const exists = await check_relation_memo_exist(memoId);
              if (exists) {
                return {
                  memoId: prevMemo.id,
                  relatedMemoId: memoId,
                  type: "REFERENCE" as MemoRelationType,
                };
              }
              return {
                memoId: -999,
                relatedMemoId: memoId,
                type: "REFERENCE" as MemoRelationType,
              };
            })
          );
          relations = filteredMatchResult.filter(item => item.memoId != -999);
        }
        if (prevMemo) {
          await memoStore.patchMemo({
            id: prevMemo.id,
            content,
            visibility: state.memoVisibility,
            resourceIdList: state.resourceList.map((resource) => resource.id),
            relationList: relations,
          });
        }
      } else {
        if (matchResult) {
          const filteredMatchResult = await Promise.all(
            matchResult.map(async (match) => {
              const memoId = parseInt(match.split("]")[1].split("m/")[1]);
              const exists = await check_relation_memo_exist(memoId);
              if (exists) {
                return {
                  memoId: UNKNOWN_ID,
                  relatedMemoId: memoId,
                  type: "REFERENCE" as MemoRelationType,
                };
              }
              return {
                memoId: -999,
                relatedMemoId: memoId,
                type: "REFERENCE" as MemoRelationType,
              };
            })
          );
          relations = filteredMatchResult.filter(item => item.memoId != -999);
        }
        await memoStore.createMemo({
          content,
          visibility: state.memoVisibility,
          resourceIdList: state.resourceList.map((resource) => resource.id),
          relationList: relations,
        });
      }
      editorRef.current?.setContent("");
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

    const matchedNodes = getMatchedNodes(content);
    const tagNameList = uniq(matchedNodes.filter((node) => node.parserName === "tag").map((node) => node.matchedContent.slice(1)));
    for (const tagName of tagNameList) {
      await tagStore.upsertTag(tagName);
    }

    setState((state) => {
      return {
        ...state,
        fullscreen: false,
      };
    });

    setState((prevState) => ({
      ...prevState,
      resourceList: [],
    }));
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleFullscreenBtnClick = useCallback(() => {
    setState((state) => {
      return {
        ...state,
        fullscreen: !state.fullscreen,
      };
    });
  }, []);

  const handleCheckBoxBtnClick = () => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current?.insertText("- [ ] ", "");
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
      return
    }
    let maxCount = 0;

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

      const count = str.split('|').length - 1;
      if (count > maxCount) {
        maxCount = count;
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
    const content_select = editorRef.current.getSelectedContent();
    if (content_select.length == 0) {
      editorRef.current?.insertText("", "[MEMO](/m/", ")");
    }
    else {
      editorRef.current?.insertText("", "[");
      editorRef.current?.insertText("", "](/m/", ")");
    }
  };

  const handleCodeBlockBtnClick = () => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current?.insertText("", "\n```\n", "\n```");
  };

  const handleTagSelectorClick = useCallback((tag: string) => {
    editorRef.current?.insertText(`#${tag} `);
  }, []);

  const insert_to_begin = (content: string) => {
    const cursorPosition = editorRef.current?.getCursorPosition() ?? 0;
    editorRef.current?.setCursorPosition(0);
    editorRef.current?.insertText(content);
    editorRef.current?.setCursorPosition(cursorPosition + content.length);
  }

  const handleRestoreContentClick = () => {
    if (memoId) {
      memoStore.getMemoById(memoId ?? UNKNOWN_ID).then((memo) => {
        if (memo) {
          editorRef.current?.setContent(memo.content ?? "");
        }
      });
      set_modify(false)
    }
  }

  function replaceDateTime(str: string): string {
    let lan = 'en'
    if (str.includes('$datetime-zh')) {
      lan = 'zh-cn'
      str = str.replace('$datetime-zh', '$datetime')
    }
    let djs = dayjs().locale(lan)
    return str.replace(/\$datetime(|[^:]+)*:(.*?)\$/g, (match, bias, format) => {
      if (bias) {
        const bias_list = bias.slice(1).split(',')
        for (let i = 0; i < bias_list.length; i++) {
          const bias_str = bias_list[i]
          if (bias_str.startsWith('+')) {
            djs = djs.add(parseInt(bias_str[1]), bias_str[2])
          }
          else if (bias_str.startsWith('-')) {
            djs = djs.subtract(parseInt(bias_str[1]), bias_str[2])
          }
        }
        return djs.format(format);
      } else {
        return djs.format(format);
      }
    });
  }

  async function replaceClipboardPlaceholderSync(inputString: string): Promise<string> {
    const clipboardText = await navigator.clipboard.readText().catch(err => {
        return '';
    });
    return inputString.replace(/\$CLIPBOARD\$/g, clipboardText);
  }

  const handleCustomShortcut = async (shortcut: string) => {
    if (!editorRef.current) {
      return;
    }
    const content_select = editorRef.current.getSelectedContent();
    if (content_select) {
      editorRef.current.removeText(editorRef.current.getCursorPosition(), content_select.length);
    }
    shortcut = replaceDateTime(shortcut);
    if (shortcut.includes("$CLIPBOARD$")) {
      shortcut = await replaceClipboardPlaceholderSync(shortcut);
    }
    if (shortcut.includes("$SELECT$")) {
      shortcut = shortcut.replace("$SELECT$", content_select)
    }
    if (shortcut.startsWith("^")) {
      const cursorPosition = editorRef.current.getCursorPosition();
      const prevValue = editorRef.current.getContent().slice(0, cursorPosition);
      if (prevValue.endsWith("\n")) {
        shortcut = shortcut.slice(1);
      }
      else {
        shortcut = "\n" + shortcut.slice(1);
      }
    }
    if (shortcut.includes("$CURSOR$")) {
      const cursor_pos = shortcut.indexOf("$CURSOR$")
      shortcut = shortcut.replace("$CURSOR$", "")
      editorRef.current.insertText("", shortcut.substring(0, cursor_pos), shortcut.substring(cursor_pos));
    }
    else {
      editorRef.current.insertText(shortcut);
    }
  };

  const handleInputActionClick = useCallback((action: string) => {
    if (action == "checkbox") {
      handleCheckBoxBtnClick()
    }
    else if (action == "code") {
      handleCodeBlockBtnClick()
    }
    else if (action == "add_table") {
      handleInsertTableBtnClick()
    }
    else if (action == "add_col") {
      handleAddColBtnClick()
    }
    else if (action == "add_row") {
      handleAddRowBtnClick()
    }
    else if (action.startsWith("custom_shortcut_")) {
      const shortcut = action.split("custom_shortcut_")[1]
      if (shortcut) {
        handleCustomShortcut(shortcut)
      }
    }
  }, []);

  const handleEditorFocus = () => {
    editorRef.current?.focus();
  };

  const editorConfig = useMemo(
    () => ({
      className: editorClassName ?? "",
      initialContent: "",
      fullscreen: state.fullscreen,
      placeholder: t("editor.placeholder"),
      onContentChange: handleContentChange,
      onPaste: handlePasteEvent,
    }),
    [state.fullscreen, i18n.language]
  );

  const allowSave = (hasContent || state.resourceList.length > 0) && !state.isUploadingResource && !state.isRequesting;

  const disableOption = (v: string) => {
    const isAdminOrHost = currentUser.role === User_Role.ADMIN || currentUser.role === User_Role.HOST;

    if (v === "PUBLIC" && !isAdminOrHost) {
      return systemStatus.disablePublicMemos;
    }
    return false;
  };

  return (
    <div
      className={`${
        className ?? ""
      } w-full flex flex-col justify-start items-start bg-white dark:bg-zinc-700 rounded-lg border-2 border-gray-200 dark:border-zinc-600 ${state.fullscreen ? "transition-all fixed w-full h-full top-0 left-0 z-1000 rounded-none dark:bg-zinc-800" : "px-4 pt-4"} `}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDrop={handleDropEvent}
      onFocus={handleEditorFocus}
      onCompositionStart={() => setIsInIME(true)}
      onCompositionEnd={() => setIsInIME(false)}
    >
      <Editor ref={editorRef} {...editorConfig} className={`${state.fullscreen ? "p-4 mb-4 rounded-lg border flex flex-col flex-grow justify-start items-start relative w-full h-full bg-white " : ""}`}/>
      <div className="relative w-full flex flex-row justify-between items-center pt-2 z-1">
        <div className="flex flex-row justify-start items-center">
          {show_tag_selector && <TagSelector onTagSelectorClick={(tag) => handleTagSelectorClick(tag)} fullScreen={state.fullscreen}/>}
          <IconButton className="flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow">
            <Icon.Link className="w-5 h-5 mx-auto" onClick={handleMarkBtnClick}/>
          </IconButton>
          <IconButton className="md:!hidden flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow">
            <Icon.ArrowRightFromLine className="w-5 h-5 mx-auto" onClick={handleIndent}/>
          </IconButton>
          <IconButton className="md:!hidden flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow" >
            <Icon.ArrowLeftFromLine className="w-5 h-5 mx-auto" onClick={handleAntiIndent}/>
          </IconButton>
          {
            mobile_show_list.map((item) => {
              return <Tooltip title={item["tips"] || item["content"]} placement="bottom" key={"custom_shortcut_mobile_"+item["name"]}><IconButton className="md:!hidden flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow" onClick={() => handleCustomShortcut(item['content'])}>
                <CustomIcon name={item["icon"] || "User"}/>
              </IconButton></Tooltip>
            })
          }
          {
            pc_show_list.map((item) => {
              return <Tooltip title={item["tips"] || item["content"]} placement="bottom" key={"custom_shortcut_pc_"+item["name"]} ><IconButton className="!hidden md:!block flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow" onClick={() => handleCustomShortcut(item['content'])}>
                <CustomIcon name={item["icon"] || "User"}/>
              </IconButton></Tooltip>
            })
          }
          <InputActionSelector onActionSelectorClick={(action) => handleInputActionClick(action)} fullScreen={state.fullscreen} />
          <IconButton className="flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow" >
            <Icon.Image className="w-5 h-5 mx-auto" onClick={handleUploadFileBtnClick} />
          </IconButton>
          {use_excalidraw && <IconButton className="flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow" >
            <Icon.Spline className="w-5 h-5 mx-auto" onClick={handleExcalidrawClick} />
          </IconButton>}
          <IconButton className="action-btn">
            {state.fullscreen ? <Icon.Minimize className="w-5 h-5 mx-auto"  onClick={handleFullscreenBtnClick}/> : <Icon.Maximize className="w-5 h-5 mx-auto"  onClick={handleFullscreenBtnClick}/>}
          </IconButton>
          {has_modify && (
            <>
              <IconButton className={`flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer hover:bg-gray-300 hover:shadow ${!has_modify ? 'hidden' : ''}`} style={{ color: "#CC0000" }} >
                <Icon.ListRestartIcon id="content_restore" className="w-5 h-5 mx-auto" onClick={handleRestoreContentClick} />
              </IconButton>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center">
        <ResourceListView resourceList={state.resourceList} setResourceList={handleSetResourceList} />
      </div>
      <RelationListView memoId={memoId} content={editorRef.current?.getContent() ?? ""} relationList={referenceRelations} setRelationList={handleSetRelationList} />
      <Divider className="!mt-2" />
      <div className="w-full flex flex-row justify-between items-center py-3 ">
        <div className="relative flex flex-row justify-start items-center" onFocus={(e) => e.stopPropagation()}>
          {show_memo_public && <Select
            variant="plain"
            value={state.memoVisibility}
            startDecorator={<VisibilityIcon visibility={state.memoVisibility} />}
            onChange={(_, visibility) => {
              if (visibility) {
                handleMemoVisibilityChange(visibility);
              }
            }}
          >
            {VISIBILITY_SELECTOR_ITEMS.map((item) => (
              <Option key={item} value={item} className="whitespace-nowrap" disabled={disableOption(item)}>
                {t(`memo.visibility.${item.toLowerCase() as Lowercase<typeof item>}`)}
              </Option>
            ))}
          </Select>}
        </div>
        <div className="shrink-0 flex flex-row justify-end items-center">
        {show_word_cnt && (word_cnt>0 || hasContent) && (
          <span className="pr-4 text-xs text-gray-500 ">有效字数: {word_cnt}</span>
        )}
          <Button color="success" disabled={!allowSave} onClick={handleSaveBtnClick}>
            {t("editor.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MemoEditor;
