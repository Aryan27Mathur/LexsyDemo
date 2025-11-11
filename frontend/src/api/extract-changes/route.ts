import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ChangeLogEntry {
  type: 'added' | 'removed' | 'modified'
  oldText?: string
  newText?: string
  context?: string
  section?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { oldTranscription, newTranscription } = body

    if (!oldTranscription || !newTranscription) {
      return NextResponse.json({ error: 'Missing transcriptions' }, { status: 400 })
    }

    const prompt = `You are a document comparison expert. Analyze two document transcriptions and extract all changes in a structured format.

OLD VERSION:
${oldTranscription}

NEW VERSION:
${newTranscription}

Extract all changes between these two versions. For each change, identify:
1. Type: "added" (new content), "removed" (deleted content), or "modified" (changed content)
2. Old text: The text that was removed or changed (for removed/modified)
3. New text: The text that was added or changed to (for added/modified)
4. Context: A brief description of what section or topic this change relates to
5. Section: The heading or section name where this change occurred (if applicable)

Return your response as a JSON array of change objects. Each object should have this structure:
{
  "type": "added" | "removed" | "modified",
  "oldText": "text that was removed/changed (omit for added)",
  "newText": "text that was added/changed to (omit for removed)",
  "context": "brief description",
  "section": "section name or heading (optional)"
}

Focus on meaningful changes - ignore minor formatting differences, whitespace changes, or trivial edits. Group related changes when possible. Return ONLY valid JSON, no markdown formatting or additional commentary.`

    const genAI = new GoogleGenerativeAI(apiKey)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro'
    const model = genAI.getGenerativeModel({ model: modelName })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Empty extraction result' }, { status: 502 })
    }

    // Try to extract JSON from the response (in case it's wrapped in markdown code blocks)
    let jsonText = text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    }

    // Parse the JSON response
    let changes: ChangeLogEntry[]
    try {
      changes = JSON.parse(jsonText)
      if (!Array.isArray(changes)) {
        throw new Error('Response is not an array')
      }
    } catch (parseError) {
      console.error('Failed to parse changes JSON:', parseError)
      console.error('Raw response:', text)
      return NextResponse.json({ 
        error: 'Failed to parse changes. The model response was not valid JSON.',
        rawResponse: text 
      }, { status: 502 })
    }

    return NextResponse.json({ changes })
  } catch (error) {
    console.error('Change extraction error:', error)
    const message = error instanceof Error ? error.message : 'Failed to extract changes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

