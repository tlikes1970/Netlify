const cloud = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("../firebaseBootstrap",()=>({db:{}}));
vi.mock("firebase/firestore",()=>({doc:(_:unknown,...path:string[])=>path.join("/"),setDoc:cloud,serverTimestamp:()=>"now"}));
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../auth",()=>({authManager:{getCurrentUser:()=>({uid:"owner"})}}));vi.mock("../readOnlyGuard",()=>({guardMutation:()=>true}));vi.mock("../proConfig",()=>({getMaxCustomLists:()=>3}));
import { Library } from "../storage";
import { firebaseSyncManager } from "../firebaseSync";
import { customListManager } from "../customLists";
beforeEach(()=>{localStorage.clear();window.dispatchEvent(new Event("library:cleared"));localStorage.setItem("flicklet.customLists.v2",JSON.stringify({customLists:[{id:"a",name:"A",createdAt:1},{id:"b",name:"B",createdAt:2}]}));window.dispatchEvent(new Event("customLists:updated"));});
describe("whole custom-list deletion",()=>{
 it.each(["watching","wishlist","watched","not"] as const)("preserves %s and all user data while removing only the deleted membership",status=>{
 const item={id:"1",mediaType:"movie" as const,title:"Title",userRating:4,userNotes:"Notes",tags:["tag"],isFavorite:true,year:2020};Library.upsert(item,status);Library.addToCustomList(item,"a");Library.addToCustomList(item,"b");const event=vi.fn();window.addEventListener("library:changed",event);expect(customListManager.deleteList("a")).toBe(true);window.removeEventListener("library:changed",event);
 expect(Library.getEntry("1","movie")).toMatchObject({...item,list:status,customListIds:["b"]});expect(JSON.parse(localStorage.getItem("flicklet.library.v2")!)["movie:1"].customListIds).toEqual(["b"]);expect(customListManager.getListById("a")).toBeNull();expect(event).toHaveBeenCalled();expect(event.mock.calls[0][0].detail).toEqual({uid:"owner",operation:"customListDelete"});
 });
 it("normal cloud persistence saves updated definitions and memberships together",async()=>{
  const item={id:"1",mediaType:"movie" as const,title:"Title"};Library.upsert(item,"watched");Library.addToCustomList(item,"a");Library.addToCustomList(item,"b");customListManager.deleteList("a");await firebaseSyncManager.saveToFirebase("owner");expect(cloud).toHaveBeenCalledWith("users/owner",expect.objectContaining({watchlists:expect.objectContaining({customLists:expect.arrayContaining([expect.objectContaining({id:"b"})])})}),{merge:true});const payload=cloud.mock.calls.at(-1)![1] as any;expect(payload.watchlists.customLists.some((l:any)=>l.id==="a")).toBe(false);expect(payload.watchlists.movies.watched[0].custom_list_ids).toEqual(["b"]);
 });
 it("retains legacy custom-only titles using the existing export fallback",()=>{
 localStorage.setItem("flicklet.library.v2",JSON.stringify({"movie:1":{id:"1",mediaType:"movie",title:"Only A",list:"custom:a",addedAt:1,userNotes:"Keep",customListIds:["a"]},"movie:2":{id:"2",mediaType:"movie",title:"Both",list:"custom:a",addedAt:2,customListIds:["a","b"]}}));Library.reloadFromStorage(true);customListManager.deleteList("a");expect(Library.getEntry("1","movie")).toMatchObject({list:"wishlist",customListIds:[],userNotes:"Keep"});expect(Library.getEntry("2","movie")).toMatchObject({list:"custom:b",customListIds:["b"]});expect(Library.getAll()).toHaveLength(2);
 });
});
