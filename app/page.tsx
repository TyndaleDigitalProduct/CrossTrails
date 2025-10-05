'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { BibleVerse, CrossReferenceGroup } from '@/lib/types'
import Header from './components/Header'
import BibleReader from './components/BibleReader'
import CrossReferencesSidebar from './components/CrossReferencesSidebar'
import AICompanion from './components/AICompanion'
import { findBookInString, findChapterInString } from '@/lib/parsers/book'
import SearchResultModal from './components/SearchResultModal'

export default function HomePage() {
  // State management for the main application
  const [currentBook, setCurrentBook] = useState('Matthew')
  const [currentChapter, setCurrentChapter] = useState(2)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<string[]>([])
  const [selectedCrossRefs, setSelectedCrossRefs] = useState<string[]>([])
  const [crossReferences, setCrossReferences] = useState<CrossReferenceGroup[]>([])
  
  const [loading, setLoading] = useState({
    verses: false,
    crossRefs: false,
    search: false,
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
    console.log('Search query:', query)

    try {
      const bookMatch = findBookInString(query)
      if (bookMatch) {
        const chapterMatch = findChapterInString(bookMatch.book, bookMatch.remaining)
        console.log('Book match:', bookMatch)
        console.log('Chapter match:', chapterMatch)
        if (chapterMatch) {
          setCurrentBook(bookMatch.book)
          setCurrentChapter(chapterMatch.chapter)
          setIsSearchModalOpen(false)
          setSearchResults([])
          return
        }
      }

      setLoading(prev => ({ ...prev, search: true }))
      setError(null)

      const response = await fetch(`/api/search?terms=${query}`);

      if (!response.ok) {
        throw new Error('Failed to load search')
      }

      const data = await response.json()
      setSearchResults(data)
      setIsSearchModalOpen(Array.isArray(data) && data.length > 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search')
      console.error('Error loading search:', err)
    } finally {
      setLoading(prev => ({ ...prev, search: false }))
    }
  }

  const handleSearchResultClick = (result: any) => {
    // result should have book and chapter fields
    setCurrentBook(result.book)
    setCurrentChapter(result.chapter)
    setIsSearchModalOpen(false)
    setSearchResults([])
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
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <Header
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigate={handleNavigation}
        onSearch={handleSearch}
      />

      {/* Search Results Modal */}
      {isSearchModalOpen && (
        <SearchResultModal
          searchResults={searchResults}
          loading={loading.search}
          setIsSearchModalOpen={setIsSearchModalOpen}
          setSearchResults={setSearchResults}
          handleSearchResultClick={handleSearchResultClick}
        />
      )}

      {/* Main content area - matching Figma layout */}
      <main id="main-content" style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: '55px' }}>
        {/* Frame 8 - Container for BibleReader and CrossReferences */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '70px',
          isolation: 'isolate',
          width: '1076px',
          maxWidth: '1076px'
        }}>
          {/* Frame 10 - Bible reading area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            width: '742px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            zIndex: 0
          }}>
            {error ? (
              <div className="py-8">
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
              <BibleReader
                book={currentBook}
                chapter={currentChapter}
                verses={verses}
                selectedVerses={selectedVerses}
                onVerseSelect={handleVerseSelection}
                loading={loading.verses}
              />
            )}
          </div>

          {/* Frame 8 - Cross-references sidebar */}
          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            width: '220.33px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            zIndex: 1
          }}>
            <CrossReferencesSidebar
              crossReferences={crossReferences}
              selectedRefs={selectedCrossRefs}
              onRefSelect={handleCrossRefSelection}
              loading={loading.crossRefs}
            />
          </aside>
        </div>
      </main>

      {/* AI Companion Modal - show when we have selections */}
      {selectedVerses.length > 0 && selectedCrossRefs.length > 0 && (
        <AICompanion
          selectedVerses={selectedVerses}
          selectedCrossRefs={selectedCrossRefs}
          onSubmitObservation={handleAIExploration}
          conversation_history={[]} // TODO: Implement conversation history
          isOpen={selectedCrossRefs.length > 0}
          onClose={() => setSelectedCrossRefs([])}
          crossRefReference={selectedCrossRefs[0]}
          crossRefText="Sample cross-reference text will be fetched from API"
        />
      )}
    </div>
  )
}