import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConversationTurn,
  CrossReference,
  VersesAPIResponse,
} from '@/lib/types';
interface CrossTrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceVerse?: CrossReference;
  anchorRef?: string;
}

export default function CrossTrailsModal({
  isOpen,
  onClose,
  referenceVerse,
  anchorRef,
}: CrossTrailsModalProps) {
  const [conversationHistory, setConversationHistory] = useState<
    ConversationTurn[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerseLoading, setIsVerseLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const conversationRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [verse, setVerse] = useState<VersesAPIResponse | null>(null);

  const onHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const question = formData.get('question') as string;

    if (!question.trim()) {
      console.log('No question provided');
      return;
    }

    // Prevent submission if verse is still loading
    if (isVerseLoading || !verse) {
      console.log('Verse is still loading, please wait');
      return;
    }

    // Add user's question to conversation history
    const userTurn: ConversationTurn = {
      type: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setConversationHistory(prev => [...prev, userTurn]);
    setIsLoading(true);

    // Clear the textarea
    (e.target as HTMLFormElement).reset();

    try {
      // Use the provided reference verse or fallback to demo data
      const crossReference = referenceVerse || {
        reference: 'Acts.20.16',
        display_ref: 'Acts 20.16',
        text: 'On the day of Pentecost all the believers were meeting together in one place.',
        anchor_ref: 'Acts.2.1',
        connection: {
          categories: ['ritual_practice', 'elaboration'],
          strength: 0.9,
          type: 'ritual_practice' as const,
          explanation:
            'Paul had decided to sail on past Ephesus, for he didn\u2019t want to spend any more time in the province',
        },
        context: {
          book: 'Acts',
          chapter: 20,
          verse: 16,
        },
      };

      crossReference.anchor_ref = anchorRef;
      // Use the current verse state to ensure we have the latest data
      crossReference.text = verse.verses[0]?.text || '';
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
        // Add AI response to conversation history
        const assistantTurn: ConversationTurn = {
          type: 'assistant',
          content: data.data.analysis,
          timestamp: new Date().toISOString(),
        };

        setConversationHistory(prev => [...prev, assistantTurn]);
      }
    } catch (error) {
      console.error('Error analyzing cross-reference:', error);

      // Add error message to conversation history
      const errorTurn: ConversationTurn = {
        type: 'assistant',
        content:
          'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setConversationHistory(prev => [...prev, errorTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearHistory = () => {
    setConversationHistory([]);
    messageRefs.current = [];
  };

  const fetchReferenceVerse = useCallback(async () => {
    if (!referenceVerse?.reference) {
      setIsVerseLoading(false);
      return;
    }

    setIsVerseLoading(true);
    try {
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      const response = await fetch(
        `/api/verses?reference=${referenceVerse.reference}&_t=${timestamp}`,
        {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVerse(data);
    } catch (error) {
      console.error('Error fetching verse:', error);
      setVerse(null);
    } finally {
      setIsVerseLoading(false);
    }
  }, [
    referenceVerse?.reference,
    referenceVerse?.display_ref,
    referenceVerse?._timestamp,
  ]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear all state including verse data to prevent flash
      setVerse(null);
      setConversationHistory([]);
      setIsLoading(false);
      setExpanded(true);
      messageRefs.current = [];

      // Fetch new verse data
      fetchReferenceVerse();
    } else {
      // Clean up when modal closes
      setVerse(null);
      setConversationHistory([]);
    }
  }, [isOpen, fetchReferenceVerse]);

  // Separate effect to handle reference changes when modal is already open
  useEffect(() => {
    if (isOpen && referenceVerse?.reference) {
      // Clear all data immediately when reference changes
      setVerse(null);
      setConversationHistory([]);
      setIsLoading(false);

      // Fetch new verse data
      fetchReferenceVerse();
    }
  }, [
    referenceVerse?.reference,
    referenceVerse?.display_ref,
    referenceVerse?._timestamp,
    isOpen,
    fetchReferenceVerse,
  ]);

  // Ensure messageRefs array is properly sized
  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(
      0,
      conversationHistory.length
    );
  }, [conversationHistory.length]);

  // Auto-scroll behavior: show beginning of new AI responses, bottom for user messages
  useEffect(() => {
    if (conversationRef.current && conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      const lastMessageIndex = conversationHistory.length - 1;

      if (lastMessage.type === 'assistant' && !isLoading) {
        // For AI responses, scroll to show the beginning of the new response
        setTimeout(() => {
          const lastMessageElement = messageRefs.current[lastMessageIndex];
          if (lastMessageElement) {
            lastMessageElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      } else if (lastMessage.type === 'user') {
        // For user messages, scroll to bottom as they're typically short
        if (conversationRef.current) {
          conversationRef.current.scrollTop =
            conversationRef.current.scrollHeight;
        }
      }
    }
  }, [conversationHistory, isLoading]);

  // Don't render anything if modal is closed
  if (!isOpen) {
    return null;
  }

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
            {/* Loading indicator */}
            {isVerseLoading && (
              <>
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
                  Verse
                </div>
                <div
                  style={{
                    fontFamily: 'Calibri, sans-serif',
                    fontSize: '17px',
                    color: '#403e3e',
                    marginBottom: '0',
                  }}
                >
                  <span style={{ fontWeight: 400, fontStyle: 'italic' }}>
                    Reference verse is loading...
                  </span>
                </div>
              </>
            )}

            {!isVerseLoading && (
              <>
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
                  {verse && !isVerseLoading && (
                    <>
                      {verse?.book} {verse?.chapter}
                      {':'}
                      {verse?.verses[0]?.verse_number}
                    </>
                  )}
                  {isVerseLoading && (
                    <span style={{ color: '#999' }}>Loading...</span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: 'Calibri, sans-serif',
                    fontSize: '17px',
                    color: '#403e3e',
                    marginBottom: '0',
                  }}
                >
                  <span style={{ fontWeight: 400 }}>
                    {verse && !isVerseLoading && <>{verse?.verses[0].text}</>}
                    {isVerseLoading && (
                      <span style={{ color: '#999' }}>
                        Loading verse text...
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Section: How Does This Passage Relate? */}
          <div style={{ background: '#e5e5e5', padding: '18px 32px 2px 32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              {expanded && conversationHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#666',
                    cursor: 'pointer',
                    fontFamily: 'Calibri, sans-serif',
                  }}
                  title="Clear conversation history"
                >
                  Clear
                </button>
              )}
            </div>

            {expanded && (
              <>
                {/* Conversation History */}
                <div
                  ref={conversationRef}
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '12px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ccc transparent',
                  }}
                >
                  {conversationHistory.length === 0 && !isLoading && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#999',
                        fontStyle: 'italic',
                        fontSize: '14px',
                        fontFamily: 'Calibri, sans-serif',
                      }}
                    >
                      Start a conversation with the Trail Guide about how these
                      passages relate to each other.
                    </div>
                  )}
                  {conversationHistory.map((turn, index) => (
                    <div
                      key={index}
                      ref={el => {
                        messageRefs.current[index] = el;
                      }}
                      style={{
                        background:
                          turn.type === 'user' ? '#f8f9fa' : 'transparent',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '8px',
                        fontFamily: 'Calibri, sans-serif',
                        fontSize: '15px',
                        color: '#403e3e',
                        border:
                          turn.type === 'user' ? '1px solid #e9ecef' : 'none',
                        marginLeft: turn.type === 'user' ? '20px' : '0px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: turn.type === 'user' ? '#666' : '#ff6a32',
                          }}
                        >
                          {turn.type === 'user' ? 'You asked:' : 'Trail Guide:'}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          {formatTimestamp(turn.timestamp)}
                        </div>
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: turn.content.replace(/\n/g, '<br>'),
                        }}
                      />
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div
                      style={{
                        background: 'transparent',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        fontFamily: 'Calibri, sans-serif',
                        fontSize: '15px',
                        color: '#403e3e',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#ff6a32',
                          marginBottom: '4px',
                        }}
                      >
                        Trail Guide:
                      </div>
                      <div style={{ fontStyle: 'italic', color: '#888' }}>
                        Trail Guide is thinking...
                      </div>
                    </div>
                  )}
                </div>

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
                      disabled={isLoading}
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
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      placeholder={
                        isLoading
                          ? 'Trail Guide is thinking...'
                          : 'Chat with the Trail Guide'
                      }
                    />
                    <button
                      type="submit"
                      disabled={isLoading || isVerseLoading || !verse}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background:
                          isLoading || isVerseLoading || !verse
                            ? '#ccc'
                            : '#403e3e',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '16px',
                        cursor:
                          isLoading || isVerseLoading || !verse
                            ? 'not-allowed'
                            : 'pointer',
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
