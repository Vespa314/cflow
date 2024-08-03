import { Input, Checkbox, Textarea, Button, Option, Select, Tooltip, Divider } from "@mui/joy";
import Icon from "./Icon";
import { toast } from "react-hot-toast";
import { generateDialog } from "./Dialog";
import { useState, useEffect } from "react";
import { useTranslate } from "@/utils/i18n";
import { ShortcutType }from "../components/Settings/ShortcurType";

interface Props extends DialogProps {
    shortcut_init?: ShortcutType;
    onConfirm: (shourcut: ShortcutType, item_idx: number) => void;
    item_idx?: number;
    existing_shortcuts: ShortcutType[];
}


const CreateShortcutDialog: React.FC<Props> = (props: Props) => {
    const t = useTranslate();
    const { shortcut_init, destroy, onConfirm, item_idx, existing_shortcuts} = props;
    const [shortcut, setShortcut] = useState<ShortcutType>({
        name: shortcut_init ? shortcut_init?.name : "",
        content: shortcut_init ? shortcut_init?.content : "",
        shortcut: shortcut_init ? shortcut_init?.shortcut : "",
        pc_show: shortcut_init ? shortcut_init?.pc_show : false,
        mobile_show: shortcut_init ? shortcut_init?.mobile_show : false,
        icon: shortcut_init ? shortcut_init?.icon : "",
        tips: shortcut_init ? shortcut_init?.tips : "",
        meta_key: shortcut_init ? shortcut_init?.meta_key : "",
    });
    const IconList = (Icon.icons as { [key: string]: any });
    const [icon, setIcon] = useState<React.ReactNode>(<Icon.FileQuestion className="text-red-500 w-4 h-auto" />);

    const [pc_show, setPcShow] = useState(shortcut_init ? shortcut_init?.pc_show : false);
    const [mobile_show, setMobileShow] = useState(shortcut_init ? shortcut_init?.mobile_show : false);

    const handlePcShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPcShow(e.target.checked);
        setShortcut({ ...shortcut, pc_show: e.target.checked });
    }

    const handleMobileShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMobileShow(e.target.checked);
        setShortcut({ ...shortcut, mobile_show: e.target.checked });
    }

    useEffect(() => {
        if (!shortcut.icon) {
            return;
        }
        if (IconList[shortcut.icon]) {
            const LucideIcon = IconList[shortcut.icon];
            setIcon(<LucideIcon className="w-4 h-auto" />);
        }
    }, []);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShortcut({ ...shortcut, icon: e.target.value });
        if (IconList[e.target.value]) {
            const LucideIcon = IconList[e.target.value];
            setIcon(<LucideIcon className="w-4 h-auto" />);
        } else {
            setIcon(<Icon.FileQuestion className="text-red-500 w-4 h-auto" />);
        }
    }

    const handleMetaKeyChange = (
        event: React.SyntheticEvent | null,
        newValue: string | null,
      ) => {
        if (!newValue) {
            return;
        }
        setShortcut({ ...shortcut, meta_key: newValue });
      };

    const handleSaveBtnClick = async () => {
        if (!shortcut.name) {
            toast.error("名称不能为空");
            return;
        }

        for (let i = 0; i < existing_shortcuts.length; i++) {
            if (existing_shortcuts[i].name === shortcut.name && i !== item_idx) {
                toast.error(shortcut.name + "已存在");
                return;
            }
            if (!shortcut.shortcut) {
                continue;
            }
            const exist_key = existing_shortcuts[i].shortcut;
            if (exist_key === undefined) {
                continue;
            }
            if (exist_key.toLowerCase() === shortcut.shortcut.toLowerCase() && i !== item_idx) {
                toast.error("快捷键和“”"+existing_shortcuts[i].name+"”重复");
                return;
            }
        }

        if (shortcut?.icon && !IconList[shortcut.icon]) {
            toast.error("icon不存在");
            return;
        }
        if(item_idx==undefined) {
            onConfirm(shortcut, -1);
        } else {
            onConfirm(shortcut, item_idx);
        }

        destroy();
      };

    return (
        <>
            <div className="dialog-header-container">
                <p className="title-text">自定义快捷输入</p>
                <button className="btn close-btn" onClick={() => destroy()}>
                <Icon.X />
                </button>
            </div>
            <div className="dialog-content-container">
                <div className="flex flex-row items-center justify-between w-full">
                    <label>
                        <span className="text-red-600">*</span>
                        名称：
                    </label>
                    <Input
                        value={shortcut.name}
                        onChange={(e) => setShortcut({ ...shortcut, name: e.target.value })}
                    />
                </div>
                <label className="flex flex-row items-center justify-between">
                    <span className="text-red-600">*</span>
                    输入内容
                    <Tooltip title={
                        <div className="flex flex-col items-start">
                            <span>支持的变量：</span>
                            <span><span className="text-green-500">$CURSOR$</span>: 插入后光标位置</span>
                            <span><span className="text-green-500">$SELECT$</span>: 编辑器选中的内容（如果有的话）</span>
                            <span><span className="text-green-500">$CLIPBOARD$</span>: 剪贴板文本（如果有的话）</span>
                            <span><span className="text-green-500">^开头</span>表示保证插入位置为一行开头</span>
                            <Divider className="!mb-4"/>
                            <span>日期支持:</span>
                            <span>基础格式:<span className="text-green-500">$datetime:YYYYMMDD$</span></span>
                            <span>其中冒号后面的语法参考：https://dayjs.fenxianglu.cn/category/display.html</span>
                            <span>月份星期信息中文显示则为<span className="text-green-500">$datetime-zh:...$</span></span>
                            <Divider className="!mb-2"/>
                            <span>进阶格式:<span className="text-green-400 bold">$datetime|+1d,-3m...:YYYYMMDD$</span></span>
                            <span><span className="text-green-400 bold">|</span>后面的语法为：<span className="text-green-400 bold">+/-</span>后面接<span className="text-green-400 bold">数字</span>再接<span className="text-green-400 bold">单位</span>，逗号分隔</span>
                            <span>单位的语法参考https://dayjs.fenxianglu.cn/category/manipulate.html里面的缩写部分</span>
                        </div>
                    } placement="top" arrow>
                        <Icon.HelpCircle className="w-4 h-auto ml-1 text-gray-500"/>
                    </Tooltip>：
                </label>
                <Textarea
                    value={shortcut.content}
                    onChange={(e) => setShortcut({ ...shortcut, content: e.target.value })}
                    placeholder="插入正文的内容"
                    className="w-full mb-1"
                    minRows={3}
                />
                <div className="relative flex flex-row items-center justify-between w-full">
                    <label>Icon</label><Tooltip title={
                        <div className="flex flex-col items-start">
                            <span>图标来源：https://lucide.dev/icons/</span>
                            <span>找到图标名，去掉-，首字母全部变成大写，即为所得</span>
                            <span>比如arrow-up-from-line，则填写 ArrowUpFromLine</span>
                        </div>
                    } placement="top" arrow>
                        <Icon.HelpCircle className="w-4 h-auto ml-1 text-gray-500"/>
                    </Tooltip>
                    ：
                    <Input value={shortcut.icon} onChange={handleIconChange} />
                    <span className="text-gray-500">
                        {icon}
                    </span>
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                    <label>快捷键：</label>
                    <Input
                        value={shortcut.shortcut}
                        onChange={(e) => setShortcut({ ...shortcut, shortcut: e.target.value })}
                    />
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                    <label>在PC端一级目录显示：</label>
                    <Checkbox
                        checked={pc_show}
                        onChange={handlePcShowChange}
                    />
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                    <label>在移动端一级目录显示：</label>
                    <Checkbox
                        checked={mobile_show}
                        onChange={handleMobileShowChange}
                    />
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                    <label>提示：</label>
                    <Input
                        value={shortcut.tips}
                        onChange={(e) => setShortcut({ ...shortcut, tips: e.target.value })}
                    />
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                    <label className="whitespace-nowrap">Meta键：</label>
                    <Select defaultValue="ctrl+cmd" className="w-full" onChange={handleMetaKeyChange}>
                        <Option value="ctrl+cmd">ctrl/cmd</Option>
                        <Option value="ctrl">ctrl</Option>
                        <Option value="cmd">cmd</Option>
                    </Select>
                </div>
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

function showCreateShortcutDialog(
    onConfirm: (shourcut: ShortcutType, item_idx: number) => void,
    existing_shortcuts: ShortcutType[],
    shortcut_init?: ShortcutType,
    item_idx?: number,
) {
    generateDialog(
      {
        className: "create-shortcut-dialog",
        dialogName: "create-shortcut-dialog",
      },
      CreateShortcutDialog,
      {
        onConfirm,
        shortcut_init,
        item_idx,
        existing_shortcuts,
      }
    );
  }

export default showCreateShortcutDialog;
