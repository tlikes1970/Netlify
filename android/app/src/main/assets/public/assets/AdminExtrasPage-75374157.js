import{j as e,ax as T,ay as P,a8 as ge,r as ue,v as he,a as pe,c as be,N as ve}from"./games-0ff06d94.js";import{r as o}from"./react-vendor-55abab24.js";import{extrasProvider as K}from"./extrasProvider-aacde9fa.js";import{a as fe}from"./settings-d01eed58.js";import{collection as ye,query as je,limit as Ne,orderBy as we,onSnapshot as ke}from"./firebase-firestore-2123038e.js";import"./firebase-auth-b0f60665.js";import"./firebase-app-dda3858f.js";import"./pages-32b8424f.js";import"./modals-c2532c5b.js";function Ce(){const[N,R]=o.useState([]),[w,x]=o.useState(!0),[p,b]=o.useState(new Set),[g,k]=o.useState("");o.useEffect(()=>{const a=ye(ge,"users"),m=je(a,we("lastLoginAt","desc"),Ne(100)),u=ke(m,async s=>{const i=[];s.forEach(c=>{var C,S,A;const d=c.data();i.push({uid:c.id,email:d.email||((C=d.profile)==null?void 0:C.email)||"",displayName:d.displayName||((S=d.profile)==null?void 0:S.displayName)||"",photoURL:d.photoURL||((A=d.profile)==null?void 0:A.photoURL),lastLoginAt:d.lastLoginAt,isAdmin:!1})}),R(i),x(!1)},s=>{console.error("Error listening to users:",s),x(!1)});return()=>u()},[]);const E=async(a,m,u)=>{if(confirm(`Are you sure you want to ${u?"grant":"revoke"} admin role for ${m}?`)){b(s=>new Set(s).add(a));try{await T(P,"manageAdminRole")({userId:a,grant:u}),R(i=>i.map(c=>c.uid===a?{...c,isAdmin:u}:c)),alert(u?"Admin role granted. User must sign out and back in for changes to take effect.":"Admin role revoked.")}catch(s){console.error("Error managing admin role:",s),alert(`Failed to ${u?"grant":"revoke"} admin role: ${s.message||"Unknown error"}`)}finally{b(s=>{const i=new Set(s);return i.delete(a),i})}}},v=N.filter(a=>{var m;return!g||a.email.toLowerCase().includes(g.toLowerCase())||((m=a.displayName)==null?void 0:m.toLowerCase().includes(g.toLowerCase()))});return w?e.jsxs("div",{className:"border rounded-lg p-6",style:{borderColor:"var(--line)",backgroundColor:"var(--card)"},children:[e.jsx("div",{className:"h-8 w-32 bg-gray-200 rounded animate-pulse mb-4",style:{backgroundColor:"var(--line)"}}),e.jsx("div",{className:"space-y-2",children:[1,2,3].map(a=>e.jsx("div",{className:"h-12 bg-gray-200 rounded animate-pulse",style:{backgroundColor:"var(--line)"}},a))})]}):e.jsxs("div",{className:"border rounded-lg p-6 mb-8",style:{borderColor:"var(--line)",backgroundColor:"var(--card)"},children:[e.jsx("h2",{className:"text-xl font-semibold mb-4",children:"Manage Admin Roles"}),e.jsx("div",{className:"mb-4",children:e.jsx("input",{type:"text",placeholder:"Search by email or name...",value:g,onChange:a=>k(a.target.value),className:"w-full px-4 py-2 rounded border",style:{borderColor:"var(--line)",backgroundColor:"var(--bg)"}})}),e.jsxs("div",{className:"overflow-x-auto",children:[e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b",style:{borderColor:"var(--line)"},children:[e.jsx("th",{className:"text-left p-2",children:"Email"}),e.jsx("th",{className:"text-left p-2",children:"Name"}),e.jsx("th",{className:"text-left p-2",children:"UID"}),e.jsx("th",{className:"text-left p-2",children:"Status"}),e.jsx("th",{className:"text-left p-2",children:"Actions"})]})}),e.jsx("tbody",{children:v.map(a=>e.jsxs("tr",{className:"border-b",style:{borderColor:"var(--line)"},children:[e.jsx("td",{className:"p-2",children:a.email}),e.jsx("td",{className:"p-2",children:a.displayName||"—"}),e.jsxs("td",{className:"p-2 text-sm font-mono",children:[a.uid.substring(0,8),"..."]}),e.jsx("td",{className:"p-2",children:e.jsx("span",{className:`px-2 py-1 rounded text-xs ${a.isAdmin?"bg-green-500/20 text-green-600":"bg-gray-500/20 text-gray-600"}`,children:a.isAdmin?"Admin":"User"})}),e.jsx("td",{className:"p-2",children:e.jsx("button",{onClick:()=>E(a.uid,a.email,!a.isAdmin),disabled:p.has(a.uid),className:"px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80",style:{borderColor:"var(--line)",backgroundColor:a.isAdmin?"var(--btn)":"var(--accent)",color:a.isAdmin?"var(--text)":"white"},children:p.has(a.uid)?"Updating...":a.isAdmin?"Revoke Admin":"Grant Admin"})})]},a.uid))})]}),v.length===0&&e.jsx("p",{className:"text-center py-8 text-sm",style:{color:"var(--muted)"},children:g?"No users found matching search":"No users found"})]}),e.jsx("p",{className:"mt-4 text-xs",style:{color:"var(--muted)"},children:"Note: Users must sign out and sign back in for admin role changes to take effect."})]})}function Fe({isMobile:N}={}){var J,Q;const R=ue(),{isAdmin:w}=fe(),[x,p]=o.useState([]),[b,g]=o.useState([]),[k,E]=o.useState(!1),[v,a]=o.useState(""),[m,u]=o.useState(0),[s,i]=o.useState("content"),c=N!=null?N:he(),[d,C]=o.useState(""),[S,A]=o.useState(""),[M,X]=o.useState("tv"),[D,L]=o.useState(""),[U,z]=o.useState(""),[$,V]=o.useState(""),[F,q]=o.useState(!1),[f,G]=o.useState(null),[I,W]=o.useState(!1),[h,B]=o.useState(null),y=(Q=(J=R.pro)==null?void 0:J.isPro)!=null?Q:!1,[Y,O]=o.useState(!1),ee=async()=>{const t=pe.currentUser;if(!(t!=null&&t.uid)){alert("You must be signed in to change Pro status.");return}const r=!y;O(!0);try{await T(P,"manageProStatus")({userId:t.uid,isPro:r}),be(),await ve.loadSettingsFromFirebase(t.uid)}catch(n){console.error("[AdminExtrasPage] manageProStatus failed:",n);const l=n;alert(`Failed to update Pro status: ${l.message||l.code||"Unknown error"}`)}finally{O(!1)}},te=async()=>{if(m){E(!0);try{const t=await K.fetchBloopers(m,v),r=await K.fetchExtras(m,v),n=[...t.videos,...r.videos];p(n)}catch(t){console.error("Failed to fetch videos:",t)}finally{E(!1)}}},se=t=>{p(r=>r.map(n=>n.id===t?{...n,status:"approved"}:n))},re=t=>{p(r=>r.map(n=>n.id===t?{...n,status:"rejected"}:n))},ae=()=>{p(t=>t.map(r=>({...r,status:"approved"})))},ne=()=>{p(t=>t.map(r=>({...r,status:"rejected"})))},H=t=>{g(r=>r.map(n=>n.id===t?{...n,status:"approved"}:n))},Z=(t,r)=>{g(n=>n.map(l=>l.id===t?{...l,status:"rejected",rejectionReason:r}:l))},oe=()=>{g([{id:"1",type:"comment",showName:"The Office",content:"Michael Scott is the best boss ever!",submittedBy:"user123",submittedAt:"2024-01-15T10:30:00Z",status:"pending"},{id:"2",type:"video",showName:"Stranger Things",content:"Behind the scenes footage from season 4",submittedBy:"user456",submittedAt:"2024-01-15T11:45:00Z",status:"pending"}])};o.useEffect(()=>{oe()},[]);const le=async()=>{if(!d){alert("Please enter a TMDB ID");return}q(!0),G(null);try{const t=D.split(",").map(xe=>xe.trim()).filter(Boolean),r={tmdbId:parseInt(d),id:parseInt(d),title:S||"Unknown Title",mediaType:M,genres:t,year:U?parseInt(U):null,runtimeMins:$?parseInt($):null},_=(await T(P,"ingestGoofs")({mode:"single",tmdbId:d,metadata:r})).data;G({success:_.success||!0,itemsGenerated:_.itemsGenerated||0}),C(""),A(""),L(""),z(""),V("")}catch(t){console.error("Failed to generate insights:",t),G({success:!1,error:t.message||String(t)})}finally{q(!1)}},ie=async()=>{if(window.confirm("Run bulk goofs ingestion now? This will process all titles in Firestore and may take a while.")){W(!0),B(null);try{const l=(await T(P,"ingestGoofs")({mode:"bulk"})).data;B({success:l.success||!0,total:l.total||0,succeeded:l.succeeded||l.count||0,failed:l.failed||0})}catch(r){console.error("Failed to run bulk ingestion:",r);let n="Unknown error";const l=r;l.message?n=l.message:l.code?n=`Error code: ${l.code}`:typeof r=="string"?n=r:n=JSON.stringify(r),B({success:!1,error:n})}finally{W(!1)}}},de=x.filter(t=>t.status==="pending").length,ce=x.filter(t=>t.status==="approved").length,me=x.filter(t=>t.status==="rejected").length,j=b.filter(t=>t.status==="pending").length;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        /* Root container - SettingsPage provides padding, so no padding here */
        .admin-extras-root {
          min-height: auto;
          width: 100%;
          background: transparent;
          color: var(--text);
        }

        /* Tabs - Real pills - normalized spacing */
        .admin-extras-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          position: relative;
          contain: layout style;
        }
        
        /* Ensure tabs don't overflow parent container */
        .admin-extras-tabs button {
          flex-shrink: 0;
        }

        .admin-extras-tabs::-webkit-scrollbar {
          display: none;
        }

        .admin-extras-tab {
          white-space: nowrap;
          border-radius: 9999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.85rem;
          border: 1px solid var(--line, #d1d5db);
          background: var(--card, #f9fafb);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          max-width: fit-content;
        }

        .admin-extras-tab:hover {
          background: var(--btn, #f3f4f6);
        }

        .admin-extras-tab--active {
          border-color: var(--accent-primary, #3b82f6);
          background: var(--accent-primary, #3b82f6);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .admin-extras-tab--active:hover {
          background: var(--accent-primary, #3b82f6);
          opacity: 0.95;
        }

        /* Compact sections */
        .admin-extras-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Form fields - stack on mobile */
        @media (max-width: 900px) {
          .admin-extras-section--auto .admin-extras-fields {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        @media (min-width: 901px) {
          .admin-extras-section--auto .admin-extras-fields {
            display: flex;
            flex-direction: row;
            gap: 0.75rem;
            align-items: center;
          }
        }

        /* Counts row - compact badges */
        .admin-extras-counts-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 0.5rem;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        .admin-extras-counts-row span {
          padding: 0.2rem 0.45rem;
          border-radius: 9999px;
          background: var(--card, #f3f4f6);
          border: 1px solid var(--line, #e2e8f0);
          color: var(--text);
          white-space: nowrap;
        }

        /* Helper text */
        .admin-extras-helper {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: var(--muted, #6b7280);
          text-align: center;
        }


        /* Mobile: Touch-friendly buttons and prevent horizontal scroll */
        @media (max-width: 900px) {
          .admin-extras-root {
            overflow-x: hidden;
            max-width: 100%;
          }
          
          /* Ensure all buttons are touch-friendly (minimum 44px height) */
          .admin-extras-root button,
          .admin-extras-root input[type="button"],
          .admin-extras-root input[type="submit"] {
            min-height: 44px;
            padding: 12px 16px;
            font-size: 16px;
          }
          
          /* Ensure text inputs are touch-friendly */
          .admin-extras-root input[type="text"],
          .admin-extras-root input[type="number"],
          .admin-extras-root textarea,
          .admin-extras-root select {
            min-height: 44px;
            font-size: 16px;
            padding: 12px;
          }
          
          /* Prevent horizontal scrolling */
          .admin-extras-section {
            overflow-x: hidden;
            width: 100%;
          }
          
          /* Ensure content wraps instead of scrolling horizontally */
          .admin-extras-counts-row {
            flex-wrap: wrap;
          }
        }
      `}),e.jsxs("div",{className:"admin-extras-root space-y-6",children:[e.jsx("h3",{className:"text-xl font-semibold",style:{color:"var(--text)"},children:s==="content"?"Auto Content":s==="insights"?"Insights & Easter Eggs":s==="comments"?"Marquee Comments":s==="videos"?"Video Submissions":s==="pro"?"Pro Status":s==="admin"?"Admin Management":"Admin"}),c?e.jsxs("select",{value:s,onChange:t=>i(t.target.value),style:{width:"100%",maxWidth:"240px",padding:"8px 12px",fontSize:"15px",borderRadius:"8px",backgroundColor:"var(--card)",border:"1px solid var(--line)",color:"var(--text)",minHeight:"40px",WebkitAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",paddingRight:"32px"},children:[e.jsx("option",{value:"content",children:"Auto Content"}),e.jsx("option",{value:"insights",children:"Insights & Easter Eggs"}),e.jsxs("option",{value:"comments",children:["Marquee Comments (",j,")"]}),e.jsxs("option",{value:"videos",children:["Video Submissions (",j,")"]}),e.jsx("option",{value:"pro",children:"Pro Status"}),w&&e.jsx("option",{value:"admin",children:"Admin Management"})]}):e.jsxs("div",{className:"admin-extras-tabs",style:{width:"100%",maxWidth:"100%",boxSizing:"border-box"},children:[e.jsx("button",{onClick:()=>i("content"),className:`admin-extras-tab ${s==="content"?"admin-extras-tab--active":""}`,title:"Auto Content",children:"Auto Content"}),e.jsx("button",{onClick:()=>i("insights"),className:`admin-extras-tab ${s==="insights"?"admin-extras-tab--active":""}`,title:"Insights & Easter Eggs",children:"Insights & Easter Eggs"}),e.jsxs("button",{onClick:()=>i("comments"),className:`admin-extras-tab ${s==="comments"?"admin-extras-tab--active":""}`,title:`Marquee Comments (${j})`,children:["Marquee Comments (",j,")"]}),e.jsxs("button",{onClick:()=>i("videos"),className:`admin-extras-tab ${s==="videos"?"admin-extras-tab--active":""}`,title:`Video Submissions (${j})`,children:["Video Submissions (",j,")"]}),e.jsx("button",{onClick:()=>i("pro"),className:`admin-extras-tab ${s==="pro"?"admin-extras-tab--active":""}`,title:"Pro Status",children:"Pro Status"}),w&&e.jsx("button",{onClick:()=>i("admin"),className:`admin-extras-tab ${s==="admin"?"admin-extras-tab--active":""}`,title:"Admin Management",children:"Admin Management"})]}),s==="insights"&&e.jsx("div",{className:"space-y-6",children:e.jsxs("div",{className:"rounded-lg p-4",style:{backgroundColor:"var(--card)",border:"1px solid var(--line)"},children:[e.jsx("h4",{className:"text-lg font-medium mb-3",style:{color:"var(--text)"},children:"Generate Insights & Easter Eggs"}),e.jsxs("p",{className:"text-sm mb-4",style:{color:"var(--muted)"},children:['Generate original "Insights & Easter Eggs" content from title metadata. Content is generated using templates + metadata, NOT from external copyrighted sources.',e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Data Flow:"})," Admin triggers ingestion â†’ Netlify function fetches/transforms data â†’ Writes to Firestore â†’ Clients read from Firestore (no direct external API calls)."]}),e.jsxs("div",{className:"space-y-3",style:{gap:c?"0.75rem":"1rem"},children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"TMDB ID (required)"}),e.jsx("input",{type:"text",value:d,onChange:t=>C(t.target.value),placeholder:"e.g., 1399",className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"Title"}),e.jsx("input",{type:"text",value:S,onChange:t=>A(t.target.value),placeholder:"e.g., Game of Thrones",className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"Media Type"}),e.jsxs("select",{value:M,onChange:t=>X(t.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"},children:[e.jsx("option",{value:"tv",children:"TV Show"}),e.jsx("option",{value:"movie",children:"Movie"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"Genres (comma-separated)"}),e.jsx("input",{type:"text",value:D,onChange:t=>L(t.target.value),placeholder:"e.g., drama, fantasy, action",className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}})]}),e.jsxs("div",{className:`${c?"flex flex-col gap-3":"grid grid-cols-2 gap-4"}`,children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"Year"}),e.jsx("input",{type:"text",value:U,onChange:t=>z(t.target.value),placeholder:"e.g., 2011",className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium mb-2",children:"Runtime (minutes)"}),e.jsx("input",{type:"text",value:$,onChange:t=>V(t.target.value),placeholder:"e.g., 60",className:"w-full px-3 py-2 border border-gray-300 rounded",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}})]})]}),e.jsx("p",{className:"text-xs mb-2",style:{color:"var(--muted)"},children:"Use this for one-off fixes or testing a specific TMDB ID."}),e.jsx("button",{onClick:le,disabled:F||!d||I,className:"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",children:F?"Generating...":"Generate Insights"}),f&&e.jsx("div",{className:`p-4 rounded ${f.success?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200"}`,style:{backgroundColor:(f.success,"var(--card)"),borderColor:"var(--line)"},children:f.success?e.jsxs("p",{className:"text-sm text-green-800",style:{color:"var(--text)"},children:["âœ… Successfully generated"," ",f.itemsGenerated," insights and saved to Firestore. Users will see them the next time they open the Insights & Easter Eggs modal."]}):e.jsxs("p",{className:"text-sm text-red-800",style:{color:"var(--text)"},children:["âŒ Error: ",f.error||"Unknown error"]})})]}),e.jsxs("div",{className:"mt-6 pt-6",style:{borderTop:"1px solid var(--line)"},children:[e.jsx("h5",{className:"text-md font-medium mb-2",style:{color:"var(--text)"},children:"Bulk Ingestion"}),e.jsx("p",{className:"text-sm mb-4",style:{color:"var(--muted)"},children:"Use this to refresh goofs/insights for all configured shows. Fetches titles from Firestore (titles collection or user watchlists) and processes them automatically. No TMDB IDs required."}),e.jsx("button",{onClick:ie,disabled:I||F||I,className:"px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed",children:I?"Running bulk ingestion...":"Run bulk goofs ingestion"}),h&&e.jsx("div",{className:`mt-4 p-4 rounded ${h.success?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200"}`,style:{backgroundColor:"var(--card)",borderColor:"var(--line)"},children:h.success?e.jsxs("div",{className:"text-sm",style:{color:"var(--text)"},children:[e.jsx("p",{className:"mb-2",children:"âœ… Bulk ingestion complete!"}),e.jsxs("ul",{className:"list-disc list-inside space-y-1",children:[e.jsxs("li",{children:["Total titles processed:"," ",h.total||0]}),e.jsxs("li",{children:["Successfully updated:"," ",h.succeeded||0]}),h.failed!==void 0&&h.failed>0&&e.jsxs("li",{style:{color:"var(--muted)"},children:["Failed: ",h.failed]})]}),e.jsx("p",{className:"mt-2 text-xs",style:{color:"var(--muted)"},children:"Users will see updated insights the next time they open the Insights & Easter Eggs modal."})]}):e.jsxs("p",{className:"text-sm text-red-800",style:{color:"var(--text)"},children:["âŒ Error: ",h.error||"Unknown error"]})})]})]})}),s==="content"&&e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"admin-extras-section admin-extras-section--auto",children:[e.jsxs("div",{className:"admin-extras-fields",children:[e.jsx("input",{type:"text",placeholder:"Show Title",value:v,onChange:t=>a(t.target.value),className:"px-3 py-2 border rounded flex-1",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}}),e.jsx("input",{type:"number",placeholder:"Show ID",value:m||"",onChange:t=>u(parseInt(t.target.value)||0),className:"px-3 py-2 border rounded flex-1",style:{borderColor:"var(--line)",backgroundColor:"var(--card)",color:"var(--text)"}}),e.jsx("button",{onClick:te,disabled:k||!m,className:"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50",style:{flexShrink:0},children:k?"Fetching...":"Fetch Videos"})]}),e.jsxs("div",{className:"admin-extras-counts-row",children:[e.jsxs("span",{children:["Pending: ",de]}),e.jsxs("span",{children:["Approved: ",ce]}),e.jsxs("span",{children:["Rejected: ",me]})]})]}),x.length>0&&e.jsxs("div",{className:`flex gap-2 ${c?"flex-col":""}`,children:[e.jsx("button",{onClick:ae,className:"px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700",children:"Approve All"}),e.jsx("button",{onClick:ne,className:"px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",children:"Reject All"})]}),e.jsx("div",{className:`grid grid-cols-1 ${c?"":"md:grid-cols-2 lg:grid-cols-3"} gap-4`,children:x.map(t=>e.jsxs("div",{className:`border rounded-lg ${c?"p-2.5":"p-4"} ${t.status==="approved"?"border-green-500 bg-green-50":t.status==="rejected"?"border-red-500 bg-red-50":"border-gray-300"}`,children:[e.jsx("img",{src:t.thumbnail,alt:t.title,className:"w-full h-32 object-cover rounded mb-2"}),e.jsx("h3",{className:"font-medium text-sm mb-1 line-clamp-2",children:t.title}),e.jsx("p",{className:"text-xs text-gray-500 mb-2",children:t.channelName}),e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:`px-2 py-1 rounded text-xs ${t.category==="bloopers"?"bg-blue-100 text-blue-800":"bg-purple-100 text-purple-800"}`,children:t.category}),e.jsx("span",{className:"text-xs text-gray-400",children:t.provider})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>se(t.id),className:"px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700",children:"Approve"}),e.jsx("button",{onClick:()=>re(t.id),className:"px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700",children:"Reject"}),e.jsx("a",{href:t.watchUrl,target:"_blank",rel:"noopener noreferrer",className:"px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700",children:"View"})]})]},t.id))}),x.length===0&&!k&&e.jsx("div",{className:"text-center py-8 text-gray-500",children:'Enter a show title and ID, then click "Fetch Videos" to get started.'})]}),s==="comments"&&e.jsxs("div",{className:"space-y-6",children:[b.filter(t=>t.type==="comment").map(t=>e.jsxs("div",{className:`border rounded-lg p-4 ${t.status==="approved"?"border-green-500 bg-green-50":t.status==="rejected"?"border-red-500 bg-red-50":"border-gray-300"}`,children:[e.jsxs("div",{className:"flex justify-between items-start mb-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium",children:t.showName}),e.jsxs("p",{className:"text-sm text-gray-600",style:{color:"var(--muted)"},children:["By ",t.submittedBy," â€¢"," ",new Date(t.submittedAt).toLocaleDateString()]})]}),e.jsx("span",{className:`px-2 py-1 rounded text-xs ${t.status==="approved"?"bg-green-100 text-green-800":t.status==="rejected"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.status})]}),e.jsx("p",{className:"text-sm mb-3",children:t.content}),t.status==="pending"&&e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>H(t.id),className:"px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700",children:"Approve"}),e.jsx("button",{onClick:()=>{const r=prompt("Rejection reason:");r&&Z(t.id,r)},className:"px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700",children:"Reject"})]}),t.rejectionReason&&e.jsxs("p",{className:"text-xs text-red-600 mt-2",children:["Rejected: ",t.rejectionReason]})]},t.id)),b.filter(t=>t.type==="comment").length===0&&e.jsx("div",{className:"text-center py-8 text-gray-500",children:"No marquee comment submissions found."})]}),s==="videos"&&e.jsxs("div",{className:"space-y-6",children:[b.filter(t=>t.type==="video").map(t=>e.jsxs("div",{className:`border rounded-lg p-4 ${t.status==="approved"?"border-green-500 bg-green-50":t.status==="rejected"?"border-red-500 bg-red-50":"border-gray-300"}`,children:[e.jsxs("div",{className:"flex justify-between items-start mb-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium",children:t.showName}),e.jsxs("p",{className:"text-sm text-gray-600",style:{color:"var(--muted)"},children:["By ",t.submittedBy," â€¢"," ",new Date(t.submittedAt).toLocaleDateString()]})]}),e.jsx("span",{className:`px-2 py-1 rounded text-xs ${t.status==="approved"?"bg-green-100 text-green-800":t.status==="rejected"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.status})]}),e.jsx("p",{className:"text-sm mb-3",children:t.content}),t.status==="pending"&&e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>H(t.id),className:"px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700",children:"Approve"}),e.jsx("button",{onClick:()=>{const r=prompt("Rejection reason:");r&&Z(t.id,r)},className:"px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700",children:"Reject"})]}),t.rejectionReason&&e.jsxs("p",{className:"text-xs text-red-600 mt-2",children:["Rejected: ",t.rejectionReason]})]},t.id)),b.filter(t=>t.type==="video").length===0&&e.jsx("div",{className:"text-center py-8 text-gray-500",children:"No video submissions found."})]}),s==="pro"&&e.jsx("div",{className:"space-y-6",children:e.jsxs("div",{className:"bg-gray-100 rounded-lg p-6",style:{backgroundColor:"var(--card)"},children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Pro Status Management"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200",style:{backgroundColor:"var(--card)",borderColor:"var(--line)"},children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-1",style:{color:"var(--text)"},children:"Pro Status"}),e.jsxs("p",{className:"text-sm text-gray-600",style:{color:"var(--muted)"},children:["Current status:"," ",e.jsx("strong",{className:y?"text-green-600":"text-gray-500",children:y?"Pro Enabled":"Pro Disabled"})]})]}),e.jsxs("label",{className:`relative inline-flex items-center ${Y?"cursor-wait opacity-70":"cursor-pointer"}`,children:[e.jsx("input",{type:"checkbox",checked:y,disabled:Y,onChange:()=>{ee()},className:"sr-only peer"}),e.jsx("div",{className:"w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600",style:{backgroundColor:"var(--btn)",borderColor:"var(--line)"}})]})]}),y&&e.jsxs("div",{className:"mt-4 p-4 bg-green-50 rounded-lg border border-green-200",style:{backgroundColor:"var(--card)",borderColor:"var(--line)"},children:[e.jsx("h4",{className:"font-semibold text-green-800 mb-2",style:{color:"var(--text)"},children:"Pro Features Enabled:"}),e.jsxs("ul",{className:"list-disc list-inside space-y-1 text-sm text-green-700",style:{color:"var(--text)"},children:[e.jsx("li",{children:"Advanced Notifications"}),e.jsx("li",{children:"Theme Packs"}),e.jsx("li",{children:"Bloopers Access"}),e.jsx("li",{children:"Extras Access"}),e.jsx("li",{children:"3 FlickWord games per day (vs 1 for free)"}),e.jsx("li",{children:"50 Trivia questions (vs 10 for free)"})]})]}),!y&&e.jsxs("div",{className:"mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200",style:{backgroundColor:"var(--card)",borderColor:"var(--line)"},children:[e.jsx("h4",{className:"font-semibold text-gray-800 mb-2",style:{color:"var(--text)"},children:"Free Tier Limitations:"}),e.jsxs("ul",{className:"list-disc list-inside space-y-1 text-sm text-gray-700",style:{color:"var(--text)"},children:[e.jsx("li",{children:"1 FlickWord game per day"}),e.jsx("li",{children:"10 Trivia questions per day"}),e.jsx("li",{children:"No advanced notifications"}),e.jsx("li",{children:"No theme packs"}),e.jsx("li",{children:"No bloopers/extras access"})]})]}),e.jsx("div",{className:"mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200",style:{backgroundColor:"var(--card)",borderColor:"var(--line)"},children:e.jsxs("p",{className:"text-sm text-blue-800",style:{color:"var(--text)"},children:[e.jsx("strong",{children:"Note:"})," This updates Pro for the signed-in account in Firestore (including billing status used by the app) via the admin backend. It is not for changing other users' accounts from this screen."]})})]})]})}),s==="admin"&&w&&e.jsx("div",{className:"space-y-6",children:e.jsx(Ce,{})})]})]})}export{Fe as default};
