package v2

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/usememos/memos/api/auth"
	apiv2pb "github.com/usememos/memos/proto/gen/api/v2"
	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

var (
	usernameMatcher = regexp.MustCompile("^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$")
)

func (s *APIV2Service) GetUser(ctx context.Context, request *apiv2pb.GetUserRequest) (*apiv2pb.GetUserResponse, error) {
	username, err := ExtractUsernameFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}
	user, err := s.Store.GetUser(ctx, &store.FindUser{
		Username: &username,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	userMessage := convertUserFromStore(user)
	response := &apiv2pb.GetUserResponse{
		User: userMessage,
	}
	return response, nil
}

func (s *APIV2Service) CreateUser(ctx context.Context, request *apiv2pb.CreateUserRequest) (*apiv2pb.CreateUserResponse, error) {
	currentUser, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if currentUser.Role != store.RoleHost {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	username, err := ExtractUsernameFromName(request.User.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}
	if !usernameMatcher.MatchString(strings.ToLower(username)) {
		return nil, status.Errorf(codes.InvalidArgument, "invalid username: %s", username)
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.User.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to generate password hash").SetInternal(err)
	}

	user, err := s.Store.CreateUser(ctx, &store.User{
		Username:     username,
		Role:         convertUserRoleToStore(request.User.Role),
		Email:        request.User.Email,
		Nickname:     request.User.Nickname,
		PasswordHash: string(passwordHash),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	response := &apiv2pb.CreateUserResponse{
		User: convertUserFromStore(user),
	}
	return response, nil
}

func (s *APIV2Service) UpdateUser(ctx context.Context, request *apiv2pb.UpdateUserRequest) (*apiv2pb.UpdateUserResponse, error) {
	username, err := ExtractUsernameFromName(request.User.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}
	currentUser, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if currentUser.Username != username && currentUser.Role != store.RoleAdmin && currentUser.Role != store.RoleHost {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}
	if request.UpdateMask == nil || len(request.UpdateMask.Paths) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update mask is empty")
	}

	user, err := s.Store.GetUser(ctx, &store.FindUser{Username: &username})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	currentTs := time.Now().Unix()
	update := &store.UpdateUser{
		ID:        user.ID,
		UpdatedTs: &currentTs,
	}
	for _, field := range request.UpdateMask.Paths {
		if field == "username" {
			if !usernameMatcher.MatchString(strings.ToLower(username)) {
				return nil, status.Errorf(codes.InvalidArgument, "invalid username: %s", username)
			}
			update.Username = &username
		} else if field == "nickname" {
			update.Nickname = &request.User.Nickname
		} else if field == "email" {
			update.Email = &request.User.Email
		} else if field == "avatar_url" {
			update.AvatarURL = &request.User.AvatarUrl
		} else if field == "role" {
			role := convertUserRoleToStore(request.User.Role)
			update.Role = &role
		} else if field == "password" {
			passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.User.Password), bcrypt.DefaultCost)
			if err != nil {
				return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to generate password hash").SetInternal(err)
			}
			passwordHashStr := string(passwordHash)
			update.PasswordHash = &passwordHashStr
		} else if field == "row_status" {
			rowStatus := convertRowStatusToStore(request.User.RowStatus)
			update.RowStatus = &rowStatus
		} else {
			return nil, status.Errorf(codes.InvalidArgument, "invalid update path: %s", field)
		}
	}

	updatedUser, err := s.Store.UpdateUser(ctx, update)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update user: %v", err)
	}

	response := &apiv2pb.UpdateUserResponse{
		User: convertUserFromStore(updatedUser),
	}
	return response, nil
}

func (s *APIV2Service) DeleteUser(ctx context.Context, request *apiv2pb.DeleteUserRequest) (*apiv2pb.DeleteUserResponse, error) {
	username, err := ExtractUsernameFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}
	currentUser, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if currentUser.Username != username && currentUser.Role != store.RoleAdmin && currentUser.Role != store.RoleHost {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	user, err := s.Store.GetUser(ctx, &store.FindUser{Username: &username})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	if err := s.Store.DeleteUser(ctx, &store.DeleteUser{
		ID: user.ID,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete user: %v", err)
	}

	return &apiv2pb.DeleteUserResponse{}, nil
}

func getDefaultUserSetting() *apiv2pb.UserSetting {
	return &apiv2pb.UserSetting{
		Locale:            "zh-Hans",
		Appearance:        "system",
		MemoVisibility:    "PRIVATE",
		ShowWordCnt:       true,
		MarkWithTag:       false,
		CustomShortcut:    "",
		FavTag:            "",
		RefPreview:        true,
		ShowTodoPage:      true,
		ShowArchivePage:   true,
		PasteRename:       false,
		ShowTagSelector:   true,
		ShowMemoPublic:    false,
		CustomCardStyle:   "",
		DoubleClickEdit:   true,
		UseExcalidraw:     false,
		HideMarkBlock:     false,
		HideFullScreen:    false,
		SysShortcutConfig: "todo,code,table,add_col,add_row",
	}
}

func (s *APIV2Service) GetUserSetting(ctx context.Context, _ *apiv2pb.GetUserSettingRequest) (*apiv2pb.GetUserSettingResponse, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get current user: %v", err)
	}

	userSettings, err := s.Store.ListUserSettingsV1(ctx, &store.FindUserSetting{
		UserID: &user.ID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list user settings: %v", err)
	}
	userSettingMessage := getDefaultUserSetting()
	for _, setting := range userSettings {
		if setting.Key == storepb.UserSettingKey_USER_SETTING_LOCALE {
			userSettingMessage.Locale = setting.GetLocale()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_APPEARANCE {
			userSettingMessage.Appearance = setting.GetAppearance()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_MEMO_VISIBILITY {
			userSettingMessage.MemoVisibility = setting.GetMemoVisibility()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_WORD_CNT {
			userSettingMessage.ShowWordCnt = setting.GetShowWordCnt()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_MARK_WITH_TAG {
			userSettingMessage.MarkWithTag = setting.GetMarkWithTag()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_SHORTCUT {
			userSettingMessage.CustomShortcut = setting.GetCustomShortcut()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_FAV_TAG {
			userSettingMessage.FavTag = setting.GetFavTag()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_REF_PREVIEW {
			userSettingMessage.RefPreview = setting.GetRefPreview()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TODO_PAGE {
			userSettingMessage.ShowTodoPage = setting.GetShowTodoPage()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_ARCHIVE_PAGE {
			userSettingMessage.ShowArchivePage = setting.GetShowArchivePage()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_PASTE_RENAME {
			userSettingMessage.PasteRename = setting.GetPasteRename()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_TAG_SELECTOR {
			userSettingMessage.ShowTagSelector = setting.GetShowTagSelector()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SHOW_MEMO_PUBLIC {
			userSettingMessage.ShowMemoPublic = setting.GetShowMemoPublic()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_CUSTOM_CARD_STYLE {
			userSettingMessage.CustomCardStyle = setting.GetCustomCardStyle()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_DOUBLE_CLICK_EDIT {
			userSettingMessage.DoubleClickEdit = setting.GetDoubleClickEdit()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_USE_EXCALIDRAW {
			userSettingMessage.UseExcalidraw = setting.GetUseExcalidraw()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_HIDE_MARK_BLOCK {
			userSettingMessage.HideMarkBlock = setting.GetHideMarkBlock()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_HIDE_FULL_SCREEN {
			userSettingMessage.HideFullScreen = setting.GetHideFullScreen()
		} else if setting.Key == storepb.UserSettingKey_USER_SETTING_SYS_SHORTCUT_CONFIG {
			userSettingMessage.SysShortcutConfig = setting.GetSysShortcutConfig()
		}
	}
	return &apiv2pb.GetUserSettingResponse{
		Setting: userSettingMessage,
	}, nil
}

func (s *APIV2Service) UpdateUserSetting(ctx context.Context, request *apiv2pb.UpdateUserSettingRequest) (*apiv2pb.UpdateUserSettingResponse, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get current user: %v", err)
	}

	if request.UpdateMask == nil || len(request.UpdateMask.Paths) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update mask is empty")
	}

	for _, field := range request.UpdateMask.Paths {
		if field == "locale" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_LOCALE,
				Value: &storepb.UserSetting_Locale{
					Locale: request.Setting.Locale,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "appearance" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_APPEARANCE,
				Value: &storepb.UserSetting_Appearance{
					Appearance: request.Setting.Appearance,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "memo_visibility" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_MEMO_VISIBILITY,
				Value: &storepb.UserSetting_MemoVisibility{
					MemoVisibility: request.Setting.MemoVisibility,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "show_word_cnt" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SHOW_WORD_CNT,
				Value: &storepb.UserSetting_ShowWordCnt{
					ShowWordCnt: request.Setting.ShowWordCnt,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "mark_with_tag" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_MARK_WITH_TAG,
				Value: &storepb.UserSetting_MarkWithTag{
					MarkWithTag: request.Setting.MarkWithTag,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "custom_shortcut" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_CUSTOM_SHORTCUT,
				Value: &storepb.UserSetting_CustomShortcut{
					CustomShortcut: request.Setting.CustomShortcut,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "fav_tag" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_FAV_TAG,
				Value: &storepb.UserSetting_FavTag{
					FavTag: request.Setting.FavTag,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "ref_preview" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_REF_PREVIEW,
				Value: &storepb.UserSetting_RefPreview{
					RefPreview: request.Setting.RefPreview,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "show_todo_page" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SHOW_TODO_PAGE,
				Value: &storepb.UserSetting_ShowTodoPage{
					ShowTodoPage: request.Setting.ShowTodoPage,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "show_archive_page" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SHOW_ARCHIVE_PAGE,
				Value: &storepb.UserSetting_ShowArchivePage{
					ShowArchivePage: request.Setting.ShowArchivePage,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "paste_rename" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_PASTE_RENAME,
				Value: &storepb.UserSetting_PasteRename{
					PasteRename: request.Setting.PasteRename,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "show_tag_selector" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SHOW_TAG_SELECTOR,
				Value: &storepb.UserSetting_ShowTagSelector{
					ShowTagSelector: request.Setting.ShowTagSelector,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "show_memo_public" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SHOW_MEMO_PUBLIC,
				Value: &storepb.UserSetting_ShowMemoPublic{
					ShowMemoPublic: request.Setting.ShowMemoPublic,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "custom_card_style" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_CUSTOM_CARD_STYLE,
				Value: &storepb.UserSetting_CustomCardStyle{
					CustomCardStyle: request.Setting.CustomCardStyle,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "double_click_edit" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_DOUBLE_CLICK_EDIT,
				Value: &storepb.UserSetting_DoubleClickEdit{
					DoubleClickEdit: request.Setting.DoubleClickEdit,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "use_excalidraw" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_USE_EXCALIDRAW,
				Value: &storepb.UserSetting_UseExcalidraw{
					UseExcalidraw: request.Setting.UseExcalidraw,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "hide_mark_block" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_HIDE_MARK_BLOCK,
				Value: &storepb.UserSetting_HideMarkBlock{
					HideMarkBlock: request.Setting.HideMarkBlock,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "hide_full_screen" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_HIDE_FULL_SCREEN,
				Value: &storepb.UserSetting_HideFullScreen{
					HideFullScreen: request.Setting.HideFullScreen,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else if field == "sys_shortcut_config" {
			if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
				UserId: user.ID,
				Key:    storepb.UserSettingKey_USER_SETTING_SYS_SHORTCUT_CONFIG,
				Value: &storepb.UserSetting_SysShortcutConfig{
					SysShortcutConfig: request.Setting.SysShortcutConfig,
				},
			}); err != nil {
				return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
			}
		} else {
			return nil, status.Errorf(codes.InvalidArgument, "invalid update path: %s", field)
		}
	}

	userSettingResponse, err := s.GetUserSetting(ctx, &apiv2pb.GetUserSettingRequest{})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user setting: %v", err)
	}
	return &apiv2pb.UpdateUserSettingResponse{
		Setting: userSettingResponse.Setting,
	}, nil
}

func (s *APIV2Service) ListUserAccessTokens(ctx context.Context, request *apiv2pb.ListUserAccessTokensRequest) (*apiv2pb.ListUserAccessTokensResponse, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get current user: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.PermissionDenied, "permission denied")
	}

	userID := user.ID
	username, err := ExtractUsernameFromName(request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "name is required")
	}
	// List access token for other users need to be verified.
	if user.Username != username {
		// Normal users can only list their access tokens.
		if user.Role == store.RoleUser {
			return nil, status.Errorf(codes.PermissionDenied, "permission denied")
		}

		// The request user must be exist.
		requestUser, err := s.Store.GetUser(ctx, &store.FindUser{Username: &username})
		if requestUser == nil || err != nil {
			return nil, status.Errorf(codes.NotFound, "fail to find user %s", username)
		}
		userID = requestUser.ID
	}

	userAccessTokens, err := s.Store.GetUserAccessTokens(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list access tokens: %v", err)
	}

	accessTokens := []*apiv2pb.UserAccessToken{}
	for _, userAccessToken := range userAccessTokens {
		claims := &auth.ClaimsMessage{}
		_, err := jwt.ParseWithClaims(userAccessToken.AccessToken, claims, func(t *jwt.Token) (any, error) {
			if t.Method.Alg() != jwt.SigningMethodHS256.Name {
				return nil, errors.Errorf("unexpected access token signing method=%v, expect %v", t.Header["alg"], jwt.SigningMethodHS256)
			}
			if kid, ok := t.Header["kid"].(string); ok {
				if kid == "v1" {
					return []byte(s.Secret), nil
				}
			}
			return nil, errors.Errorf("unexpected access token kid=%v", t.Header["kid"])
		})
		if err != nil {
			// If the access token is invalid or expired, just ignore it.
			continue
		}

		userAccessToken := &apiv2pb.UserAccessToken{
			AccessToken: userAccessToken.AccessToken,
			Description: userAccessToken.Description,
			IssuedAt:    timestamppb.New(claims.IssuedAt.Time),
		}
		if claims.ExpiresAt != nil {
			userAccessToken.ExpiresAt = timestamppb.New(claims.ExpiresAt.Time)
		}
		accessTokens = append(accessTokens, userAccessToken)
	}

	// Sort by issued time in descending order.
	slices.SortFunc(accessTokens, func(i, j *apiv2pb.UserAccessToken) int {
		return int(i.IssuedAt.Seconds - j.IssuedAt.Seconds)
	})
	response := &apiv2pb.ListUserAccessTokensResponse{
		AccessTokens: accessTokens,
	}
	return response, nil
}

func (s *APIV2Service) CreateUserAccessToken(ctx context.Context, request *apiv2pb.CreateUserAccessTokenRequest) (*apiv2pb.CreateUserAccessTokenResponse, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get current user: %v", err)
	}

	expiresAt := time.Time{}
	if request.ExpiresAt != nil {
		expiresAt = request.ExpiresAt.AsTime()
	}

	accessToken, err := auth.GenerateAccessToken(user.Username, user.ID, expiresAt, []byte(s.Secret))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate access token: %v", err)
	}

	claims := &auth.ClaimsMessage{}
	_, err = jwt.ParseWithClaims(accessToken, claims, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Name {
			return nil, errors.Errorf("unexpected access token signing method=%v, expect %v", t.Header["alg"], jwt.SigningMethodHS256)
		}
		if kid, ok := t.Header["kid"].(string); ok {
			if kid == "v1" {
				return []byte(s.Secret), nil
			}
		}
		return nil, errors.Errorf("unexpected access token kid=%v", t.Header["kid"])
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to parse access token: %v", err)
	}

	// Upsert the access token to user setting store.
	if err := s.UpsertAccessTokenToStore(ctx, user, accessToken, request.Description); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to upsert access token to store: %v", err)
	}

	userAccessToken := &apiv2pb.UserAccessToken{
		AccessToken: accessToken,
		Description: request.Description,
		IssuedAt:    timestamppb.New(claims.IssuedAt.Time),
	}
	if claims.ExpiresAt != nil {
		userAccessToken.ExpiresAt = timestamppb.New(claims.ExpiresAt.Time)
	}
	response := &apiv2pb.CreateUserAccessTokenResponse{
		AccessToken: userAccessToken,
	}
	return response, nil
}

func (s *APIV2Service) DeleteUserAccessToken(ctx context.Context, request *apiv2pb.DeleteUserAccessTokenRequest) (*apiv2pb.DeleteUserAccessTokenResponse, error) {
	user, err := getCurrentUser(ctx, s.Store)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get current user: %v", err)
	}

	userAccessTokens, err := s.Store.GetUserAccessTokens(ctx, user.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list access tokens: %v", err)
	}
	updatedUserAccessTokens := []*storepb.AccessTokensUserSetting_AccessToken{}
	for _, userAccessToken := range userAccessTokens {
		if userAccessToken.AccessToken == request.AccessToken {
			continue
		}
		updatedUserAccessTokens = append(updatedUserAccessTokens, userAccessToken)
	}
	if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
		UserId: user.ID,
		Key:    storepb.UserSettingKey_USER_SETTING_ACCESS_TOKENS,
		Value: &storepb.UserSetting_AccessTokens{
			AccessTokens: &storepb.AccessTokensUserSetting{
				AccessTokens: updatedUserAccessTokens,
			},
		},
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to upsert user setting: %v", err)
	}

	return &apiv2pb.DeleteUserAccessTokenResponse{}, nil
}

func (s *APIV2Service) UpsertAccessTokenToStore(ctx context.Context, user *store.User, accessToken, description string) error {
	userAccessTokens, err := s.Store.GetUserAccessTokens(ctx, user.ID)
	if err != nil {
		return errors.Wrap(err, "failed to get user access tokens")
	}
	userAccessToken := storepb.AccessTokensUserSetting_AccessToken{
		AccessToken: accessToken,
		Description: description,
	}
	userAccessTokens = append(userAccessTokens, &userAccessToken)
	if _, err := s.Store.UpsertUserSettingV1(ctx, &storepb.UserSetting{
		UserId: user.ID,
		Key:    storepb.UserSettingKey_USER_SETTING_ACCESS_TOKENS,
		Value: &storepb.UserSetting_AccessTokens{
			AccessTokens: &storepb.AccessTokensUserSetting{
				AccessTokens: userAccessTokens,
			},
		},
	}); err != nil {
		return errors.Wrap(err, "failed to upsert user setting")
	}
	return nil
}

func convertUserFromStore(user *store.User) *apiv2pb.User {
	return &apiv2pb.User{
		Name:       fmt.Sprintf("%s%s", UserNamePrefix, user.Username),
		Id:         user.ID,
		RowStatus:  convertRowStatusFromStore(user.RowStatus),
		CreateTime: timestamppb.New(time.Unix(user.CreatedTs, 0)),
		UpdateTime: timestamppb.New(time.Unix(user.UpdatedTs, 0)),
		Role:       convertUserRoleFromStore(user.Role),
		Email:      user.Email,
		Nickname:   user.Nickname,
		AvatarUrl:  user.AvatarURL,
	}
}

func convertUserRoleFromStore(role store.Role) apiv2pb.User_Role {
	switch role {
	case store.RoleHost:
		return apiv2pb.User_HOST
	case store.RoleAdmin:
		return apiv2pb.User_ADMIN
	case store.RoleUser:
		return apiv2pb.User_USER
	default:
		return apiv2pb.User_ROLE_UNSPECIFIED
	}
}

func convertUserRoleToStore(role apiv2pb.User_Role) store.Role {
	switch role {
	case apiv2pb.User_HOST:
		return store.RoleHost
	case apiv2pb.User_ADMIN:
		return store.RoleAdmin
	case apiv2pb.User_USER:
		return store.RoleUser
	default:
		return store.RoleUser
	}
}
