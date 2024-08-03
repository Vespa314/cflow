import { Input, Textarea, Button } from "@mui/joy";
import Icon from "./Icon";
import { toast } from "react-hot-toast";
import { generateDialog } from "./Dialog";
import { useState } from "react";
import { useTranslate } from "@/utils/i18n";
import { CustomCardStyleType }from "../components/Settings/CustomCardStyleType";

interface Props extends DialogProps {
    style_init?: CustomCardStyleType;
    onConfirm: (shourcut: CustomCardStyleType, item_idx: number) => void;
    item_idx?: number;
}


const CreateCustomCardDialog: React.FC<Props> = (props: Props) => {
    const t = useTranslate();
    const { style_init, destroy, onConfirm, item_idx} = props;
    const [style, setStyle] = useState<CustomCardStyleType>({
        name: style_init ? style_init?.name : "",
        rule: style_init ? style_init?.rule : "",
        style: style_init ? style_init?.style : "",
        icon: style_init ? style_init?.icon : "",
    });

    const handleSaveBtnClick = async () => {
        if (!style.name) {
            toast.error("名称不能为空");
            return;
        }
        if(item_idx==undefined) {
            onConfirm(style, -1);
        } else {
            onConfirm(style, item_idx);
        }

        destroy();
      };

    return (
        <>
            <div className="dialog-header-container">
                <p className="title-text">卡片样式</p>
                <button className="btn close-btn" onClick={() => destroy()}>
                <Icon.X />
                </button>
            </div>
            <div className="dialog-content-container">
                <div className="flex flex-row items-center justify-between w-full">
                    <label className="whitespace-nowrap">
                        <span className="text-red-600">*</span>
                        名称：
                    </label>
                    <Input
                        value={style.name}
                        onChange={(e) => setStyle({ ...style, name: e.target.value })}
                        className="w-full"
                    />
                </div>
                <label className="flex flex-row items-center justify-between">
                    <span className="text-red-600">*</span>
                    规则
                </label>

                <Textarea
                    value={style.rule}
                    onChange={(e) => setStyle({ ...style, rule: e.target.value })}
                    placeholder=""
                    className="w-full mb-1"
                    minRows={4}
                />
                <label className="flex flex-row items-center justify-between">
                    样式
                </label>
                <Textarea
                    value={style.style}
                    onChange={(e) => setStyle({ ...style, style: e.target.value })}
                    placeholder={"background-color: #FF0000;..."}
                    className="w-full mb-1"
                    minRows={2}
                />
                <label className="flex flex-row items-center justify-between">
                    图标/emoji
                </label>
                <Input
                    value={style.icon}
                    onChange={(e) => setStyle({ ...style, icon: e.target.value })}
                    placeholder=""
                    className="w-full mb-1"
                />
                <div className="w-full flex flex-row justify-end items-center mt-2 space-x-2">
                    <Button color="neutral" variant="plain" onClick={destroy}>
                        {t("common.cancel")}
                    </Button>
                    <Button color="primary" onClick={handleSaveBtnClick}>
                        保存
                    </Button>
                </div>
            </div>
        </>
    )
}

function showCreateCustomStyleDialog(
    onConfirm: (style: CustomCardStyleType, item_idx: number) => void,
    style_init?: CustomCardStyleType,
    item_idx?: number,
) {
    generateDialog(
      {
        className: "create-custom-style-dialog",
        dialogName: "create-custom-style-dialog",
        containerClassName: "w-[400px]"
      },
      CreateCustomCardDialog,
      {
        onConfirm,
        style_init,
        item_idx,
      }
    );
  }

export default showCreateCustomStyleDialog;
