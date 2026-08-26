import { DOCUMENT_TYPE_LABELS, type FamilyDocument } from "@/lib/types";

interface DocWithUrl extends FamilyDocument {
  signedUrl: string | null;
}

export default function DocumentList({ documents }: { documents: DocWithUrl[] }) {
  if (documents.length === 0) {
    return (
      <p className="border border-dashed border-ink/25 p-4 text-sm text-ink/50">
        No records uploaded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between border border-ink/15 bg-vellum px-4 py-3"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-brass">
              {DOCUMENT_TYPE_LABELS[doc.document_type]}
            </p>
            <p className="text-sm text-ink">{doc.file_name}</p>
            {doc.description && (
              <p className="text-xs text-ink/50">{doc.description}</p>
            )}
          </div>
          {doc.signedUrl && (
            <a
              href={doc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-wide text-patina hover:underline"
            >
              View →
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
