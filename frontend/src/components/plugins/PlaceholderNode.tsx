'use client';

import {
  TextNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  SerializedTextNode,
  Spread,
} from 'lexical';

export interface PlaceholderPayload {
  placeholder: string;
  key?: NodeKey;
}

export type SerializedPlaceholderNode = Spread<
  {
    placeholder: string;
    type: 'placeholder';
    version: 1;
  },
  SerializedTextNode
>;

export class PlaceholderNode extends TextNode {
  __placeholder: string;

  static getType(): string {
    return 'placeholder';
  }

  static clone(node: PlaceholderNode): PlaceholderNode {
    return new PlaceholderNode(node.__placeholder, node.__key);
  }

  constructor(placeholder: string, key?: NodeKey) {
    super(placeholder, key);
    this.__placeholder = placeholder;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'editor-placeholder';
    span.textContent = this.__placeholder;
    span.setAttribute('data-placeholder', this.__placeholder);
    span.setAttribute('contenteditable', 'false');
    return span;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateDOM(prevNode: PlaceholderNode, dom: HTMLElement, _config: EditorConfig): boolean {
    if (prevNode.__placeholder !== this.__placeholder) {
      dom.textContent = this.__placeholder;
      dom.setAttribute('data-placeholder', this.__placeholder);
    }
    return false;
  }

  static importJSON(serializedNode: SerializedPlaceholderNode): PlaceholderNode {
    const { placeholder } = serializedNode;
    return $createPlaceholderNode(placeholder);
  }

  exportJSON(): SerializedPlaceholderNode {
    return {
      ...super.exportJSON(),
      placeholder: this.__placeholder,
      type: 'placeholder',
      version: 1,
    };
  }

  getPlaceholder(): string {
    return this.__placeholder;
  }

  setPlaceholder(placeholder: string): void {
    const writable = this.getWritable();
    writable.__placeholder = placeholder;
    writable.__text = placeholder;
  }

  getTextContent(): string {
    return this.__placeholder;
  }

  isInline(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createPlaceholderNode(placeholder: string): PlaceholderNode {
  return new PlaceholderNode(placeholder);
}

export function $isPlaceholderNode(
  node: LexicalNode | null | undefined
): node is PlaceholderNode {
  return node instanceof PlaceholderNode;
}

