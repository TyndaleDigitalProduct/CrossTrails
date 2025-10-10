'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { BibleVerse, CrossReferenceGroup } from '@/lib/types';
import Header from './components/Header';
import BibleReader from './components/BibleReader';
import CrossReferencesSidebar from './components/CrossReferencesSidebar';
import AICompanion from './components/AICompanion';
import CrossTrailsModal from './components/CrossTrailsModal';
import { findBookInString, findChapterInString } from '@/lib/parsers/book';
import SearchResultModal from './components/SearchResultModal';

export const fullBookNameToAbbrev: Record<string, string> = {
  Genesis: 'Gen',
  Exodus: 'Exod',
  Leviticus: 'Lev',
  Numbers: 'Num',
  Deuteronomy: 'Deut',
  Joshua: 'Josh',
  Judges: 'Judg',
  Ruth: 'Ruth',
  '1 Samuel': '1Sam',
  '2 Samuel': '2Sam',
  '1 Kings': '1Kgs',
  '2 Kings': '2Kgs',
  '1 Chronicles': '1Chr',
  '2 Chronicles': '2Chr',
  Ezra: 'Ezra',
  Nehemiah: 'Neh',
  Esther: 'Esth',
  Job: 'Job',
  Psalms: 'Ps',
  Proverbs: 'Pr',
  Ecclesiastes: 'Eccl',
  'Song of Songs': 'Song',
  Isaiah: 'Isa',
  Jeremiah: 'Jer',
  Lamentations: 'Lam',
  Ezekiel: 'Ezek',
  Daniel: 'Dan',
  Hosea: 'Hos',
  Joel: 'Joel',
  Amos: 'Amos',
  Obadiah: 'Obad',
  Jonah: 'Jon',
  Micah: 'Mic',
  Nahum: 'Nah',
  Habakkuk: 'Hab',
  Zephaniah: 'Zeph',
  Haggai: 'Hagg',
  Zechariah: 'Zech',
  Malachi: 'Mal',
  Matthew: 'Matt',
  Mark: 'Mark',
  Luke: 'Luke',
  John: 'John',
  Acts: 'Acts',
  Romans: 'Rom',
  '1 Corinthians': '1Cor',
  '2 Corinthians': '2Cor',
  Galatians: 'Gal',
  Ephesians: 'Eph',
  Philippians: 'Phil',
  Colossians: 'Col',
  '1 Thessalonians': '1Thes',
  '2 Thessalonians': '2Thes',
  '1 Timothy': '1Tim',
  '2 Timothy': '2Tim',
  Titus: 'Titus',
  Philemon: 'Phlm',
  Hebrews: 'Heb',
  James: 'Jas',
  '1 Peter': '1Pet',
  '2 Peter': '2Pet',
  '1 John': '1Jn',
  '2 John': '2Jn',
  '3 John': '3Jn',
  Jude: 'Jude',
  Revelation: 'Rev',
};

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
      if (
        target.tagName === 'A' ||
        (target.tagName === 'SPAN' &&
          target.style.textDecoration === 'underline')
      ) {
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
  const [currentBook, setCurrentBook] = useState('Matthew');
  const [currentChapter, setCurrentChapter] = useState(2);
  const [nextChapter, setNextChapter] = useState(3);
  const [previousChapter, setPreviousChapter] = useState(1);
  const [currentTerms, setCurrentTerms] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<string[]>([]);
  const [selectedCrossRefs, setSelectedCrossRefs] = useState<string[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReferenceGroup[]>(
    []
  );
  const [versesWithCrossRefs, setVersesWithCrossRefs] = useState<string[]>([]);

  const [loading, setLoading] = useState({
    verses: false,
    crossRefs: false,
    search: false,
    ai: false,
  });
  const [verseError, setVerseError] = useState<string | null>(null);
  const [crossRefError, setCrossRefError] = useState<string | null>(null);

  // Load verses when book/chapter changes
  useEffect(() => {
    loadVerses(currentBook, currentChapter);
  }, [currentBook, currentChapter]);

  // Load cross-ref availability for the chapter when verses change
  useEffect(() => {
    if (verses.length === 0) {
      setVersesWithCrossRefs([]);
      return;
    }
    // Fetch cross-ref metadata for all verses in this chapter
    const bookAbbrev = fullBookNameToAbbrev[currentBook] || currentBook;
    fetch(`/api/cross-refs?chapter=${bookAbbrev}.${currentChapter}`)
      .then(res =>
        res.ok
          ? res.json()
          : Promise.reject('Failed to fetch cross-ref metadata')
      )
      .then(data => {
        // Assume data.verses is an array of cross-ref objects with anchor_verse or verse_id
        const ids = Array.isArray(data.verses)
          ? data.verses.map((ref: any) => ref.anchor_verse || ref.verse_id)
          : [];
        setVersesWithCrossRefs(ids);
      })
      .catch(() => setVersesWithCrossRefs([]));
  }, [verses]);

  // Load cross-references when verses are selected
  // Always show demo sidebar links regardless of selection
  useEffect(() => {
    if (selectedVerses.length > 0) {
      loadCrossReferences(selectedVerses);
    } else {
      setCrossReferences([]);
    }
  }, [selectedVerses]);

  const loadVerses = async (book: string, chapter: number) => {
    setLoading(prev => ({ ...prev, verses: true }));
    setVerseError(null);

    try {
      const response = await fetch(
        `/api/verses?book=${book}&chapter=${chapter}`
      );

      if (!response.ok) {
        throw new Error('Failed to load verses');
      }

      const data = await response.json();
      setVerses(data.verses);
      setSelectedVerses([]); // Clear selection when changing passages
    } catch (err) {
      setVerseError(
        err instanceof Error ? err.message : 'Failed to load verses'
      );
      console.error('Error loading verses:', err);
    } finally {
      setLoading(prev => ({ ...prev, verses: false }));
    }
  };

  const loadCrossReferences = async (verseIds: string[]) => {
    console.log('Loading cross-references for:', verseIds);
    setLoading(prev => ({ ...prev, crossRefs: true }));
    setCrossRefError(null); // Clear previous cross-ref errors

    try {
      const versesParam = verseIds.join(',');
      const response = await fetch(`/api/cross-refs?verses=${versesParam}`);

      if (!response.ok) {
        throw new Error('Failed to load cross-references');
      }

      const data = await response.json();

      // If no cross-references are found, show the error and clear the sidebar
      if (!data.cross_references || data.cross_references.length === 0) {
        setCrossRefError(
          'Sorry, cross-references are not available for this chapter.'
        );
        setCrossReferences([]);
        return;
      }

      setCrossReferences([
        {
          anchor_verse: verseIds[0],
          cross_references: data.cross_references,
          total_found: data.total_found,
          returned: data.returned,
        },
      ]);
    } catch (err) {
      console.error('Error loading cross-references:', err);
      setCrossRefError(
        'Sorry, cross-references are not available for this chapter.'
      );
      setCrossReferences([]); // Clear any previous cross-references
    } finally {
      setLoading(prev => ({ ...prev, crossRefs: false }));
    }
  };

  const handleNavigation = (book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setNextChapter(chapter + 1);
    setPreviousChapter(chapter > 1 ? chapter - 1 : 1);
  };

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);

    try {
      const bookMatch = findBookInString(query);
      if (bookMatch) {
        const chapterMatch = findChapterInString(
          bookMatch.book,
          bookMatch.remaining
        );
        console.log('Book match:', bookMatch);
        console.log('Chapter match:', chapterMatch);
        if (chapterMatch) {
          setCurrentBook(bookMatch.book);
          setCurrentChapter(chapterMatch.chapter);
          setIsSearchModalOpen(false);
          setSearchResults([]);
          return;
        }
      }

      setLoading(prev => ({ ...prev, search: true }));
      setVerseError(null);
      setCurrentTerms(query);

      const response = await fetch(`/api/search?terms=${query}`);

      if (!response.ok) {
        throw new Error('Failed to load search');
      }

      const data = await response.json();
      setSearchResults(data);
      setIsSearchModalOpen(Array.isArray(data) && data.length > 0);
    } catch (err) {
      setVerseError(
        err instanceof Error ? err.message : 'Failed to load search'
      );
      console.error('Error loading search:', err);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSearchResultClick = (result: any) => {
    // result should have book and chapter fields
    setCurrentBook(result.book);
    setCurrentChapter(result.chapter);
    setIsSearchModalOpen(false);
    setSearchResults([]);
  };

  const handleVerseSelection = (verseIds: string[]) => {
    setSelectedVerses(verseIds);
    setSelectedCrossRefs([]); // Clear cross-ref selection when verses change
  };

  const handleCrossRefSelection = (refIds: string[]) => {
    setSelectedCrossRefs(refIds);
  };

  const handleAIExploration = async (observation: string) => {
    if (!selectedVerses.length || !selectedCrossRefs.length) {
      return;
    }

    setLoading(prev => ({ ...prev, ai: true }));

    try {
      const response = await fetch('/api/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVerses,
          userObservation: observation,
          selectedCrossRefs,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI insights');
      }

      // Handle streaming response
      // TODO: Implement streaming response handling
    } catch (err) {
      console.error('Error getting AI insights:', err);
    } finally {
      setLoading(prev => ({ ...prev, ai: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <Header
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigate={handleNavigation}
        onSearch={handleSearch}
        handleChapterSelect={(chapter: number) =>
          handleNavigation(currentBook, chapter)
        }
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
      <main
        id="main-content"
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          paddingTop: '55px',
        }}
      >
        {/* Frame 8 - Container for BibleReader and CrossReferences */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '70px',
            isolation: 'isolate',
            width: '1076px',
            maxWidth: '1076px',
          }}
        >
          {/* Frame 10 - Bible reading area */}
          <div
            style={{
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
              zIndex: 0,
            }}
          >
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
                handleChapterSelect={(chapter: number) =>
                  handleNavigation(currentBook, chapter)
                }
                versesWithCrossRefs={versesWithCrossRefs}
              />
            )}
          </div>

          {/* Frame 8 - Cross-references sidebar */}
          <aside
            style={{
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
              zIndex: 1,
            }}
          >
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
      <CrossTrailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      ></CrossTrailsModal>
    </div>
  );
}
