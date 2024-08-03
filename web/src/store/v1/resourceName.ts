export const UserNamePrefix = "users/";

export const extractUsernameFromName = (name: string = "") => {
  if (!name) {
    return "";
  }
  return name.slice(UserNamePrefix.length);
};
