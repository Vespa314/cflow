import { Button, Switch } from "@mui/joy";
import Icon from "./Icon";
import { toast } from "react-hot-toast";
import { generateDialog } from "./Dialog";
import { useState } from "react";

interface Props extends DialogProps {
    sysShortcutConfig: string;
    onConfirm: (config: string) => void;
}

interface SystemShortcut {
    key: string;
    name: string;
    description: string;
}

const SYSTEM_SHORTCUTS: SystemShortcut[] = [
    { key: "todo", name: "待办", description: "插入待办列表" },
    { key: "code", name: "代码块", description: "插入代码块" },
    { key: "table", name: "新建表格", description: "插入表格" },
    { key: "add_col", name: "表格加一列", description: "为表格增加一列" },
    { key: "add_row", name: "表格加一行", description: "为表格增加一行" }
];

const SystemShortcutConfigDialog: React.FC<Props> = (props: Props) => {
    const { sysShortcutConfig, destroy, onConfirm } = props;

    // 解析当前配置
    const parseConfig = (config: string): Set<string> => {
        const keys = config.split(',').map(key => key.trim());
        return new Set(keys);
    };

    const [enabledShortcuts, setEnabledShortcuts] = useState<Set<string>>(
        parseConfig(sysShortcutConfig)
    );

    const handleShortcutToggle = (key: string) => {
        const newEnabledShortcuts = new Set(enabledShortcuts);
        if (newEnabledShortcuts.has(key)) {
            newEnabledShortcuts.delete(key);
        } else {
            newEnabledShortcuts.add(key);
        }
        setEnabledShortcuts(newEnabledShortcuts);
    };

    const handleSaveBtnClick = () => {
        // 保存配置
        const configString = Array.from(enabledShortcuts).join(',');
        onConfirm(configString);
        destroy();
    };

    return (
        <>
            <div className="dialog-header-container">
                <p className="title-text">系统快捷键配置</p>
                <button className="btn close-btn" onClick={() => destroy()}>
                    <Icon.X />
                </button>
            </div>
            <div className="dialog-content-container">
                <p className="text-sm text-gray-600 mb-4">
                    选择要启用的系统快捷键，这些快捷键将在编辑器中的快捷输入菜单中显示。
                </p>

                <div className="space-y-2 w-full">
                    {SYSTEM_SHORTCUTS.map((shortcut) => (
                        <div key={shortcut.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full">
                            <span className="font-medium text-gray-900">{shortcut.name}</span>
                            <Switch
                                checked={enabledShortcuts.has(shortcut.key)}
                                onChange={() => handleShortcutToggle(shortcut.key)}
                                size="sm"
                            />
                        </div>
                    ))}
                </div>

                <div className="w-full flex flex-row justify-end items-center mt-6 space-x-2">
                    <Button color="neutral" variant="plain" onClick={destroy}>
                        取消
                    </Button>
                    <Button color="primary" onClick={handleSaveBtnClick}>
                        保存
                    </Button>
                </div>
            </div>
        </>
    );
};

function showSystemShortcutConfigDialog(
    sysShortcutConfig: string,
    onConfirm: (config: string) => void
) {
    generateDialog(
        {
            className: "system-shortcut-config-dialog",
            dialogName: "system-shortcut-config-dialog",
        },
        SystemShortcutConfigDialog,
        {
            sysShortcutConfig,
            onConfirm,
        }
    );
}

export default showSystemShortcutConfigDialog;