"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";

import { createClient } from "@/lib/supabase-browser";

export default function Editor({
  id,
  initialTitle,
  initialContent,
  isOwner,
}: {
  id: string;
  initialTitle: string;
  initialContent: string;
  isOwner: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedContent = useRef<string>(initialContent);
  const lastSavedTitle = useRef<string>(initialTitle);
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ listItem: false }),
      ListItem.extend({ content: "(paragraph | heading) block*" }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-1 py-2",
      },
    },
  });

  const save = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const currentTitle = titleRef.current;
    const contentChanged = html !== lastSavedContent.current;
    const titleChanged = currentTitle !== lastSavedTitle.current;
    if (!contentChanged && !titleChanged) return;

    setSaving(true);
    const patch: { content?: string; title?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (contentChanged) patch.content = html;
    if (titleChanged) patch.title = currentTitle;

    const { error } = await supabase.from("documents").update(patch).eq("id", id);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    if (contentChanged) lastSavedContent.current = html;
    if (titleChanged) lastSavedTitle.current = currentTitle;
    setSaveError(null);
  }, [editor, id, supabase]);

  useEffect(() => {
    const interval = setInterval(save, 3000);
    return () => clearInterval(interval);
  }, [save]);

  async function handleShare(e: React.FormEvent) {
    if (!isOwner) return;
    e.preventDefault();
    setShareMsg("");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", shareEmail)
      .single();

    if (!profile) {
      setShareMsg("No user found with that email.");
      return;
    }

    const { error } = await supabase.from("document_shares").insert({
      document_id: id,
      shared_with_email: shareEmail,
      shared_with_id: profile.id,
    });

    if (error) {
      setShareMsg(error.code === "23505" ? "Already shared with this user." : error.message);
    } else {
      setShareMsg("Shared!");
      setShareEmail("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-neutral-900 shrink-0">
          &larr; Back
        </button>
        <div className="flex items-center gap-3 min-w-0">
          {saveError ? (
            <span className="text-xs text-red-600 truncate">Save failed: {saveError}</span>
          ) : saving ? (
            <span className="text-xs text-neutral-400">Saving...</span>
          ) : null}
          {isOwner && (
            <button
              onClick={() => setShowShare(!showShare)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 shrink-0"
            >
              Share
            </button>
          )}
        </div>
      </div>

      {showShare && (
        <form onSubmit={handleShare} className="mb-6 flex flex-wrap gap-2 items-start">
          <input
            type="email"
            placeholder="Email to share with"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            required
            className="flex-1 min-w-0 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 shrink-0"
          >
            Share
          </button>
          {shareMsg && <span className="text-sm text-neutral-500 self-center basis-full">{shareMsg}</span>}
        </form>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-semibold mb-4 border-none outline-none bg-transparent"
        placeholder="Document title"
      />

      {editor && <Toolbar editor={editor} />}

      <div className="border border-neutral-200 rounded-md p-4 mt-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`;

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </button>
      <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </button>
      <span className="w-px bg-neutral-200 mx-1" />
      <button
        className={btn(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        className={btn(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        className={btn(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <span className="w-px bg-neutral-200 mx-1" />
      <button
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        &bull; List
      </button>
      <button
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </button>
    </div>
  );
}
