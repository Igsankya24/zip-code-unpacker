import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { useCallback } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b border-border">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className="h-8 w-8"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 w-8"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 w-8"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 w-8"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          onClick={setLink}
          className="h-8 w-8"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={addImage}
          className="h-8 w-8"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
};

export default RichTextEditor;