import { Button, IconButton } from "@mui/joy";
import Icon from "../Icon";
import { toast } from "react-hot-toast";
import { useUserV1Store } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import showCreateShortcutDialog from "../CreateShortcutDialog";
import { useState } from "react";
import { ShortcutType } from "./ShortcurType";
import { showCommonDialog } from "../Dialog/CommonDialog";

const CustomIcon = ({ name }: { name: string }) => {
  const LucideIcon = (Icon.icons as { [key: string]: any })[name];
  return <LucideIcon className="w-4 h-auto mr-2" />;
};


const CustomShortcutSection = () => {
    const t = useTranslate();
    const userV1Store = useUserV1Store();
    const setting = userV1Store.userSetting as UserSetting;
    const [config, setConfig] = useState<ShortcutType[]>(setting.customShortcut?JSON.parse(setting.customShortcut):[]);

    const handleEditShortcut = async (init_shortcut: ShortcutType, idx: number) => {
        showCreateShortcutDialog(
            (shortcut: ShortcutType, item_idx: number) => handleCreateshortcutDialogConfirm(shortcut, item_idx),
            config,
            init_shortcut,
            idx,
        )
    }

    const get_config_str = (new_config: ShortcutType[]) => {
      let format_list = []
      for (let item of new_config) {
          let new_item: Record<string, any> = {
              name: item.name,
              content: item.content,
              shortcut: item.shortcut,
              pc_show: item.pc_show,
              mobile_show: item.mobile_show,
              icon: item.icon,
              tips: item.tips,
              meta_key: item.meta_key,
          }
          // 删除掉所有值为undefined的属性
          for (let key in new_item) {
              if (new_item[key] === undefined) {
                  delete new_item[key];
              }
          }
          format_list.push(new_item);
      }
      return JSON.stringify(format_list);
    }

    const SaveShortcut = async (new_config: ShortcutType[]) => {
        try {
            await userV1Store.updateUserSetting(
                {
                    customShortcut: get_config_str(new_config),
                },
                ["custom_shortcut"]
            );
            toast.success("保存成功");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response.data.message);
        }
    }


    const handleDeleteShortcut = async (shortcut_item: ShortcutType, idx: number) => {
        showCommonDialog({
            title: "删除快捷输入",
            content: `确定要删除快捷输入 \`${shortcut_item.name}\`? `,
            style: "danger",
            dialogName: "delete-webhook-dialog",
            onConfirm: async () => {
                const newConfig = config.filter((_, index) => index !== idx);
                setConfig(newConfig);
                SaveShortcut(newConfig);
            },
        });
    }

    const handleCreateshortcutDialogConfirm = async (shortcut: ShortcutType, item_idx: number) => {
        const new_config = [...config];
        if (item_idx === -1) {
            new_config.push(shortcut);
            setConfig(new_config);
        } else {
            new_config[item_idx] = shortcut;
            setConfig(new_config);
        }
        SaveShortcut(new_config);
    }
    return (
    <>
      <div className="mb-2 w-full flex flex-row justify-between items-center">
        <p className="title-text !mt-2 !mb-2 flex items-center">自定义快捷输入
        </p>
        <Button
          variant="outlined"
          color="neutral"
          onClick={() => {
            showCreateShortcutDialog(handleCreateshortcutDialogConfirm, config);
          }}
        >
          {t("common.create")}
        </Button>
      </div>
      <div className="w-full mt-2 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full border rounded-lg align-middle">
            <table className="min-w-full divide-y divide-gray-300 ">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 text-sm font-semibold text-gray-900 ">
                    名称
                  </th>
                  <th scope="col" className="px-3 py-2 text-sm font-semibold text-gray-900 text-center">
                    内容
                  </th>
                  <th scope="col" className="relative px-3 py-2 pr-4 ">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 ">
                {config.map((shortcut_item, idx) => (
                  <tr key={idx}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 ">
                      <div className="flex flex-row items-center">
                        <span>{shortcut_item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 ">
                      {shortcut_item.content}
                    </td>
                    <td className="relative whitespace-nowrap px-3 py-2 text-sm">
                      <IconButton
                          variant="plain"
                          size="sm"
                          onClick={() => {
                            handleEditShortcut(shortcut_item, idx);
                          }}
                        >
                          <Icon.Edit className="w-4 h-auto" />
                      </IconButton>
                      <IconButton
                        color="danger"
                        variant="plain"
                        size="sm"
                        onClick={() => {
                          handleDeleteShortcut(shortcut_item, idx);
                        }}
                      >
                        <Icon.Trash className="w-4 h-auto" />
                      </IconButton>
                    </td>
                  </tr>
                ))}

                {config.length === 0 && (
                  <tr>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 " colSpan={3}>
                      尚未配置快捷输入
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>)

}

export default CustomShortcutSection;