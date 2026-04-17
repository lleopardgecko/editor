import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Dashboard from "./dashboard";

type Doc = { id: string; title: string; updated_at: string };
type ShareRow = { document_id: string; documents: Doc | null };

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .returns<Doc[]>();

  const { data: shares } = await supabase
    .from("document_shares")
    .select("document_id, documents(id, title, updated_at)")
    .eq("shared_with_id", user.id)
    .returns<ShareRow[]>();

  const sharedDocs = (shares ?? [])
    .map((s) => s.documents)
    .filter((d): d is Doc => d !== null);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}/${dt.getUTCFullYear()}`;
  };

  const formatDocs = (docs: Doc[]) =>
    docs.map((d) => ({ ...d, updated_at: formatDate(d.updated_at) }));

  return (
    <Dashboard
      ownedDocs={formatDocs(owned ?? [])}
      sharedDocs={formatDocs(sharedDocs)}
      userEmail={user.email ?? ""}
    />
  );
}
