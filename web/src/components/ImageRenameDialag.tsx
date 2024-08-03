import { Button, IconButton, Input } from "@mui/joy";
import React, { useState, useEffect } from "react";
import { useTranslate } from "@/utils/i18n";
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

interface Props extends DialogProps {
    old_name: string;
    file: File | string;
    onConfirm: (name: string) => void;
}

const RenameImageDialog: React.FC<Props> = (props: Props) => {
  const { old_name, file, onConfirm, destroy } = props;
  const t = useTranslate();
  const [newName, setNewName] = useState(old_name.split(".")[0]);
  const [imageSrc, setImageSrc] = useState<string | null >(null);

  useEffect(() => {
    if (typeof file === 'string') {
      setImageSrc(file);
    } else {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [file]);

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  }

  const handleConfirm = async () => {
    onConfirm(newName + ".png");
    destroy();
  };

  return (
    <>
      <div className="dialog-header-container">
        <p className="title-text">重命名</p>
        <IconButton size="sm" onClick={() => destroy()}>
          <Icon.X className="w-5 h-auto" />
        </IconButton>
      </div>
      <div className="dialog-content-container max-w-2xs">
        <div className="w-full flex flex-col justify-start items-center mb-3">
          {imageSrc && <img className="w-64 border rounded hover:shadow-md mb-3" src={imageSrc} alt="Pasted" />}
          <div className="relative w-full mb-2 flex flex-row justify-start items-center space-x-2">
            <span className="w-20 text-sm whitespace-nowrap shrink-0 text-right">默认名：</span>
            <Input className="w-full" readOnly disabled type="text" placeholder="A new tag name" size="md" value={old_name} />
          </div>
          <div className="relative w-full mb-2 flex flex-row justify-start items-center space-x-2">
            <span className="w-20 text-sm whitespace-nowrap shrink-0 text-right">重命名为：</span>
            <Input
              className="w-full w-20"
              type="text"
              placeholder="image"
              size="md"
              value={newName}
              onChange={handleNameInputChange}
              onKeyDown={handleKeyDown}
            />
            <Input className="w-30" readOnly disabled type="text" size="md" value={".png"} />
          </div>
        </div>
        <div className="w-full flex flex-row justify-end items-center mt-2 space-x-2">
          <Button color="primary" disabled={newName==""} onClick={handleConfirm}>
            {t("common.confirm")}
          </Button>
        </div>
      </div>
    </>
  );
};

function showRenameImageDialog(
    old_name: string,
    file: File | string,
    onConfirm: (name: string) => void,
) {
  generateDialog(
    {
      className: "rename-image-dialog",
      dialogName: "rename-image-dialog",
    },
    RenameImageDialog,
    {
        old_name,
        file,
        onConfirm,
    }
  );
}

export default showRenameImageDialog;
