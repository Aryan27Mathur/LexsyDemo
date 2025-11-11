import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, createPartFromUri } from '@google/genai'
import mammoth from 'mammoth'
import { PDFDocument } from 'pdf-lib'

async function convertDocxToPdf(docxBuffer: ArrayBuffer): Promise<Uint8Array> {
  // Convert DOCX to text/markdown using mammoth
  const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer })
  const text = result.value

  // Create PDF from text content
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size (8.5 x 11 inches)
  const { height } = page.getSize()

  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  const fontSize = 12
  const lineHeight = fontSize * 1.2
  const margin = 72 // 1 inch margin
  const maxWidth = 612 - (margin * 2)
  let y = height - margin

  let currentPage = page

  for (const paragraph of paragraphs) {
    // Split long paragraphs into lines that fit the page width
    const words = paragraph.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      // Rough estimate: 6 pixels per character for font size 12
      const textWidth = testLine.length * 7

      if (textWidth > maxWidth && currentLine) {
        // Draw current line
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([612, 792])
          y = height - margin
        }
        
        currentPage.drawText(currentLine, {
          x: margin,
          y: y,
          size: fontSize,
          maxWidth: maxWidth,
        })
        y -= lineHeight
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    // Draw remaining line
    if (currentLine) {
      if (y < margin + lineHeight) {
        currentPage = pdfDoc.addPage([612, 792])
        y = height - margin
      }
      
      currentPage.drawText(currentLine, {
        x: margin,
        y: y,
        size: fontSize,
        maxWidth: maxWidth,
      })
      y -= lineHeight * 1.5 // Extra space between paragraphs
    }
  }

  return await pdfDoc.save()
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey })

    // Check if file is DOCX and convert to PDF
    const isDocx = file.name.toLowerCase().endsWith('.docx') || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    let fileBlob: Blob
    let uploadFileName = file.name

    if (isDocx) {
      // Convert DOCX to PDF
      const arrayBuffer = await file.arrayBuffer()
      const pdfBytes = await convertDocxToPdf(arrayBuffer)
      // Create Blob from Uint8Array - Blob accepts Uint8Array directly
      fileBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      uploadFileName = file.name.replace(/\.docx?$/i, '.pdf')
    } else {
      // Use file as-is
      fileBlob = new Blob([await file.arrayBuffer()], { type: file.type })
    }

    // Upload file to Gemini
    const uploadedFile = await ai.files.upload({
      file: fileBlob,
      config: {
        displayName: uploadFileName,
      },
    })

    // Wait for the file to be processed
    if (!uploadedFile.name) {
      return NextResponse.json({ error: 'File upload failed: missing file name' }, { status: 500 })
    }
    
    const uploadedFileName = uploadedFile.name
    let getFile = await ai.files.get({ name: uploadedFileName })
    while (getFile.state === 'PROCESSING') {
      getFile = await ai.files.get({ name: uploadedFileName })
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    if (getFile.state === 'FAILED') {
      return NextResponse.json({ error: 'File processing failed' }, { status: 500 })
    }

    // Generate transcription
    const prompt = `You are a meticulous technical editor. Analyze the uploaded document and produce clean, production-ready Markdown that:
    - Preserves and normalizes headings (use #, ##, ### appropriately)
    - Converts all text formatting (bold, italics, lists, tables, code) to proper Markdown
    - Retains document structure and logical sections
    - Fixes inconsistent spacing and punctuation
    - Uses fenced code blocks where appropriate
    - For images/figures, insert a descriptive placeholder like: ![Figure: short description](image-placeholder)
    - For page numbers/footers/headers noise in PDFs, omit them
    - Do not include any extra commentary; return only the Markdown content.

    Output: GitHub-flavored Markdown, no frontmatter.`

    const contents: Array<string | ReturnType<typeof createPartFromUri>> = [prompt]

    if (getFile.uri && getFile.mimeType) {
      const fileContent = createPartFromUri(getFile.uri, getFile.mimeType)
      contents.push(fileContent)
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents,
      config: {
        temperature: 0,
      },
    })

    const transcription = response.text || ''

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json({ error: 'Empty transcription result' }, { status: 502 })
    }

    return NextResponse.json({ transcription, fileName: file.name })
  } catch (error) {
    console.error('Transcription error:', error)
    const message = error instanceof Error ? error.message : 'Failed to transcribe document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


