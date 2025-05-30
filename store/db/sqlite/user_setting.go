package sqlite

import (
	"context"
	"database/sql"
	"strings"

	"github.com/pkg/errors"
	"google.golang.org/protobuf/encoding/protojson"

	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

func (d *DB) UpsertUserSetting(ctx context.Context, upsert *storepb.UserSetting) (*storepb.UserSetting, error) {
	stmt := `
		INSERT INTO user_setting (
			user_id, key, value
		)
		VALUES (?, ?, ?)
		ON CONFLICT(user_id, key) DO UPDATE
		SET value = EXCLUDED.value
	`
	var valueString string
	var valueBool bool
	var valueNumber int32
	var is_bool bool = false
	var is_number bool = false
	if upsert.Key == storepb.UserSettingKey_USER_SETTING_ACCESS_TOKENS {
		valueBytes, err := protojson.Marshal(upsert.GetAccessTokens())
		if err != nil {
			return nil, err
		}
		valueString = string(valueBytes)
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_LOCALE {
		valueString = upsert.GetLocale()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_APPEARANCE {
		valueString = upsert.GetAppearance()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_MEMO_VISIBILITY {
		valueString = upsert.GetMemoVisibility()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SHOW_WORD_CNT {
		valueBool = upsert.GetShowWordCnt()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_MARK_WITH_TAG {
		valueBool = upsert.GetMarkWithTag()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_SHORTCUT {
		valueString = upsert.GetCustomShortcut()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_FAV_TAG {
		valueString = upsert.GetFavTag()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_REF_PREVIEW {
		valueBool = upsert.GetRefPreview()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TODO_PAGE {
		valueBool = upsert.GetShowTodoPage()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SHOW_ARCHIVE_PAGE {
		valueBool = upsert.GetShowArchivePage()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_PASTE_RENAME {
		valueBool = upsert.GetPasteRename()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TAG_SELECTOR {
		valueBool = upsert.GetShowTagSelector()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SHOW_MEMO_PUBLIC {
		valueBool = upsert.GetShowMemoPublic()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_CARD_STYLE {
		valueString = upsert.GetCustomCardStyle()
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_DOUBLE_CLICK_EDIT {
		valueBool = upsert.GetDoubleClickEdit()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_USE_EXCALIDRAW {
		valueBool = upsert.GetUseExcalidraw()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_HIDE_MARK_BLOCK {
		valueBool = upsert.GetHideMarkBlock()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_HIDE_FULL_SCREEN {
		valueBool = upsert.GetHideFullScreen()
		is_bool = true
	} else if upsert.Key == storepb.UserSettingKey_USER_SETTING_SYS_SHORTCUT_CONFIG {
		valueString = upsert.GetSysShortcutConfig()
	} else {
		return nil, errors.Errorf("unknown user setting key: %s", upsert.Key.String())
	}
	if is_bool {
		if _, err := d.db.ExecContext(ctx, stmt, upsert.UserId, upsert.Key.String(), valueBool); err != nil {
			return nil, err
		}
		return upsert, nil
	}
	if is_number {
		if _, err := d.db.ExecContext(ctx, stmt, upsert.UserId, upsert.Key.String(), valueNumber); err != nil {
			return nil, err
		}
		return upsert, nil
	}
	if _, err := d.db.ExecContext(ctx, stmt, upsert.UserId, upsert.Key.String(), valueString); err != nil {
		return nil, err
	}

	return upsert, nil
}

func (d *DB) ListUserSettings(ctx context.Context, find *store.FindUserSetting) ([]*storepb.UserSetting, error) {
	where, args := []string{"1 = 1"}, []any{}

	if v := find.Key; v != storepb.UserSettingKey_USER_SETTING_KEY_UNSPECIFIED {
		where, args = append(where, "key = ?"), append(args, v.String())
	}
	if v := find.UserID; v != nil {
		where, args = append(where, "user_id = ?"), append(args, *find.UserID)
	}

	query := `
		SELECT
			user_id,
		  key,
			value
		FROM user_setting
		WHERE ` + strings.Join(where, " AND ")
	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	userSettingList := make([]*storepb.UserSetting, 0)
	for rows.Next() {
		userSetting := &storepb.UserSetting{}
		var keyString, valueString string
		if err := rows.Scan(
			&userSetting.UserId,
			&keyString,
			&valueString,
		); err != nil {
			return nil, err
		}
		userSetting.Key = storepb.UserSettingKey(storepb.UserSettingKey_value[keyString])
		if userSetting.Key == storepb.UserSettingKey_USER_SETTING_ACCESS_TOKENS {
			accessTokensUserSetting := &storepb.AccessTokensUserSetting{}
			if err := protojson.Unmarshal([]byte(valueString), accessTokensUserSetting); err != nil {
				return nil, err
			}
			userSetting.Value = &storepb.UserSetting_AccessTokens{
				AccessTokens: accessTokensUserSetting,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_LOCALE {
			userSetting.Value = &storepb.UserSetting_Locale{
				Locale: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_APPEARANCE {
			userSetting.Value = &storepb.UserSetting_Appearance{
				Appearance: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_MEMO_VISIBILITY {
			userSetting.Value = &storepb.UserSetting_MemoVisibility{
				MemoVisibility: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_WORD_CNT {
			userSetting.Value = &storepb.UserSetting_ShowWordCnt{
				ShowWordCnt: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_MARK_WITH_TAG {
			userSetting.Value = &storepb.UserSetting_MarkWithTag{
				MarkWithTag: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_SHORTCUT {
			userSetting.Value = &storepb.UserSetting_CustomShortcut{
				CustomShortcut: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_FAV_TAG {
			userSetting.Value = &storepb.UserSetting_FavTag{
				FavTag: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_REF_PREVIEW {
			userSetting.Value = &storepb.UserSetting_RefPreview{
				RefPreview: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TODO_PAGE {
			userSetting.Value = &storepb.UserSetting_ShowTodoPage{
				ShowTodoPage: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_ARCHIVE_PAGE {
			userSetting.Value = &storepb.UserSetting_ShowArchivePage{
				ShowArchivePage: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_PASTE_RENAME {
			userSetting.Value = &storepb.UserSetting_PasteRename{
				PasteRename: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TAG_SELECTOR {
			userSetting.Value = &storepb.UserSetting_ShowTagSelector{
				ShowTagSelector: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_MEMO_PUBLIC {
			userSetting.Value = &storepb.UserSetting_ShowMemoPublic{
				ShowMemoPublic: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_CARD_STYLE {
			userSetting.Value = &storepb.UserSetting_CustomCardStyle{
				CustomCardStyle: valueString,
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_DOUBLE_CLICK_EDIT {
			userSetting.Value = &storepb.UserSetting_DoubleClickEdit{
				DoubleClickEdit: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_USE_EXCALIDRAW {
			userSetting.Value = &storepb.UserSetting_UseExcalidraw{
				UseExcalidraw: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_HIDE_MARK_BLOCK {
			userSetting.Value = &storepb.UserSetting_HideMarkBlock{
				HideMarkBlock: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_HIDE_FULL_SCREEN {
			userSetting.Value = &storepb.UserSetting_HideFullScreen{
				HideFullScreen: valueString == "1",
			}
		} else if userSetting.Key == storepb.UserSettingKey_USER_SETTING_SYS_SHORTCUT_CONFIG {
			userSetting.Value = &storepb.UserSetting_SysShortcutConfig{
				SysShortcutConfig: valueString,
			}
		} else {
			// Skip unknown user setting key.
			continue
		}
		userSettingList = append(userSettingList, userSetting)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return userSettingList, nil
}

func vacuumUserSetting(ctx context.Context, tx *sql.Tx) error {
	stmt := `
	DELETE FROM
		user_setting
	WHERE
		user_id NOT IN (
			SELECT
				id
			FROM
				user
		)`
	_, err := tx.ExecContext(ctx, stmt)
	if err != nil {
		return err
	}

	return nil
}
