import { Tabs, TabList, Tab, tabClasses, TabPanel } from "@mui/joy";
import React from "react";
import { useTranslate } from "@/utils/i18n";
import TagManagerDialog from "./TagManage"
import RadialTag from "./RadialTag"
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

type Props = DialogProps;

const MainTagManagerDialog: React.FC<Props> = (props: Props) => {
  const { destroy } = props;
  const t = useTranslate();

  return (
    <>
      <Tabs aria-label="tabs" defaultValue={0} sx={{ bgcolor: 'transparent' }}>
      <div className="flex flex-row">
        <TabList
          disableUnderline
          sx={{
            p: 0.5,
            gap: 0.5,
            borderRadius: 'xl',
            bgcolor: 'background.level1',
            [`& .${tabClasses.root}[aria-selected="true"]`]: {
              boxShadow: 'sm',
              bgcolor: 'background.surface',
            },
          }}
          className="w-full flex flex-row"
        >
          <Tab disableIndicator className="w-full">标签</Tab>
          <Tab disableIndicator className="w-full">辐射图</Tab>
        </TabList>
        <button className="btn close-btn" onClick={() => destroy()}>
          <Icon.X />
        </button>
      </div>
      <TabPanel value={0}>
        <TagManagerDialog />
      </TabPanel>
      <TabPanel value={1}>
        <RadialTag />
      </TabPanel>
    </Tabs>
    </>

  );
};

function showTagManagerDialog() {
  generateDialog(
    {
      className: "tag-manager-main-dialog",
      dialogName: "tag-manager-main-dialog",
    },
    MainTagManagerDialog
  );
}

export default showTagManagerDialog;
