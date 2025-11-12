'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, TextNode } from 'lexical';
import { $createPlaceholderNode, $isPlaceholderNode, PlaceholderNode } from './PlaceholderNode';

// Pattern to match placeholders:
// - $variable or $variable$ (dollar sign indicators)
// - ___ (three or more underscores)
// - {{variable}}, {variable}, ${variable}, or [[variable]] (legacy patterns)
const PLACEHOLDER_PATTERNS = [
  /\$([a-zA-Z_][a-zA-Z0-9_]*)\$/g,  // $variable$ (dollar sign on both sides)
  /\$([a-zA-Z_][a-zA-Z0-9_]*)\b/g,  // $variable (dollar sign prefix, word boundary)
  /_{3,}/g,                          // ___ (three or more underscores)
  /\{\{([^}]+)\}\}/g,               // {{variable}}
  /\{([^}]+)\}/g,                   // {variable}
  /\$\{([^}]+)\}/g,                 // ${variable}
  /\[\[([^\]]+)\]\]/g,              // [[variable]]
];

function PlaceholderPlugin() {
  const [editor] = useLexicalComposerContext();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
      // Skip if we're already processing
      if (isProcessingRef.current) {
        return;
      }

      // Process if there are dirty leaves/elements OR if this is a content update
      // The 'set-content' tag indicates content was set programmatically (from SetContentPlugin)
      const hasChanges = dirtyLeaves.size > 0 || dirtyElements.size > 0;
      const isContentUpdate = tags.has('set-content');
      
      // Always process when content is set, otherwise only process on text changes
      if (!hasChanges && !isContentUpdate) {
        return;
      }

      // For content updates, add a small delay to ensure all nodes are inserted
      const processPlaceholders = () => {
        if (isProcessingRef.current) {
          return;
        }

        isProcessingRef.current = true;
        editor.update(() => {
          const root = $getRoot();
          const selection = $getSelection();
          
          // Don't process while user is actively selecting text
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            isProcessingRef.current = false;
            return;
          }

          // Collect text nodes that need processing (collect keys to avoid stale references)
          const textNodesToProcess: Array<{ key: string; text: string }> = [];

          // Process all text nodes to find and convert placeholders
          root.getAllTextNodes().forEach((node) => {
            if (!($isPlaceholderNode(node)) && node instanceof TextNode) {
              const text = node.getTextContent();
              // Check if text contains any placeholder pattern
              const hasPlaceholder = PLACEHOLDER_PATTERNS.some((pattern) => {
                pattern.lastIndex = 0;
                return pattern.test(text);
              });
              if (hasPlaceholder) {
                textNodesToProcess.push({ key: node.getKey(), text });
              }
            }
          });

          if (textNodesToProcess.length === 0) {
            isProcessingRef.current = false;
            return;
          }

          // Process each text node
          textNodesToProcess.forEach(({ key, text }) => {
            // Get the node by traversing - we need to find it in the current state
            let foundNode: TextNode | null = null;
            root.getAllTextNodes().forEach((node) => {
              if (node.getKey() === key && node instanceof TextNode && !$isPlaceholderNode(node)) {
                foundNode = node;
              }
            });

            if (!foundNode) {
              return;
            }
            
            const textNode: TextNode = foundNode;
            const matches: Array<{ start: number; end: number; value: string }> = [];

            // Collect all matches from all patterns
            PLACEHOLDER_PATTERNS.forEach((pattern, patternIndex) => {
              pattern.lastIndex = 0;
              let match;
              while ((match = pattern.exec(text)) !== null) {
                // For underscore patterns (index 2), use a generic placeholder name
                // For dollar sign patterns, use the captured variable name
                // For other patterns, use the captured group or the full match
                let placeholderValue: string;
                if (patternIndex === 2) {
                  // Multiple underscores pattern - count them and create a descriptive name
                  const underscoreCount = match[0].length;
                  placeholderValue = `placeholder_${underscoreCount}`;
                } else {
                  placeholderValue = match[1] || match[0];
                }
                
                matches.push({
                  start: match.index,
                  end: match.index + match[0].length,
                  value: placeholderValue,
                });
              }
            });

            // Sort matches by start position
            matches.sort((a, b) => a.start - b.start);

            // Remove overlapping matches (keep first match)
            const nonOverlappingMatches: typeof matches = [];
            for (const match of matches) {
              const overlaps = nonOverlappingMatches.some(
                (existing) =>
                  (match.start >= existing.start && match.start < existing.end) ||
                  (match.end > existing.start && match.end <= existing.end)
              );
              if (!overlaps) {
                nonOverlappingMatches.push(match);
              }
            }

            if (nonOverlappingMatches.length === 0) {
              return;
            }

            const nodesToInsert: (TextNode | PlaceholderNode)[] = [];
            let lastIndex = 0;

            for (const match of nonOverlappingMatches) {
              // Add text before the match
              if (match.start > lastIndex) {
                const beforeText = text.substring(lastIndex, match.start);
                if (beforeText) {
                  nodesToInsert.push(new TextNode(beforeText));
                }
              }

              // Add placeholder node
              nodesToInsert.push($createPlaceholderNode(match.value));

              lastIndex = match.end;
            }

            // Add remaining text after last match
            if (lastIndex < text.length) {
              const remainingText = text.substring(lastIndex);
              if (remainingText) {
                nodesToInsert.push(new TextNode(remainingText));
              }
            }

            // Replace the original text node with the new nodes
            if (textNode && nodesToInsert.length > 0) {
              const parent = textNode.getParent();
              if (parent) {
                const index = textNode.getIndexWithinParent();
                textNode.remove();
                parent.splice(index, 0, nodesToInsert);
              }
            }
          });
          
          isProcessingRef.current = false;
        });
      };

      // For content updates, delay processing slightly to ensure DOM is ready
      if (isContentUpdate) {
        setTimeout(processPlaceholders, 0);
      } else {
        processPlaceholders();
      }
    });
  }, [editor]);

  return null;
}

export default PlaceholderPlugin;

