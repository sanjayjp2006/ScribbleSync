import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Underline from '@tiptap/extension-underline';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import type { CollaborationProvider, CollaborationUser } from '@/types/collaboration';
import type * as Y from 'yjs';

interface UseEditorOptions {
  readonly document: Y.Doc;
  readonly provider: CollaborationProvider;
  readonly user: CollaborationUser;
}

export const useEditor = ({ document, provider, user }: UseEditorOptions) =>
  useTiptapEditor({
    extensions: [
      StarterKit.configure({
        history: false,
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Collaboration.configure({
        document,
        field: 'default'
      }),
      CollaborationCursor.configure({
        provider,
        user
      })
    ],
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] w-full rounded-b-lg border border-t-0 border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none'
      }
    }
  });
