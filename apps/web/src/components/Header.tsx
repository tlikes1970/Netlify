import { useTranslations } from '../lib/language';

export default function Header({ user, onLoginToggle }: { user: { name: string; loggedIn: boolean }, onLoginToggle: () => void }) {
  const translations = useTranslations();
  
  const snark = [
    translations.procrastinatingProductively,
    translations.curatingYourIndecision,
    translations.becauseTimeIsAnIllusion,
    translations.cinemaNowWithCommitmentIssues,
    translations.yourBacklogCalledItsGrowing
  ];
  const quip = snark[(Date.now() / (1000 * 15) | 0) % snark.length]; // rotates every ~15s

  return (
    <header className="w-full bg-black/90 backdrop-blur border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 grid grid-cols-3 items-center">
        {/* Left: user + snark */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="font-medium text-neutral-200">{user.name || translations.guest}</span>
          <span aria-hidden>•</span>
          <span className="hidden sm:inline">{quip}</span>
        </div>

        {/* Middle: app name */}
        <div className="text-center">
          <div className="text-base font-semibold tracking-wide text-neutral-100">Flicklet</div>
        </div>

        {/* Right: auth */}
        <div className="flex justify-end">
          <button className="btn" onClick={onLoginToggle}>{user.loggedIn ? translations.logOut : translations.logIn}</button>
        </div>
      </div>
    </header>
  );
}
