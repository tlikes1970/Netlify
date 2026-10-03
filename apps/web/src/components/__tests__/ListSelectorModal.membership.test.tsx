import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListSelectorModal from '../ListSelectorModal';
import { Library } from '@/lib/storage';
vi.mock('@/lib/auth',()=>({authManager:{getCurrentUser:()=>null}}));
vi.mock('@/lib/readOnlyGuard',()=>({guardMutation:()=>true}));
vi.mock('@/lib/language',async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),useTranslations:()=>({})}));
vi.mock('@/hooks/useEntitlements',()=>({useEntitlements:()=>({hasFullAccess:true})}));
vi.mock('@/components/UpgradeToProCTA',()=>({UpgradeToProCTA:()=>null}));
vi.mock('@/lib/events',()=>({emit:vi.fn()}));
vi.mock('@/lib/customLists',()=>{
  const lists=[{id:'a',name:'List A',itemCount:1},{id:'b',name:'List B',itemCount:0}];
  return {useCustomLists:()=>({customLists:lists,maxLists:3}),customListManager:{getListById:(id:string)=>lists.find(l=>l.id===id),setSelectedList:vi.fn(),updateItemCount:vi.fn()}};
});
const item={id:'1',mediaType:'movie' as const,title:'Tracked title'};
beforeEach(()=>{localStorage.clear();window.dispatchEvent(new Event('library:cleared'));Library.upsert(item,'watching');Library.addToCustomList(item,'a')});
describe('add-only list picker membership semantics',()=>{
  it('identifies active membership and adds another without an exclusive move',()=>{
    const close=vi.fn();render(<ListSelectorModal isOpen onClose={close} item={item}/>);
    expect(screen.getByText('Already added').closest('label')).toHaveTextContent('List A');
    fireEvent.click(screen.getByRole('radio',{name:/List B/}).closest('label')!);
    fireEvent.click(screen.getByRole('button',{name:'Add to Custom List'}));
    expect(Library.getEntry('1','movie')).toMatchObject({list:'watching',customListIds:['a','b']});expect(close).toHaveBeenCalledOnce();
    Library.removeFromCustomList('1','movie','a');expect(Library.getEntry('1','movie')).toMatchObject({list:'watching',customListIds:['b']});
  });
  it('retains the existing already-added confirmation and status',()=>{
    render(<ListSelectorModal isOpen onClose={()=>{}} item={item}/>);
    fireEvent.click(screen.getByRole('radio',{name:/List A/}).closest('label')!);fireEvent.click(screen.getByRole('button',{name:'Add to Custom List'}));
    expect(screen.getByText('Item Already Exists')).toBeInTheDocument();expect(Library.getEntry('1','movie')).toMatchObject({list:'watching',customListIds:['a']});
  });
});
