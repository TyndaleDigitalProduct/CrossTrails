'use client'

import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { HeaderProps } from '@/lib/types'

// Bible books for the dropdown (in order)
const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Songs',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
]

// Maximum chapters per book (simplified - would be more accurate in production)
const MAX_CHAPTERS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
  'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Songs': 8, 'Isaiah': 66,
  'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
  'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
  'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
  'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16, 'Luke': 24,
  'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
  '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
}

export default function Header({
  currentBook,
  currentChapter,
  onNavigate,
  onSearch
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showBookDropdown, setShowBookDropdown] = useState(false)
  const [showChapterDropdown, setShowChapterDropdown] = useState(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleBookSelect = (book: string) => {
    onNavigate(book, 1) // Start with chapter 1 when changing books
    setShowBookDropdown(false)
  }

  const handleChapterSelect = (chapter: number) => {
    onNavigate(currentBook, chapter)
    setShowChapterDropdown(false)
  }

  const maxChapters = MAX_CHAPTERS[currentBook] || 1

  return (
    <header className="header sticky top-0 z-40">
      <div className="container-responsive">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="logo">
              CROSS/TRAILS
            </h1>
          </div>

          {/* Search bar and navigation */}
          <div className="flex items-center space-x-4">
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="search-bar w-64">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by Verse or Passage"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            {/* Book and Chapter Navigation */}
            <div className="flex items-center space-x-2">
              {/* Book dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBookDropdown(!showBookDropdown)}
                  className="chapter-dropdown flex items-center space-x-2"
                >
                  <span>{currentBook}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showBookDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBookDropdown(false)}
                    />

                    {/* Dropdown menu */}
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto scrollbar-thin">
                      <div className="py-1">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                          Old Testament
                        </div>
                        {BIBLE_BOOKS.slice(0, 39).map((book) => (
                          <button
                            key={book}
                            onClick={() => handleBookSelect(book)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              book === currentBook ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {book}
                          </button>
                        ))}
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-t border-gray-100">
                          New Testament
                        </div>
                        {BIBLE_BOOKS.slice(39).map((book) => (
                          <button
                            key={book}
                            onClick={() => handleBookSelect(book)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              book === currentBook ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {book}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Chapter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                  className="chapter-dropdown flex items-center space-x-2"
                >
                  <span>Chapter {currentChapter}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showChapterDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowChapterDropdown(false)}
                    />

                    {/* Dropdown menu */}
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto scrollbar-thin">
                      <div className="py-1">
                        {Array.from({ length: maxChapters }, (_, i) => i + 1).map((chapter) => (
                          <button
                            key={chapter}
                            onClick={() => handleChapterSelect(chapter)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              chapter === currentChapter ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            Chapter {chapter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}