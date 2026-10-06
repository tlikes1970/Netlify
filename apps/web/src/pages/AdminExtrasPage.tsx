import { useState } from "react";
import { useAdminRole } from "../hooks/useAdminRole";
import { isMobileNow } from "../lib/isMobile";
import AdminFullAccess from "../components/admin/AdminFullAccess";
import AdminUserManagement from "../components/admin/AdminUserManagement";
import { t, useLanguage } from "../lib/language";

/** Production support tools only; moderation demos have been retired. */
export default function AdminExtrasPage({isMobile: mobile}: {isMobile?: boolean} = {}) {
  useLanguage();
  const {isAdmin} = useAdminRole();
  const [section,setSection] = useState('access');
  const isMobile = mobile ?? isMobileNow();
  if (!isAdmin) return null;
  const options = [{id:'access',label:t('adminAccessTitle')},{id:'roles',label:t('adminRolesTitle')}];
  return <div className="w-full min-w-0 space-y-4">
    <h3 className="text-xl font-semibold">{options.find(item=>item.id===section)?.label}</h3>
    {isMobile ? <select aria-label={t('adminToolsLabel')} value={section} onChange={event=>setSection(event.target.value)} className="w-full min-h-[44px] max-w-sm rounded-lg border px-3" style={{background:'var(--card)',color:'var(--text)',borderColor:'var(--line)'}}>
      {options.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </select> : <div className="flex flex-wrap gap-2" aria-label={t('adminToolsLabel')}>
      {options.map(item=><button type="button" key={item.id} aria-pressed={section===item.id} onClick={()=>setSection(item.id)} className="min-h-[44px] px-4 py-2 rounded-lg border" style={{background:section===item.id?'var(--accent)':'var(--card)',color:section===item.id?'white':'var(--text)',borderColor:'var(--line)'}}>{item.label}</button>)}
    </div>}
    {section==='access'?<AdminFullAccess/>:<AdminUserManagement/>}
  </div>;
}
