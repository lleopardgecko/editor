import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Editor from "./editor";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) redirect("/");

  // Check access: owner or shared
  const isOwner = doc.owner_id === user.id;
  if (!isOwner) {
    const { data: share } = await supabase
      .from("document_shares")
      .select("id")
      .eq("document_id", id)
      .eq("shared_with_id", user.id)
      .single();
    if (!share) redirect("/");
  }

  return (
    <Editor
      id={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content ?? ""}
      isOwner={isOwner}
      userId={user.id}
    />
  );
}
