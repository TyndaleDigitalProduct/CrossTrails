
const BIBLE_BOOKS = [
  // Old Testament
  { name: 'Genesis', abbrevs: ['Gen', 'Ge', 'Gn'] },
  { name: 'Exodus', abbrevs: ['Exod', 'Ex', 'Exo'] },
  { name: 'Leviticus', abbrevs: ['Lev', 'Le', 'Lv'] },
  { name: 'Numbers', abbrevs: ['Num', 'Nu', 'Nm', 'Nb'] },
  { name: 'Deuteronomy', abbrevs: ['Deut', 'De', 'Dt'] },
  { name: 'Joshua', abbrevs: ['Josh', 'Jos', 'Jsh'] },
  { name: 'Judges', abbrevs: ['Judg', 'Jdg', 'Jg', 'Jdgs'] },
  { name: 'Ruth', abbrevs: ['Rth', 'Ru'] },
  { name: '1 Samuel', abbrevs: ['1Sam', '1 Sam', '1S', '1 S', 'I Samuel', 'I Sam', 'I S', '1Samuel'] },
  { name: '2 Samuel', abbrevs: ['2Sam', '2 Sam', '2S', '2 S', 'II Samuel', 'II Sam', 'II S', '2Samuel'] },
  { name: '1 Kings', abbrevs: ['1Kgs', '1 Kgs', '1K', '1 K', 'I Kings', 'I Kgs', 'I K', '1Kings'] },
  { name: '2 Kings', abbrevs: ['2Kgs', '2 Kgs', '2K', '2 K', 'II Kings', 'II Kgs', 'II K', '2Kings'] },
  { name: '1 Chronicles', abbrevs: ['1Chr', '1 Chr', '1Ch', '1 Ch', 'I Chronicles', 'I Chr', 'I Ch', '1Chronicles'] },
  { name: '2 Chronicles', abbrevs: ['2Chr', '2 Chr', '2Ch', '2 Ch', 'II Chronicles', 'II Chr', 'II Ch', '2Chronicles'] },
  { name: 'Ezra', abbrevs: ['Ezr', 'Ez'] },
  { name: 'Nehemiah', abbrevs: ['Neh', 'Ne'] },
  { name: 'Esther', abbrevs: ['Esth', 'Es'] },
  { name: 'Job', abbrevs: ['Jb'] },
  { name: 'Psalms', abbrevs: ['Ps', 'Psalm', 'Psa', 'Psm', 'Pss'] },
  { name: 'Proverbs', abbrevs: ['Prov', 'Pro', 'Prv', 'Pr'] },
  { name: 'Ecclesiastes', abbrevs: ['Eccl', 'Ec', 'Ecc'] },
  { name: 'Song of Songs', abbrevs: ['Song', 'So', 'SOS', 'Song of Solomon', 'SoS', 'Canticles'] },
  { name: 'Isaiah', abbrevs: ['Isa', 'Is'] },
  { name: 'Jeremiah', abbrevs: ['Jer', 'Je', 'Jr'] },
  { name: 'Lamentations', abbrevs: ['Lam', 'La'] },
  { name: 'Ezekiel', abbrevs: ['Ezek', 'Eze', 'Ezk'] },
  { name: 'Daniel', abbrevs: ['Dan', 'Da', 'Dn'] },
  { name: 'Hosea', abbrevs: ['Hos', 'Ho'] },
  { name: 'Joel', abbrevs: ['Joe', 'Jl'] },
  { name: 'Amos', abbrevs: ['Am'] },
  { name: 'Obadiah', abbrevs: ['Obad', 'Ob'] },
  { name: 'Jonah', abbrevs: ['Jnh', 'Jon'] },
  { name: 'Micah', abbrevs: ['Mic', 'Mc'] },
  { name: 'Nahum', abbrevs: ['Nah', 'Na'] },
  { name: 'Habakkuk', abbrevs: ['Hab', 'Hb'] },
  { name: 'Zephaniah', abbrevs: ['Zeph', 'Zep', 'Zp'] },
  { name: 'Haggai', abbrevs: ['Hag', 'Hg'] },
  { name: 'Zechariah', abbrevs: ['Zech', 'Zec', 'Zc'] },
  { name: 'Malachi', abbrevs: ['Mal', 'Ml'] },
  
  // New Testament
  { name: 'Matthew', abbrevs: ['Matt', 'Mt'] },
  { name: 'Mark', abbrevs: ['Mk', 'Mr'] },
  { name: 'Luke', abbrevs: ['Lk', 'Lu'] },
  { name: 'John', abbrevs: ['Jn', 'Joh'] },
  { name: 'Acts', abbrevs: ['Act', 'Ac'] },
  { name: 'Romans', abbrevs: ['Rom', 'Ro', 'Rm'] },
  { name: '1 Corinthians', abbrevs: ['1Cor', '1 Cor', '1Co', '1 Co', 'I Corinthians', 'I Cor', 'I Co', '1Corinthians'] },
  { name: '2 Corinthians', abbrevs: ['2Cor', '2 Cor', '2Co', '2 Co', 'II Corinthians', 'II Cor', 'II Co', '2Corinthians'] },
  { name: 'Galatians', abbrevs: ['Gal', 'Ga'] },
  { name: 'Ephesians', abbrevs: ['Eph', 'Ephes'] },
  { name: 'Philippians', abbrevs: ['Phil', 'Php', 'Pp'] },
  { name: 'Colossians', abbrevs: ['Col', 'Co'] },
  { name: '1 Thessalonians', abbrevs: ['1Thess', '1 Thess', '1Th', '1 Th', 'I Thessalonians', 'I Thess', 'I Th', '1Thessalonians'] },
  { name: '2 Thessalonians', abbrevs: ['2Thess', '2 Thess', '2Th', '2 Th', 'II Thessalonians', 'II Thess', 'II Th', '2Thessalonians'] },
  { name: '1 Timothy', abbrevs: ['1Tim', '1 Tim', '1Ti', '1 Ti', 'I Timothy', 'I Tim', 'I Ti', '1Timothy'] },
  { name: '2 Timothy', abbrevs: ['2Tim', '2 Tim', '2Ti', '2 Ti', 'II Timothy', 'II Tim', 'II Ti', '2Timothy'] },
  { name: 'Titus', abbrevs: ['Tit', 'Ti'] },
  { name: 'Philemon', abbrevs: ['Phlm', 'Phm', 'Pm'] },
  { name: 'Hebrews', abbrevs: ['Heb', 'He'] },
  { name: 'James', abbrevs: ['Jas', 'Jm'] },
  { name: '1 Peter', abbrevs: ['1Pet', '1 Pet', '1Pe', '1 Pe', 'I Peter', 'I Pet', 'I Pe', '1Peter'] },
  { name: '2 Peter', abbrevs: ['2Pet', '2 Pet', '2Pe', '2 Pe', 'II Peter', 'II Pet', 'II Pe', '2Peter'] },
  { name: '1 John', abbrevs: ['1Jn', '1 Jn', '1J', '1 J', 'I John', 'I Jn', 'I J', '1John'] },
  { name: '2 John', abbrevs: ['2Jn', '2 Jn', '2J', '2 J', 'II John', 'II Jn', 'II J', '2John'] },
  { name: '3 John', abbrevs: ['3Jn', '3 Jn', '3J', '3 J', 'III John', 'III Jn', 'III J', '3John'] },
  { name: 'Jude', abbrevs: ['Jud', 'Jd'] },
  { name: 'Revelation', abbrevs: ['Rev', 'Re', 'Rv', 'Apocalypse'] }
];

// Create a map for quick book name lookup
const bookNameMap = new Map<string, string>();
BIBLE_BOOKS.forEach(book => {
  // Add full name
  bookNameMap.set(book.name.toLowerCase(), book.name);
  // Add abbreviations
  book.abbrevs.forEach(abbrev => {
    bookNameMap.set(abbrev.toLowerCase(), book.name);
  });
});


/**
* Find a book name at the beginning of a string and return the book name and remaining text
*/
export function findBookInString(input: string): { book: string; remaining: string } | null {
  const normalized = input?.toLowerCase()?.trim();
  
  // Try to find the longest matching book name or abbreviation
  let bestMatch: { book: string; length: number } | null = null;
  
  for (const [key, bookName] of bookNameMap.entries()) {
    if (normalized.startsWith(key)) {
      if (!bestMatch || key.length > bestMatch.length) {
        bestMatch = { book: bookName, length: key.length };
      }
    }
  }
  
  if (bestMatch) {
    const remaining = input.substring(bestMatch.length);
    return { book: bestMatch.book, remaining };
  }
  
  return null;
}

/**
* Find a chapter number at the beginning of a string and return the chapter number and remaining text
*/
export function findChapterInString(bookName: string, input: string): { chapter: number; remaining: string } | null {
  const normalized = input?.toLowerCase()?.trim();
  
  const chapterMatch = /\b(\d+)\b/.exec(normalized);
  if (chapterMatch) {
    const chapter = parseInt(chapterMatch[1], 10);
    const remaining = normalized.substring(chapterMatch.index! + chapterMatch[0].length);
    return { chapter, remaining };
  }
  
  return null;
}