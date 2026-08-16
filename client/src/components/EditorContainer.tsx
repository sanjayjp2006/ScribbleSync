import { EditorContent, type Editor } from '@tiptap/react';
import type { ReactElement } from 'react';

import { EditorToolbar } from '@/components/EditorToolbar';

interface EditorContainerProps {
  readonly editor: Editor | null;
}

export const EditorContainer = ({ editor }: EditorContainerProps): ReactElement => (
  <section className="w-full" aria-label="Rich text editor">
    <EditorToolbar editor={editor} />
    {editor === null ? (
      <div className="min-h-[360px] rounded-b-lg border border-t-0 border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
        Loading editor
      </div>
    ) : (
      <EditorContent editor={editor} />
    )}
  </section>
);
