import { Tabs, TabList, Tab, tabClasses, TabPanel } from "@mui/joy";
import React from "react";
import { useTranslate } from "@/utils/i18n";
import BubbleHeatmap from "./BubbleHeatmap";
import PostHeatmap from "./PostHeatmap";
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

interface Props extends DialogProps {
}

const UsageDialog: React.FC<Props> = (props: Props) => {
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
          <Tab disableIndicator className="w-full">热力图</Tab>
          <Tab disableIndicator className="w-full">发表时间分布</Tab>
        </TabList>
        <button className="btn close-btn" onClick={() => destroy()}>
          <Icon.X />
        </button>
      </div>
      <TabPanel value={0}>
        <PostHeatmap />
      </TabPanel>
      <TabPanel value={1}>
        <BubbleHeatmap />
      </TabPanel>
    </Tabs>
    </>

  );
};

function showUsageDialog() {
  generateDialog(
    {
      className: "usage-dialog",
      dialogName: "usage-dialog",
    },
    UsageDialog,
    {
    }
  );
}

export default showUsageDialog;
