'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { BibleVerse, CrossReferenceGroup } from '@/lib/types'
import Header from './components/Header'
import BibleReader from './components/BibleReader'
import CrossReferencesSidebar from './components/CrossReferencesSidebar'
import AICompanion from './components/AICompanion'

export default function HomePage() {
  // State management for the main application
  const [currentBook, setCurrentBook] = useState('Matthew')
  const [currentChapter, setCurrentChapter] = useState(2)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<string[]>([])
  const [selectedCrossRefs, setSelectedCrossRefs] = useState<string[]>([])
  const [crossReferences, setCrossReferences] = useState<CrossReferenceGroup[]>([])
  const [loading, setLoading] = useState({
    verses: false,
    crossRefs: false,
    ai: false
  })
  const [error, setError] = useState<string | null>(null)

  // Load verses when book/chapter changes
  useEffect(() => {
    loadVerses(currentBook, currentChapter)
  }, [currentBook, currentChapter])

  // Load cross-references when verses are selected
  useEffect(() => {
    if (selectedVerses.length > 0) {
      loadCrossReferences(selectedVerses)
    } else {
      setCrossReferences([])
    }
  }, [selectedVerses])

  const loadVerses = async (book: string, chapter: number) => {
    setLoading(prev => ({ ...prev, verses: true }))
    setError(null)

    try {
      const response = await fetch(`/api/verses?book=${book}&chapter=${chapter}`)

      if (!response.ok) {
        throw new Error('Failed to load verses')
      }

      const data = await response.json()
      setVerses(data.verses)
      setSelectedVerses([]) // Clear selection when changing passages

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verses')
      console.error('Error loading verses:', err)
    } finally {
      setLoading(prev => ({ ...prev, verses: false }))
    }
  }

  const loadCrossReferences = async (verseIds: string[]) => {
    setLoading(prev => ({ ...prev, crossRefs: true }))

    try {
      const versesParam = verseIds.join(',')
      const response = await fetch(`/api/cross-refs?verses=${versesParam}`)

      if (!response.ok) {
        throw new Error('Failed to load cross-references')
      }

      const data = await response.json()
      setCrossReferences([{
        anchor_verse: verseIds[0],
        cross_references: data.cross_references,
        total_found: data.total_found,
        returned: data.returned
      }])

    } catch (err) {
      console.error('Error loading cross-references:', err)
      // Don't show error for cross-references as it's secondary functionality
    } finally {
      setLoading(prev => ({ ...prev, crossRefs: false }))
    }
  }

  const handleNavigation = (book: string, chapter: number) => {
    setCurrentBook(book)
    setCurrentChapter(chapter)
  }

  const handleSearch = async (query: string) => {
    // TODO: Implement search functionality
    console.log('Search query:', query)
  }

  const handleVerseSelection = (verseIds: string[]) => {
    setSelectedVerses(verseIds)
    setSelectedCrossRefs([]) // Clear cross-ref selection when verses change
  }

  const handleCrossRefSelection = (refIds: string[]) => {
    setSelectedCrossRefs(refIds)
  }

  const handleAIExploration = async (observation: string) => {
    if (!selectedVerses.length || !selectedCrossRefs.length) {
      return
    }

    setLoading(prev => ({ ...prev, ai: true }))

    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVerses,
          userObservation: observation,
          selectedCrossRefs
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI insights')
      }

      // Handle streaming response
      // TODO: Implement streaming response handling

    } catch (err) {
      console.error('Error getting AI insights:', err)
    } finally {
      setLoading(prev => ({ ...prev, ai: false }))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigate={handleNavigation}
        onSearch={handleSearch}
      />

      {/* Main content area */}
      <main id="main-content" className="flex-1 flex">
        {/* Bible reading area */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="container-responsive py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  Error loading content: {error}
                </p>
                <button
                  onClick={() => loadVerses(currentBook, currentChapter)}
                  className="mt-2 btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="container-responsive py-8">
              {/* Instruction text */}
              <p className="text-text-muted text-sm mb-6">
                Select an underlined passage to view a cross reference
              </p>

              {/* Bible reader component */}
              <BibleReader
                book={currentBook}
                chapter={currentChapter}
                verses={verses}
                selectedVerses={selectedVerses}
                onVerseSelect={handleVerseSelection}
                loading={loading.verses}
              />

              {/* AI Companion - show when we have selections */}
              {selectedVerses.length > 0 && selectedCrossRefs.length > 0 && (
                <AICompanion
                  selectedVerses={selectedVerses}
                  selectedCrossRefs={selectedCrossRefs}
                  onSubmitObservation={handleAIExploration}
                  conversation_history={[]} // TODO: Implement conversation history
                />
              )}
            </div>
          )}
        </div>

        {/* Cross-references sidebar */}
        <aside className="cross-refs-sidebar w-80 overflow-y-auto scrollbar-thin">
          <CrossReferencesSidebar
            crossReferences={crossReferences}
            selectedRefs={selectedCrossRefs}
            onRefSelect={handleCrossRefSelection}
            loading={loading.crossRefs}
          />
        </aside>
      </main>
    </div>
  )
}