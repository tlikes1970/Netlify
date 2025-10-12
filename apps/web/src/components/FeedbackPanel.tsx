import { useTranslations } from '../lib/language';

export default function FeedbackPanel() {
  const translations = useTranslations();
  
  return (
    <div data-rail="feedback" className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{translations.tellUsWhatToImprove}</h3>
        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <textarea
            className="w-full h-28 rounded-2xl p-3 text-sm"
            style={{ 
              backgroundColor: 'var(--btn)', 
              borderColor: 'var(--line)', 
              color: 'var(--text)',
              border: '1px solid'
            }}
            placeholder={translations.typeYourFeedback}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn">{translations.sendFeedback}</button>
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
