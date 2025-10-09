'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { BibleVerse, CrossReferenceGroup } from '@/lib/types'
import Header from './components/Header'
import BibleReader from './components/BibleReader'
import CrossReferencesSidebar from './components/CrossReferencesSidebar'
import AICompanion from './components/AICompanion'
import CrossTrailsModal from './components/CrossTrailsModal'
import { findBookInString, findChapterInString } from '@/lib/parsers/book'
import SearchResultModal from './components/SearchResultModal'

export default function HomePage() {
  // Modal state for proof of concept
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);
  // (removed duplicate modalOpen and modalContent)

  // Global link click handler
  React.useEffect(() => {
    function handleLinkClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || (target.tagName === 'SPAN' && target.style.textDecoration === 'underline')) {
        e.preventDefault();
        // Always show the same initial modal content regardless of which link is clicked
        setModalContent('');
        setModalOpen(true);
      }
    }
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);
  // State management for the main application
  const [currentBook, setCurrentBook] = useState('Matthew')
  const [currentChapter, setCurrentChapter] = useState(2)
  const [nextChapter, setNextChapter] = useState(3)
  const [previousChapter, setPreviousChapter] = useState(1)
  const [currentTerms, setCurrentTerms] = useState('')
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
  const [verseError, setVerseError] = useState<string | null>(null)
  const [crossRefError, setCrossRefError] = useState<string | null>(null)
  
  // Load verses when book/chapter changes
  useEffect(() => {
    loadVerses(currentBook, currentChapter)
  }, [currentBook, currentChapter])
  
  // Load cross-references when verses are selected
  // Always show demo sidebar links regardless of selection
useEffect(() => {
  if (selectedVerses.length > 0) {
    loadCrossReferences(selectedVerses)
  } else {
    setCrossReferences([])
  }
}, [selectedVerses])
  
  const loadVerses = async (book: string, chapter: number) => {
    setLoading(prev => ({ ...prev, verses: true }))
    setVerseError(null)
    
    try {
      const response = await fetch(`/api/verses?book=${book}&chapter=${chapter}`)
      
      if (!response.ok) {
        throw new Error('Failed to load verses')
      }
      
      const data = await response.json()
      setVerses(data.verses)
      setSelectedVerses([]) // Clear selection when changing passages
      
    } catch (err) {
      setVerseError(err instanceof Error ? err.message : 'Failed to load verses')
      console.error('Error loading verses:', err)
    } finally {
      setLoading(prev => ({ ...prev, verses: false }))
    }
  }
  
const loadCrossReferences = async (verseIds: string[]) => {
  console.log('Loading cross-references for:', verseIds)
  setLoading(prev => ({ ...prev, crossRefs: true }))
  setCrossRefError(null) // Clear previous cross-ref errors

  try {
    const versesParam = verseIds.join(',')
    const response = await fetch(`/api/cross-refs?verses=${versesParam}`)

    if (!response.ok) {
      throw new Error('Failed to load cross-references')
    }

    const data = await response.json()

    // If no cross-references are found, show the error and clear the sidebar
    if (!data.cross_references || data.cross_references.length === 0) {
      setCrossRefError('Sorry, cross-references are not available for this chapter.')
      setCrossReferences([])
      return
    }

    setCrossReferences([{
      anchor_verse: verseIds[0],
      cross_references: data.cross_references,
      total_found: data.total_found,
      returned: data.returned
    }])

  } catch (err) {
    console.error('Error loading cross-references:', err)
    setCrossRefError('Sorry, cross-references are not available for this chapter.')
    setCrossReferences([]) // Clear any previous cross-references
  } finally {
    setLoading(prev => ({ ...prev, crossRefs: false }))
  }
}
  
  const handleNavigation = (book: string, chapter: number) => {
    setCurrentBook(book)
    setCurrentChapter(chapter)
    setNextChapter(chapter + 1) 
    setPreviousChapter(chapter > 1 ? chapter - 1 : 1)
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
      setVerseError(null)
      setCurrentTerms(query)
      
      const response = await fetch(`/api/search?terms=${query}`);
      
      if (!response.ok) {
        throw new Error('Failed to load search')
      }
      
      const data = await response.json()
      setSearchResults(data)
      setIsSearchModalOpen(Array.isArray(data) && data.length > 0)
    } catch (err) {
      setVerseError(err instanceof Error ? err.message : 'Failed to load search')
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
        handleChapterSelect={(chapter: number) => handleNavigation(currentBook, chapter)}
      />
    
      {/* Search Results Modal */}
      {isSearchModalOpen && (
        <SearchResultModal
        term={currentTerms}
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
            {verseError ? (
              <div className="py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    Error loading content: {verseError}
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
                  handleChapterSelect={(chapter: number) => handleNavigation(currentBook, chapter)}
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
              error={crossRefError}
            />
          </aside>
        </div>
      </main>

      {/* Proof of concept modal for any link click */}
      <CrossTrailsModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {(() => {
          const [expanded, setExpanded] = React.useState(true);
          return (
            <div style={{
              borderRadius: '24px',
              background: '#fff',
              minWidth: '400px',
              maxWidth: '600px',
              margin: '0 auto',
              padding: 0,
              position: 'relative',
              boxShadow: '0 2px 16px rgba(64,62,62,0.10)',
              overflow: 'hidden',
            }}>
              {/* Headline and passage */}
              <div style={{ padding: '28px 32px 18px 32px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontFamily: 'Calibri, sans-serif', fontWeight: 700, fontSize: '20px', color: '#403e3e', textDecoration: 'underline', marginBottom: '8px' }}>
                  {'Micah 5:2'}
                </div>
                <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '17px', color: '#403e3e', marginBottom: '0' }}>
                  2<span style={{ fontWeight: 400 }}>*But you, O Bethlehem Ephrathah,</span><br />
                  <span style={{ display: 'inline-block', marginLeft: '24px' }}>are only a small village among all the people of Judah.</span><br />
                  Yet a ruler of Israel,<br />
                  <span style={{ display: 'inline-block', marginLeft: '24px' }}>whose origins are in the distant past,</span><br />
                  <span style={{ display: 'inline-block', marginLeft: '24px' }}>will come from you on my behalf.</span>
                </div>
              </div>
              {/* Section: How Does This Passage Relate? */}
              <div style={{ background: '#e5e5e5', padding: '18px 32px 2px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'Calibri, sans-serif', fontWeight: 700, fontSize: '15px', color: '#403e3e', marginRight: '8px' }}>What are your thoughts on how these passages are related?</span>
                  <span
                    style={{ background: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#ff6a32', fontSize: '16px', border: '1px solid #e0e0e0', cursor: 'pointer' }}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? '−' : '+'}
                  </span>
                </div>
                {expanded && (
                  <div style={{ display: 'none', background: '#fff', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontFamily: 'Calibri, sans-serif', fontSize: '15px', color: '#403e3e', boxShadow: '0 1px 4px rgba(64,62,62,0.04)' }}>
                    Is Micah predicting that the Messiah would come from Jerusalem?
                  </div>
                )}
                {expanded && (
                  <>
                    {/* AI response bubble */}
                    <div style={{ display: 'none', background: 'transparent', borderRadius: '8px', padding: '14px 16px', fontFamily: 'Calibri, sans-serif', fontSize: '15px', color: '#403e3e', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '8px' }}>Yes, Here’s what’s going on:</div>
                      <ul style={{ paddingLeft: '18px', margin: 0 }}>
                        <li style={{ marginBottom: '8px' }}><b>Micah 5:2 (OT prophecy)</b><br />Micah prophesies that a future ruler of Israel (the Messiah) will come from Bethlehem, a small, seemingly insignificant town:<br /><span style={{ color: '#888' }}>&quot;But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel, whose origins are from of old, from ancient times.&quot;</span></li>
                        <li><b>Matthew 2:6 (NT fulfillment)</b><br />Matthew quotes/paraphrases Micah 5:2 to show that Jesus’ birthplace (Bethlehem) is not random but foretold in Scripture:<br /><span style={{ color: '#888' }}>&quot;But you, Bethlehem, in the land of Judah, are by no means least among the rulers of Judah; for out of you will come a ruler who will shepherd my people Israel.&quot;</span></li>
                      </ul>
                    </div>
                    {/* Textarea and send button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '8px', padding: '8px 10px', border: '1px solid #e0e0e0', marginBottom: '18px' }}>
                      <textarea style={{ flex: 1, borderRadius: '8px', border: 'none', padding: '8px 10px', fontFamily: 'Calibri, sans-serif', fontSize: '15px', color: '#403e3e', resize: 'none', minHeight: '36px', outline: 'none', background: 'transparent' }} placeholder="Chat with the Trail Guide" />
                      <button style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#403e3e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }} aria-label="Send">
                        <span style={{ height: '0', width: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '10px solid white', rotate: '-90deg', marginLeft: '3px' }}></span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </CrossTrailsModal>
    </div>
  )
}