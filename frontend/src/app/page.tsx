'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sparkles, MessageCircle, Code, Zap, Palette } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="lawlace-64px-heading-2">Welcome to Lexsy!</h1>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-6">
            Lexsy is an AI-powered legal document assistant that transforms your documents into markdown format 
            and provides intelligent commenting and AI-powered insights. Upload legal documents, contracts, or 
            any text-based file and get instant markdown conversion with advanced editing capabilities.
          </p>
        </section>

        {/* Demo Walkthrough */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <FileText className="w-8 h-8 text-[var(--primary)]" />
            Demo Walkthrough
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-[var(--primary)]">1.</span>
                  Upload Your Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--muted-foreground)]">
                  Start by uploading a PDF, DOCX, image, or other MIME-compatible document. The system automatically 
                  converts DOCX files to PDF format for processing with Gemini AI.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-[var(--primary)]">2.</span>
                  AI-Powered Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--muted-foreground)] mb-3">
                  Your document is processed by Google&apos;s Gemini 2.5 Flash Lite model, which converts it to 
                  clean, structured markdown format while preserving headings, tables, and formatting.
                </p>
                <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] font-mono text-sm">
                  <code className="text-[var(--foreground)]">
                    Model: gemini-2.5-flash-lite<br />
                    Temperature: 0 (deterministic)
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-[var(--primary)]">3.</span>
                  Typewriter Animation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--muted-foreground)]">
                  Watch as your converted markdown appears line-by-line at 10 lines per second. After 3 seconds, 
                  the full content is instantly displayed for immediate editing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-[var(--primary)]">4.</span>
                  Rich Text Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--muted-foreground)] mb-3">
                  Edit your markdown in a powerful Lexical-based editor with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)] ml-4">
                  <li>Line numbers for easy reference</li>
                  <li>Full markdown editing capabilities</li>
                  <li>Formatting toolbar (bold, italic, headings, lists)</li>
                  <li>Dark/light theme support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-[var(--primary)]">5.</span>
                  Comment & AI Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--muted-foreground)] mb-3">
                  Select any text to add comments or ask AI questions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)] ml-4">
                  <li>Click the comment circle that appears on text selection</li>
                  <li>Add manual comments or use &quot;Ask AI&quot; for intelligent insights</li>
                  <li>Get streaming AI responses based on the full document context</li>
                  <li>Save AI responses as comments for future reference</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Libraries */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-[var(--primary)]" />
            Key React Libraries
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--primary)]" />
                  Next.js 16
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  React framework with App Router, Server Actions, and streaming support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="w-5 h-5 text-[var(--primary)]" />
                  Lexical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Extensible text editor framework for building rich text experiences
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                  @google/genai
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Google Gemini AI SDK for document processing and AI-powered responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--primary)]" />
                  Motion (Framer Motion)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Animation library for smooth transitions and scroll-based animations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="w-5 h-5 text-[var(--primary)]" />
                  @ai-sdk/rsc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  AI SDK for React Server Components with streaming support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--primary)]" />
                  Radix UI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Unstyled, accessible component primitives for building UI
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Libraries */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">Additional Tools</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-[var(--muted-foreground)]">
              <li>• <code className="text-[var(--foreground)]">mammoth</code> - DOCX to text conversion</li>
              <li>• <code className="text-[var(--foreground)]">pdf-lib</code> - PDF generation and manipulation</li>
              <li>• <code className="text-[var(--foreground)]">marked</code> - Markdown parsing</li>
              <li>• <code className="text-[var(--foreground)]">lucide-react</code> - Icon library</li>
              <li>• <code className="text-[var(--foreground)]">tailwindcss</code> - Utility-first CSS</li>
              <li>• <code className="text-[var(--foreground)]">class-variance-authority</code> - Component variants</li>
            </ul>
          </div>
        </section>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-12"
        >
          <Link href="/test">
            <Button
              size="lg"
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-lg px-8 py-6 rounded-lg shadow-lg transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Try Now
            </Button>
          </Link>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-sm text-[var(--muted-foreground)] border-t border-[var(--border)] pt-8">
          <p>Lexsy - Your AI Legal Expert</p>
          <p className="mt-2">Built with Next.js, Lexical, and Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}
