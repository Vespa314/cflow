import Icon from "@/components/Icon";
import React from 'react';
import { useTranslate } from "@/utils/i18n";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import { Tooltip, IconButton, Divider } from "@mui/joy";

interface Props {
    onActionSelectorClick: (action: string) => void;
    fullScreen: boolean;
}

const CustomIcon = ({ name }: { name: string }) => {
  const LucideIcon = (Icon.icons as { [key: string]: any })[name];
  return <LucideIcon className="w-4 h-auto mr-2" />;
};

const InputActionSelector = (props: Props) => {
  const t = useTranslate();
  const { fullScreen, onActionSelectorClick } = props;
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;

  // 获取启用的系统快捷键配置
  const sysShortcutConfig = userSetting.sysShortcutConfig == undefined ? "todo,code,table,add_col,add_row" : userSetting.sysShortcutConfig;
  const enabledSystemShortcuts = new Set(sysShortcutConfig.split(',').map(key => key.trim()));

  const action_list = [
    { name: "待办", action: "checkbox", icon: "CheckSquare", tips: "todo list", configKey: "todo"},
    { name: "代码块", action: "code", icon: "Code", tips: "代码", configKey: "code"},
    { name: "新建表格", action: "add_table", icon: "Table", tips: "输入表格", configKey: "table"},
    { name: "表格加一列", action: "add_col", icon: "ArrowRightToLine", tips: "表格增加一列", configKey: "add_col"},
    { name: "表格加一行", action: "add_row", icon: "ArrowDownToLine", tips: "表格增加一行", configKey: "add_row"},
  ].filter(item => enabledSystemShortcuts.has(item.configKey)); // 只显示启用的系统快捷键

  let custom_shortcut = []
  if (userSetting?.customShortcut) {
    custom_shortcut = JSON.parse(userSetting?.customShortcut);
  }

  if (custom_shortcut.length > 0) {
    for (let i = 0; i < custom_shortcut.length; i++) {
      if(custom_shortcut[i].hasOwnProperty('disable') && custom_shortcut[i]['disable'] === true) {
        continue;
      }
      action_list.push({
        name: custom_shortcut[i]['name'],
        action: `custom_shortcut_${custom_shortcut[i]['content']}`,
        icon: custom_shortcut[i]['icon'] || "User",
        tips: custom_shortcut[i]['tips'] || custom_shortcut[i]['content'],
        configKey: '', // 自定义快捷键不需要configKey
      });
    }
  }

  return (
    <IconButton className="relative group flex flex-row justify-center items-center p-1 w-auto h-auto mr-1 select-none rounded cursor-pointer text-gray-600 hover:bg-gray-300 hover:shadow">
      <Icon.SquareSlash className="w-5 h-5 mx-auto" />
      <div className={`hidden flex-row justify-start items-start flex-wrap absolute ${fullScreen ? "bottom-9" : "top-8"} left-0 mt-1 p-1 z-1 rounded h-auto overflow-y-auto font-mono shadow bg-zinc-200 group-hover:inline`}>
        {
          action_list.filter((action) => !action.action.startsWith("custom_shortcut_")).map((action_info) => {
            const padding_style = {
              paddingLeft: `0.5rem`,
              display: 'flex',
              alignItems: 'center',
              paddingRight: `0.5rem`,
            } as React.CSSProperties;
            return (
              <Tooltip title={action_info['tips']} placement="right" key={action_info['name']} >
                <span
                  className={"w-full max-w-full truncate text-black cursor-pointer rounded text-sm leading-6 hover:bg-zinc-300 shrink-0 "}
                  onClick={() => onActionSelectorClick(action_info['action'])}
                  style={padding_style}
                >
                  <CustomIcon name={action_info['icon']} />{action_info['name']}
                </span>
              </Tooltip>
            );
          })
        }
        {
          action_list.filter((action) => action.action.startsWith("custom_shortcut_")).map((action_info) => {
            const padding_style = {
              paddingLeft: `0.5rem`,
              display: 'flex',
              alignItems: 'center',
              paddingRight: `0.5rem`,
            } as React.CSSProperties;
            return (
              <Tooltip title={action_info['tips']} placement="right" key={action_info['name']} >
                <span
                  className={"w-full max-w-full truncate text-black cursor-pointer rounded text-sm leading-6 hover:bg-zinc-300 shrink-0 "}
                  onClick={() => onActionSelectorClick(action_info['action'])}
                  style={padding_style}
                >
                  <CustomIcon name={action_info['icon']} />{action_info['name']}
                </span>
              </Tooltip>
            );
          })
        }
      </div>
    </IconButton>
  );
};

export default InputActionSelector;
