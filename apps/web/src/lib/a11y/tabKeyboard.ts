/** Horizontal ARIA tabs: activate and focus the destination, preserving native click behavior. */
export function handleTabKeyboard(event: {key:string;currentTarget:EventTarget|null;preventDefault:()=>void}) {
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const current=event.currentTarget as HTMLElement;
 const group=current.closest('[role="tablist"]');
 const tabs=Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? []);
 const index=tabs.indexOf(current as HTMLButtonElement);
 if(index<0||!tabs.length)return;
 const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 event.preventDefault();tabs[next].focus();tabs[next].click();
}
