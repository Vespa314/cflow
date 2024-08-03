import { Button, IconButton} from "@mui/joy";
import Icon from "../Icon";
import { toast } from "react-hot-toast";
import { useUserV1Store } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import showCreateCustomStyleDialog from "../CreateCustomCardStyleDialog";
import { useState } from "react";
import { CustomCardStyleType } from "./CustomCardStyleType"
import { showCommonDialog } from "../Dialog/CommonDialog";


const CustomCardStyle = () => {
    const t = useTranslate();
    const userV1Store = useUserV1Store();
    const setting = userV1Store.userSetting as UserSetting;
    const [config, setConfig] = useState<CustomCardStyleType[]>(setting.customCardStyle?JSON.parse(setting.customCardStyle):[]);

    const handleEditStyle = async (init_style: CustomCardStyleType, idx: number) => {
      showCreateCustomStyleDialog(
            (style: CustomCardStyleType, item_idx: number) => handleCreateCustomStyleDialogConfirm(style, item_idx),
            init_style,
            idx,
        )
    }

    const get_config_str = (new_config: CustomCardStyleType[]) => {
      return JSON.stringify(new_config);
    }

    const SaveStyle = async (new_config: CustomCardStyleType[]) => {
        try {
            await userV1Store.updateUserSetting(
                {
                    customCardStyle: get_config_str(new_config),
                },
                ["custom_card_style"]
            );
            toast.success("保存成功");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response.data.message);
        }
    }

    const handleDeleteStyle = async (style_item: CustomCardStyleType, idx: number) => {
        showCommonDialog({
            title: "删除快捷输入",
            content: `确定要删除自定义样式 \`${style_item.name}\`? `,
            style: "danger",
            dialogName: "delete-webhook-dialog",
            onConfirm: async () => {
                const newConfig = config.filter((_, index) => index !== idx);
                setConfig(newConfig);
                SaveStyle(newConfig);
            },
        });
    }

    const handleCreateCustomStyleDialogConfirm = async (style: CustomCardStyleType, item_idx: number) => {
        const new_config = [...config];
        if (item_idx === -1) {
            new_config.push(style);
            setConfig(new_config);
        } else {
            new_config[item_idx] = style;
            setConfig(new_config);
        }
        SaveStyle(new_config);
    }

    return (
    <>
      <div className="mb-2 w-full flex flex-row justify-between items-center">
        <p className="title-text !mt-2 !mb-2 flex items-center">自定义卡片样式
        </p>
        <Button
          variant="outlined"
          color="neutral"
          onClick={() => {
            showCreateCustomStyleDialog(handleCreateCustomStyleDialogConfirm);
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
                  <th scope="col" className="px-3 py-2 text-sm">
                    名称
                  </th>
                  <th scope="col" className="relative px-3 py-2 pr-4 text-sm">
                    规则
                  </th>
                  <th scope="col" className="relative px-3 py-2 pr-4 text-sm">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 ">
                {config.map((style_item, idx) => (
                  <tr key={idx}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 ">
                      <div className="flex flex-row items-center">
                        <span>{style_item.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 flex flex-row justify-center">
                      <div className="flex flex-row items-center">
                        <span>{style_item.rule}</span>
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap px-3 py-2 text-sm text-right">
                      <IconButton
                          variant="plain"
                          size="sm"
                          onClick={() => {
                            handleEditStyle(style_item, idx);
                          }}
                        >
                          <Icon.Edit className="w-4 h-auto" />
                      </IconButton>
                      <IconButton
                        color="danger"
                        variant="plain"
                        size="sm"
                        onClick={() => {
                          handleDeleteStyle(style_item, idx);
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
                      尚未配置自定义卡片样式
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

export default CustomCardStyle;