'use client'

import React from 'react'
import { useState } from 'react'
import { CrossReferencesSidebarProps } from '@/lib/types'

export default function CrossReferencesSidebar({
  crossReferences,
  selectedRefs,
  onRefSelect,
  loading = false
}: CrossReferencesSidebarProps) {
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

  // Use demo data if no real cross-references are provided
  const displayReferences = crossReferences.length > 0
    ? crossReferences
    : getDemoReferences().map(group => ({
        anchor_verse: `Matthew.${group.verse}`,
        cross_references: group.references.map(ref => ({
          reference: ref.ref.replace(/\s/g, '.').replace(/:/g, '.'),
          display_ref: ref.text,
          text: '', // Would be populated from API
          connection: {
            categories: [],
            strength: 0.8,
            type: 'parallel' as const,
            explanation: ''
          }
        })),
        total_found: group.references.length,
        returned: group.references.length
      }))

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
    <div className="space-y-6 w-full">
      {displayReferences.map((group, groupIndex) => {
        const verseDisplay = group.anchor_verse.split('.').slice(-2).join(':'); // e.g., "2:1"

        return (
          <div key={group.anchor_verse} className="mb-6">
            {/* Verse number header - matching Figma */}
            <div className="text-[20px] text-[#403e3e] mb-2" style={{ fontFamily: 'Calibri, sans-serif', lineHeight: '1.5' }}>
              {verseDisplay}
            </div>

            {/* Cross-reference list */}
            <div className="space-y-1">
              {group.cross_references.map((ref, refIndex) => {
                const isSelected = selectedRefs.includes(ref.reference)

                return (
                  <div key={ref.reference}>
                    <button
                      onClick={() => handleRefClick(ref.reference)}
                      className={`block w-full text-left text-[16px] underline decoration-[#ff6a32] decoration-solid hover:decoration-2 ${
                        isSelected ? 'font-semibold' : ''
                      }`}
                      style={{
                        fontFamily: 'Calibri, sans-serif',
                        lineHeight: '1.5',
                        color: '#ff6a32',
                        textDecorationSkipInk: 'none',
                        textUnderlinePosition: 'from-font'
                      }}
                      title={`Click to select ${ref.display_ref}`}
                    >
                      {ref.display_ref}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}