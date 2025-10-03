'use client'

import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Sparkles } from 'lucide-react'
import { AICompanionProps } from '@/lib/types'

export default function AICompanion({
  selectedVerses,
  selectedCrossRefs,
  onSubmitObservation,
  aiResponse,
  conversation_history
}: AICompanionProps) {
  const [observation, setObservation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [observation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!observation.trim() || selectedVerses.length === 0 || selectedCrossRefs.length === 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmitObservation(observation.trim())
      setObservation('') // Clear the input after successful submission
    } catch (error) {
      console.error('Error submitting observation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedVerseDisplay = () => {
    return selectedVerses.map(verse => {
      // Convert "Matthew.2.1" to "Matthew 2:1"
      const parts = verse.split('.')
      if (parts.length >= 3) {
        return `${parts[0]} ${parts[1]}:${parts[2]}`
      }
      return verse
    }).join(', ')
  }

  const getSelectedRefsDisplay = () => {
    return selectedCrossRefs.map(ref => {
      // Convert reference format to display format
      const parts = ref.split('.')
      if (parts.length >= 3) {
        return `${parts[0]} ${parts[1]}:${parts[2]}`
      }
      return ref
    }).join(', ')
  }

  return (
    <div className="ai-companion fade-in">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-text-primary">
          Explore Connections
        </h3>
        <Sparkles className="w-4 h-4 text-primary-400" />
      </div>

      {/* Context summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
        <div className="space-y-1">
          <div>
            <span className="font-medium text-gray-600">Selected verses:</span>{' '}
            <span className="text-gray-800">{getSelectedVerseDisplay()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Cross-references:</span>{' '}
            <span className="text-gray-800">{getSelectedRefsDisplay()}</span>
          </div>
        </div>
      </div>

      {/* Conversation history */}
      {conversation_history.length > 0 && (
        <div className="mb-4 space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
          {conversation_history.map((turn, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                turn.type === 'user'
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-sm">
                <div className={`font-medium mb-1 ${
                  turn.type === 'user' ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {turn.type === 'user' ? 'Your observation:' : 'AI Insight:'}
                </div>
                <div className="text-gray-800 whitespace-pre-wrap">
                  {turn.content}
                </div>
                {turn.sources && turn.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Sources:</div>
                    <div className="text-xs text-gray-600 space-x-2">
                      {turn.sources.map((source, idx) => (
                        <span key={idx} className="bg-gray-200 px-1 py-0.5 rounded">
                          {source.reference}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current AI response (streaming) */}
      {aiResponse && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-gray-700 mb-1 flex items-center space-x-2">
              <span>AI Insight:</span>
              {aiResponse.streaming && (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-150"></div>
                </div>
              )}
            </div>
            <div className="ai-response text-gray-800 whitespace-pre-wrap">
              {aiResponse.content}
            </div>
            {aiResponse.sources && aiResponse.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Sources:</div>
                <div className="text-xs text-gray-600 space-x-2">
                  {aiResponse.sources.map((source, idx) => (
                    <span key={idx} className="bg-gray-200 px-1 py-0.5 rounded">
                      {source.reference}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Prompt */}
        <div className="text-sm font-medium text-gray-700">
          What connections do you see?
        </div>

        {/* Textarea input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Share your thoughts about how these passages connect..."
            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
            rows={3}
            disabled={isSubmitting}
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {observation.length}/500
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            AI will provide insights grounded in biblical text and trusted resources
          </div>

          <button
            type="submit"
            disabled={!observation.trim() || isSubmitting || selectedVerses.length === 0 || selectedCrossRefs.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Getting insights...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Explore</span>
              </>
            )}
          </button>
        </div>

        {/* Requirements notice */}
        {(selectedVerses.length === 0 || selectedCrossRefs.length === 0) && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
            Select both verses and cross-references to explore connections
          </div>
        )}
      </form>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500 leading-relaxed">
        <strong>How it works:</strong> Share your observations about the connections you see between the selected verses and cross-references.
        The AI will provide insights grounded in biblical text, cross-reference metadata, and trusted study resources.
      </div>
    </div>
  )
}