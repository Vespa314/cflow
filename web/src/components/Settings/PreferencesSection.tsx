import { Divider, Option, Select, Switch } from "@mui/joy";
import React from "react";
import { VISIBILITY_SELECTOR_ITEMS } from "@/helpers/consts";
import { useGlobalStore } from "@/store/module";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import { useTranslate } from "@/utils/i18n";
import AppearanceSelect from "../AppearanceSelect";
import LocaleSelect from "../LocaleSelect";
import VisibilityIcon from "../VisibilityIcon";
import "@/less/settings/preferences-section.less";


const PreferencesSection = () => {
  const t = useTranslate();
  const globalStore = useGlobalStore();
  const userV1Store = useUserV1Store();
  const { appearance, locale } = globalStore.state;
  const setting = userV1Store.userSetting as UserSetting;

  const handleLocaleSelectChange = async (locale: Locale) => {
    await userV1Store.updateUserSetting(
      {
        locale,
      },
      ["locale"]
    );
    globalStore.setLocale(locale);
  };

  const handleAppearanceSelectChange = async (appearance: Appearance) => {
    await userV1Store.updateUserSetting(
      {
        appearance,
      },
      ["appearance"]
    );
    globalStore.setAppearance(appearance);
  };

  const handleDefaultMemoVisibilityChanged = async (value: string) => {
    await userV1Store.updateUserSetting(
      {
        memoVisibility: value,
      },
      ["memo_visibility"]
    );
  };

  const handleShowWordCntChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        showWordCnt: event.target.checked,
      },
      ["show_word_cnt"]
    );
  };

  const handleRefPreviewChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        refPreview: event.target.checked,
      },
      ["ref_preview"]
    );
  };

  const handleShowTodoPageChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        showTodoPage: event.target.checked,
      },
      ["show_todo_page"]
    );
  };

  const handleShowArchiveChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        showArchivePage: event.target.checked,
      },
      ["show_archive_page"]
    );
  };

  const handleMarkWithTagChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        markWithTag: event.target.checked,
      },
      ["mark_with_tag"]
    );
  };

  const handleShowTagSelectorChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        showTagSelector: event.target.checked,
      },
      ["show_tag_selector"]
    );
  }

  const handleShowMemoPublicChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        showMemoPublic: event.target.checked,
      },
      ["show_memo_public"]
    );
  }

  const handlePasteRenameChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        pasteRename: event.target.checked,
      },
      ["paste_rename"]
    );
  }

  const handleDoubleClickEditChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        doubleClickEdit: event.target.checked,
      },
      ["double_click_edit"]
    );
  }

  const handleUseExcalidrawChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await userV1Store.updateUserSetting(
      {
        useExcalidraw: event.target.checked,
      },
      ["use_excalidraw"]
    );
  }

  return (
    <div className="section-container preferences-section-container">
      <p className="title-text">{t("common.basic")}</p>
      <div className="form-label selector">
        <span className="text-sm">{t("common.language")}</span>
        <LocaleSelect value={locale} onChange={handleLocaleSelectChange} />
      </div>
      <div className="form-label selector">
        <span className="text-sm">{t("setting.preference-section.theme")}</span>
        <AppearanceSelect value={appearance} onChange={handleAppearanceSelectChange} />
      </div>
      <Divider className="!mt-3" />
      <p className="title-text flex !mb-0 flex-row items-center">{t("setting.preference")}</p>
      <div className="form-label selector">
        <span className="text-sm break-keep text-ellipsis overflow-hidden">{t("setting.preference-section.default-memo-visibility")}</span>
        <Select
          className="!min-w-fit"
          value={setting.memoVisibility}
          startDecorator={<VisibilityIcon visibility={setting.memoVisibility as Visibility} />}
          onChange={(_, visibility) => {
            if (visibility) {
              handleDefaultMemoVisibilityChanged(visibility);
            }
          }}
        >
          {VISIBILITY_SELECTOR_ITEMS.map((item) => (
            <Option key={item} value={item} className="whitespace-nowrap">
              {t(`memo.visibility.${item.toLowerCase() as Lowercase<typeof item>}`)}
            </Option>
          ))}
        </Select>
      </div>
      <p className="title-text !mb-0 flex flex-row items-center">编辑器</p>
      <label className="form-label selector">
        <div className="flex flex-row items-center">
          <span className="text-sm break-keep mr-1">显示字数</span>
        </div>
        <Switch className="ml-2" checked={setting.showWordCnt} onChange={handleShowWordCntChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">引用时附带tag</span>
        <Switch className="ml-2" checked={setting.markWithTag} onChange={handleMarkWithTagChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">显示标签选择器</span>
        <Switch className="ml-2" checked={setting.showTagSelector} onChange={handleShowTagSelectorChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">显示卡片公开入口</span>
        <Switch className="ml-2" checked={setting.showMemoPublic} onChange={handleShowMemoPublicChanged} />
      </label>
      <label className="form-label selector">
        <div className="flex flex-row items-center">
          <span className="text-sm break-keep mr-1">截图重命名</span>
        </div>
        <Switch className="ml-2" checked={setting.pasteRename} onChange={handlePasteRenameChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">双击编辑</span>
        <Switch className="ml-2" checked={setting.doubleClickEdit} onChange={handleDoubleClickEditChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">使用Excalidraw</span>
        <Switch className="ml-2" checked={setting.useExcalidraw} onChange={handleUseExcalidrawChanged} />
      </label>
      <p className="title-text !mb-0 flex flex-row items-center">页面入口显示</p>
      <Divider className="" />
      <label className="form-label selector">
        <span className="text-sm break-keep">卡片引用预览</span>
        <Switch className="ml-2" checked={setting.refPreview} onChange={handleRefPreviewChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">TODO</span>
        <Switch className="ml-2" checked={setting.showTodoPage} onChange={handleShowTodoPageChanged} />
      </label>
      <label className="form-label selector">
        <span className="text-sm break-keep">归档</span>
        <Switch className="ml-2" checked={setting.showArchivePage} onChange={handleShowArchiveChanged} />
      </label>
      <Divider className="!my-4" />
    </div>
  );
};

export default PreferencesSection;
