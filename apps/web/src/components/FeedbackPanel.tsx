import { useState } from 'react';
import { useTranslations } from '../lib/language';
// import { useSettings } from '../lib/settings'; // Unused
import { useToast } from '../components/Toast';
import { ERROR_MESSAGES, logErrorDetails } from '../lib/errorMessages';

export default function FeedbackPanel() {
  const translations = useTranslations();
  // const settings = useSettings(); // Unused
  const { addToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      addToast('Please enter some feedback before submitting.', 'error');
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
      formData.append('theme', 'light'); // Default theme
      formData.append('timestamp', new Date().toISOString());
      
      console.log('📤 Form data:', {
        'form-name': 'feedback',
        message: feedback.trim(),
        theme: 'light', // Default theme
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
      logErrorDetails('FeedbackPanel', error, { context: 'submitFeedback' });
      addToast(ERROR_MESSAGES.saveFailed, 'error');
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
          <input type="hidden" name="theme" value="light" />
          
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
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>📝 Submit Content</h3>
        
        {/* Marquee Comments */}
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text)' }}>Marquee Comments</h4>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted)' }}>
            <p>• Keep comments under 100 characters</p>
            <p>• Use feedback form on the left</p>
            <p>• Subject: "Marquee Comment: [Show Name]"</p>
            <p>• Include your comment in the message body</p>
          </div>
        </div>

        {/* Video Submissions */}
        <div>
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text)' }}>🎬 Video Submissions</h4>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted)' }}>
            <p>• Max file size: 100MB</p>
            <p>• Formats: MP4, MOV, AVI</p>
            <p>• Resolution: 720p minimum</p>
            <p>• Duration: 30 seconds - 5 minutes</p>
            <p>• Email: <strong>support@flickletapp.com</strong></p>
            <p>• Subject: "Video Submission: [Show Name] - [Type]"</p>
            <p>• Include: Show name, video type, your username</p>
          </div>
        </div>
      </div>
    </div>
  );
}
