'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, TextNode } from 'lexical';
import { $createPlaceholderNode, $isPlaceholderNode } from './PlaceholderNode';

interface PlaceholderLocation {
  start: number;
  end: number;
  value: string;
  originalText: string;
}

interface ReplacePlaceholdersPluginProps {
  placeholders: PlaceholderLocation[];
  isComplete: boolean;
}

function ReplacePlaceholdersPlugin({ placeholders, isComplete }: ReplacePlaceholdersPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!isComplete || !placeholders || placeholders.length === 0) {
      return;
    }

    // Wait a bit after typewriter completes to ensure content is set
    const timeoutId = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot();
        
        // Get all text content to find placeholders
        const fullText = root.getTextContent();
        
        if (!fullText || placeholders.length === 0) {
          return;
        }

        // Sort placeholders by start position (descending) to replace from end to start
        const sortedPlaceholders = [...placeholders].sort((a, b) => b.start - a.start);
        const processedNodes = new Set<string>();

        // Replace placeholders starting from the end to avoid position shifts
        sortedPlaceholders.forEach((placeholder) => {
          // Get current full text (may have changed from previous replacements)
          const currentFullText = root.getTextContent();
          
          // Verify the placeholder text matches at the expected position
          let placeholderStart = placeholder.start;
          let placeholderEnd = placeholder.end;
          
          const actualText = currentFullText.substring(placeholderStart, placeholderEnd);
          if (actualText !== placeholder.originalText) {
            // Try to find the placeholder in the text (might have shifted)
            const index = currentFullText.indexOf(placeholder.originalText);
            if (index === -1) {
              return; // Placeholder not found
            }
            // Use found position
            placeholderStart = index;
            placeholderEnd = index + placeholder.originalText.length;
          }

          // Find the text node(s) that contain this placeholder
          const allTextNodes: TextNode[] = [];
          root.getAllTextNodes().forEach((node) => {
            if (!($isPlaceholderNode(node)) && node instanceof TextNode && node.isAttached()) {
              allTextNodes.push(node);
            }
          });

          // Build position map
          let currentPos = 0;
          const nodeMap: Array<{ node: TextNode; start: number; end: number }> = [];
          
          allTextNodes.forEach((node) => {
            const text = node.getTextContent();
            const start = currentPos;
            const end = start + text.length;
            nodeMap.push({ node, start, end });
            currentPos = end;
          });

          // Find nodes that contain this placeholder
          const affectedNodes = nodeMap.filter(
            ({ start, end }) => placeholderStart < end && placeholderEnd > start
          );

          if (affectedNodes.length === 0) {
            return;
          }

          // Process the first affected node (should contain the start of placeholder)
          const firstNode = affectedNodes[0];
          const { node, start: nodeStart } = firstNode;
          
          if (processedNodes.has(node.getKey()) || $isPlaceholderNode(node) || !node.isAttached()) {
            return;
          }

          const nodeText = node.getTextContent();
          const relativeStart = Math.max(0, placeholderStart - nodeStart);
          const relativeEnd = Math.min(nodeText.length, placeholderEnd - nodeStart);

          if (relativeStart >= 0 && relativeEnd <= nodeText.length && relativeStart < relativeEnd) {
            const beforeText = nodeText.substring(0, relativeStart);
            const placeholderText = nodeText.substring(relativeStart, relativeEnd);
            const afterText = nodeText.substring(relativeEnd);

            // Verify the placeholder text matches
            if (placeholderText === placeholder.originalText) {
              const nodesToInsert: (TextNode | ReturnType<typeof $createPlaceholderNode>)[] = [];
              
              if (beforeText) {
                nodesToInsert.push(new TextNode(beforeText));
              }
              
              nodesToInsert.push($createPlaceholderNode(placeholder.value));
              
              if (afterText) {
                nodesToInsert.push(new TextNode(afterText));
              }

              const parent = node.getParent();
              if (parent && nodesToInsert.length > 0) {
                const index = node.getIndexWithinParent();
                node.remove();
                parent.splice(index, 0, nodesToInsert);
                processedNodes.add(node.getKey());
              }
            }
          }
        });
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [editor, placeholders, isComplete]);

  return null;
}

export default ReplacePlaceholdersPlugin;

