package v1

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strings"

	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slices"

	"github.com/usememos/memos/store"
)

type Tag struct {
	Name      string
	CreatorID int32
}

type UpsertTagRequest struct {
	Name string `json:"name"`
}

type DeleteTagRequest struct {
	Name string `json:"name"`
}

func getValidTags(tag string) []string {
	tags := strings.Split(tag, "/")
	validTags := make([]string, len(tags))
	for i := range tags {
		validTags[i] = strings.Join(tags[:i+1], "/")
	}
	return validTags
}

func (s *APIV1Service) registerTagRoutes(g *echo.Group) {
	g.GET("/tag", s.GetTagList)
	g.POST("/tag", s.CreateTag)
	g.GET("/tag/suggestion", s.GetTagSuggestion)
	g.POST("/tag/delete", s.DeleteTag)
	g.GET("/tag_cnt", s.GetTagCnt)
}

// GetTagList godoc
//
//	@Summary	Get a list of tags
//	@Tags		tag
//	@Produce	json
//	@Success	200	{object}	[]string	"Tag list"
//	@Failure	400	{object}	nil			"Missing user id to find tag"
//	@Failure	500	{object}	nil			"Failed to find tag list"
//	@Router		/api/v1/tag [GET]
func (s *APIV1Service) GetTagList(c echo.Context) error {
	ctx := c.Request().Context()
	userID, ok := c.Get(userIDContextKey).(int32)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing user id to find tag")
	}

	list, err := s.Store.ListTags(ctx, &store.FindTag{
		CreatorID: userID,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find tag list").SetInternal(err)
	}

	tagNameList := []string{}
	for _, tag := range list {
		tagNameList = append(tagNameList, tag.Name)
	}
	return c.JSON(http.StatusOK, tagNameList)
}

// CreateTag godoc
//
//	@Summary	Create a tag
//	@Tags		tag
//	@Accept		json
//	@Produce	json
//	@Param		body	body		UpsertTagRequest	true	"Request object."
//	@Success	200		{object}	string				"Created tag name"
//	@Failure	400		{object}	nil					"Malformatted post tag request | Tag name shouldn't be empty"
//	@Failure	401		{object}	nil					"Missing user in session"
//	@Failure	500		{object}	nil					"Failed to upsert tag | Failed to create activity"
//	@Router		/api/v1/tag [POST]
func (s *APIV1Service) CreateTag(c echo.Context) error {
	ctx := c.Request().Context()
	userID, ok := c.Get(userIDContextKey).(int32)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Missing user in session")
	}

	tagUpsert := &UpsertTagRequest{}
	if err := json.NewDecoder(c.Request().Body).Decode(tagUpsert); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Malformatted post tag request").SetInternal(err)
	}
	if tagUpsert.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Tag name shouldn't be empty")
	}

	tag, err := s.Store.UpsertTag(ctx, &store.Tag{
		Name:      tagUpsert.Name,
		CreatorID: userID,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to upsert tag").SetInternal(err)
	}
	tagMessage := convertTagFromStore(tag)
	return c.JSON(http.StatusOK, tagMessage.Name)
}

// GetTagCnt godoc
//
//	@Summary	Get use count of tags
//	@Tags		tag
//	@Produce	json
//	@Success	200	{object}	map[string]int	"Tag Count Dict"
//	@Failure	400	{object}	nil			"Missing user id to find tag"
//	@Failure	500	{object}	nil			"Failed to find tag list"
//	@Security	ApiKeyAuth
//	@Router		/api/v1/tag_cnt [GET]
func (s *APIV1Service) GetTagCnt(c echo.Context) error {
	ctx := c.Request().Context()
	userID, ok := c.Get(userIDContextKey).(int32)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing user session")
	}
	normalRowStatus := store.Normal

	memoFind := &store.FindMemo{
		CreatorID:     &userID,
		ContentSearch: []string{"#"},
		RowStatus:     &normalRowStatus,
	}

	memoMessageList, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find memo list").SetInternal(err)
	}

	tagCountMap := make(map[string]int)
	for _, memo := range memoMessageList {
		curMemoTag := make(map[string]bool)
		for tag := range createMemoTagMapSet(memo.Content) {
			valid_tags := getValidTags(tag)
			for _, valid_tag := range valid_tags {
				curMemoTag[valid_tag] = true
			}
		}
		for tag := range curMemoTag {
			tagCountMap[tag]++
		}
	}
	return c.JSON(http.StatusOK, tagCountMap)
}

// DeleteTag godoc
//
//	@Summary	Delete a tag
//	@Tags		tag
//	@Accept		json
//	@Produce	json
//	@Param		body	body		DeleteTagRequest	true	"Request object."
//	@Success	200		{boolean}	true				"Tag deleted"
//	@Failure	400		{object}	nil					"Malformatted post tag request | Tag name shouldn't be empty"
//	@Failure	401		{object}	nil					"Missing user in session"
//	@Failure	500		{object}	nil					"Failed to delete tag name: %v"
//	@Router		/api/v1/tag/delete [POST]
func (s *APIV1Service) DeleteTag(c echo.Context) error {
	ctx := c.Request().Context()
	userID, ok := c.Get(userIDContextKey).(int32)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Missing user in session")
	}

	tagDelete := &DeleteTagRequest{}
	if err := json.NewDecoder(c.Request().Body).Decode(tagDelete); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Malformatted post tag request").SetInternal(err)
	}
	if tagDelete.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Tag name shouldn't be empty")
	}

	err := s.Store.DeleteTag(ctx, &store.DeleteTag{
		Name:      tagDelete.Name,
		CreatorID: userID,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to delete tag name: %v", tagDelete.Name)).SetInternal(err)
	}
	return c.JSON(http.StatusOK, true)
}

// GetTagSuggestion godoc
//
//	@Summary	Get a list of tags suggested from other memos contents
//	@Tags		tag
//	@Produce	json
//	@Success	200	{object}	[]string	"Tag list"
//	@Failure	400	{object}	nil			"Missing user session"
//	@Failure	500	{object}	nil			"Failed to find memo list | Failed to find tag list"
//	@Router		/api/v1/tag/suggestion [GET]
func (s *APIV1Service) GetTagSuggestion(c echo.Context) error {
	ctx := c.Request().Context()
	userID, ok := c.Get(userIDContextKey).(int32)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing user session")
	}
	normalRowStatus := store.Normal
	memoFind := &store.FindMemo{
		CreatorID:     &userID,
		ContentSearch: []string{"#"},
		RowStatus:     &normalRowStatus,
	}

	memoMessageList, err := s.Store.ListMemos(ctx, memoFind)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find memo list").SetInternal(err)
	}

	list, err := s.Store.ListTags(ctx, &store.FindTag{
		CreatorID: userID,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to find tag list").SetInternal(err)
	}
	tagNameList := []string{}
	for _, tag := range list {
		tagNameList = append(tagNameList, tag.Name)
	}

	tagMapSet := make(map[string]bool)
	for _, memo := range memoMessageList {
		for _, tag := range findTagListFromMemoContent(memo.Content) {
			if !slices.Contains(tagNameList, tag) {
				tagMapSet[tag] = true
			}
		}
	}
	tagList := []string{}
	for tag := range tagMapSet {
		tagList = append(tagList, tag)
	}
	sort.Strings(tagList)
	return c.JSON(http.StatusOK, tagList)
}

func convertTagFromStore(tag *store.Tag) *Tag {
	return &Tag{
		Name:      tag.Name,
		CreatorID: tag.CreatorID,
	}
}

var tagRegexp = regexp.MustCompile(`#([^\s#,\.]+)`)

func findTagListFromMemoContent(memoContent string) []string {
	tagMapSet := createMemoTagMapSet(memoContent)

	tagList := []string{}
	for tag := range tagMapSet {
		tagList = append(tagList, tag)
	}
	sort.Strings(tagList)
	return tagList
}

func createMemoTagMapSet(memoContent string) map[string]bool {
	codeBlockRegex := regexp.MustCompile("(?s)```.*?```")
	memoContent = codeBlockRegex.ReplaceAllString(memoContent, "")

	tagMapSet := make(map[string]bool)
	matches := tagRegexp.FindAllStringSubmatch(memoContent, -1)
	for _, v := range matches {
		tagName := v[1]
		tagMapSet[tagName] = true
	}
	return tagMapSet
}
