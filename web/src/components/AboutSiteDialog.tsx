import { Divider } from "@mui/joy";
import { useGlobalStore } from "@/store/module";
import { useTranslate } from "@/utils/i18n";
import { generateDialog } from "./Dialog";
import Icon from "./Icon";

type Props = DialogProps;

const AboutSiteDialog: React.FC<Props> = ({ destroy }: Props) => {
  const t = useTranslate();
  const globalStore = useGlobalStore();
  const customizedProfile = globalStore.state.systemStatus.customizedProfile;

  const handleCloseBtnClick = () => {
    destroy();
  };

  return (
    <>
      <div className="dialog-header-container">
        <p className="title-text flex items-center">
          {t("common.about")} {customizedProfile.name}
        </p>
        <button className="btn close-btn" onClick={handleCloseBtnClick}>
          <Icon.X />
        </button>
      </div>
      <div className="flex flex-col justify-start items-start max-w-full w-96">
        <p className="text-xm">{t("about.memos-description")}</p>
        <div className="mb-4 mt-4 w-full flex flex-row text-sm justify-start items-center">
          <a href="https://github.com/usememos/memos" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
          <img className="w-6 h-auto rounded-full mr-1" src="/logo.png" alt="" />
            Memos
          </a>
          ————魔改————→
          <a href="https://github.com/Vespa314/cflow" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
            cflow
            <img className="w-6 h-auto rounded-full mr-1" src="/cflow.jpg" alt="" />
          </a>
        </div>
        <Divider className="!mt-1 !my-1" />
        依赖项目：
        <div className="w-full text-sm justify-start items-center">
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span>
              <a href="https://github.com/Yidadaa/ChatGPT-Next-Web" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/ChatGPT-Next-Web.svg" alt="" />ChatGPT-Next-Web
              </a>
            </span>
            →
            cflow Brain
          </p>
          <p className="flex flex-item li-container p-1">
          <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://openai.com/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/openai.png" alt="" />ChatGPT
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span className="flex flex-row justify-start items-center mx-1">
                <img className="w-5 h-auto rounded-full mr-1 " src="/emb_svr.png" alt="" />Embedding Server
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://github.com/tiangolo/fastapi" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/fastapi.png" alt="" />FastAPI
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://github.com/facebookresearch/faiss" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/faiss.png" alt="" />Faiss
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span className="flex flex-row justify-start items-center mx-1">
                <img className="w-5 h-auto rounded-full mr-1" src="/django.png" alt="" />cflow Django Backend
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span>
              <a href="https://artalk.js.org/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/artalk.png" alt="" />Artalk
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span>
              <a href="https://excalidraw.com/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
                <img className="w-5 h-auto rounded-full mr-1" src="/excalidraw_logo.png" alt="" />Excalidraw
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block">•</span>
            <span className="flex flex-row justify-start items-center mx-1">
                <img className="w-5 h-auto rounded-full mr-1" src="/logo.webp" alt="" />cflow Utils
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://github.com/wallabag/wallabag" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
              <img className="w-5 h-auto rounded-full mr-1" src="/wallabag.png" alt="" />Wallabag
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://www.notion.so/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
              <img className="w-5 h-auto rounded-full mr-1" src="/notion.png" alt="" />Notion
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://dida365.com/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
              <img className="w-5 h-auto rounded-full mr-1" src="/dida.png" alt="" />滴答清单
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://weread.qq.com/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
              <img className="w-5 h-auto rounded-full mr-1" src="/weread.png" alt="" />微信读书
              </a>
            </span>
          </p>
          <p className="flex flex-item li-container p-1">
            <span className="ul-block ml-8">•</span>
            <span className="text-xs">
              <a href="https://obsidian.md/" target="_blank" className="flex flex-row justify-start items-center mx-1 hover:underline">
              <img className="w-5 h-auto rounded-full mr-1" src="/obsidian.png" alt="" />Obsidian
              </a>
            </span>
          </p>
        </div>
        <div className="border-t w-full mt-3 pt-2 text-sm justify-start items-center space-x-4">
          <span className="text-gray-500">others:</span>
          <a
            href={`/u/Admin`}
            target="_blank"
            className="flex items-center underline text-red-600 hover:opacity-80"
          >
            <span className="flex flex-item">
              <img className="w-5 h-auto rounded-full mr-1" src="/help.png" alt="" />教程</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default function showAboutSiteDialog(): void {
  generateDialog(
    {
      className: "about-site-dialog",
      dialogName: "about-site-dialog",
    },
    AboutSiteDialog
  );
}
