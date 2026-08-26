"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Person, RelationshipType } from "@/lib/types";

interface Props {
  familyId: string;
  people: Person[];
  onClose: () => void;
}

export default function AddPersonForm({ familyId, people, onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relatedTo, setRelatedTo] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("parent_child");
  const [direction, setDirection] = useState<"is_parent" | "is_child">("is_child");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: newPerson, error: personError } = await supabase
      .from("people")
      .insert({
        family_id: familyId,
        first_name: firstName,
        last_name: lastName || null,
        birth_date: birthDate || null,
      })
      .select("id")
      .single();

    if (personError || !newPerson) {
      setError(personError?.message ?? "Could not save person");
      setSaving(false);
      return;
    }

    if (relatedTo) {
      const isParentChild = relationshipType === "parent_child";
      const [personAId, personBId] = isParentChild
        ? direction === "is_child"
          ? [relatedTo, newPerson.id] // existing person is the parent
          : [newPerson.id, relatedTo] // new person is the parent
        : [relatedTo, newPerson.id];

      const { error: relError } = await supabase.from("relationships").insert({
        family_id: familyId,
        person_a_id: personAId,
        person_b_id: personBId,
        relationship_type: relationshipType,
      });

      if (relError) {
        setError(relError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md border border-ink/20 bg-vellum p-6">
        <h2 className="font-display text-2xl text-ink">Add a person</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
              Birth date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
            />
          </div>

          {people.length > 0 && (
            <>
              <div>
                <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
                  Related to (optional)
                </label>
                <select
                  value={relatedTo}
                  onChange={(e) => setRelatedTo(e.target.value)}
                  className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
                >
                  <option value="">— no relationship yet —</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {relatedTo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
                      Relationship
                    </label>
                    <select
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                      className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
                    >
                      <option value="parent_child">Parent / child</option>
                      <option value="spouse">Spouse</option>
                      <option value="divorced_spouse">Divorced spouse</option>
                    </select>
                  </div>
                  {relationshipType === "parent_child" && (
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wide text-ink/70">
                        New person is the
                      </label>
                      <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as "is_parent" | "is_child")}
                        className="mt-1 w-full border border-ink/25 bg-transparent px-3 py-2 outline-none focus-visible:border-patina"
                      >
                        <option value="is_child">Child</option>
                        <option value="is_parent">Parent</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {error && <p className="text-sm text-oxblood">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-ink px-4 py-2 font-mono text-sm uppercase tracking-wide text-vellum transition hover:bg-patina disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-sm uppercase tracking-wide text-ink/60 hover:text-oxblood"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
