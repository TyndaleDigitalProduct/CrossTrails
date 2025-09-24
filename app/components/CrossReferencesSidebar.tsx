'use client'

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
    <div className="space-y-6">
      {displayReferences.map((group, groupIndex) => {
        const verseDisplay = group.anchor_verse.split('.').slice(-2).join(':'); // e.g., "2:1"

        return (
          <div key={group.anchor_verse} className="cross-ref-group">
            {/* Verse number header */}
            <div className="cross-ref-group-verse">
              {verseDisplay}
            </div>

            {/* Cross-reference list */}
            <div className="cross-ref-list">
              {group.cross_references.map((ref, refIndex) => {
                const isSelected = selectedRefs.includes(ref.reference)

                return (
                  <div key={ref.reference} className="cross-ref-item">
                    <button
                      onClick={() => handleRefClick(ref.reference)}
                      className={`cross-ref-link block w-full text-left ${
                        isSelected ? 'font-semibold' : ''
                      }`}
                      title={`Click to select ${ref.display_ref}`}
                    >
                      {ref.display_ref}
                    </button>

                    {/* Show reference text if available and selected */}
                    {isSelected && ref.text && (
                      <div className="mt-1 text-xs text-text-secondary pl-2 border-l-2 border-primary-200">
                        {ref.text}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Show total count if there are more references */}
            {group.total_found > group.returned && (
              <div className="mt-2 text-xs text-text-muted">
                Showing {group.returned} of {group.total_found} references
              </div>
            )}
          </div>
        )
      })}

      {/* Selection summary */}
      {selectedRefs.length > 0 && (
        <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="text-sm font-medium text-primary-700 mb-2">
            Selected References ({selectedRefs.length})
          </div>
          <div className="text-xs text-primary-600 space-y-1">
            {selectedRefs.map(ref => {
              // Find the display name for this reference
              const displayRef = displayReferences
                .flatMap(group => group.cross_references)
                .find(cr => cr.reference === ref)?.display_ref || ref

              return (
                <div key={ref} className="flex justify-between items-center">
                  <span>{displayRef}</span>
                  <button
                    onClick={() => handleRefClick(ref)}
                    className="text-primary-500 hover:text-primary-700"
                    title="Remove from selection"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-primary-200">
            <button
              onClick={() => onRefSelect([])}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Clear all selections
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-text-muted">
        Click references to select them for AI exploration. Multiple references can be selected.
      </div>
    </div>
  )
}