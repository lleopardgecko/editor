"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Doc = { id: string; title: string; updated_at: string };

export default function Dashboard({
  ownedDocs,
  sharedDocs,
  userEmail,
}: {
  ownedDocs: Doc[];
  sharedDocs: Doc[];
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDoc() {
    setCreating(true);
    setError(null);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (!user) { setCreating(false); setError(authErr?.message ?? "Not authenticated"); return; }
    const { data, error: insertErr } = await supabase
      .from("documents")
      .insert({ title: "Untitled", content: "", owner_id: user.id })
      .select("id")
      .single();
    if (data) router.push(`/doc/${data.id}`);
    if (insertErr) { setCreating(false); setError(insertErr.message); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (!user) { setError(authErr?.message ?? "Not authenticated"); return; }
    const text = await file.text();
    const title = file.name.replace(/\.(txt|md)$/, "");
    const { data, error: insertErr } = await supabase
      .from("documents")
      .insert({ title, content: text, owner_id: user.id })
      .select("id")
      .single();
    if (data) router.push(`/doc/${data.id}`);
    if (insertErr) setError(insertErr.message);
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await supabase.from("documents").delete().eq("id", id);
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{userEmail}</span>
          <button
            onClick={signOut}
            className="text-sm text-neutral-500 underline hover:text-neutral-900"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex gap-3 mb-8">
        <button
          onClick={createDoc}
          disabled={creating}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          New Document
        </button>
        <label className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium cursor-pointer hover:bg-neutral-50">
          Upload .txt / .md
          <input
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">My Documents</h2>
        {ownedDocs.length === 0 ? (
          <p className="text-sm text-neutral-400">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {ownedDocs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-3 hover:bg-neutral-50 -mx-2 px-2 rounded">
                <Link
                  href={`/doc/${doc.id}`}
                  className="flex-1 flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{doc.title}</span>
                  <span className="text-xs text-neutral-400">
                    {doc.updated_at}
                  </span>
                </Link>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  className="ml-3 text-xs text-neutral-400 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Shared with Me</h2>
        {sharedDocs.length === 0 ? (
          <p className="text-sm text-neutral-400">Nothing shared yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {sharedDocs.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/doc/${doc.id}`}
                  className="flex items-center justify-between py-3 hover:bg-neutral-50 -mx-2 px-2 rounded"
                >
                  <span className="text-sm font-medium">{doc.title}</span>
                  <span className="text-xs text-neutral-400">
                    {doc.updated_at}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
