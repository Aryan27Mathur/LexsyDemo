'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $getRoot } from 'lexical';
import { MessageCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateAIResponse } from '@/app/actions';
import { readStreamableValue } from '@ai-sdk/rsc';

interface Comment {
  id: string;
  text: string;
  position: { top: number; left: number };
  selectedText: string;
}

function CommentPlugin() {
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<Range | null>(null);
  const [showCommentCircle, setShowCommentCircle] = useState(false);
  const [circlePosition, setCirclePosition] = useState({ top: 0, left: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showAIView, setShowAIView] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const commentBoxRef = useRef<HTMLDivElement>(null);

  const updateSelection = useCallback(() => {
    editor.getEditorState().read(() => {
      const lexicalSelection = $getSelection();
      if ($isRangeSelection(lexicalSelection) && !lexicalSelection.isCollapsed()) {
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const range = nativeSelection.getRangeAt(0);
          setSelection(range);
          
          // Get position for comment circle
          const rect = range.getBoundingClientRect();
          const editorElement = editor.getRootElement();
          if (editorElement) {
            const editorRect = editorElement.getBoundingClientRect();
            setCirclePosition({
              top: rect.bottom - editorRect.top + 5,
              left: rect.right - editorRect.left + 5,
            });
            setShowCommentCircle(true);
          }
        }
      } else {
        setShowCommentCircle(false);
        setSelection(null);
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateSelection();
      });
    });
  }, [editor, updateSelection]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commentBoxRef.current &&
        !commentBoxRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.comment-circle')
      ) {
        setActiveComment(null);
        setCommentText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCommentCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selection) {
      const selectedText = selection.toString();
      const newComment: Comment = {
        id: Date.now().toString(),
        text: '',
        position: circlePosition,
        selectedText,
      };
      setActiveComment(newComment);
      setShowCommentCircle(false);
    }
  };

  const handleSaveComment = () => {
    if (activeComment && commentText.trim()) {
      const updatedComment: Comment = {
        ...activeComment,
        text: commentText,
      };
      setComments((prev) => [...prev, updatedComment]);
      setActiveComment(null);
      setCommentText('');
      setShowCommentCircle(false);
      
      // Clear selection by removing it
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCancelComment = () => {
    setActiveComment(null);
    setCommentText('');
    setShowCommentCircle(false);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const getFullEditorContent = useCallback(() => {
    let fullContent = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      fullContent = root.getTextContent();
    });
    return fullContent;
  }, [editor]);

  const handleAskAI = async () => {
    if (!activeComment || !commentText.trim()) return;

    setIsLoadingAI(true);
    setShowAIView(true);
    setAiResponse('');

    try {
      const fullContent = getFullEditorContent();
      const selectedText = activeComment.selectedText;
      const userQuestion = commentText;

      const { output } = await generateAIResponse(fullContent, selectedText, userQuestion);

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

  return (
    <>
      {/* Comment Circle Overlay */}
      {showCommentCircle && !activeComment && (
        <button
          className="comment-circle absolute z-10 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary)]/90 transition-colors shadow-lg"
          style={{
            top: `${circlePosition.top}px`,
            left: `${circlePosition.left}px`,
          }}
          onClick={handleCommentCircleClick}
          aria-label="Add comment"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      )}

      {/* Comment Box */}
      {activeComment && !showAIView && (
        <div
          ref={commentBoxRef}
          className="absolute z-20 bg-[var(--card)] border-2 border-[var(--border)] rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px] transition-colors"
          style={{
            top: `${activeComment.position.top + 30}px`,
            left: `${activeComment.position.left}px`,
          }}
        >
          <div className="mb-2">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Selected text:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)] italic">
              &ldquo;{activeComment.selectedText}&rdquo;
            </p>
          </div>
          <Input
            placeholder="Add a comment or ask a question..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mb-3"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancelComment}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAskAI}
              disabled={!commentText.trim() || isLoadingAI}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
            <Button size="sm" onClick={handleSaveComment} disabled={!commentText.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* AI Response View */}
      {activeComment && showAIView && (
        <div
          ref={commentBoxRef}
          className="absolute z-20 bg-[var(--card)] border-2 border-[var(--border)] rounded-lg shadow-xl p-4 min-w-[400px] max-w-[600px] max-h-[500px] overflow-y-auto transition-colors"
          style={{
            top: `${activeComment.position.top + 30}px`,
            left: `${activeComment.position.left}px`,
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
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Question:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)]">
              {commentText}
            </p>
          </div>
          <div className="mb-3">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Selected text:</p>
            <p className="text-sm bg-[var(--background)] p-2 rounded border border-[var(--border)] italic">
              &ldquo;{activeComment.selectedText}&rdquo;
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
              onClick={() => {
                if (aiResponse) {
                  const updatedComment: Comment = {
                    ...activeComment,
                    text: `AI Response: ${aiResponse}`,
                  };
                  setComments((prev) => [...prev, updatedComment]);
                  setActiveComment(null);
                  setCommentText('');
                  setShowAIView(false);
                  setAiResponse('');
                }
              }}
              disabled={!aiResponse || isLoadingAI}
            >
              Save Response
            </Button>
          </div>
        </div>
      )}

      {/* Existing Comments */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute z-10 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-md p-3 min-w-[250px] max-w-[350px] transition-colors"
          style={{
            top: `${comment.position.top + 30}px`,
            left: `${comment.position.left}px`,
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs text-[var(--muted-foreground)] italic flex-1">
              &ldquo;{comment.selectedText}&rdquo;
            </p>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Delete comment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[var(--foreground)]">{comment.text}</p>
        </div>
      ))}
    </>
  );
}

export default CommentPlugin;

