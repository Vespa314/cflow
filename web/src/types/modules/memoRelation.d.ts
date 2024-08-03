type MemoRelationType = "REFERENCE" | "ADDITIONAL" | "COMMENT";

interface MemoRelation {
  memoId: MemoId;
  relatedMemoId: MemoId;
  type: MemoRelationType;
}

interface MemoRelationUpsert {
  relatedMemoId: MemoId;
  type: MemoRelationType;
}
