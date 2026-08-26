"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/types";

interface Props {
  familyId: string;
  personId: string;
}

const DOC_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

export default function DocumentUploader({ familyId, personId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [documentType, setDocumentType] = useState<DocumentType>("photo");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired - please sign in again.");
      setUploading(false);
      return;
    }

    // Path convention families.id / person.id / random-filename
    // This is what the storage RLS policy checks against.
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${familyId}/${personId}/${crypto.randomUUID()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      family_id: familyId,
      person_id: personId,
      document_type: documentType,
      storage_path: storagePath,
      file_name: file.name,
      uploaded_by: user.id,
      description: description || null,
    });

    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }

    setFile(null);
    setDescription("");
    setUploading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3 border border-ink/20 bg-vellum p-4">
      <div>
        <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
          Document type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
          File
        </label>
        <input
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-ink/80"
        />
      </div>

      <div>
        <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
          Note (optional)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Issued by Hamilton County, 1978"
          className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-patina"
        />
      </div>

      {error && <p className="text-sm text-oxblood">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full bg-ink px-4 py-2 font-mono text-sm uppercase tracking-wide text-vellum transition hover:bg-patina disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload record"}
      </button>
    </form>
  );
}
