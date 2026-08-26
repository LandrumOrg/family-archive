"use client";

import type { Person } from "@/lib/types";

interface Props {
  person: Person;
  documentCount: number;
  onClick: () => void;
}

function formatYear(dateStr: string | null) {
  if (!dateStr) return "?";
  return new Date(dateStr).getFullYear();
}

export default function PersonNode({ person, documentCount, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group relative w-48 border border-ink/20 bg-vellum p-4 text-left transition hover:border-patina hover:shadow-md"
    >
      <span className="record-seal absolute -right-3 -top-3 bg-vellum">
        {documentCount}
      </span>

      <p className="font-display text-lg leading-tight text-ink">
        {person.first_name} {person.last_name ?? ""}
      </p>
      {person.maiden_name && (
        <p className="font-mono text-xs text-ink/50">née {person.maiden_name}</p>
      )}
      <p className="mt-2 font-mono text-xs text-ink/60">
        {formatYear(person.birth_date)} – {person.death_date ? formatYear(person.death_date) : "present"}
      </p>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-patina opacity-0 transition group-hover:opacity-100">
        View records →
      </p>
    </button>
  );
}
