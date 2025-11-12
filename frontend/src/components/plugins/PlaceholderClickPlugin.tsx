'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, TextNode } from 'lexical';
import { $isPlaceholderNode, PlaceholderNode } from './PlaceholderNode';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateAIResponse } from '@/app/actions';
import { readStreamableValue } from '@ai-sdk/rsc';

interface ActivePlaceholder {
  nodeKey: string;
  placeholder: string;
  position: { top: number; left: number };
}

function PlaceholderClickPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activePlaceholder, setActivePlaceholder] = useState<ActivePlaceholder | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showAIView, setShowAIView] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const getFullEditorContent = useCallback(() => {
    let fullContent = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      fullContent = root.getTextContent();
    });
    return fullContent;
  }, [editor]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked element is a placeholder
      if (target.classList.contains('editor-placeholder') || target.closest('.editor-placeholder')) {
        const placeholderElement = target.classList.contains('editor-placeholder') 
          ? target 
          : target.closest('.editor-placeholder') as HTMLElement;
        
        if (!placeholderElement) return;

        event.preventDefault();
        event.stopPropagation();

        const placeholderValue = placeholderElement.getAttribute('data-placeholder') || placeholderElement.textContent || '';
        
        // Get position for popup
        const rect = placeholderElement.getBoundingClientRect();
        const editorRect = rootElement.getBoundingClientRect();
        
        const position = {
          top: rect.bottom - editorRect.top + 5,
          left: rect.left - editorRect.left,
        };

        // Find the node key by matching DOM element
        editor.getEditorState().read(() => {
          const root = $getRoot();
          
          // Find node by matching the DOM element
          for (const node of root.getAllTextNodes()) {
            if ($isPlaceholderNode(node)) {
              const placeholderNode = node as PlaceholderNode;
              const nodeElement = editor.getElementByKey(placeholderNode.getKey());
              // Check if this is the clicked element
              if (nodeElement === placeholderElement) {
                setActivePlaceholder({
                  nodeKey: placeholderNode.getKey(),
                  placeholder: placeholderValue,
                  position,
                });
                setInputValue('');
                setShowAIView(false);
                setAiResponse('');
                break;
              }
            }
          }
        });
      }
    };

    rootElement.addEventListener('click', handleClick);
    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.editor-placeholder')
      ) {
        setActivePlaceholder(null);
        setInputValue('');
        setShowAIView(false);
        setAiResponse('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    if (!activePlaceholder || !inputValue.trim()) return;

    editor.update(() => {
      const root = $getRoot();
      
      // Find the node by key
      for (const n of root.getAllTextNodes()) {
        if ($isPlaceholderNode(n) && n.getKey() === activePlaceholder.nodeKey) {
          // Replace placeholder with text node containing the input value
          const textNode = new TextNode(inputValue.trim());
          const parent = n.getParent();
          if (parent) {
            const index = n.getIndexWithinParent();
            n.remove();
            parent.splice(index, 0, [textNode]);
          }
          break;
        }
      }
    });

    setActivePlaceholder(null);
    setInputValue('');
    setShowAIView(false);
    setAiResponse('');
  };

  const handleCancel = () => {
    setActivePlaceholder(null);
    setInputValue('');
    setShowAIView(false);
    setAiResponse('');
  };

  const handleAskAI = async () => {
    if (!activePlaceholder || !inputValue.trim()) return;

    setIsLoadingAI(true);
    setShowAIView(true);
    setAiResponse('');

    try {
      const fullContent = getFullEditorContent();
      const userQuestion = inputValue;

      const { output } = await generateAIResponse(fullContent, activePlaceholder.placeholder, userQuestion);

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAiResponse(delta);
        }
      }
    } catch (error) {
      console.error('Error asking AI:', error);
      setAiResponse('Error: Failed to get AI response. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSaveAIResponse = () => {
    if (!activePlaceholder || !aiResponse.trim()) return;

    editor.update(() => {
      const root = $getRoot();
      
      // Find the node by key
      for (const n of root.getAllTextNodes()) {
        if ($isPlaceholderNode(n) && n.getKey() === activePlaceholder.nodeKey) {
          // Replace placeholder with text node containing the AI response
          const textNode = new TextNode(aiResponse.trim());
          const parent = n.getParent();
          if (parent) {
            const index = n.getIndexWithinParent();
            n.remove();
            parent.splice(index, 0, [textNode]);
          }
          break;
        }
      }
    });

    setActivePlaceholder(null);
    setInputValue('');
    setShowAIView(false);
    setAiResponse('');
  };

  if (!activePlaceholder) {
    return null;
  }

  return (
    <>
      {/* Input View */}
      {!showAIView && (
        <div
          ref={popupRef}
          className="absolute z-20 bg-[var(--card)] border-2 border-[var(--border)] rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px] transition-colors"
          style={{
            top: `${activePlaceholder.position.top + 30}px`,
            left: `${activePlaceholder.position.left}px`,
          }}
        >
          <div className="mb-2">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Placeholder:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)] font-mono">
              {activePlaceholder.placeholder}
            </p>
          </div>
          <Input
            placeholder="Enter value or ask AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mb-3"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAskAI}
              disabled={!inputValue.trim() || isLoadingAI}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!inputValue.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* AI Response View */}
      {showAIView && (
        <div
          ref={popupRef}
          className="absolute z-20 bg-[var(--card)] border-2 border-[var(--border)] rounded-lg shadow-xl p-4 min-w-[400px] max-w-[600px] max-h-[500px] overflow-y-auto transition-colors"
          style={{
            top: `${activePlaceholder.position.top + 30}px`,
            left: `${activePlaceholder.position.left}px`,
          }}
        >
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Response
              </h3>
              <button
                onClick={() => {
                  setShowAIView(false);
                  setAiResponse('');
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close AI view"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Placeholder:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)] font-mono mb-2">
              {activePlaceholder.placeholder}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Question:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)]">
              {inputValue}
            </p>
          </div>
          <div className="mb-3">
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Response:</p>
            <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] min-h-[100px]">
              {isLoadingAI && !aiResponse && (
                <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                {aiResponse}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              setShowAIView(false);
              setAiResponse('');
            }}>
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAIResponse}
              disabled={!aiResponse || isLoadingAI}
            >
              Save Response
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default PlaceholderClickPlugin;

