import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../lib/language';

export type VoiceSearchProps = {
  onVoiceResult: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
};

export default function VoiceSearch({ onVoiceResult, onError, className = '' }: VoiceSearchProps) {
  const translations = useTranslations();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition settings
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      // Handle successful recognition
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Voice recognition result:', transcript);
        
        // Clean up the transcript
        const cleanedText = transcript.trim().toLowerCase();
        
        // Add to search history
        if (cleanedText) {
          onVoiceResult(cleanedText);
        }
        
        setIsListening(false);
        setError(null);
      };
      
      // Handle recognition errors
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 Voice recognition error:', event.error);
        
        let errorMessage = 'Voice recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
        onError?.(errorMessage);
      };
      
      // Handle recognition end
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else {
      setIsSupported(false);
      setError('Voice search is not supported in this browser');
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceResult, onError]);

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice search is not supported');
      return;
    }
    
    try {
      setError(null);
      setIsListening(true);
      
      // Start recognition
      recognitionRef.current.start();
      
      // Set a timeout to stop listening after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        setError('Listening timeout. Please try again.');
      }, 10000);
      
      console.log('🎤 Started voice recognition');
    } catch (err) {
      console.error('🎤 Failed to start voice recognition:', err);
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsListening(false);
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ease-out
          hover:scale-105 active:scale-95
          ${isListening 
            ? 'bg-red-500 text-white border-red-500 animate-pulse' 
            : 'bg-card text-muted-foreground border-line hover:bg-muted hover:text-foreground'
          }
        `}
        style={{
          backgroundColor: isListening ? '#ef4444' : 'var(--card)',
          color: isListening ? '#ffffff' : 'var(--muted)',
          borderColor: isListening ? '#ef4444' : 'var(--line)'
        }}
        title={isListening ? 'Stop listening' : 'Start voice search'}
        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
          </svg>
        )}
      </button>
      
      {/* Error tooltip */}
      {error && (
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-red-500 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap"
          style={{ maxWidth: '200px' }}
        >
          {error}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
        </div>
      )}
      
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
