'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getRoot, $getSelection as $getSelectionHelper } from 'lexical';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, Quote } from 'lucide-react';

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const formatNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const formatBold = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('bold');
      }
    });
  };

  const formatItalic = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('italic');
      }
    });
  };

  const formatUnderline = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('underline');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatBold}
        className="h-8 w-8 p-0"
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatItalic}
        className="h-8 w-8 p-0"
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatUnderline}
        className="h-8 w-8 p-0"
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h1')}
        className="h-8 w-8 p-0"
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h2')}
        className="h-8 w-8 p-0"
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h3')}
        className="h-8 w-8 p-0"
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatBulletList}
        className="h-8 w-8 p-0"
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatNumberedList}
        className="h-8 w-8 p-0"
        aria-label="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={formatQuote}
        className="h-8 w-8 p-0"
        aria-label="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ToolbarPlugin;

