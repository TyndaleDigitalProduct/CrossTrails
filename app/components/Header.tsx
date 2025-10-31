'use client';

import React from 'react';
import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/types';
import Image from 'next/image';

// Bible books for the dropdown (in order)
const BIBLE_BOOKS = [
  // Old Testament
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Songs',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  // New Testament
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
];

// Maximum chapters per book
const MAX_CHAPTERS: Record<string, number> = {
  Genesis: 50,
  Exodus: 40,
  Leviticus: 27,
  Numbers: 36,
  Deuteronomy: 34,
  Joshua: 24,
  Judges: 21,
  Ruth: 4,
  '1 Samuel': 31,
  '2 Samuel': 24,
  '1 Kings': 22,
  '2 Kings': 25,
  '1 Chronicles': 29,
  '2 Chronicles': 36,
  Ezra: 10,
  Nehemiah: 13,
  Esther: 10,
  Job: 42,
  Psalms: 150,
  Proverbs: 31,
  Ecclesiastes: 12,
  'Song of Songs': 8,
  Isaiah: 66,
  Jeremiah: 52,
  Lamentations: 5,
  Ezekiel: 48,
  Daniel: 12,
  Hosea: 14,
  Joel: 3,
  Amos: 9,
  Obadiah: 1,
  Jonah: 4,
  Micah: 7,
  Nahum: 3,
  Habakkuk: 3,
  Zephaniah: 3,
  Haggai: 2,
  Zechariah: 14,
  Malachi: 4,
  Matthew: 28,
  Mark: 16,
  Luke: 24,
  John: 21,
  Acts: 28,
  Romans: 16,
  '1 Corinthians': 16,
  '2 Corinthians': 13,
  Galatians: 6,
  Ephesians: 6,
  Philippians: 4,
  Colossians: 4,
  '1 Thessalonians': 5,
  '2 Thessalonians': 3,
  '1 Timothy': 6,
  '2 Timothy': 4,
  Titus: 3,
  Philemon: 1,
  Hebrews: 13,
  James: 5,
  '1 Peter': 5,
  '2 Peter': 3,
  '1 John': 5,
  '2 John': 1,
  '3 John': 1,
  Jude: 1,
  Revelation: 22,
};

export default function Header({
  currentBook,
  currentChapter,
  onNavigate,
  onSearch,
  handleChapterSelect,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleBookSelect = (book: string) => {
    onNavigate(book, 1);
    setShowBookDropdown(false);
  };

  const internalHandleChapterSelect = (chapter: number) => {
    if (handleChapterSelect) {
      handleChapterSelect(chapter);
    } else {
      onNavigate(currentBook, chapter);
    }
    setShowChapterDropdown(false);
  };

  const maxChapters = MAX_CHAPTERS[currentBook] || 1;

  return (
    <header className="bg-white w-full">
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          paddingTop: '24px',
          paddingBottom: '54px',
          background: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '1076px',
            maxWidth: '1076px',
            background: 'white',
          }}
        >
          {/* Logo - aligned to left */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
            }}
          >
            <Image
              src="/images/logo.svg"
              alt="CrossTrails"
              width={332}
              height={58}
              priority
              style={{ background: 'white' }}
            />
          </div>

          {/* Search and Navigation - aligned to right */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: '0px',
              background: 'white',
            }}
          >
            {/* Search bar with label on top */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                background: 'white',
                width: '294px',
                minWidth: '294px',
                maxWidth: '294px',
                marginRight: '8px',
              }}
            >
              <div style={{ position: 'relative', width: '100%' }}>
                <label
                  htmlFor="search"
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '16px',
                    padding: '0 6px',
                    background: 'white',
                    fontFamily: 'Inter, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '17px',
                    color: '#403E3E',
                    zIndex: 2,
                  }}
                >
                  Search
                </label>
              </div>
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  position: 'relative',
                  width: '294px',
                  minWidth: '294px',
                  maxWidth: '294px',
                  background: 'white',
                }}
              >
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Verse or Passage"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '294px',
                    height: '48px',
                    border: '2px solid #403E3E',
                    borderRadius: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '130%',
                    color: '#403E3E',
                    paddingLeft: '12px',
                    paddingRight: '40px',
                    background: 'white',
                    boxSizing: 'border-box',
                    maxWidth: '294px',
                    minWidth: '294px',
                    // @ts-ignore
                    width: '294px !important',
                  }}
                />
                <Search
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '17.49px',
                    height: '17.49px',
                    color: '#403E3E',
                    background: 'white',
                  }}
                />
              </form>
            </div>

            {/* Chapter/Book dropdown - same size as search */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                marginTop: '21px',
                background: 'white',
                width: '294px',
                minWidth: '294px',
                maxWidth: '294px',
              }}
            >
              <button
                onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  gap: '12px',
                  width: '294px',
                  height: '48px',
                  border: '2px solid #403E3E',
                  borderRadius: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '130%',
                  color: '#403E3E',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <span style={{ background: 'white' }}>
                  {currentBook} {currentChapter}
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '12px',
                    width: '28px',
                    height: '31.08px',
                    background: 'white',
                  }}
                >
                  <div
                    style={{
                      width: '2px',
                      height: '31.08px',
                      background: '#403E3E',
                    }}
                  />
                  <ChevronDown
                    style={{
                      width: '14px',
                      height: '9px',
                      color: '#403E3E',
                      background: 'white',
                    }}
                  />
                </div>
              </button>

              {showChapterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowChapterDropdown(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      width: '294px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      zIndex: 20,
                      maxHeight: '384px',
                      overflowY: 'auto',
                    }}
                  >
                    <div className="py-1">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Old Testament
                      </div>
                      {BIBLE_BOOKS.slice(0, 39).map(book => (
                        <button
                          key={book}
                          onClick={() => handleBookSelect(book)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            book === currentBook
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700'
                          }`}
                          style={{ background: 'white' }}
                        >
                          {book}
                        </button>
                      ))}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-t border-gray-100">
                        New Testament
                      </div>
                      {BIBLE_BOOKS.slice(39).map(book => (
                        <button
                          key={book}
                          onClick={() => handleBookSelect(book)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            book === currentBook
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700'
                          }`}
                          style={{ background: 'white' }}
                        >
                          {book}
                        </button>
                      ))}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-t border-gray-100">
                        Chapters
                      </div>
                      {Array.from({ length: maxChapters }, (_, i) => i + 1).map(
                        chapter => (
                          <button
                            key={chapter}
                            onClick={() => internalHandleChapterSelect(chapter)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              chapter === currentChapter
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700'
                            }`}
                            style={{ background: 'white' }}
                          >
                            Chapter {chapter}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
