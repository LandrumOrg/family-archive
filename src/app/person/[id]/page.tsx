import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import type { FamilyDocument } from "@/lib/types";

export default async function PersonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!person) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("person_id", params.id)
    .order("uploaded_at", { ascending: false });

  // Signed URLs expire in 1 hour - documents are never publicly accessible.
  const docsWithUrls = await Promise.all(
    ((documents ?? []) as FamilyDocument[]).map(async (doc) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60 * 60);
      return { ...doc, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-patina"
      >
        ← Back to register
      </Link>

      <header className="mt-4 border-b border-ink/15 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-patina">Record for</p>
        <h1 className="font-display text-4xl text-ink">
          {person.first_name} {person.last_name ?? ""}
        </h1>
        {person.maiden_name && (
          <p className="font-mono text-sm text-ink/50">née {person.maiden_name}</p>
        )}
        <p className="mt-1 font-mono text-sm text-ink/60">
          {person.birth_date ?? "unknown"} – {person.death_date ?? "present"}
        </p>
      </header>

      <section className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-ink">Upload a record</h2>
          <p className="mt-1 text-sm text-ink/60">
            Files are stored privately and only visible to your family's members.
          </p>
          <div className="mt-4">
            <DocumentUploader familyId={person.family_id} personId={person.id} />
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-ink">Records on file</h2>
          <div className="mt-4">
            <DocumentList documents={docsWithUrls} />
          </div>
        </div>
      </section>
    </main>
  );
}
