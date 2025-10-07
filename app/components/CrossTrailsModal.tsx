import React from 'react';

interface CrossTrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function CrossTrailsModal({ isOpen, onClose, children }: CrossTrailsModalProps) {
  if (!isOpen) return null;

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
          maxWidth: '90vw',
          padding: '0',
          position: 'relative',
          fontFamily: 'Inter, Calibri, sans-serif',
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
        {children}
      </div>
    </div>
  );
}
