import classNames from "classnames";
import React from "react";
import { Resource } from "@/types/proto/api/v2/resource_service";
import { getResourceType, getResourceUrl } from "@/utils/resource";
import Icon from "./Icon";
import showPreviewImageDialog from "./PreviewImageDialog";
import SquareDiv from "./kit/SquareDiv";

interface Props {
  resource: Resource;
  className?: string;
  strokeWidth?: number;
}

const ResourceIcon = (props: Props) => {
  const { resource } = props;
  const resourceType = getResourceType(resource);
  const resourceUrl = getResourceUrl(resource);
  const className = classNames("w-full h-auto", props.className);
  const strokeWidth = props.strokeWidth;

  const previewResource = () => {
    window.open(resourceUrl);
  };

  if (resourceType === "image/*") {
    return (
      <SquareDiv className={classNames(className, "flex items-center justify-center overflow-clip")}>
        <img
          className="min-w-full min-h-full object-cover shadow"
          src={resourceUrl}
          onClick={() => showPreviewImageDialog(resourceUrl)}
        />
      </SquareDiv>
    );
  }

  const getResourceIcon = () => {
    switch (resourceType) {
      case "video/*":
        return <Icon.FileVideo2 strokeWidth={strokeWidth} className="w-full h-auto" />;
      case "audio/*":
        return <Icon.FileAudio strokeWidth={strokeWidth} className="w-full h-auto" />;
      case "text/*":
        return <Icon.FileText strokeWidth={strokeWidth} className="w-full h-auto" />;
      default:
        return <Icon.File strokeWidth={strokeWidth} className="w-full h-auto" />;
    }
  };

  return (
    <div onClick={previewResource} className={classNames(className, "max-w-[4rem] opacity-50")}>
      {getResourceIcon()}
    </div>
  );
};

export default React.memo(ResourceIcon);
