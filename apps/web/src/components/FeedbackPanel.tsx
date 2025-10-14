import { useState } from 'react';
import { useTranslations } from '../lib/language';
import { useSettings } from '../lib/settings';
import { useToast } from '../components/Toast';

export default function FeedbackPanel() {
  const translations = useTranslations();
  const settings = useSettings();
  const { addToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      addToast('Please enter some feedback before submitting.', 'warning');
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
      
      // For Netlify Dev or production, submit to Netlify Forms
      console.log('🌐 Submitting via Netlify Forms');
      
      // Create FormData for Netlify Forms
      const formData = new FormData();
      formData.append('form-name', 'feedback');
      formData.append('message', feedback.trim());
      formData.append('theme', settings.theme || 'light');
      formData.append('timestamp', new Date().toISOString());
      
      console.log('📤 Form data:', {
        'form-name': 'feedback',
        message: feedback.trim(),
        theme: settings.theme || 'light',
        timestamp: new Date().toISOString()
      });
      
      // Submit to Netlify Forms
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Response error:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);
      
      console.log('✅ Feedback submitted successfully via Netlify Forms');
      addToast('Thanks for sharing! Your thoughts have been received. 💭', 'success');
      setFeedback('');
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      addToast('Sorry, there was an error submitting your feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div data-rail="feedback" className="grid md:grid-cols-2 gap-4">
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
          <input type="hidden" name="theme" value={settings.theme || 'light'} />
          
          {/* Honeypot field for bot protection */}
          <div style={{ display: 'none' }}>
            <label>Don't fill this out if you're human: <input name="bot-field" /></label>
          </div>
          
          <textarea
            name="message"
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
              className="btn"
              disabled={isSubmitting || !feedback.trim()}
            >
              {isSubmitting ? 'Sending...' : translations.sendFeedback}
            </button>
          </div>
        </form>
      </div>
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{translations.whatsComing}</h3>
        <ul className="text-xs list-disc ml-5 space-y-1" style={{ color: 'var(--muted)' }}>
          <li>{translations.betterRecommendations}</li>
          <li>{translations.episodeUpNextWithDates}</li>
          <li>{translations.shareListsWithFriends}</li>
        </ul>
      </div>
    </div>
  );
}
