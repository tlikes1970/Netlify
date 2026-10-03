import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ uid: "owner" as string | null, docs: {} as Record<string, any>, writes: [] as any[], cloudError: false, nativeError: false, native: true, cancel: vi.fn(), schedule: vi.fn(), commitGate: null as Promise<void> | null }));
vi.mock("../auth", () => ({ authManager: { getCurrentUser: () => m.uid ? { uid: m.uid, email: "owner@example.com" } : null, getUserSettings: async () => m.docs["users/owner"]?.settings, subscribe: () => () => undefined } }));
vi.mock("../firebaseBootstrap", () => ({ db: {}, auth: { currentUser: null } }));
vi.mock("../proConfig", () => ({ getMaxCustomLists: () => 3 }));
vi.mock("../readOnlyGuard", async () => { const { isRestoring } = await import("../restoreBarrier"); return { guardMutation: () => !isRestoring() }; });
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => m.native, getPlatform: () => "android" } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: {
 getPending: async () => ({ notifications: [{ id: 10, title: "Show", body: "Episode", extra: { flickletSeriesReminder: true }, schedule: { at: new Date(Date.now()+60000) } }, { id: 99, title: "Other", extra: {} }] }),
 cancel: async (v: unknown) => { m.cancel(v); if(m.nativeError) throw Error("native failure"); }, schedule: async (v: unknown) => m.schedule(v),
} }));
vi.mock("firebase/firestore", () => ({
 doc: (_: unknown, ...p: string[]) => p.join("/"), collection: (_: unknown, ...p: string[]) => p.join("/"), serverTimestamp: () => "now", deleteField: () => "__delete__",
 getDoc: async (path: string) => ({ exists: () => !!m.docs[path], data: () => m.docs[path] }), getDocFromServer: async (path: string) => ({ exists: () => !!m.docs[path], data: () => m.docs[path] }),
 getDocs: async (path: string) => ({ empty: !Object.keys(m.docs).some(p=>p.startsWith(path+"/")), forEach: (fn: (v:any)=>void) => Object.keys(m.docs).filter(p=>p.startsWith(path+"/")).forEach(p=>fn({id:p.split("/").at(-1),data:()=>m.docs[p]})) }),
 getDocsFromServer: async (path: string) => ({ forEach: (fn: (v: any) => void) => Object.keys(m.docs).filter(p => p.startsWith(path+"/")).forEach(p => fn({ref:p,id:p.split("/").at(-1)})) }),
 updateDoc: vi.fn(), setDoc: vi.fn(), runTransaction: vi.fn(),
 writeBatch: () => { const ops: any[] = []; return {
 update: (p:string,v:any) => ops.push(["update",p,v]), set: (p:string,v:any) => ops.push(["set",p,v]), delete: (p:string) => ops.push(["delete",p]),
 commit: async () => { if(m.commitGate) await m.commitGate; if(m.cloudError) throw Error("cloud failure"); m.writes.push(...ops);
 for(const [op,p,v] of ops) { if(op==="delete") delete m.docs[p]; else if(op==="set") m.docs[p]=v; else for(const [key,value] of Object.entries(v)) { const parts=key.split(".");let target=m.docs[p];for(const part of parts.slice(0,-1)) target=target[part]??(target[part]={});if(value==="__delete__")delete target[parts.at(-1)!];else target[parts.at(-1)!]=value; } }
 }
 }; }
}));
import { startOver } from "../startOver";
import { createBackup, restoreBackup } from "../backupPersistence";
import { DEFAULT_SETTINGS, settingsManager } from "../settings";
import { Library, flushPendingSaves } from "../storage";
import { customListManager } from "../customLists";
import { firebaseSyncManager } from "../firebaseSync";
import { notificationManager } from "../notifications";
import * as barrier from "../restoreBarrier";
import { RESTORE_JOURNAL_KEY } from "../restoreRecovery";
import { resolvePreferredName } from "../preferredName";
import { saveTabState } from "../tabState";
import { writeStoredEpisodeProgress } from "../../utils/episodeProgress";
import { languageManager } from "../language";
const entry = { id: "10", mediaType: "tv", title: "Show", list: "watching", addedAt: 1, customListIds: ["a"], userRating: 4, userNotes: "Notes", tags: ["family"], isFavorite: true };
let release: (() => void) | undefined;
const snapshot = () => Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));
beforeEach(() => {
 localStorage.clear(); m.uid="owner"; m.native=true; m.nativeError=false; m.cloudError=false; m.commitGate=null; m.writes=[]; m.cancel.mockClear(); m.schedule.mockClear();
 const settings = { ...structuredClone(DEFAULT_SETTINGS), preferredName:"TJ", username:"handle", usernamePrompted:true, pro:{isPro:true,features:{extrasAccess:true}} };
 settings.layout.theme="dark";
 m.docs={ "users/owner": { uid:"owner", email:"owner@example.com", profile:{displayName:"Google"}, settings:{...settings,fullSettings:structuredClone(settings)}, watchlists:{}, gameStats:{trivia:{games:4}} }, "users/owner/episodeProgress/10":{episodes:{S1E1:true}}, "users/owner/tabState/watching":{sort:"custom"}, "users/owner/notificationSettings/main":{showOverrides:{10:{enabled:true}}}, "users/owner/notificationSettings/old":{content:true}, "users/owner/billing/status":{isPro:true}, "users/owner/entitlements/trial":{trialStartMs:123}, "usernames/handle":{uid:"owner"} };
 localStorage.setItem("flicklet.settings.v2",JSON.stringify(settings)); localStorage.setItem("flicklet.library.v2",JSON.stringify({"tv:10":entry})); localStorage.setItem("flicklet.customLists.v2",JSON.stringify({customLists:[{id:"a",name:"A",createdAt:1,itemCount:1}]}));
 Library.reloadFromStorage(true); settingsManager.reloadAfterRestore(); window.dispatchEvent(new Event("customLists:updated"));
 for(const [key,value] of Object.entries({"episode-progress-10":'{"episodes":{"S1E1":true}}',"flk.tab.watching.sort":"custom","flk.tab.watching.order.custom":'["10:tv"]',"flicklet.onboardingCompleted":"true","flicklet.searchTipDismissed":"true","flicklet.series-reminders.v1":'{"10":{"showId":10,"title":"Show","enabled":true,"updatedAt":1}}',"flicklet.search-history":'["Show"]',"notification-log":"[]","notification-settings":'{"globalEnabled":false,"freeTierTiming":"24-hours-before","proTierTiming":2,"methods":{"inApp":true,"push":false,"email":false},"showOverrides":{"10":{"enabled":true}}}',"flickword:stats":'{"games":2}',"trivia:stats":'{"games":3}',"flickword:game-state":"{}","flickword:completed-games:2026-10-01":"[]","flicklet:forYouRows:v2:owner":'{"version":2,"rows":[{"id":"1","mainGenre":"horror","subGenre":"psychological","title":"Horror"}]}',"flicklet:v2:holidays":"[]","flicklet:v2:holidayAssignments":"{}","flicklet.trial.v1":"kept","firebase:authUser":"credentials","unrelated":"kept"}))localStorage.setItem(key,value);
 notificationManager.reloadAfterRestore();
 const begin=barrier.beginRestore;vi.spyOn(barrier,"beginRestore").mockImplementation(async()=>{release=await begin();return release;});
});
afterEach(()=>{release?.();release=undefined;vi.restoreAllMocks();});
describe("Start Over coordinated replacement",()=>{
 it("a replacement backup without language reloads the actual default instead of retaining stale Spanish",async()=>{
  languageManager.setLanguage('es');const backup=await createBackup();delete backup.local['flicklet.language.v2'];
  await restoreBackup(backup);expect(localStorage.getItem('flicklet.language.v2')).toBeNull();
  expect(languageManager.getLanguage()).toBe('en');expect(document.documentElement.lang).toBe('en');
 });
 it("Spanish backup restores device language and document semantics through the real managers",async()=>{
  languageManager.setLanguage('es');const backup=await createBackup();expect(backup.local['flicklet.language.v2']).toBe('es');
  languageManager.setLanguage('en');await restoreBackup(backup);
  expect(languageManager.getLanguage()).toBe('es');expect(document.documentElement.lang).toBe('es');
  expect(Library.getAll()[0]).toMatchObject({userNotes:'Notes',tags:['family'],customListIds:['a']});
  expect(m.docs['users/owner/billing/status']).toEqual({isPro:true});
 });
 it("Reset Settings resets actual language and document to English without deleting content",async()=>{
  m.uid=null;languageManager.setLanguage('es');const titles=Library.getAll();await settingsManager.resetToDefaults();
  expect(languageManager.getLanguage()).toBe('en');expect(document.documentElement.lang).toBe('en');
  expect(localStorage.getItem('flicklet.language.v2')).toBe('en');expect(Library.getAll()).toEqual(titles);
 });
 it("Start Over resets actual language and document to English",async()=>{
  languageManager.setLanguage('es');await startOver(vi.fn());expect(languageManager.getLanguage()).toBe('en');
  expect(document.documentElement.lang).toBe('en');expect(localStorage.getItem('flicklet.language.v2')).toBe('en');
 });
 it.each([['es','en'],['en','es']] as const)("legacy cloud %s cannot override device %s",async(cloud,device)=>{
  m.docs['users/owner'].settings.lang=cloud;languageManager.setLanguage(device);await settingsManager.loadSettingsFromFirebase('owner');
  expect(languageManager.getLanguage()).toBe(device);expect(document.documentElement.lang).toBe(device);
  expect(localStorage.getItem('flicklet.language.v2')).toBe(device);expect(m.docs['users/owner'].settings.lang).toBe(cloud);
 });
 it.each(["owner",null])("clears content and mounted managers while preserving identity/access for %s",async(uid)=>{
  m.uid=uid;const preserved=structuredClone(m.docs);const reload=vi.fn(()=>{expect(Library.getAll()).toEqual([]);expect(customListManager.getUserLists().customLists).toEqual([]);expect(barrier.isRestoring()).toBe(true);});await startOver(reload);
  expect(reload).toHaveBeenCalledOnce();expect(localStorage.getItem("episode-progress-10")).toBeNull();expect(localStorage.getItem("flk.tab.watching.sort")).toBeNull();expect(localStorage.getItem("flickword:stats")).toBeNull();expect(localStorage.getItem("flicklet.onboardingCompleted")).toBeNull();expect(localStorage.getItem("flicklet.series-reminders.v1")).toBeNull();
  const settings=JSON.parse(localStorage.getItem("flicklet.settings.v2")!);expect(settings).toMatchObject({preferredName:"",username:"handle",pro:{isPro:true},layout:{theme:DEFAULT_SETTINGS.layout.theme}});expect(resolvePreferredName(settings)).toBe("");expect(notificationManager.loadSettings().showOverrides).toEqual({});expect(localStorage.getItem("firebase:authUser")).toBe("credentials");expect(localStorage.getItem("flicklet.trial.v1")).toBe("kept");expect(localStorage.getItem("unrelated")).toBe("kept");
  expect(m.cancel).toHaveBeenCalledWith({notifications:[{id:10}]});expect(m.uid).toBe(uid);
  if(uid){expect(m.docs["users/owner"]).toMatchObject({uid:"owner",email:"owner@example.com",settings:{username:"handle",preferredName:"",pro:{isPro:true}},gameStats:{flickword:{},trivia:{}}});expect(m.docs["users/owner"].watchlists.customLists).toEqual([]);expect(m.docs["users/owner/episodeProgress/10"]).toBeUndefined();expect(m.docs["users/owner/tabState/watching"]).toBeUndefined();expect(m.docs["users/owner/notificationSettings/old"]).toBeUndefined();expect(m.docs["users/owner/notificationSettings/main"].showOverrides).toEqual({});for(const p of ["users/owner/billing/status","users/owner/entitlements/trial","usernames/handle"])expect(m.docs[p]).toEqual(preserved[p]);}
  else expect(m.docs).toEqual(preserved);
 });
 it("resets optional preferences for a legacy account without a settings mirror",async()=>{
  delete m.docs["users/owner"].settings.fullSettings;m.docs["users/owner"].settings.layout.themePack="old";m.docs["users/owner"].settings.notifications.alertConfig={targetList:"watching",leadTimeHours:4};await startOver(vi.fn());expect(m.docs["users/owner"].settings.fullSettings.layout.themePack).toBeUndefined();expect(m.docs["users/owner"].settings.fullSettings.notifications.alertConfig).toBeUndefined();expect(m.docs["users/owner"].settings.fullSettings.displayName).toBe("Guest");expect(m.docs["users/owner"].settings.pro.isPro).toBe(true);
 });
 it("normal cloud loading after reload does not resurrect old content",async()=>{
  await startOver(vi.fn());release?.();expect(await firebaseSyncManager.loadFromFirebase("owner")).toBe(true);expect(Library.getAll()).toEqual([]);expect(customListManager.getUserLists().customLists).toEqual([]);expect(localStorage.getItem("episode-progress-10")).toBeNull();expect(localStorage.getItem("flk.tab.watching.sort")).toBeNull();expect(resolvePreferredName(m.docs["users/owner"].settings)).toBe("");
 });
 it("blocks queued, mounted and unload writes through completion",async()=>{
  const reload=vi.fn();await startOver(reload);settingsManager.updateTheme("dark");Library.upsert({id:"99",mediaType:"movie",title:"Stale"},"watched");await saveTabState("watching",{sort:"custom"});writeStoredEpisodeProgress(10,{episodes:{S1E1:true}});barrier.persistLocalContent("flickword:stats",'{"games":99}');flushPendingSaves();window.dispatchEvent(new Event("beforeunload"));
  expect(Library.getAll()).toEqual([]);expect(localStorage.getItem("episode-progress-10")).toBeNull();expect(localStorage.getItem("flk.tab.watching.sort")).toBeNull();expect(localStorage.getItem("flickword:stats")).toBeNull();expect(settingsManager.getSettings().layout.theme).toBe(DEFAULT_SETTINGS.layout.theme);
 });
 it("waits for existing tracked writes and never reloads ahead of cloud commit",async()=>{
  let finish!:()=>void;const pending=barrier.trackedWrite(async()=>new Promise<void>(r=>finish=r))();const reload=vi.fn();const result=startOver(reload);await Promise.resolve();expect(reload).not.toHaveBeenCalled();expect(m.cancel).not.toHaveBeenCalled();finish();await pending;await result;expect(reload).toHaveBeenCalledOnce();
 });
 it("rolls local state back after cloud failure and recovers cancelled schedules",async()=>{
  m.cloudError=true;const before=snapshot(),server=structuredClone(m.docs);const reload=vi.fn();await expect(startOver(reload)).rejects.toThrow("cloud failure");expect(snapshot()).toEqual(before);expect(m.docs).toEqual(server);expect(m.schedule).toHaveBeenCalled();expect(reload).not.toHaveBeenCalled();expect(barrier.isRestoring()).toBe(false);expect(Library.getAll()).toHaveLength(1);
 });
 it("aborts before mutation when native cancellation fails",async()=>{
  m.nativeError=true;const before=snapshot();const reload=vi.fn();await expect(startOver(reload)).rejects.toThrow("native failure");expect(snapshot()).toEqual(before);expect(m.writes).toEqual([]);expect(reload).not.toHaveBeenCalled();
 });
 it("rolls back a routine local storage failure before cloud commit",async()=>{
  const before=snapshot();const set=Storage.prototype.setItem;let failed=false;vi.spyOn(Storage.prototype,"setItem").mockImplementation(function(this:Storage,k,v){if(k==="flicklet.customLists.v2"&&!failed){failed=true;throw Error("quota");}return set.call(this,k,v);});const reload=vi.fn();await expect(startOver(reload)).rejects.toThrow("quota");expect(snapshot()).toEqual(before);expect(m.writes).toEqual([]);expect(reload).not.toHaveBeenCalled();
 });
 it("leaves pending recovery untouched",async()=>{
  localStorage.setItem(RESTORE_JOURNAL_KEY,"pending");const before=snapshot();await expect(startOver(vi.fn())).rejects.toThrow("recovery is pending");expect(snapshot()).toEqual(before);expect(m.cancel).not.toHaveBeenCalled();
 });
 it("rejects a concurrent restore",async()=>{const unlock=await barrier.beginRestore();await expect(startOver(vi.fn())).rejects.toThrow("pending");unlock();});
 it("a pre-reset backup restores content without overwriting identity or paid access",async()=>{
  const backup=await createBackup();await startOver(vi.fn());release?.();await restoreBackup(backup);expect(Library.getAll()).toHaveLength(1);expect(Library.getAll()[0]).toMatchObject({userRating:4,userNotes:"Notes",customListIds:["a"]});expect(m.docs["users/owner"].settings).toMatchObject({preferredName:"TJ",username:"handle",pro:{isPro:true}});expect(m.docs["users/owner/billing/status"]).toEqual({isPro:true});expect(m.uid).toBe("owner");
 });
});
