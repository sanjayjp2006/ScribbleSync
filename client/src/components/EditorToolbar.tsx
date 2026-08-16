import type { Editor } from '@tiptap/react';
import type { ReactElement } from 'react';

import { cn } from '@/utils/className';

interface EditorToolbarProps {
  readonly editor: Editor | null;
}

interface ToolbarButton {
  readonly label: string;
  readonly title: string;
  readonly isActive?: () => boolean;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps): ReactElement => {
  const buttons: readonly ToolbarButton[] =
    editor === null
      ? []
      : [
          {
            label: 'B',
            title: 'Bold',
            isActive: () => editor.isActive('bold'),
            onClick: () => {
              editor.chain().focus().toggleBold().run();
            }
          },
          {
            label: 'I',
            title: 'Italic',
            isActive: () => editor.isActive('italic'),
            onClick: () => {
              editor.chain().focus().toggleItalic().run();
            }
          },
          {
            label: 'U',
            title: 'Underline',
            isActive: () => editor.isActive('underline'),
            onClick: () => {
              editor.chain().focus().toggleUnderline().run();
            }
          },
          {
            label: '•',
            title: 'Bullet list',
            isActive: () => editor.isActive('bulletList'),
            onClick: () => {
              editor.chain().focus().toggleBulletList().run();
            }
          },
          {
            label: '1.',
            title: 'Ordered list',
            isActive: () => editor.isActive('orderedList'),
            onClick: () => {
              editor.chain().focus().toggleOrderedList().run();
            }
          },
          {
            label: 'H',
            title: 'Heading',
            isActive: () => editor.isActive('heading', { level: 2 }),
            onClick: () => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }
          },
          {
            label: '↶',
            title: 'Undo',
            disabled: !editor.can().undo(),
            onClick: () => {
              editor.chain().focus().undo().run();
            }
          },
          {
            label: '↷',
            title: 'Redo',
            disabled: !editor.can().redo(),
            onClick: () => {
              editor.chain().focus().redo().run();
            }
          }
        ];

  return (
    <div className="flex flex-wrap gap-2 rounded-t-lg border border-slate-200 bg-slate-50 p-2">
      {buttons.map((button) => (
        <button
          key={button.title}
          type="button"
          title={button.title}
          disabled={button.disabled}
          onClick={button.onClick}
          className={cn(
            'flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40',
            button.isActive?.() === true && 'border-blue-500 bg-blue-50 text-blue-700'
          )}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};
