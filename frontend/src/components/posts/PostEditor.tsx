'use client';

import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

interface PostEditorProps {
  value: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  autosaveKey?: string;
}

export default function PostEditor({ value, onChange, editable = true, placeholder = 'Write your post...', autosaveKey = 'post-editor-draft' }: PostEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Restore from localStorage if available
  useEffect(() => {
    if (autosaveKey && !value) {
      const saved = localStorage.getItem(autosaveKey);
      if (saved) onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Underline,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      // Autosave
      if (autosaveKey) localStorage.setItem(autosaveKey, html);
      // Word/char count
      const text = editor.getText();
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      setCharCount(text.length);
    },
  });

  // Keep editor in sync with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return <div>Loading editor...</div>;

  return (
    <div className="border rounded-md p-2 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-blue-600' : ''}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-blue-600' : ''}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-blue-600' : ''}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'text-blue-600' : ''}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'text-blue-600' : ''}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'text-blue-600' : ''}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'text-blue-600' : ''}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'text-blue-600' : ''}>Left</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'text-blue-600' : ''}>Center</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'text-blue-600' : ''}>Right</button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>Img</button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter link URL');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}>Link</button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</button>
        <button type="button" className="ml-auto text-xs text-gray-500 underline" onClick={() => setShowPreview(v => !v)}>{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
      </div>
      {/* Editor or Preview */}
      {!showPreview ? (
        <EditorContent editor={editor} className="min-h-[200px]" />
      ) : (
        <div className="prose prose-lg min-h-[200px] border bg-gray-50 rounded p-2" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
      )}
      {/* Word/char count */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{wordCount} words</span>
        <span>{charCount} chars</span>
        {autosaveKey && <span>Draft autosaved</span>}
      </div>
    </div>
  );
} 