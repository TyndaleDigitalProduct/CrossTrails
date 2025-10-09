'use client'

import React from 'react'
import { useState } from 'react'
import { CrossReferencesSidebarProps } from '@/lib/types'

export default function CrossReferencesSidebar({
  crossReferences,
  selectedRefs,
  onRefSelect,
  loading = false,
  error
}: CrossReferencesSidebarProps & { error?: string }) {

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-center">
          {error}
        </p>
      </div>
    )
  }
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const handleRefClick = (refId: string) => {
    if (selectedRefs.includes(refId)) {
      onRefSelect(selectedRefs.filter(id => id !== refId))
    } else {
      // Allow multiple cross-reference selection
      onRefSelect([...selectedRefs, refId])
    }
  }

  const handleRefNavigation = async (reference: string) => {
    // TODO: Implement navigation to the cross-reference
    console.log('Navigate to:', reference)
  }

  // Demo data that matches the Figma design for Matthew 2
  const getDemoReferences = () => {
    return [
      {
        verse: '2:1',
        references: [
          { ref: 'Luke 1:5', text: 'Luke 1:5' },
          { ref: 'Luke 2:4-7', text: 'Luke 2:4-7' }
        ]
      },
      {
        verse: '2:2',
        references: [
          { ref: 'Num 24:17', text: 'Num 24:17' },
          { ref: 'Jer 23:5', text: 'Jer 23:5' },
          { ref: 'Matt 2:9', text: 'Matt 2:9' },
          { ref: 'Rev 22:16', text: 'Rev 22:16' }
        ]
      },
      {
        verse: '2:5',
        references: [
          { ref: 'John 7:42', text: 'John 7:42' }
        ]
      },
      {
        verse: '2:6',
        references: [
          { ref: 'Mic 5:2', text: 'Mic 5:2' }
        ]
      }
    ]
  }

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
    )
  }

  // Debug logging
  // console.log('CrossReferencesSidebar received crossReferences:', crossReferences)
  // console.log('crossReferences.length:', crossReferences.length)

// Only use live cross-references
const displayReferences = crossReferences;

if (displayReferences.length === 0) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-text-muted text-center">
        Select an underlined passage<br />
        to view cross references
      </p>
    </div>
  )
}

  return (
  <div className="w-full">
      {displayReferences.map((group, groupIndex) => {
  const verseDisplay = group.anchor_verse.replace(/^Matthew\.?/, '').split('.').slice(-2).join(':'); // e.g., "2:1"

        return (
          <div key={group.anchor_verse} style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start' }}>
            {/* Verse number header - matching Figma */}
            <div style={{ fontFamily: 'Calibri, sans-serif', fontWeight: 400, fontSize: '20px', color: '#403e3e', lineHeight: '1.5', marginRight: '12px', whiteSpace: 'nowrap' }}>
              {verseDisplay}
            </div>

            {/* Cross-reference links inline to the right */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {group.cross_references.map((ref, refIndex) => {
                const isSelected = selectedRefs.includes(ref.reference)
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
                      fontWeight: isSelected ? 600 : 400
                    }}
                    title={`Click to select ${ref.display_ref}`}
                  >
                    {ref.display_ref}
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}