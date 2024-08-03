type Appearance = "system" | "light" | "dark";

interface BasicSetting {
  locale: Locale;
  appearance: Appearance;
}
interface Setting {
  locale: Locale;
  appearance: Appearance;
  memoVisibility: Visibility;
  telegramUserId: string;
  openaiApiKey: string;
  scriptConfig: string;
}

interface LocalSetting {
  enableDoubleClickEditing: boolean;
  enableShowWordCnt: boolean
  markWithTag: boolean;
}

interface UserLocaleSetting {
  key: "locale";
  value: Locale;
}

interface UserAppearanceSetting {
  key: "appearance";
  value: Appearance;
}

interface UserMemoVisibilitySetting {
  key: "memo-visibility";
  value: Visibility;
}

interface UserTelegramUserIdSetting {
  key: "telegram-user-id";
  value: string;
}

interface UserOpenAIKeyIdSetting {
  key: "openai-api-key";
  value: string;
}

interface UserScriptConfigSetting {
  key: "script-config";
  value: string;
}

type UserSetting = UserLocaleSetting | UserAppearanceSetting | UserMemoVisibilitySetting | UserTelegramUserIdSetting | UserOpenAIKeyIdSetting | UserScriptConfigSetting;

interface UserSettingUpsert {
  key: keyof Setting;
  value: string;
}
