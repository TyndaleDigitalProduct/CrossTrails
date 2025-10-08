'use client'

import React from 'react'
import { useState, useCallback, type ReactElement } from 'react'
import { BibleReaderProps } from '@/lib/types'

export default function BibleReader({
  book,
  chapter,
  verses,
  selectedVerses,
  onVerseSelect,
  loading = false
}: BibleReaderProps) {
  const [hoveredSpan, setHoveredSpan] = useState<string | null>(null)

  // Handle clicking on cross-reference spans in the text
  const handleSpanClick = useCallback((verseId: string, spanText: string) => {
    // Toggle verse selection
    if (selectedVerses.includes(verseId)) {
      onVerseSelect(selectedVerses.filter(id => id !== verseId))
    } else {
      // For now, only allow single verse selection
      // In the future, we might support multiple verse selection
      onVerseSelect([verseId])
    }
  }, [selectedVerses, onVerseSelect])

  // Render a verse with cross-reference indicators
  const renderVerse = (verse: any, index: number) => {
    const isSelected = selectedVerses.includes(verse.verse_id)

    // For demo purposes, let's add some cross-reference spans to specific verses
    // In production, this would come from the cross-reference data
    const hasDemo = verse.verse_number <= 6; // First 6 verses have demo cross-refs

    const verseText = verse.text;
    let spanElements: ReactElement[] = [];

    if (verse.verse_number === 1) {
      // Entirety of verse 1 is underlined and is a link
      spanElements = [
        <sup key="verse-num" style={{ fontSize: '16.77px', fontFamily: 'Calibri, sans-serif', marginRight: '6px', position: 'relative', top: '0.1em' }}>{verse.verse_number}</sup>,
        <a
          key="text"
          href="#"
          style={{
            fontSize: '26px',
            fontFamily: 'Calibri, sans-serif',
            lineHeight: '1.55',
            color: '#403E3E',
            verticalAlign: 'baseline',
            textDecoration: 'underline',
            textDecorationColor: '#ff6a32',
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.2em',
            textDecorationSkipInk: 'none',
            cursor: 'pointer'
          }}
          onClick={e => {
            e.preventDefault();
            handleSpanClick(verse.verse_id, verseText);
          }}
        >
          {verseText}
        </a>
      ];
    } else if (hasDemo) {
      // Demo: Add underlines to specific phrases (in production, this comes from data)
      const demoSpans = getDemoCrossReferenceSpans(verse.verse_number, verse.text);
      spanElements = renderTextWithSpans(verse.text, demoSpans, verse.verse_id, verse.verse_number);
    } else {
      // No cross-references, render plain text with verse number
      spanElements = [
        <sup key="verse-num" style={{ fontSize: '16.77px', fontFamily: 'Calibri, sans-serif', marginRight: '6px', position: 'relative', top: '0.1em' }}>{verse.verse_number}</sup>,
        <span key="text" style={{ fontSize: '26px', fontFamily: 'Calibri, sans-serif', lineHeight: '1.55', color: '#403E3E', verticalAlign: 'baseline' }}>{verseText}</span>
      ];
    }

    return (
      <p key={verse.verse_id} style={{ marginBottom: '16px', fontSize: '26px', fontFamily: 'Calibri, sans-serif', lineHeight: '1.55', color: '#403E3E', fontWeight: 400 }}>
        {spanElements}
      </p>
    )
  }

  // Helper function to create demo cross-reference spans
  const getDemoCrossReferenceSpans = (verseNumber: number, text: string) => {
    // Demo spans based on Matthew 2 content (matching Figma)
    const demoSpans: Array<{start: number, end: number, refs: string[]}> = [];

    switch (verseNumber) {
      case 1:
        // "Jesus was born in Bethlehem in Judea, during the reign of King Herod"
        if (text.includes('Jesus was born in Bethlehem')) {
          const start = text.indexOf('Jesus was born in Bethlehem');
          const end = start + 'Jesus was born in Bethlehem in Judea, during the reign of King Herod'.length;
          demoSpans.push({ start, end, refs: ['Luke.1.5', 'Luke.2.4-7'] });
        }
        break;
      case 2:
        // Demo spans for verse 2
        if (text.includes('wise men')) {
          const start = text.indexOf('wise men');
          const end = start + 'wise men from eastern lands'.length;
          demoSpans.push({ start, end, refs: ['Num.24.17', 'Jer.23.5', 'Matt.2.9', 'Rev.22.16'] });
        }
        break;
      case 5:
        // "In Bethlehem in Judea," they said, "for this is what the prophet wrote:"
        if (text.includes('In Bethlehem in Judea')) {
          const start = text.indexOf('In Bethlehem in Judea');
          const end = start + 'In Bethlehem in Judea," they said, "for this is what the prophet wrote'.length;
          demoSpans.push({ start, end, refs: ['John.7.42'] });
        }
        break;
      case 6:
        // "And you, O Bethlehem in the land of Judah, are not least among the ruling cities of Judah"
        if (text.includes('And you, O Bethlehem')) {
          const start = text.indexOf('And you, O Bethlehem');
          const end = start + 'And you, O Bethlehem in the land of Judah, are not least among the ruling cities of Judah'.length;
          demoSpans.push({ start, end, refs: ['Mic.5.2'] });
        }
        break;
    }

    return demoSpans;
  }

  // Render text with cross-reference spans
  const renderTextWithSpans = (text: string, spans: Array<{start: number, end: number, refs: string[]}>, verseId: string, verseNumber: number) => {
    const elements: ReactElement[] = [];
    let currentIndex = 0;

    // Add verse number at the beginning
    elements.push(
          <sup key="verse-num" style={{ fontSize: '16.77px', fontFamily: 'Calibri, sans-serif', marginRight: '6px', position: 'relative', top: '0.1em' }}>
            {verseNumber}
          </sup>
    );

    if (spans.length === 0) {
      elements.push(<span key="text">{text}</span>);
      return elements;
    }

    spans.forEach((span, spanIndex) => {
      // Add text before the span
      if (span.start > currentIndex) {
        elements.push(
          <span key={`before-${spanIndex}`}>
            {text.slice(currentIndex, span.start)}
          </span>
        );
      }

      // Add the cross-reference span with orange underline matching Figma
      const spanText = text.slice(span.start, span.end);
      const isHovered = hoveredSpan === `${verseId}-${spanIndex}`;
      const isSelected = selectedVerses.includes(verseId);

      elements.push(
        <span
          key={`span-${spanIndex}`}
          className="cursor-pointer"
          style={{
            textDecoration: 'underline',
            textDecorationColor: '#ff6a32',
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.2em',
            textDecorationSkipInk: 'none'
          }}
          onClick={() => handleSpanClick(verseId, spanText)}
          onMouseEnter={() => setHoveredSpan(`${verseId}-${spanIndex}`)}
          onMouseLeave={() => setHoveredSpan(null)}
          title={`Cross-references: ${span.refs.join(', ')}`}
        >
          {spanText}
        </span>
      );

      currentIndex = span.end;
    });

    // Add remaining text after the last span
    if (currentIndex < text.length) {
      elements.push(
        <span key="after-last">
          {text.slice(currentIndex)}
        </span>
      );
    }

    return elements;
  }

  if (loading) {
    return (
      <div className="bible-reader-container">
        <div className="space-y-4">
          {/* Loading skeleton */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex">
              <div className="flex-1">
                <div className="loading-skeleton h-4 mb-2"></div>
                <div className="loading-skeleton h-4 w-3/4"></div>
              </div>
              <div className="ml-4 w-12">
                <div className="loading-skeleton h-4 w-8 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!verses.length) {
    return (
      <div className="bible-reader-container">
        <div className="text-center py-12">
          <p className="text-text-muted">No verses available for this passage.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Instruction text */}
      <p className="text-[20px] mb-[35px]" style={{ fontFamily: 'Calibri, sans-serif', fontWeight: 300, color: '#403E3E' }}>
        Select an underlined passage to view a cross reference
      </p>

      {/* Chapter title */}
      <h2 className="text-[32px] font-bold mb-6" style={{ fontFamily: 'miller-text, serif', lineHeight: '1.5', color: '#403E3E' }}>
  <span style={{ fontFamily: 'Miller Text, miller-text, serif', fontWeight: 'bold', fontSize: '32px', lineHeight: '1.2', color: '#403E3E' }}>{book} {chapter}</span>
      </h2>

      {/* Chapter subtitle if we have it (for demo, using Matthew 2) */}
      {book === 'Matthew' && chapter === 2 && (
        <h3 className="text-[24px] font-bold mb-6" style={{ fontFamily: 'Miller Text, miller-text, serif', fontWeight: 'bold', fontSize: '24px', lineHeight: '1.2', color: '#403E3E' }}>
          Visitors from the East
        </h3>
      )}

      {/* Verses */}
      <div className="space-y-0">
        {verses.map((verse, index) => renderVerse(verse, index))}
      </div>
    </div>
  )
}