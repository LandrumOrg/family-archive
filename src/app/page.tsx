import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FamilyTree from "@/components/FamilyTree";
import type { Person, Relationship } from "@/lib/types";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find a family this user belongs to, or create one on first visit.
  let { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let familyId = membership?.family_id as string | undefined;

  if (!familyId) {
    const { data: newFamily, error: familyError } = await supabase
      .from("families")
      .insert({ name: "My Family", created_by: user.id })
      .select("id")
      .single();

    if (familyError || !newFamily) {
      throw new Error(familyError?.message ?? "Could not create family");
    }

    await supabase
      .from("family_members")
      .insert({ family_id: newFamily.id, user_id: user.id, role: "owner" });

    familyId = newFamily.id;
  }

  const [{ data: people }, { data: relationships }] = await Promise.all([
    supabase.from("people").select("*").eq("family_id", familyId).order("birth_date"),
    supabase.from("relationships").select("*").eq("family_id", familyId),
  ]);

  // Document counts per person, for the record-seal badge.
  const { data: documents } = await supabase
    .from("documents")
    .select("person_id")
    .eq("family_id", familyId);

  const docCounts: Record<string, number> = {};
  (documents ?? []).forEach((d) => {
    docCounts[d.person_id] = (docCounts[d.person_id] ?? 0) + 1;
  });

  return (
    <FamilyTree
      familyId={familyId}
      people={(people ?? []) as Person[]}
      relationships={(relationships ?? []) as Relationship[]}
      docCounts={docCounts}
    />
  );
}
