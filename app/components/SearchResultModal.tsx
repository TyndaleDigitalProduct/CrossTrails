
const SearchResultModal = ({ 
    searchResults, 
    loading, 
    setIsSearchModalOpen, 
    setSearchResults, 
    handleSearchResultClick 
}: { 
    searchResults: any; 
    loading: boolean; 
    setIsSearchModalOpen: (open: boolean) => void; 
    setSearchResults: (results: any) => void; 
    handleSearchResultClick: (result: any) => void 
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                padding: '32px',
                minWidth: '400px',
                maxHeight: '80vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600 }}>Search Results</h2>
                    <button onClick={() => { setIsSearchModalOpen(false); setSearchResults([]) }} style={{ fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                </div>
                {loading ? (
                    <div>Loading...</div>
                ) : searchResults.length === 0 ? (
                    <div>No results found.</div>
                ) : (
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
                )}
            </div>
        </div>
    )
}

export default SearchResultModal
