import { Button, IconButton, Input, List, ListItem } from "@mui/joy";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { tagServiceClient } from "@/grpcweb";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import { useTranslate } from "@/utils/i18n";
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

interface Props extends DialogProps {
  tag: string;
}

const RenameTagDialog: React.FC<Props> = (props: Props) => {
  const { tag, destroy } = props;
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const [newName, setNewName] = useState(tag);
  const requestState = useLoading(false);

  const handleTagNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value.trim());
  };

  const handleConfirm = async () => {
    if (!newName || newName.includes(" ")) {
      toast.error("新标签不能包含空格或为空");
      return;
    }
    if (newName === tag) {
      toast.error("新旧标签同名");
      return;
    }

    try {
      await tagServiceClient.renameTag({
        user: currentUser.name,
        oldName: tag,
        newName: newName,
      });
      toast.success("Rename tag successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.details);
    }
    destroy();
  };

  return (
    <>
      <div className="dialog-header-container">
        <p className="title-text">{"标签重命名"}</p>
        <IconButton size="sm" onClick={() => destroy()}>
          <Icon.X className="w-5 h-auto" />
        </IconButton>
      </div>
      <div className="dialog-content-container max-w-2xs">
        <div className="w-full flex flex-col justify-start items-start mb-3">
          <div className="relative w-full mb-2 flex flex-row justify-start items-center space-x-2">
            <span className="w-20 text-sm whitespace-nowrap shrink-0 text-right">原标签：</span>
            <Input className="w-full" readOnly disabled type="text" placeholder="A new tag name" size="md" value={tag} />
          </div>
          <div className="relative w-full mb-2 flex flex-row justify-start items-center space-x-2">
            <span className="w-20 text-sm whitespace-nowrap shrink-0 text-right">新标签：</span>
            <Input
              className="w-full"
              type="text"
              placeholder="A new tag name"
              size="md"
              value={newName}
              onChange={handleTagNameInputChange}
            />
          </div>
          <List className="!leading-5" size="sm" marker="disc">
            <ListItem><span className="text-red-600">此操作会影响所有包含<span className="text-blue-600">#{tag}</span>的卡片</span></ListItem>
            <ListItem><span className="text-red-600">更新后无法直接撤销修改，只能再次重命名！</span></ListItem>
            <ListItem>若涉及卡片较多，此操作耗时会较长！</ListItem>
            <ListItem>更新后需<span className="text-green-600">刷新页面</span>查看！</ListItem>
            <ListItem>若有次级别标签，更新后需去<span className="text-green-600">全部标签</span>处理一下</ListItem>
          </List>
        </div>
        <div className="w-full flex flex-row justify-end items-center mt-2 space-x-2">
          <Button color="neutral" variant="plain" disabled={requestState.isLoading} loading={requestState.isLoading} onClick={destroy}>
            {t("common.cancel")}
          </Button>
          <Button color="primary" disabled={requestState.isLoading} loading={requestState.isLoading} onClick={handleConfirm}>
            {t("common.confirm")}
          </Button>
        </div>
      </div>
    </>
  );
};

function showRenameTagDialog(props: Pick<Props, "tag">) {
  generateDialog(
    {
      className: "rename-tag-dialog",
      dialogName: "rename-tag-dialog",
    },
    RenameTagDialog,
    props,
  );
}

export default showRenameTagDialog;