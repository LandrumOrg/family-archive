export type RelationshipType = "parent_child" | "spouse" | "divorced_spouse" | "sibling";

export type DocumentType =
  | "birth_certificate"
  | "marriage_license"
  | "medical_history"
  | "genealogy_record"
  | "photo"
  | "other";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  birth_certificate: "Birth certificate",
  marriage_license: "Marriage license",
  medical_history: "Medical history",
  genealogy_record: "Genealogy record",
  photo: "Photo",
  other: "Other",
};

export interface Person {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string | null;
  maiden_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Relationship {
  id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  marriage_date: string | null;
  divorce_date: string | null;
}

export interface FamilyDocument {
  id: string;
  family_id: string;
  person_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
}
