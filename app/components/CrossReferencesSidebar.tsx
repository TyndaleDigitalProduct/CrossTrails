'use client';

import React from 'react';
import {
  CrossReferencesSidebarProps,
  CrossReferenceGroup,
  CrossReferenceCategory,
} from '@/lib/types';

export default function CrossReferencesSidebar({
  crossReferences,
  selectedRefs,
  onRefSelect,
  loading = false,
  spanPositions = [],
}: CrossReferencesSidebarProps) {
  const handleRefClick = (refId: string) => {
    if (selectedRefs.includes(refId)) {
      onRefSelect(selectedRefs.filter(id => id !== refId));
    } else {
      // Allow multiple cross-reference selection
      onRefSelect([...selectedRefs, refId]);
    }
  };

  // Create positioned references based on span positions
  const createPositionedReferences = () => {
    const positionedRefs: Array<{
      position: number;
      height: number;
      references: Array<{ ref: string; text: string }>;
      verseId: string;
    }> = [];

    spanPositions.forEach(span => {
      const refs = span.crossReferences.map(ref => ({
        ref: ref.replace(/\s/g, '.').replace(/:/g, '.'),
        text: ref,
      }));

      if (refs.length > 0) {
        // The span.top is now relative to the verses container (after moving containerRef)
        // No additional offsets needed since positioning is already correctly calculated
        const adjustedPosition = span.top;

        positionedRefs.push({
          position: adjustedPosition,
          height: span.height,
          references: refs,
          verseId: span.verseId,
        });
      }
    });

    return positionedRefs.sort((a, b) => a.position - b.position);
  };

  const positionedReferences = createPositionedReferences();

  // Demo data that matches the Figma design for Matthew 2 (fallback)
  const getDemoReferences = () => {
    return [
      {
        verse: '2:1',
        references: [
          { ref: 'Luke 1:5', text: 'Luke 1:5' },
          { ref: 'Luke 2:4-7', text: 'Luke 2:4-7' },
        ],
      },
      {
        verse: '2:2',
        references: [
          { ref: 'Num 24:17', text: 'Num 24:17' },
          { ref: 'Jer 23:5', text: 'Jer 23:5' },
          { ref: 'Matt 2:9', text: 'Matt 2:9' },
          { ref: 'Rev 22:16', text: 'Rev 22:16' },
        ],
      },
      {
        verse: '2:5',
        references: [{ ref: 'John 7:42', text: 'John 7:42' }],
      },
      {
        verse: '2:6',
        references: [{ ref: 'Mic 5:2', text: 'Mic 5:2' }],
      },
    ];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="cross-ref-group">
            <div className="loading-skeleton h-4 w-12 mb-2"></div>
            <div className="space-y-1">
              <div className="loading-skeleton h-4 w-24"></div>
              <div className="loading-skeleton h-4 w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Debug logging
  // console.log('CrossReferencesSidebar received crossReferences:', crossReferences)
  // console.log('crossReferences.length:', crossReferences.length)

  // Use positioned references if available, otherwise fall back to demo data
  const displayReferences =
    positionedReferences.length > 0
      ? positionedReferences
      : crossReferences.length > 0
        ? crossReferences
        : (getDemoReferences().map(group => ({
            anchor_verse: `Matthew.${group.verse}`,
            cross_references: group.references.map(ref => ({
              reference: ref.ref.replace(/\s/g, '.').replace(/:/g, '.'),
              display_ref: ref.text,
              text: '', // Would be populated from API
              connection: {
                categories: [],
                strength: 0.8,
                type: 'parallel' as CrossReferenceCategory,
                explanation: '',
              },
            })),
            total_found: group.references.length,
            returned: group.references.length,
          })) as unknown as CrossReferenceGroup[]);

  if (displayReferences.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted text-center">
          Select an underlined passage
          <br />
          to view cross references
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {positionedReferences.length > 0
        ? // Positioned references based on span positions
          positionedReferences.map((group, index) => {
            return (
              <div
                key={`${group.verseId}-${index}`}
                className="absolute left-0 flex items-start"
                style={{
                  top: `${group.position}px`,
                  minHeight: `${group.height}px`,
                  width: '100%',
                  paddingTop: '0px', // Align with verse baseline
                }}
              >
                {/* Cross-reference links */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'baseline', // Align with text baseline
                    justifyContent: 'flex-start',
                    lineHeight: '1.55', // Match Bible text line height
                  }}
                >
                  {group.references.map(ref => {
                    const isSelected = selectedRefs.includes(ref.ref);
                    return (
                      <a
                        key={ref.ref}
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          handleRefClick(ref.ref);
                        }}
                        style={{
                          fontFamily: 'Calibri, sans-serif',
                          fontSize: '16px',
                          lineHeight: '1.55', // Match Bible text line height
                          color: '#ff6a32',
                          textDecoration: 'underline',
                          textDecorationColor: '#ff6a32',
                          textDecorationThickness: '1px',
                          textUnderlineOffset: '0.2em',
                          textDecorationSkipInk: 'none',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          fontWeight: isSelected ? 600 : 400,
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                          verticalAlign: 'baseline',
                        }}
                        title={`Click to select ${ref.text}`}
                      >
                        {ref.text}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })
        : // Fallback to original layout when no positioned references
          displayReferences
            .filter(
              (group): group is CrossReferenceGroup => 'anchor_verse' in group
            )
            .map(group => {
              const verseDisplay = group.anchor_verse
                .replace(/^Matthew\.?/, '')
                .split('.')
                .slice(-2)
                .join(':'); // e.g., "2:1"

              return (
                <div
                  key={group.anchor_verse}
                  style={{
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Verse number header - matching Figma */}
                  <div
                    style={{
                      fontFamily: 'Calibri, sans-serif',
                      fontWeight: 400,
                      fontSize: '20px',
                      color: '#403e3e',
                      lineHeight: '1.5',
                      marginRight: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {verseDisplay}
                  </div>

                  {/* Cross-reference links inline to the right */}
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
                  >
                    {group.cross_references.map(ref => {
                      const isSelected = selectedRefs.includes(ref.reference);
                      return (
                        <a
                          key={ref.reference}
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            handleRefClick(ref.reference);
                          }}
                          style={{
                            fontFamily: 'Calibri, sans-serif',
                            fontSize: '16px',
                            lineHeight: '1',
                            color: '#ff6a32',
                            textDecoration: 'underline',
                            textDecorationColor: '#ff6a32',
                            textDecorationThickness: '1px',
                            textUnderlineOffset: '0.2em',
                            textDecorationSkipInk: 'none',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            fontWeight: isSelected ? 600 : 400,
                          }}
                          title={`Click to select ${ref.display_ref}`}
                        >
                          {ref.display_ref}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
    </div>
  );
}
