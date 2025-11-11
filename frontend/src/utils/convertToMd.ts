// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
    GoogleGenAI,
  } from '@google/genai';
  
  async function main() {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const model = 'gemini-flash-lite-latest';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `convert the following file to markdown:`,
          },
        ],
      },
    ];
  
    const response = await ai.models.generateContentStream({
      model,
      contents,
    });
    for await (const chunk of response) {
      console.log(chunk.text);
    }
  }
  
  main();
  