
const SearchResultModal = ({
    term,
    searchResults,
    loading,
    setIsSearchModalOpen,
    setSearchResults,
    handleSearchResultClick
}: {
    term: string;
    searchResults: any;
    loading: boolean;
    setIsSearchModalOpen: (open: boolean) => void;
    setSearchResults: (results: any) => void;
    handleSearchResultClick: (result: any) => void
}) => {
    const count = searchResults.length;
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(64,62,62,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
        <div style={{
            background: '#fff',
            borderRadius: '24px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            padding: '32px',
            minWidth: '400px',
            maxHeight: '80vh',
            maxWidth: '90vw',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE 10+
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Search Results</h2>
        {/* Orange X close button only */}
        <button
          onClick={() => { setIsSearchModalOpen(false); setSearchResults([]) }}
          style={{
            position: 'absolute',
            top: '48px',
            right: '48px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ff6a32',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label="Close"
        >
          ×
        </button>
        </div>
        {loading ? (
            <div>Loading...</div>
        ) : searchResults.length === 0 ? (
            <div>No results found.</div>
        ) : (
            <>
            <p style={{ fontSize: 16, marginBottom: 8 }}>{count} results for "{term}"</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {searchResults.map((result: any, idx: any) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                <button
                style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#f1f1f1',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    padding: '10px',
                    cursor: 'pointer',
                    fontSize: 16,
                }}
                onClick={() => handleSearchResultClick(result)}
                >
                {result.book} {result.chapter}:{result.verse} - {result.text}
                </button>
                </li>
            ))}
            </ul>
            </>
        )}
        </div>
        </div>
    )
}

export default SearchResultModal
