import { useState } from 'react';
import { useTranslations } from '../lib/language';
// import { useSettings } from '../lib/settings'; // Unused
import { useToast } from '../components/Toast';
import { logErrorDetails } from '../lib/errorMessages';

function feedbackSubmitUrl(): string {
  const base = (import.meta.env.VITE_PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
  return base ? `${base}/` : '/';
}

export default function FeedbackPanel() {
  const translations = useTranslations();
  // const settings = useSettings(); // Unused
  const { addToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      addToast(translations.feedbackRequired, 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For testing purposes, always try to submit (comment out for production)
      // if (window.location.hostname === 'localhost' && window.location.port !== '8888') {
      //   console.log('🏠 Vite dev server mode - showing success message');
      //   addToast('Thanks for sharing! Your thoughts have been received. 💭 (Vite dev mode - will work in production)', 'success');
      //   setFeedback('');
      //   return;
      // }
      
      const payload = new URLSearchParams({
        'form-name': 'feedback',
        'bot-field': '',
        message: feedback.trim(),
        theme: 'light',
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(feedbackSubmitUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });

      if (!response.ok) {
        const raw = await response.text();
        console.error('❌ Feedback form error:', response.status, raw);
        throw new Error(`HTTP ${response.status}`);
      }
      addToast(translations.feedbackSuccess, 'success');
      setFeedback('');
      
    } catch (error) {
      logErrorDetails('FeedbackPanel', error, { context: 'submitFeedback' });
      addToast(translations.feedbackFailure, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div data-rail="feedback" className="grid md:grid-cols-2 gap-4 min-w-0 break-words">
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{translations.tellUsWhatToImprove}</h3>
        {/* Netlify Forms - Automatic email notifications */}
        <form 
          name="feedback"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="feedback" />
          <input type="hidden" name="theme" value="light" />
          
          {/* Honeypot field for bot protection */}
          <div style={{ display: 'none' }}>
            <label>Don't fill this out if you're human: <input name="bot-field" /></label>
          </div>
          
          <textarea
            name="message"
            aria-label={translations.feedbackInput}
            className="w-full h-28 rounded-2xl p-3 text-sm"
            style={{ 
              backgroundColor: 'var(--btn)', 
              borderColor: 'var(--line)', 
              color: 'var(--text)',
              border: '1px solid'
            }}
            placeholder={translations.typeYourFeedback}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <div className="flex gap-2">
            <button 
              type="submit" 
              className="btn min-h-[44px]"
              disabled={isSubmitting || !feedback.trim()}
            >
              {isSubmitting ? translations.feedbackSending : translations.sendFeedback}
            </button>
          </div>
        </form>
      </div>
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{translations.feedbackSupportHeading}</h3>
        <div className="text-sm space-y-2" style={{ color: 'var(--muted)' }}>
          <p>{translations.feedbackSupportIntro}</p>
          <ul className="list-disc pl-4 space-y-1">
            {[
              [translations.feedbackComments, translations.feedbackCommentsDescription],
              [translations.feedbackSuggestions, translations.feedbackSuggestionsDescription],
              [translations.feedbackKudos, translations.feedbackKudosDescription],
              [translations.feedbackBugs, translations.feedbackBugsDescription],
              [translations.feedbackTechnical, translations.feedbackTechnicalDescription],
              [translations.feedbackHelp, translations.feedbackHelpDescription],
            ].map(([label, description]) => (
              <li key={label}><strong style={{ color: 'var(--text)' }}>{label}:</strong> {description}</li>
            ))}
          </ul>
          <h4 className="font-semibold" style={{ color: 'var(--text)' }}>{translations.feedbackIncludeHeading}</h4>
          <p>{translations.feedbackIncludeDetails}</p>
          <p>{translations.feedbackResponseTime}</p>
        </div>
      </div>
    </div>
  );
}
