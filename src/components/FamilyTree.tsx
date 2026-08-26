"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Person, Relationship } from "@/lib/types";
import PersonNode from "@/components/PersonNode";
import AddPersonForm from "@/components/AddPersonForm";

interface Props {
  familyId: string;
  people: Person[];
  relationships: Relationship[];
  docCounts: Record<string, number>;
}

/**
 * Assigns each person a generation number by walking parent_child
 * edges. People with no parent edge become generation 0 anchors;
 * everyone else is (parent's generation + 1). Spouses are pulled
 * onto the same generation as their partner.
 */
function computeGenerations(people: Person[], relationships: Relationship[]) {
  const parentOf: Record<string, string[]> = {}; // childId -> [parentId]
  const spouseOf: Record<string, string[]> = {};

  relationships.forEach((r) => {
    if (r.relationship_type === "parent_child") {
      parentOf[r.person_b_id] = [...(parentOf[r.person_b_id] ?? []), r.person_a_id];
    } else if (r.relationship_type === "spouse" || r.relationship_type === "divorced_spouse") {
      spouseOf[r.person_a_id] = [...(spouseOf[r.person_a_id] ?? []), r.person_b_id];
      spouseOf[r.person_b_id] = [...(spouseOf[r.person_b_id] ?? []), r.person_a_id];
    }
  });

  const generation: Record<string, number> = {};
  const peopleIds = people.map((p) => p.id);

  function resolve(id: string, seen = new Set<string>()): number {
    if (generation[id] !== undefined) return generation[id];
    if (seen.has(id)) return 0; // guard against cycles in bad data
    seen.add(id);

    const parents = parentOf[id];
    if (!parents || parents.length === 0) {
      generation[id] = 0;
      return 0;
    }
    const g = Math.max(...parents.map((pid) => resolve(pid, seen))) + 1;
    generation[id] = g;
    return g;
  }

  peopleIds.forEach((id) => resolve(id));

  // Pull spouses onto the same generation as their partner.
  peopleIds.forEach((id) => {
    (spouseOf[id] ?? []).forEach((sid) => {
      if (generation[sid] < generation[id]) generation[id] = generation[sid];
    });
  });

  return generation;
}

export default function FamilyTree({ familyId, people, relationships, docCounts }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showAddPerson, setShowAddPerson] = useState(false);

  const generations = useMemo(
    () => computeGenerations(people, relationships),
    [people, relationships]
  );

  const byGeneration = useMemo(() => {
    const groups: Record<number, Person[]> = {};
    people.forEach((p) => {
      const g = generations[p.id] ?? 0;
      groups[g] = [...(groups[g] ?? []), p];
    });
    return groups;
  }, [people, generations]);

  const generationLabels = [
    "Great-grandparents",
    "Grandparents",
    "Parents",
    "Children",
    "Grandchildren",
    "Great-grandchildren",
  ];
  const sortedGenNumbers = Object.keys(byGeneration).map(Number).sort((a, b) => a - b);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <header className="flex items-center justify-between border-b border-ink/15 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-patina">
            Family Archive
          </p>
          <h1 className="font-display text-3xl text-ink md:text-4xl">The Family Register</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddPerson(true)}
            className="border border-ink/25 px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink transition hover:border-patina hover:text-patina"
          >
            + Add person
          </button>
          <button
            onClick={handleSignOut}
            className="font-mono text-xs uppercase tracking-wide text-ink/50 hover:text-oxblood"
          >
            Sign out
          </button>
        </div>
      </header>

      {people.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-xl text-ink/70">
            Your register is empty. Add the first person to begin.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {sortedGenNumbers.map((genNum, i) => (
            <section key={genNum}>
              {i > 0 && <div className="ledger-rule mb-8" />}
              <p className="font-mono text-xs uppercase tracking-widest text-brass">
                Generation {genNum} · {generationLabels[genNum] ?? `Gen ${genNum}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-6">
                {byGeneration[genNum].map((person) => (
                  <PersonNode
                    key={person.id}
                    person={person}
                    documentCount={docCounts[person.id] ?? 0}
                    onClick={() => router.push(`/person/${person.id}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showAddPerson && (
        <AddPersonForm
          familyId={familyId}
          people={people}
          onClose={() => setShowAddPerson(false)}
        />
      )}
    </main>
  );
}
