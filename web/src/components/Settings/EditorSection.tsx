import CustomShortcutSection from "./CustomShortcutSection";
import { UserSetting } from "@/types/proto/api/v2/user_service";
import { useUserV1Store } from "@/store/v1";

import "@/less/settings/preferences-section.less";


const EditorSection = () => {
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;

  return (
    <div className="section-container preferences-section-container">
      <CustomShortcutSection />
    </div>
  );
};

export default EditorSection;
