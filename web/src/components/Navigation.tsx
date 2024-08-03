import classNames from "classnames";
import { NavLink } from "react-router-dom";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useTranslate } from "@/utils/i18n";
import Icon from "./Icon";
import UserBanner from "./UserBanner";
import { useUserV1Store } from "@/store/v1";
import { UserSetting } from "@/types/proto/api/v2/user_service";

interface NavLinkItem {
  id: string;
  path: string;
  title: string;
  icon: React.ReactNode;
  target: string
}

const Navigation = () => {
  const t = useTranslate();
  const user = useCurrentUser();
  const userV1Store = useUserV1Store();
  const userSetting = userV1Store.userSetting as UserSetting;
  const showTodoPage = userSetting?.showTodoPage ?? true;
  const showArchivePage = userSetting?.showArchivePage ?? true;

  const homeNavLink: NavLinkItem = {
    id: "header-home",
    path: "/",
    title: t("common.home"),
    icon: <Icon.Home className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const dailyReviewNavLink: NavLinkItem = {
    id: "header-daily-review",
    path: "/review",
    title: t("daily-review.title"),
    icon: <Icon.Calendar className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const resourcesNavLink: NavLinkItem = {
    id: "header-resources",
    path: "/resources",
    title: t("common.resources"),
    icon: <Icon.Paperclip className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const archivedNavLink: NavLinkItem = {
    id: "header-archived",
    path: "/archived",
    title: t("common.archived"),
    icon: <Icon.Archive className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const settingNavLink: NavLinkItem = {
    id: "header-setting",
    path: "/setting",
    title: t("common.settings"),
    icon: <Icon.Settings className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const todoNavLink: NavLinkItem = {
    id: "header-todo",
    path: "/todo",
    title: t("common.todo"),
    icon: <Icon.LayoutList className="mr-3 w-6 h-auto opacity-70" />,
    target: "_self",
  };
  const signInNavLink: NavLinkItem = {
    id: "header-auth",
    path: "/auth",
    title: t("common.sign-in"),
    icon: <Icon.LogIn className="mr-3 w-6 h-auto opacity-70" />,
    target: "parent",
  };

  let navLinks: NavLinkItem[] = []
  if (!user) {
    navLinks = [signInNavLink];
  }
  else {
    navLinks = [homeNavLink, dailyReviewNavLink, resourcesNavLink];
    if (showTodoPage) {
      navLinks.push(todoNavLink);
    }
    if (showArchivePage) {
      navLinks.push(archivedNavLink);
    }
    navLinks.push(settingNavLink);
  }

  return (
    <header className="w-full h-full overflow-auto flex flex-col justify-start items-start py-4 z-30">
      <UserBanner />
      <div className="w-full px-2 py-2 flex flex-col justify-start items-start shrink-0 space-y-2">
        {navLinks.map((navLink) => (
          <NavLink
            key={navLink.id}
            to={navLink.path}
            id={navLink.id}
            target={navLink.target}
            className={({ isActive }) =>
              classNames(
                "px-4 pr-5 py-2 rounded-2xl border flex flex-row items-center text-lg text-gray-800 dark:text-gray-300 hover:bg-white hover:border-gray-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700",
                isActive ? "bg-white" : "border-transparent"
              )
            }
          >
            <>
              {navLink.icon} {navLink.title}
            </>
          </NavLink>
        ))}
      </div>
    </header>
  );
};

export default Navigation;
