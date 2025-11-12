'use server';

import { GoogleGenAI } from '@google/genai';
import { createStreamableValue } from '@ai-sdk/rsc';

export async function generateAIResponse(
  fullContent: string,
  selectedText: string,
  userQuestion: string
) {
  const streamableValue = createStreamableValue('');

  (async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        streamableValue.done();
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a legal AI assistant. Given the following document content and a highlighted section, answer the user's question.

Full Document Content:
${fullContent}

Highlighted Section:
${selectedText}

User Question: ${userQuestion}

Please provide a helpful and accurate response based on the document content and highlighted section.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          temperature: 0,
        },
      });

      let fullResponse = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        if (text) {
          fullResponse += text;
          streamableValue.update(fullResponse);
        }
      }

      streamableValue.done();
    } catch (error) {
      console.error('Error generating AI response:', error);
      streamableValue.update('Error: Failed to generate response. Please try again.');
      streamableValue.done();
    }
  })();

  return { output: streamableValue.value };
}

