'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { AICompanionProps } from '@/lib/types';

// Extended props to include modal functionality
interface AICompanionModalProps extends AICompanionProps {
  isOpen: boolean;
  onClose: () => void;
  crossRefText?: string;
  crossRefReference?: string;
}

export default function AICompanion({
  selectedVerses,
  selectedCrossRefs,
  onSubmitObservation,
  aiResponse,
  conversation_history,
  isOpen,
  onClose,
  crossRefText,
  crossRefReference,
}: AICompanionModalProps) {
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [observation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !observation.trim() ||
      selectedVerses.length === 0 ||
      selectedCrossRefs.length === 0
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitObservation(observation.trim());
      setObservation(''); // Clear the input after successful submission
    } catch (error) {
      console.error('Error submitting observation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedVerseDisplay = () => {
    return selectedVerses
      .map(verse => {
        // Convert "Matthew.2.1" to "Matthew 2:1"
        const parts = verse.split('.');
        if (parts.length >= 3) {
          return `${parts[0]} ${parts[1]}:${parts[2]}`;
        }
        return verse;
      })
      .join(', ');
  };

  const getSelectedRefsDisplay = () => {
    return selectedCrossRefs
      .map(ref => {
        // Convert reference format to display format
        const parts = ref.split('.');
        if (parts.length >= 3) {
          return `${parts[0]} ${parts[1]}:${parts[2]}`;
        }
        return ref;
      })
      .join(', ');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal content - matching Figma design */}
        <div
          className="bg-white rounded-[24px] w-full max-w-[518px] max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Cross-reference display section */}
          <div className="border-t-[12px] border-[#403e3e] rounded-t-[24px] pt-8 px-6">
            {/* Reference title */}
            <h3
              className="text-[24px] font-bold text-[#403e3e] underline mb-4"
              style={{
                fontFamily: 'Calibri, sans-serif',
                lineHeight: '1.4',
                textUnderlinePosition: 'from-font',
              }}
            >
              {crossRefReference || 'Cross Reference'}
            </h3>

            {/* Reference text */}
            <div
              className="text-[24px] text-[#403e3e] mb-0"
              style={{ fontFamily: 'Calibri, sans-serif', lineHeight: '1.5' }}
            >
              {crossRefText ? (
                <p>
                  <span className="text-[15.48px] align-super mr-1">2</span>
                  {crossRefText}
                </p>
              ) : (
                <p className="text-gray-500 text-base">
                  Select a cross-reference to view its text
                </p>
              )}
            </div>
          </div>

          {/* AI Interaction section */}
          <div className="bg-[rgba(64,62,62,0.2)] rounded-b-[24px] p-7 mt-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h4
                className="text-[20px] font-bold text-[#403e3e]"
                style={{ fontFamily: 'Calibri, sans-serif', lineHeight: '1.4' }}
              >
                How Does This Passage Relate?
              </h4>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/50 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#403e3e]" />
              </button>
            </div>

            {/* AI response display */}
            {aiResponse && (
              <div className="mb-4 p-4 bg-white rounded-2xl text-[#403e3e]">
                <div
                  className="text-base whitespace-pre-wrap"
                  style={{ fontFamily: 'Calibri, sans-serif' }}
                >
                  {aiResponse.content}
                </div>
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  placeholder="What do you think?"
                  className="w-full h-[150px] p-4 text-[20px] text-[#403e3e] placeholder-[rgba(64,62,62,0.7)] bg-white border-2 border-[#403e3e] rounded-2xl resize-none focus:outline-none focus:border-[#403e3e]"
                  style={{ fontFamily: 'Calibri, sans-serif', fontWeight: 300 }}
                  disabled={isSubmitting}
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!observation.trim() || isSubmitting}
                  className="absolute right-3 top-3 w-9 h-9 flex items-center justify-center bg-[#403e3e] text-white rounded-full hover:bg-[#403e3e]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
