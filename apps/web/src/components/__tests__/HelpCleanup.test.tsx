import React,{useState} from 'react';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {HelpModal} from '../HelpModal';
import {HELP_TOPICS} from '../../data/helpTopics';
import {languageManager,t} from '../../lib/language';
import {APP_VERSION} from '../../version';
beforeEach(()=>languageManager.setLanguage('en'));
afterEach(()=>{cleanup();languageManager.setLanguage('en');vi.restoreAllMocks()});
it.each(['en','es'] as const)('every current help topic renders accurate localized reference text in %s',language=>{
 languageManager.setLanguage(language);render(<HelpModal isOpen onClose={()=>{}}/>);
 expect(screen.getByRole('dialog',{name:t('helpTitle')})).toBeInTheDocument();
 for(const topic of HELP_TOPICS){fireEvent.change(screen.getByRole('combobox',{name:t('helpSection')}),{target:{value:topic.id}});expect(screen.getByRole('heading',{level:3,name:t(topic.title)})).toBeInTheDocument();for(const key of topic.paragraphs)expect(screen.getByText(t(key))).toBeInTheDocument();}
 expect(screen.getByText('Flicklet '+APP_VERSION)).toBeInTheDocument();
 expect(document.body.textContent).not.toMatch(/Goofs|FlickWord|Trivia|Pro users|Component:/);
});
it('live EN ES EN switching preserves selected help topic',()=>{
 render(<HelpModal isOpen onClose={()=>{}}/>);fireEvent.change(screen.getByRole('combobox'),{target:{value:'full-access'}});
 for(const language of ['es','en'] as const){act(()=>languageManager.setLanguage(language));expect(screen.getByRole('combobox',{name:t('helpSection')})).toHaveValue('full-access');expect(screen.getByText(t('help_full_access_0'))).toBeInTheDocument();}
});
it('meaningful initial focus, Escape and focus restoration work',()=>{
 function Harness(){const [open,setOpen]=useState(false);return <><button onClick={()=>setOpen(true)}>Open Help</button><HelpModal isOpen={open} onClose={()=>setOpen(false)}/></>}
 render(<Harness/>);const opener=screen.getByRole('button',{name:'Open Help'});opener.focus();fireEvent.click(opener);
 expect(screen.getByRole('button',{name:t('helpClose')})).toHaveFocus();fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(opener).toHaveFocus();
});
it('Tab wraps after the last dialog control',()=>{
 vi.spyOn(HTMLElement.prototype,'offsetParent','get').mockReturnValue(document.body);
 render(<HelpModal isOpen onClose={()=>{}}/>);const done=screen.getByRole('button',{name:t('helpDone')});done.focus();fireEvent.keyDown(done,{key:'Tab'});expect(screen.getByRole('button',{name:t('helpClose')})).toHaveFocus();
});

it.each(['en','es'] as const)('help has current product contracts and no retired instructions in %s',language=>{
 languageManager.setLanguage(language);
 const all=HELP_TOPICS.flatMap(topic=>[t(topic.title),...topic.paragraphs.map(key=>t(key))]).join(' ');
 expect(all).not.toMatch(/Goofs|FlickWord|Trivia|\bPro\b|Marquee Comments|Video Submissions|Submit Content|Easter eggs|observations|observaciones|Zen|condensed/i);
 expect(t('help_full_access_2')).toContain('TMDB');
 expect(t('help_full_access_2')).toContain('Extras');
 expect(t('help_full_access_0')).toContain('21');
 expect(t('help_managing_library_4')).toContain(language==='en'?'press and hold the card body':'mantén pulsado el cuerpo de la tarjeta');
 expect(t('help_managing_library_4')).toContain(language==='en'?'Custom Lists do not support reordering':'Las listas personalizadas no permiten reordenar');
 expect(t('help_custom_lists_0')).toContain('+');expect(t('help_custom_lists_0')).toContain('⋮');
 expect(t('help_account_1')).toContain(language==='en'?'Settings → Account & Profile → Delete Account':'Ajustes → Account & Profile → Eliminar cuenta');
 expect(t('help_data_sharing_2')).toContain(language==='en'?'does not delete your account':'No elimina tu cuenta');
 expect(t('help_account_2')).toContain('Google Play');
 expect(t('help_settings_customization_1')).toContain(language==='en'?'Minimal':'Mínimo');
 expect(t('help_settings_customization_1')).toContain(language==='en'?'Standard':'Estándar');
 expect(t('help_settings_customization_1')).toContain(language==='en'?'Maximum':'Máximo');
 expect(t('help_support_0')).toContain(language==='en'?'Kudos':'Felicitaciones');
 expect(t('help_support_1')).toContain(language==='en'?'2–3 business days':'2–3 días hábiles');
 expect(t('help_notifications_1')).toContain(language==='en'?'Delivery depends':'La entrega depende');
});
