'use client';

import { useMemo } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import SetContentPlugin from './plugins/SetContentPlugin';
import CommentPlugin from './plugins/CommentPlugin';

interface EditorProps {
  content?: string | null;
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

function Editor({ content = null }: EditorProps) {
  // Calculate number of lines for line numbers
  const lineCount = useMemo(() => {
    if (!content) return 0;
    const lines = content.split('\n');
    return Math.max(lines.length, 1);
  }, [content]);

  const initialConfig = {
    namespace: 'MyEditor',
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
        strikethrough: 'editor-text-strikethrough',
        code: 'editor-text-code',
      },
      list: {
        ul: 'editor-list-ul',
        ol: 'editor-list-ol',
        listitem: 'editor-listitem',
      },
      link: 'editor-link',
      quote: 'editor-quote',
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      LinkNode,
    ],
    onError,
    editorState: null,
  };

  return (
    <div className="relative border-2 border-[var(--border)] rounded-lg bg-[var(--card)] min-h-[200px] focus-within:border-[var(--primary)] overflow-hidden transition-colors">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <SetContentPlugin content={content} />
        <div className="flex">
          {/* Line Numbers */}
          <div className="shrink-0 bg-[var(--background)] border-r border-[var(--border)] text-right select-none font-mono text-xs py-4 px-2 transition-colors opacity-50" style={{ minWidth: '2.5rem', lineHeight: '1.5rem', color: 'var(--muted-foreground)' }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} style={{ minHeight: '1.5rem' }}>
                {i + 1}
              </div>
            ))}
          </div>
          {/* Editor Content */}
          <div className="flex-1 relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="outline-none p-4 min-h-[200px] text-[var(--card-foreground)] transition-colors"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <CommentPlugin />
          </div>
        </div>
        <HistoryPlugin />
        <AutoFocusPlugin />
      </LexicalComposer>
    </div>
  );
}

export default Editor;

