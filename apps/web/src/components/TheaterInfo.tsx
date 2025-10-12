import { useTranslations } from '../lib/language';

export default function TheaterInfo() {
  const translations = useTranslations();
  
  return (
    <div className="mb-3 flex flex-col gap-1">
      <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
      <div className="text-xs text-neutral-400">
        <span className="font-medium">{translations.yourLocalTheater}</span>, 123 Example St, Your City
      </div>
    </div>
  );
}
