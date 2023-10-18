type MemoRelationType = "REFERENCE" | "ADDITIONAL" | "REFERENCED";

interface MemoRelation {
  memoId: MemoId;
  relatedMemoId: MemoId;
  type: MemoRelationType;
}

interface MemoRelationUpsert {
  relatedMemoId: MemoId;
  type: MemoRelationType;
}
