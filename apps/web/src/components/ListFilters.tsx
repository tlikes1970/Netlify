import { t as coreText, useLanguage } from "@/lib/language";
import { networkOptions } from '@/lib/tabState';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type FilterType = 'all' | 'movie' | 'tv';
// Preserve the legacy persisted property; these names describe networks in the UI.
export interface ListFiltersState { type: FilterType; providers: string[]; }
interface ListFiltersProps {
  value: ListFiltersState;
  onChange: (filters: ListFiltersState) => void;
  availableProviders: string[];
  disabled?: boolean;
  inlineNetworks?: boolean;
}

export default function ListFilters({value,onChange,availableProviders,disabled=false,inlineNetworks=false}: ListFiltersProps) {
  useLanguage();
  const id=useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const popup=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState({left:8,top:8,width:240,maxHeight:256});
  const close = (restoreFocus=false) => { setOpen(false); if(restoreFocus) trigger.current?.focus(); };
  useLayoutEffect(() => {
    if(!open) return;
    const place=() => {
      const rect=trigger.current?.getBoundingClientRect(); if(!rect) return;
      const viewport=document.documentElement.getBoundingClientRect();
      const width=Math.min(280,(document.documentElement.clientWidth || window.innerWidth)-16);
      const below=window.innerHeight-rect.bottom-12;
      const maxHeight=Math.max(44,Math.min(256, below>=160 ? below : rect.top-12));
      const top=below>=160 ? rect.bottom+4 : Math.max(8,rect.top-maxHeight-4);
      setPosition({left:Math.max(8,Math.min(rect.left-viewport.left,(document.documentElement.clientWidth || window.innerWidth)-width-8)),top,width,maxHeight});
    };
    place();
    popup.current?.querySelector<HTMLInputElement>('input')?.focus();
    window.addEventListener('resize',place);
    window.addEventListener('scroll',place,true);
    return () => {window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[open]);
  const options=networkOptions([...availableProviders,...value.providers]);
  const selected=(name:string) => value.providers.some(p=>p.toLowerCase()===name.toLowerCase());
  return <div className="library-type-network-controls flex items-center gap-2 flex-wrap">
    <div className="library-type-control flex items-center gap-2">
      <label htmlFor={`${id}-type`} className="text-sm" style={{color:'var(--muted)'}}>{coreText("coreType")}</label>
      <select id={`${id}-type`} value={value.type} disabled={disabled} onChange={e=>onChange({...value,type:e.target.value as FilterType})}
        className="library-filter-control px-2 rounded text-sm border" style={{backgroundColor:'var(--menu-bg)',color:'var(--menu-text)',borderColor:'var(--menu-border)'}}>
        <option value="all">{coreText("coreAll")}</option><option value="movie">{coreText("coreMovie")}</option><option value="tv">{coreText("coreTVShort")}</option>
      </select>
    </div>
    {inlineNetworks && options.length > 0 && <fieldset className="w-full min-w-0"><legend>{coreText('coreNetwork')}</legend>{options.map(name => <label key={name} className="flex items-center gap-2 min-h-[44px] min-w-0"><input type="checkbox" checked={selected(name)} disabled={disabled} onChange={() => onChange({...value,providers:selected(name)?value.providers.filter(p=>p.toLowerCase()!==name.toLowerCase()):[...value.providers,name]})}/><span className="min-w-0" style={{overflowWrap:'anywhere'}}>{name}</span></label>)}</fieldset>}
    {!inlineNetworks && (availableProviders.length>0 || value.providers.length>0) && <button type="button" ref={trigger} disabled={disabled}
      aria-expanded={open} aria-haspopup="dialog" aria-controls={`${id}-networks`} onClick={()=>setOpen(!open)}
      className="library-network-control library-filter-control px-2 rounded text-sm border" style={{backgroundColor:value.providers.length?'var(--accent-primary)':'var(--menu-bg)',color:value.providers.length?'white':'var(--menu-text)'}}>{coreText("coreNetwork")}{value.providers.length ? ` (${value.providers.length})` : ''} <span aria-hidden="true">{open?'▲':'▼'}</span>
    </button>}
    {open && !disabled && createPortal(<>
      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={()=>close(true)}/>
      <div ref={popup} id={`${id}-networks`} role="dialog" aria-label={coreText("coreSelectNetworks")}
        className="fixed z-50 rounded-lg shadow-lg overflow-y-auto p-2" style={{...position,boxSizing:'border-box',backgroundColor:'var(--menu-bg)',color:'var(--menu-text)',border:'1px solid var(--menu-border)'}}
        onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}}}
        onBlur={e=>{if(e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget!==trigger.current) close();}}>
        <p className="text-xs mb-2">{coreText("coreSelectNetworksColon")}</p>
        {options.map(name=><label key={name.toLowerCase()} className="library-filter-control flex items-center gap-2 p-2 rounded cursor-pointer">
          <input type="checkbox" checked={selected(name)} onChange={()=>onChange({...value,providers:selected(name)?value.providers.filter(p=>p.toLowerCase()!==name.toLowerCase()):[...value.providers,name]})}/>
          <span className="text-sm min-w-0" style={{overflowWrap:'anywhere'}}>{name}</span>
        </label>)}
        {value.providers.length>0 && <button type="button" className="library-filter-control w-full text-sm border rounded" onClick={()=>onChange({...value,providers:[]})}>{coreText("coreClearNetworks")}</button>}
        <button type="button" className="library-filter-control w-full text-sm" onClick={()=>close(true)}>{coreText("coreDone")}</button>
      </div>
    </>,document.body)}
  </div>;
}
