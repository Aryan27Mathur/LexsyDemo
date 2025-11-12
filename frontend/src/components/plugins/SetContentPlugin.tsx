'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { marked } from 'marked';

interface SetContentPluginProps {
  content: string | null;
}

function SetContentPlugin({ content }: SetContentPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content === null || content === '') {
      return;
    }

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Convert markdown to HTML using marked
      const htmlContent = marked.parse(content, {
        breaks: true,
        gfm: true,
      }) as string;
      
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const dom = parser.parseFromString(htmlContent, 'text/html');
      
      // Generate Lexical nodes from the DOM
      const nodes = $generateNodesFromDOM(editor, dom);
      
      // Insert the nodes into the root
      root.append(...nodes);
    }, { tag: 'set-content' });
  }, [content, editor]);

  return null;
}

export default SetContentPlugin;

