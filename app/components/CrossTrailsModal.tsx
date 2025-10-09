import React, { useState } from 'react';

interface CrossTrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrossTrailsModal({
  isOpen,
  onClose,
}: CrossTrailsModalProps) {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  if (!isOpen) return null;

  const onHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const question = formData.get('question') as string;

    if (!question.trim()) {
      console.log('No question provided');
      return;
    }

    // Store the user's question and clear the form
    setUserQuestion(question);
    setIsLoading(true);

    // Clear the textarea
    (e.target as HTMLFormElement).reset();

    try {
      // Construct the CrossReference object for Micah 5:2
      const crossReference = {
        reference: 'Micah.5.2',
        display_ref: 'Micah 5:2',
        text: 'But you, O Bethlehem Ephrathah, are only a small village among all the people of Judah. Yet a ruler of Israel, whose origins are in the distant past, will come from you on my behalf.',
        anchor_ref: 'Matthew.2.6',
        connection: {
          categories: ['prophecy', 'messianic'],
          strength: 0.9,
          type: 'prophecy' as const,
          explanation:
            'Messianic prophecy about the birthplace of the ruler of Israel',
        },
        context: {
          book: 'Micah',
          chapter: 5,
          verse: 2,
        },
      };

      // Call the cross-refs analyze API
      const response = await fetch('/api/cross-refs/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crossReference,
          userObservation: question,
          analysisType: 'default',
          contextRange: 2,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analysis result:', data);

      if (data.success && data.data?.analysis) {
        // Convert \n to <br> tags for HTML display
        const formattedAnalysis = data.data.analysis.replace(/\n/g, '<br>');
        setAiResponse(formattedAnalysis);
      }
    } catch (error) {
      console.error('Error analyzing cross-reference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(64,62,62,0.4)',
        zIndex: 1000,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE 10+
      }}
      className="hide-scrollbar"
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          width: '518px',
          maxHeight: '80vh',
          maxWidth: '90vw',
          overflowY: 'auto',
          padding: '0',
          position: 'relative',
          fontFamily: 'Inter, Calibri, sans-serif',
          boxShadow: '0 2px 16px rgba(64,62,62,0.10)',
          borderBottom: 'none',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE 10+
        }}
      >
        {/* Orange X close button only */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
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

        <div
          style={{
            borderRadius: '24px',
            background: '#fff',
            minWidth: '400px',
            maxWidth: '600px',
            margin: '0 auto',
            padding: 0,
            position: 'relative',
            boxShadow: '0 2px 16px rgba(64,62,62,0.10)',
            overflow: 'hidden',
          }}
        >
          {/* Headline and passage */}
          <div
            style={{
              padding: '28px 32px 18px 32px',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                fontFamily: 'Calibri, sans-serif',
                fontWeight: 700,
                fontSize: '20px',
                color: '#403e3e',
                textDecoration: 'underline',
                marginBottom: '8px',
              }}
            >
              {'Micah 5:2'}
            </div>
            <div
              style={{
                fontFamily: 'Calibri, sans-serif',
                fontSize: '17px',
                color: '#403e3e',
                marginBottom: '0',
              }}
            >
              2
              <span style={{ fontWeight: 400 }}>
                *But you, O Bethlehem Ephrathah,
              </span>
              <br />
              <span style={{ display: 'inline-block', marginLeft: '24px' }}>
                are only a small village among all the people of Judah.
              </span>
              <br />
              Yet a ruler of Israel,
              <br />
              <span style={{ display: 'inline-block', marginLeft: '24px' }}>
                whose origins are in the distant past,
              </span>
              <br />
              <span style={{ display: 'inline-block', marginLeft: '24px' }}>
                will come from you on my behalf.
              </span>
            </div>
          </div>
          {/* Section: How Does This Passage Relate? */}
          <div style={{ background: '#e5e5e5', padding: '18px 32px 2px 32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Calibri, sans-serif',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#403e3e',
                  marginRight: '8px',
                }}
              >
                What are your thoughts on how these passages are related?
              </span>
              <span
                style={{
                  background: '#fff',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#ff6a32',
                  fontSize: '16px',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                }}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '−' : '+'}
              </span>
            </div>
            {expanded && (
              <div
                style={{
                  display: 'none',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  fontFamily: 'Calibri, sans-serif',
                  fontSize: '15px',
                  color: '#403e3e',
                  boxShadow: '0 1px 4px rgba(64,62,62,0.04)',
                }}
              >
                Is Micah predicting that the Messiah would come from Jerusalem?
              </div>
            )}
            {expanded && (
              <>
                {/* User question bubble */}
                {userQuestion && (
                  <div
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      fontFamily: 'Calibri, sans-serif',
                      fontSize: '15px',
                      color: '#403e3e',
                      border: '1px solid #e9ecef',
                      marginLeft: '20px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '4px',
                        fontSize: '14px',
                        color: '#666',
                      }}
                    >
                      You asked:
                    </div>
                    {userQuestion}
                  </div>
                )}

                {/* AI response bubble */}
                {(aiResponse || isLoading) && (
                  <div
                    style={{
                      background: 'transparent',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      fontFamily: 'Calibri, sans-serif',
                      fontSize: '15px',
                      color: '#403e3e',
                      marginBottom: '12px',
                    }}
                  >
                    {isLoading ? (
                      <div style={{ fontStyle: 'italic', color: '#888' }}>
                        Trail Guide is thinking...
                      </div>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: aiResponse || '',
                        }}
                      />
                    )}
                  </div>
                )}
                {/* Textarea and send button */}
                <form onSubmit={onHandleSubmit}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      border: '1px solid #e0e0e0',
                      marginBottom: '18px',
                    }}
                  >
                    <textarea
                      name="question"
                      style={{
                        flex: 1,
                        borderRadius: '8px',
                        border: 'none',
                        padding: '8px 10px',
                        fontFamily: 'Calibri, sans-serif',
                        fontSize: '15px',
                        color: '#403e3e',
                        resize: 'none',
                        minHeight: '36px',
                        outline: 'none',
                        background: 'transparent',
                      }}
                      placeholder="Chat with the Trail Guide"
                    />
                    <button
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#403e3e',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                      aria-label="Send"
                    >
                      <span
                        style={{
                          height: '0',
                          width: '0',
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '10px solid white',
                          rotate: '-90deg',
                          marginLeft: '3px',
                        }}
                      ></span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
