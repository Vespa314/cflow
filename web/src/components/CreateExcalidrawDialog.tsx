import { generateDialog } from "./Dialog";
import React, { useState } from "react";
import { Excalidraw, exportToClipboard, MainMenu, WelcomeScreen, exportToBlob } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import useLocalStorage from "react-use/lib/useLocalStorage";
import { Button } from "@mui/joy";
import toast from "react-hot-toast";

interface Props extends DialogProps {
  onConfirm: (blob: Blob) => void;
  CacheKey: string;
}

const CreateExcalidrawDialog: React.FC<Props> = (props: Props) => {
  const { onConfirm, destroy, CacheKey } = props;
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [cache, setCache] = useLocalStorage<any | null>(CacheKey + "-excalidraw", null);

  const handleExit = () => {
    if (excalidrawAPI && CacheKey) {
      setCache(excalidrawAPI.getSceneElements());
    }
    destroy();
  }

  const onExport = async () => {
    if (!excalidrawAPI) {
      return
    }
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      return
    }
    const blob = await exportToBlob({
        elements,
        mimeType: "image/png",
        files: excalidrawAPI.getFiles(),
      },
    );
    onConfirm(blob)
    handleExit();
  }

  const onExportToClipboard = async () => {
    if (!excalidrawAPI) {
      return
    }
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      return
    }
    await exportToClipboard({
      elements,
      files: excalidrawAPI.getFiles(),
      type: "png",
    });
    toast.success("已复制")
  }

  return (
    <div className="custom-styles w-full h-full">
      <Excalidraw
        excalidrawAPI={(api)=> setExcalidrawAPI(api as ExcalidrawImperativeAPI)}
        initialData={{
          elements: cache || [],
        }}
        renderTopRightUI={() => {
          return (
            <>
              <Button color="primary" variant="solid" onClick={async () => {onExport();}}>保存</Button>
              <Button color="primary" variant="outlined" onClick={async () => {onExportToClipboard();}}>复制到剪贴板</Button>
              <Button color="neutral" variant="solid" onClick={async () => {handleExit();}}>关闭</Button>
            </>
          );
        }}
      >
        <WelcomeScreen >
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Heading>
              Welcome to cflow drawing~
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>

        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
        </MainMenu>
      </Excalidraw>
    </div>

  );
}

function showCreateExcalidrawDialog(
  onConfirm: (blob: Blob) => void,
  CacheKey: string = "",
) {
    generateDialog(
      {
        className: "create-excalidraw-dialog",
        dialogName: "create-excalidraw-dialog",
        containerClassName: "w-full h-full"
      },
      CreateExcalidrawDialog,
      {
        onConfirm,
        CacheKey,
      }
    );
  }

export default showCreateExcalidrawDialog;
