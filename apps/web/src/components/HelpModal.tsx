import React, {useEffect,useState} from "react";
import {t,useLanguage} from "../lib/language";
import {HELP_TOPICS} from "../data/helpTopics";
import {useFocusTrap} from "../lib/a11y/useFocusTrap";
import {APP_VERSION} from "../version";
interface HelpModalProps {isOpen:boolean;onClose:()=>void;}
/** Optional reference help; no first-run instruction. */
export const HelpModal: React.FC<HelpModalProps> = ({isOpen,onClose}) => {
 useLanguage();
 const [dialog,setDialog]=useState<HTMLDivElement|null>(null);
 const [active,setActive]=useState('welcome');
 const topic=HELP_TOPICS.find(item=>item.id===active) ?? HELP_TOPICS[0];
 useFocusTrap(dialog,isOpen,'[data-help-close]');
 useEffect(()=>{
  if(!isOpen)return;
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}};
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[isOpen,onClose]);
 if(!isOpen)return null;
 return <div className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-4 bg-black/50" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div ref={setDialog} role="dialog" aria-modal="true" aria-labelledby="help-modal-title" tabIndex={-1} className="w-full max-w-6xl max-h-[90dvh] flex flex-col overflow-hidden rounded-lg shadow-xl" style={{background:'var(--card)',color:'var(--text)'}}>
   <header className="flex shrink-0 items-center justify-between gap-3 p-4 border-b" style={{borderColor:'var(--line)'}}>
    <h2 id="help-modal-title" className="text-xl font-bold">{t('helpTitle')}</h2>
    <button type="button" data-help-close aria-label={t('helpClose')} onClick={onClose} className="shrink-0 min-w-[44px] min-h-[44px] text-2xl rounded focus-visible:outline">×</button>
   </header>
   <div className="md:hidden p-3 shrink-0 border-b" style={{borderColor:'var(--line)'}}>
    <label htmlFor="help-topic" className="block text-sm mb-1">{t('helpSection')}</label>
    <select id="help-topic" value={active} onChange={event=>setActive(event.target.value)} className="w-full min-w-0 min-h-[44px] rounded border px-2" style={{background:'var(--bg)',color:'var(--text)',borderColor:'var(--line)'}}>{HELP_TOPICS.map(item=><option key={item.id} value={item.id}>{t(item.title)}</option>)}</select>
   </div>
   <div className="flex flex-1 min-h-0 overflow-hidden">
    <nav aria-label={t('helpSection')} className="hidden md:block w-64 shrink-0 overflow-y-auto p-3 border-r" style={{borderColor:'var(--line)'}}>{HELP_TOPICS.map(item=><button type="button" key={item.id} aria-current={active===item.id?'true':undefined} onClick={()=>setActive(item.id)} className="w-full min-h-[44px] text-left rounded p-2 mb-1" style={{background:active===item.id?'var(--btn)':'transparent'}}>{t(item.title)}</button>)}</nav>
    <section aria-labelledby="help-topic-title" className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-4 break-words">
     <h3 id="help-topic-title" className="text-lg font-semibold">{t(topic.title)}</h3>
     {topic.paragraphs.map(key=><p key={key} className="text-sm leading-relaxed">{t(key)}</p>)}
    </section>
   </div>
   <footer className="flex items-center justify-between gap-3 p-3 border-t shrink-0" style={{borderColor:'var(--line)'}}><span className="text-sm">Flicklet {APP_VERSION}</span><button type="button" onClick={onClose} className="min-h-[44px] px-4 py-2 rounded" style={{background:'var(--accent)',color:'white'}}>{t('helpDone')}</button></footer>
  </div>
 </div>;
};
