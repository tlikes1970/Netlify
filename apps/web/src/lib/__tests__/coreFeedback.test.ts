import {beforeEach, expect, it, vi} from 'vitest';
import {changeLanguage, t} from '../language';
import {setPrimaryStatus} from '../statusTransitions';
import {confirmRemoveShow} from '../confirmRemoveShow';
const state=vi.hoisted(()=>({toast:vi.fn(),move:vi.fn(),confirm:vi.fn(async()=>false)}));
vi.mock('../auth',()=>({authManager:{getCurrentUser:()=>null}}));
vi.mock('../readOnlyGuard',()=>({guardMutation:()=>true,isMutationBlocked:()=>false}));
vi.mock('../restoreBarrier',()=>({isRestoring:()=>false}));
vi.mock('../tmdb',()=>({getTVShowDetails:vi.fn()}));
vi.mock('../storage',()=>({Library:{has:()=>true,getCurrentList:()=> 'not',move:state.move,remove:vi.fn()}}));
vi.mock('../toastBridge',()=>({getGlobalToastCallback:()=>state.toast}));
vi.mock('@/state/confirm',()=>({confirmAction:state.confirm}));
beforeEach(()=>vi.clearAllMocks());
it.each(['en','es'] as const)('%s live status feedback preserves title, status identity, and undo',lang=>{
 changeLanguage(lang);const item={id:'42',mediaType:'movie' as const,title:'My original title'};
 for(const [target,key] of [['watching','coreWatching'],['wishlist','coreWant'],['watched','coreWatched']] as const){
  setPrimaryStatus(item,target,{feedback:true});expect(state.move).toHaveBeenLastCalledWith('42','movie',target);
  expect(state.toast).toHaveBeenLastCalledWith(t('coreMoved',{title:item.title,status:t(key)}),'success',expect.objectContaining({label:t('coreUndo'),onClick:expect.any(Function)}));
 }
 state.toast.mock.lastCall![2].onClick();expect(state.move).toHaveBeenLastCalledWith('42','movie','not');
});
it.each(['en','es'] as const)('%s neutral removal confirmation is translated and cancellation is preserved',async lang=>{
 changeLanguage(lang);expect(await confirmRemoveShow()).toBe(false);
 expect(state.confirm).toHaveBeenCalledWith({title:t('coreRemoveTitle'),body:t('coreRemoveBody'),confirmLabel:t('coreRemove'),cancelLabel:t('coreCancel'),destructive:true});
 expect(state.move).not.toHaveBeenCalled();
});
