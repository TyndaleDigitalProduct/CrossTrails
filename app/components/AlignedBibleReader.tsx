'use client';

import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { BibleReaderProps, BibleVerse } from '@/lib/types';
import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection';

interface AlignedBibleReaderProps
  extends Omit<BibleReaderProps, 'onSpanPositionsChange'> {
  onCrossRefSelect: (refs: string[]) => void;
  selectedCrossRefs: string[];
}

export default function AlignedBibleReader({
  book,
  chapter,
  verses,
  selectedVerses,
  onVerseSelect,
  onCrossRefSelect,
  selectedCrossRefs,
  loading = false,
}: AlignedBibleReaderProps) {
  // State to store cross-references for each verse
  const [verseCrossRefs, setVerseCrossRefs] = useState<
    Record<number, Array<{ ref: string; text: string }>>
  >({});
  const [crossRefsLoading, setCrossRefsLoading] = useState(false);
  const [crossRefsError, setCrossRefsError] = useState<string | null>(null);
  // Handle clicking on cross-reference spans in the text
  const handleSpanClick = useCallback(
    (verseId: string) => {
      // Toggle verse selection
      if (selectedVerses.includes(verseId)) {
        onVerseSelect(selectedVerses.filter(id => id !== verseId));
      } else {
        onVerseSelect([verseId]);
      }
    },
    [selectedVerses, onVerseSelect]
  );

  // Handle cross-reference link clicks
  const handleCrossRefClick = useCallback(
    (refId: string) => {
      if (selectedCrossRefs.includes(refId)) {
        onCrossRefSelect(selectedCrossRefs.filter(id => id !== refId));
      } else {
        onCrossRefSelect([...selectedCrossRefs, refId]);
      }
    },
    [selectedCrossRefs, onCrossRefSelect]
  );

  // Load cross-references for all verses when component mounts or verses change
  useEffect(() => {
    const loadCrossReferences = async () => {
      if (!verses.length || crossRefsLoading) return;

      setCrossRefsLoading(true);
      setCrossRefsError(null);
      const newCrossRefs: Record<
        number,
        Array<{ ref: string; text: string }>
      > = {};

      try {
        // Process each verse to get its cross-references
        for (const verse of verses) {
          const anchorVerse = `${book}.${chapter}.${verse.verse_number}`;

          try {
            const response = await getCrossReferenceConnection({
              anchor_verse: anchorVerse,
              candidate_refs: [], // Empty array means use all cross-references from anchor data
              min_strength: 0.3, // Lower threshold to get more references
            });

            if (response.connections.length > 0) {
              newCrossRefs[verse.verse_number] = response.connections.map(
                conn => ({
                  ref: conn.reference,
                  text: formatReferenceForDisplay(conn.reference),
                })
              );
            }
          } catch (error) {
            console.warn(
              `Failed to load cross-references for ${anchorVerse}:`,
              error
            );
            // Continue with other verses even if one fails
          }
        }

        setVerseCrossRefs(newCrossRefs);
      } catch (error) {
        console.error('Error loading cross-references:', error);
        setCrossRefsError('Failed to load cross-references');
      } finally {
        setCrossRefsLoading(false);
      }
    };

    loadCrossReferences();
  }, [book, chapter, verses, crossRefsLoading]);

  // Helper function to format reference for display
  const formatReferenceForDisplay = (ref: string): string => {
    // Convert "Luke.1.5" to "Luke 1:5"
    const parts = ref.split('.');
    if (parts.length >= 3) {
      const book = parts[0];
      const chapter = parts[1];
      const verse = parts[2];
      return `${book} ${chapter}:${verse}`;
    }
    return ref;
  };

  // Helper function to get cross-references for a verse
  const getVerseCrossReferences = (
    verseNumber: number
  ): Array<{ ref: string; text: string }> => {
    return verseCrossRefs[verseNumber] || [];
  };

  // Helper function to create cross-reference spans based on actual data
  const getCrossReferenceSpans = (verseNumber: number, text: string) => {
    const crossRefs = getVerseCrossReferences(verseNumber);
    const spans: Array<{ start: number; end: number; refs: string[] }> = [];

    // If we have cross-references for this verse, create spans
    if (crossRefs.length > 0) {
      // For demo purposes, we'll create spans for specific phrases
      // In a full implementation, this would use span data from the cross-reference system
      const refs = crossRefs.map(ref => ref.ref);

      switch (verseNumber) {
        case 1:
          if (text.includes('Jesus was born in Bethlehem')) {
            const start = text.indexOf('Jesus was born in Bethlehem');
            const end =
              start +
              'Jesus was born in Bethlehem in Judea, during the reign of King Herod'
                .length;
            spans.push({ start, end, refs });
          }
          break;
        case 2:
          if (text.includes('wise men')) {
            const start = text.indexOf('wise men');
            const end = start + 'wise men from eastern lands'.length;
            spans.push({ start, end, refs });
          }
          break;
        case 5:
          if (text.includes('In Bethlehem in Judea')) {
            const start = text.indexOf('In Bethlehem in Judea');
            const end =
              start +
              'In Bethlehem in Judea," they said, "for this is what the prophet wrote'
                .length;
            spans.push({ start, end, refs });
          }
          break;
        case 6:
          if (text.includes('And you, O Bethlehem')) {
            const start = text.indexOf('And you, O Bethlehem');
            const end =
              start +
              'And you, O Bethlehem in the land of Judah, are not least among the ruling cities of Judah'
                .length;
            spans.push({ start, end, refs });
          }
          break;
        default:
          // For other verses with cross-references, create a span for a meaningful portion
          // This is a simplified approach - in production, you'd have more sophisticated span detection
          if (crossRefs.length > 0 && text.length > 20) {
            // Create a span for the first meaningful phrase (up to first comma or period, or first 50 chars)
            const firstPunctuation = Math.min(
              text.indexOf(',') > 0 ? text.indexOf(',') : text.length,
              text.indexOf('.') > 0 ? text.indexOf('.') : text.length,
              50
            );
            spans.push({ start: 0, end: firstPunctuation, refs });
          } else if (crossRefs.length > 0) {
            // For short verses, underline the entire verse
            spans.push({ start: 0, end: text.length, refs });
          }
          break;
      }
    }

    return spans;
  };

  // Render text with cross-reference spans
  const renderTextWithSpans = (
    text: string,
    spans: Array<{ start: number; end: number; refs: string[] }>,
    verseId: string,
    verseNumber: number
  ) => {
    const elements: React.ReactElement[] = [];
    let currentIndex = 0;

    // Add verse number at the beginning
    elements.push(
      <sup
        key="verse-num"
        style={{
          fontSize: '16.77px',
          fontFamily: 'Calibri, sans-serif',
          marginRight: '6px',
          position: 'relative',
          top: '0.1em',
        }}
      >
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

      // Add the cross-reference span with orange underline
      const spanText = text.slice(span.start, span.end);
      const spanId = `${verseId}-${spanIndex}`;

      elements.push(
        <span
          key={spanId}
          className="cursor-pointer"
          style={{
            textDecoration: 'underline',
            textDecorationColor: '#ff6a32',
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.2em',
            textDecorationSkipInk: 'none',
          }}
          onClick={() => handleSpanClick(verseId)}
          title={`Cross-references: ${span.refs.join(', ')}`}
        >
          {spanText}
        </span>
      );

      currentIndex = span.end;
    });

    // Add remaining text after the last span
    if (currentIndex < text.length) {
      elements.push(<span key="after-last">{text.slice(currentIndex)}</span>);
    }

    return elements;
  };

  // Render cross-reference links for a verse
  const renderCrossReferences = (verseNumber: number) => {
    const crossRefs = getVerseCrossReferences(verseNumber);

    if (crossRefs.length === 0) {
      return <div style={{ minHeight: '1.55em' }} />; // Maintain grid alignment
    }

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'baseline',
          justifyContent: 'flex-start',
          lineHeight: '1.55', // Match Bible text line height
          minHeight: '1.55em', // Ensure consistent row height
        }}
      >
        {crossRefs.map(ref => {
          const isSelected = selectedCrossRefs.includes(ref.ref);
          return (
            <a
              key={ref.ref}
              href="#"
              onClick={e => {
                e.preventDefault();
                handleCrossRefClick(ref.ref);
              }}
              style={{
                fontFamily: 'Calibri, sans-serif',
                fontSize: '16px',
                lineHeight: '1.55',
                color: '#ff6a32',
                textDecoration: 'underline',
                textDecorationColor: '#ff6a32',
                textDecorationThickness: '1px',
                textUnderlineOffset: '0.2em',
                textDecorationSkipInk: 'none',
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
              title={`Click to select ${ref.text}`}
            >
              {ref.text}
            </a>
          );
        })}
      </div>
    );
  };

  // Render a verse row with aligned cross-references
  const renderVerseRow = (verse: BibleVerse) => {
    const crossRefs = getVerseCrossReferences(verse.verse_number);
    const hasCrossRefs = crossRefs.length > 0;
    const verseText = verse.text;
    let spanElements: React.ReactElement[] = [];

    if (hasCrossRefs) {
      // Get cross-reference spans for this verse
      const spans = getCrossReferenceSpans(verse.verse_number, verse.text);
      spanElements = renderTextWithSpans(
        verse.text,
        spans,
        verse.verse_id,
        verse.verse_number
      );
    } else {
      // No cross-references, render plain text with verse number
      spanElements = [
        <sup
          key="verse-num"
          style={{
            fontSize: '16.77px',
            fontFamily: 'Calibri, sans-serif',
            marginRight: '6px',
            position: 'relative',
            top: '0.1em',
          }}
        >
          {verse.verse_number}
        </sup>,
        <span
          key="text"
          style={{
            fontSize: '26px',
            fontFamily: 'Calibri, sans-serif',
            lineHeight: '1.55',
            color: '#403E3E',
            verticalAlign: 'baseline',
          }}
        >
          {verseText}
        </span>,
      ];
    }

    return (
      <React.Fragment key={verse.verse_id}>
        {/* Bible text column */}
        <div
          style={{
            fontSize: '26px',
            fontFamily: 'Calibri, sans-serif',
            lineHeight: '1.55',
            color: '#403E3E',
            fontWeight: 400,
            marginBottom: '16px',
          }}
        >
          {spanElements}
        </div>

        {/* Cross-references column */}
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: '0.1em', // Slight adjustment to align with text baseline
          }}
        >
          {renderCrossReferences(verse.verse_number)}
        </div>
      </React.Fragment>
    );
  };

  if (loading || crossRefsLoading) {
    return (
      <div className="w-full">
        <div className="space-y-4">
          {/* Loading skeleton */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_220px] gap-[35px]">
              <div>
                <div className="loading-skeleton h-4 mb-2"></div>
                <div className="loading-skeleton h-4 w-3/4"></div>
              </div>
              <div>
                <div className="loading-skeleton h-4 w-24"></div>
              </div>
            </div>
          ))}
        </div>
        {crossRefsLoading && (
          <div className="text-center py-4">
            <p className="text-text-muted text-sm">
              Loading cross-references...
            </p>
          </div>
        )}
        {crossRefsError && (
          <div className="text-center py-4">
            <p className="text-red-500 text-sm">{crossRefsError}</p>
          </div>
        )}
      </div>
    );
  }

  if (!verses.length) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <p className="text-text-muted">
            No verses available for this passage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Instruction text */}
      <p
        className="text-[20px] mb-[35px]"
        style={{
          fontFamily: 'Calibri, sans-serif',
          fontWeight: 300,
          color: '#403E3E',
        }}
      >
        Select an underlined passage to view a cross reference
      </p>

      {/* Chapter title */}
      <h2
        className="text-[32px] font-bold mb-6"
        style={{
          fontFamily: 'miller-text, serif',
          lineHeight: '1.5',
          color: '#403E3E',
        }}
      >
        <span
          style={{
            fontFamily: 'Miller Text, miller-text, serif',
            fontWeight: 'bold',
            fontSize: '32px',
            lineHeight: '1.2',
            color: '#403E3E',
          }}
        >
          {book} {chapter}
        </span>
      </h2>

      {/* Chapter subtitle if we have it (for demo, using Matthew 2) */}
      {book === 'Matthew' && chapter === 2 && (
        <h3
          className="text-[24px] font-bold mb-6"
          style={{
            fontFamily: 'Miller Text, miller-text, serif',
            fontWeight: 'bold',
            fontSize: '24px',
            lineHeight: '1.2',
            color: '#403E3E',
          }}
        >
          Visitors from the East
        </h3>
      )}

      {/* Grid layout for perfect alignment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '742px 220px', // Match the original layout widths
          gap: '25px', // Match the original gap
          alignItems: 'start',
        }}
      >
        {verses.map(verse => renderVerseRow(verse))}
      </div>
    </div>
  );
}
