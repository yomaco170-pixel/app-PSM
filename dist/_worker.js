var yt=Object.defineProperty;var qe=e=>{throw TypeError(e)};var wt=(e,t,r)=>t in e?yt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var m=(e,t,r)=>wt(e,typeof t!="symbol"?t+"":t,r),Ue=(e,t,r)=>t.has(e)||qe("Cannot "+r);var u=(e,t,r)=>(Ue(e,t,"read from private field"),r?r.call(e):t.get(e)),E=(e,t,r)=>t.has(e)?qe("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),f=(e,t,r,s)=>(Ue(e,t,"write to private field"),s?s.call(e,r):t.set(e,r),r),y=(e,t,r)=>(Ue(e,t,"access private method"),r);var $e=(e,t,r,s)=>({set _(n){f(e,t,n,r)},get _(){return u(e,t,s)}});var Be=(e,t,r)=>(s,n)=>{let a=-1;return o(0);async function o(i){if(i<=a)throw new Error("next() called multiple times");a=i;let c,l=!1,d;if(e[i]?(d=e[i][0][0],s.req.routeIndex=i):d=i===e.length&&n||void 0,d)try{c=await d(s,()=>o(i+1))}catch(h){if(h instanceof Error&&t)s.error=h,c=await t(h,s),l=!0;else throw h}else s.finalized===!1&&r&&(c=await r(s));return c&&(s.finalized===!1||l)&&(s.res=c),s}},Rt=Symbol(),At=async(e,t=Object.create(null))=>{const{all:r=!1,dot:s=!1}=t,a=(e instanceof at?e.raw.headers:e.headers).get("Content-Type");return a!=null&&a.startsWith("multipart/form-data")||a!=null&&a.startsWith("application/x-www-form-urlencoded")?_t(e,{all:r,dot:s}):{}};async function _t(e,t){const r=await e.formData();return r?jt(r,t):{}}function jt(e,t){const r=Object.create(null);return e.forEach((s,n)=>{t.all||n.endsWith("[]")?It(r,n,s):r[n]=s}),t.dot&&Object.entries(r).forEach(([s,n])=>{s.includes(".")&&(Nt(r,s,n),delete r[s])}),r}var It=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},Nt=(e,t,r)=>{let s=e;const n=t.split(".");n.forEach((a,o)=>{o===n.length-1?s[a]=r:((!s[a]||typeof s[a]!="object"||Array.isArray(s[a])||s[a]instanceof File)&&(s[a]=Object.create(null)),s=s[a])})},et=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},bt=e=>{const{groups:t,path:r}=Ot(e),s=et(r);return St(s,t)},Ot=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(r,s)=>{const n=`@${s}`;return t.push([n,r]),n}),{groups:t,path:e}},St=(e,t)=>{for(let r=t.length-1;r>=0;r--){const[s]=t[r];for(let n=e.length-1;n>=0;n--)if(e[n].includes(s)){e[n]=e[n].replace(s,t[r][1]);break}}return e},Ie={},xt=(e,t)=>{if(e==="*")return"*";const r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){const s=`${e}#${t}`;return Ie[s]||(r[2]?Ie[s]=t&&t[0]!==":"&&t[0]!=="*"?[s,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:Ie[s]=[e,r[1],!0]),Ie[s]}return null},Fe=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Ct=e=>Fe(e,decodeURI),tt=e=>{const t=e.url,r=t.indexOf("/",t.indexOf(":")+4);let s=r;for(;s<t.length;s++){const n=t.charCodeAt(s);if(n===37){const a=t.indexOf("?",s),o=t.indexOf("#",s),i=a===-1?o===-1?void 0:o:o===-1?a:Math.min(a,o),c=t.slice(r,i);return Ct(c.includes("%25")?c.replace(/%25/g,"%2525"):c)}else if(n===63||n===35)break}return t.slice(r,s)},Lt=e=>{const t=tt(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ae=(e,t,...r)=>(r.length&&(t=ae(t,...r)),`${(e==null?void 0:e[0])==="/"?"":"/"}${e}${t==="/"?"":`${(e==null?void 0:e.at(-1))==="/"?"":"/"}${(t==null?void 0:t[0])==="/"?t.slice(1):t}`}`),rt=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),r=[];let s="";return t.forEach(n=>{if(n!==""&&!/\:/.test(n))s+="/"+n;else if(/\:/.test(n))if(/\?/.test(n)){r.length===0&&s===""?r.push("/"):r.push(s);const a=n.replace("?","");s+="/"+a,r.push(s)}else s+="/"+n}),r.filter((n,a,o)=>o.indexOf(n)===a)},Pe=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Fe(e,nt):e):e,st=(e,t,r)=>{let s;if(!r&&t&&!/[%+]/.test(t)){let o=e.indexOf("?",8);if(o===-1)return;for(e.startsWith(t,o+1)||(o=e.indexOf(`&${t}`,o+1));o!==-1;){const i=e.charCodeAt(o+t.length+1);if(i===61){const c=o+t.length+2,l=e.indexOf("&",c);return Pe(e.slice(c,l===-1?void 0:l))}else if(i==38||isNaN(i))return"";o=e.indexOf(`&${t}`,o+1)}if(s=/[%+]/.test(e),!s)return}const n={};s??(s=/[%+]/.test(e));let a=e.indexOf("?",8);for(;a!==-1;){const o=e.indexOf("&",a+1);let i=e.indexOf("=",a);i>o&&o!==-1&&(i=-1);let c=e.slice(a+1,i===-1?o===-1?void 0:o:i);if(s&&(c=Pe(c)),a=o,c==="")continue;let l;i===-1?l="":(l=e.slice(i+1,o===-1?void 0:o),s&&(l=Pe(l))),r?(n[c]&&Array.isArray(n[c])||(n[c]=[]),n[c].push(l)):n[c]??(n[c]=l)}return t?n[t]:n},Dt=st,Ut=(e,t)=>st(e,t,!0),nt=decodeURIComponent,Xe=e=>Fe(e,nt),ce,C,q,ot,it,ke,B,Ke,at=(Ke=class{constructor(e,t="/",r=[[]]){E(this,q);m(this,"raw");E(this,ce);E(this,C);m(this,"routeIndex",0);m(this,"path");m(this,"bodyCache",{});E(this,B,e=>{const{bodyCache:t,raw:r}=this,s=t[e];if(s)return s;const n=Object.keys(t)[0];return n?t[n].then(a=>(n==="json"&&(a=JSON.stringify(a)),new Response(a)[e]())):t[e]=r[e]()});this.raw=e,this.path=t,f(this,C,r),f(this,ce,{})}param(e){return e?y(this,q,ot).call(this,e):y(this,q,it).call(this)}query(e){return Dt(this.url,e)}queries(e){return Ut(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((r,s)=>{t[s]=r}),t}async parseBody(e){var t;return(t=this.bodyCache).parsedBody??(t.parsedBody=await At(this,e))}json(){return u(this,B).call(this,"text").then(e=>JSON.parse(e))}text(){return u(this,B).call(this,"text")}arrayBuffer(){return u(this,B).call(this,"arrayBuffer")}blob(){return u(this,B).call(this,"blob")}formData(){return u(this,B).call(this,"formData")}addValidatedData(e,t){u(this,ce)[e]=t}valid(e){return u(this,ce)[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[Rt](){return u(this,C)}get matchedRoutes(){return u(this,C)[0].map(([[,e]])=>e)}get routePath(){return u(this,C)[0].map(([[,e]])=>e)[this.routeIndex].path}},ce=new WeakMap,C=new WeakMap,q=new WeakSet,ot=function(e){const t=u(this,C)[0][this.routeIndex][1][e],r=y(this,q,ke).call(this,t);return r&&/\%/.test(r)?Xe(r):r},it=function(){const e={},t=Object.keys(u(this,C)[0][this.routeIndex][1]);for(const r of t){const s=y(this,q,ke).call(this,u(this,C)[0][this.routeIndex][1][r]);s!==void 0&&(e[r]=/\%/.test(s)?Xe(s):s)}return e},ke=function(e){return u(this,C)[1]?u(this,C)[1][e]:e},B=new WeakMap,Ke),Pt={Stringify:1},ct=async(e,t,r,s,n)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const a=e.callbacks;return a!=null&&a.length?(n?n[0]+=e:n=[e],Promise.all(a.map(i=>i({phase:t,buffer:n,context:s}))).then(i=>Promise.all(i.filter(Boolean).map(c=>ct(c,t,!1,s,n))).then(()=>n[0]))):Promise.resolve(e)},Mt="text/plain; charset=UTF-8",Me=(e,t)=>({"Content-Type":e,...t}),ye,we,M,le,k,S,Re,ue,de,Q,Ae,_e,X,oe,We,kt=(We=class{constructor(e,t){E(this,X);E(this,ye);E(this,we);m(this,"env",{});E(this,M);m(this,"finalized",!1);m(this,"error");E(this,le);E(this,k);E(this,S);E(this,Re);E(this,ue);E(this,de);E(this,Q);E(this,Ae);E(this,_e);m(this,"render",(...e)=>(u(this,ue)??f(this,ue,t=>this.html(t)),u(this,ue).call(this,...e)));m(this,"setLayout",e=>f(this,Re,e));m(this,"getLayout",()=>u(this,Re));m(this,"setRenderer",e=>{f(this,ue,e)});m(this,"header",(e,t,r)=>{this.finalized&&f(this,S,new Response(u(this,S).body,u(this,S)));const s=u(this,S)?u(this,S).headers:u(this,Q)??f(this,Q,new Headers);t===void 0?s.delete(e):r!=null&&r.append?s.append(e,t):s.set(e,t)});m(this,"status",e=>{f(this,le,e)});m(this,"set",(e,t)=>{u(this,M)??f(this,M,new Map),u(this,M).set(e,t)});m(this,"get",e=>u(this,M)?u(this,M).get(e):void 0);m(this,"newResponse",(...e)=>y(this,X,oe).call(this,...e));m(this,"body",(e,t,r)=>y(this,X,oe).call(this,e,t,r));m(this,"text",(e,t,r)=>!u(this,Q)&&!u(this,le)&&!t&&!r&&!this.finalized?new Response(e):y(this,X,oe).call(this,e,t,Me(Mt,r)));m(this,"json",(e,t,r)=>y(this,X,oe).call(this,JSON.stringify(e),t,Me("application/json",r)));m(this,"html",(e,t,r)=>{const s=n=>y(this,X,oe).call(this,n,t,Me("text/html; charset=UTF-8",r));return typeof e=="object"?ct(e,Pt.Stringify,!1,{}).then(s):s(e)});m(this,"redirect",(e,t)=>{const r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)});m(this,"notFound",()=>(u(this,de)??f(this,de,()=>new Response),u(this,de).call(this,this)));f(this,ye,e),t&&(f(this,k,t.executionCtx),this.env=t.env,f(this,de,t.notFoundHandler),f(this,_e,t.path),f(this,Ae,t.matchResult))}get req(){return u(this,we)??f(this,we,new at(u(this,ye),u(this,_e),u(this,Ae))),u(this,we)}get event(){if(u(this,k)&&"respondWith"in u(this,k))return u(this,k);throw Error("This context has no FetchEvent")}get executionCtx(){if(u(this,k))return u(this,k);throw Error("This context has no ExecutionContext")}get res(){return u(this,S)||f(this,S,new Response(null,{headers:u(this,Q)??f(this,Q,new Headers)}))}set res(e){if(u(this,S)&&e){e=new Response(e.body,e);for(const[t,r]of u(this,S).headers.entries())if(t!=="content-type")if(t==="set-cookie"){const s=u(this,S).headers.getSetCookie();e.headers.delete("set-cookie");for(const n of s)e.headers.append("set-cookie",n)}else e.headers.set(t,r)}f(this,S,e),this.finalized=!0}get var(){return u(this,M)?Object.fromEntries(u(this,M)):{}}},ye=new WeakMap,we=new WeakMap,M=new WeakMap,le=new WeakMap,k=new WeakMap,S=new WeakMap,Re=new WeakMap,ue=new WeakMap,de=new WeakMap,Q=new WeakMap,Ae=new WeakMap,_e=new WeakMap,X=new WeakSet,oe=function(e,t,r){const s=u(this,S)?new Headers(u(this,S).headers):u(this,Q)??new Headers;if(typeof t=="object"&&"headers"in t){const a=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[o,i]of a)o.toLowerCase()==="set-cookie"?s.append(o,i):s.set(o,i)}if(r)for(const[a,o]of Object.entries(r))if(typeof o=="string")s.set(a,o);else{s.delete(a);for(const i of o)s.append(a,i)}const n=typeof t=="number"?t:(t==null?void 0:t.status)??u(this,le);return new Response(e,{status:n,headers:s})},We),_="ALL",Ft="all",Ht=["get","post","put","delete","options","patch"],lt="Can not add a route since the matcher is already built.",ut=class extends Error{},qt="__COMPOSED_HANDLER",$t=e=>e.text("404 Not Found",404),Ge=(e,t)=>{if("getResponse"in e){const r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},L,j,dt,D,V,Ne,be,he,Bt=(he=class{constructor(t={}){E(this,j);m(this,"get");m(this,"post");m(this,"put");m(this,"delete");m(this,"options");m(this,"patch");m(this,"all");m(this,"on");m(this,"use");m(this,"router");m(this,"getPath");m(this,"_basePath","/");E(this,L,"/");m(this,"routes",[]);E(this,D,$t);m(this,"errorHandler",Ge);m(this,"onError",t=>(this.errorHandler=t,this));m(this,"notFound",t=>(f(this,D,t),this));m(this,"fetch",(t,...r)=>y(this,j,be).call(this,t,r[1],r[0],t.method));m(this,"request",(t,r,s,n)=>t instanceof Request?this.fetch(r?new Request(t,r):t,s,n):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ae("/",t)}`,r),s,n)));m(this,"fire",()=>{addEventListener("fetch",t=>{t.respondWith(y(this,j,be).call(this,t.request,t,void 0,t.request.method))})});[...Ht,Ft].forEach(a=>{this[a]=(o,...i)=>(typeof o=="string"?f(this,L,o):y(this,j,V).call(this,a,u(this,L),o),i.forEach(c=>{y(this,j,V).call(this,a,u(this,L),c)}),this)}),this.on=(a,o,...i)=>{for(const c of[o].flat()){f(this,L,c);for(const l of[a].flat())i.map(d=>{y(this,j,V).call(this,l.toUpperCase(),u(this,L),d)})}return this},this.use=(a,...o)=>(typeof a=="string"?f(this,L,a):(f(this,L,"*"),o.unshift(a)),o.forEach(i=>{y(this,j,V).call(this,_,u(this,L),i)}),this);const{strict:s,...n}=t;Object.assign(this,n),this.getPath=s??!0?t.getPath??tt:Lt}route(t,r){const s=this.basePath(t);return r.routes.map(n=>{var o;let a;r.errorHandler===Ge?a=n.handler:(a=async(i,c)=>(await Be([],r.errorHandler)(i,()=>n.handler(i,c))).res,a[qt]=n.handler),y(o=s,j,V).call(o,n.method,n.path,a)}),this}basePath(t){const r=y(this,j,dt).call(this);return r._basePath=ae(this._basePath,t),r}mount(t,r,s){let n,a;s&&(typeof s=="function"?a=s:(a=s.optionHandler,s.replaceRequest===!1?n=c=>c:n=s.replaceRequest));const o=a?c=>{const l=a(c);return Array.isArray(l)?l:[l]}:c=>{let l;try{l=c.executionCtx}catch{}return[c.env,l]};n||(n=(()=>{const c=ae(this._basePath,t),l=c==="/"?0:c.length;return d=>{const h=new URL(d.url);return h.pathname=h.pathname.slice(l)||"/",new Request(h,d)}})());const i=async(c,l)=>{const d=await r(n(c.req.raw),...o(c));if(d)return d;await l()};return y(this,j,V).call(this,_,ae(t,"*"),i),this}},L=new WeakMap,j=new WeakSet,dt=function(){const t=new he({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,f(t,D,u(this,D)),t.routes=this.routes,t},D=new WeakMap,V=function(t,r,s){t=t.toUpperCase(),r=ae(this._basePath,r);const n={basePath:this._basePath,path:r,method:t,handler:s};this.router.add(t,r,[s,n]),this.routes.push(n)},Ne=function(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t},be=function(t,r,s,n){if(n==="HEAD")return(async()=>new Response(null,await y(this,j,be).call(this,t,r,s,"GET")))();const a=this.getPath(t,{env:s}),o=this.router.match(n,a),i=new kt(t,{path:a,matchResult:o,env:s,executionCtx:r,notFoundHandler:u(this,D)});if(o[0].length===1){let l;try{l=o[0][0][0][0](i,async()=>{i.res=await u(this,D).call(this,i)})}catch(d){return y(this,j,Ne).call(this,d,i)}return l instanceof Promise?l.then(d=>d||(i.finalized?i.res:u(this,D).call(this,i))).catch(d=>y(this,j,Ne).call(this,d,i)):l??u(this,D).call(this,i)}const c=Be(o[0],this.errorHandler,u(this,D));return(async()=>{try{const l=await c(i);if(!l.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return l.res}catch(l){return y(this,j,Ne).call(this,l,i)}})()},he),ht=[];function Xt(e,t){const r=this.buildAllMatchers(),s=(n,a)=>{const o=r[n]||r[_],i=o[2][a];if(i)return i;const c=a.match(o[0]);if(!c)return[[],ht];const l=c.indexOf("",1);return[o[1][l],c]};return this.match=s,s(e,t)}var Se="[^/]+",ge=".*",ve="(?:|/.*)",ie=Symbol(),Gt=new Set(".\\+*[^]$()");function zt(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===ge||e===ve?1:t===ge||t===ve?-1:e===Se?1:t===Se?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Z,ee,U,se,Yt=(se=class{constructor(){E(this,Z);E(this,ee);E(this,U,Object.create(null))}insert(t,r,s,n,a){if(t.length===0){if(u(this,Z)!==void 0)throw ie;if(a)return;f(this,Z,r);return}const[o,...i]=t,c=o==="*"?i.length===0?["","",ge]:["","",Se]:o==="/*"?["","",ve]:o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let l;if(c){const d=c[1];let h=c[2]||Se;if(d&&c[2]&&(h===".*"||(h=h.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(h))))throw ie;if(l=u(this,U)[h],!l){if(Object.keys(u(this,U)).some(p=>p!==ge&&p!==ve))throw ie;if(a)return;l=u(this,U)[h]=new se,d!==""&&f(l,ee,n.varIndex++)}!a&&d!==""&&s.push([d,u(l,ee)])}else if(l=u(this,U)[o],!l){if(Object.keys(u(this,U)).some(d=>d.length>1&&d!==ge&&d!==ve))throw ie;if(a)return;l=u(this,U)[o]=new se}l.insert(i,r,s,n,a)}buildRegExpStr(){const r=Object.keys(u(this,U)).sort(zt).map(s=>{const n=u(this,U)[s];return(typeof u(n,ee)=="number"?`(${s})@${u(n,ee)}`:Gt.has(s)?`\\${s}`:s)+n.buildRegExpStr()});return typeof u(this,Z)=="number"&&r.unshift(`#${u(this,Z)}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}},Z=new WeakMap,ee=new WeakMap,U=new WeakMap,se),xe,je,Ve,Kt=(Ve=class{constructor(){E(this,xe,{varIndex:0});E(this,je,new Yt)}insert(e,t,r){const s=[],n=[];for(let o=0;;){let i=!1;if(e=e.replace(/\{[^}]+\}/g,c=>{const l=`@\\${o}`;return n[o]=[l,c],o++,i=!0,l}),!i)break}const a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let o=n.length-1;o>=0;o--){const[i]=n[o];for(let c=a.length-1;c>=0;c--)if(a[c].indexOf(i)!==-1){a[c]=a[c].replace(i,n[o][1]);break}}return u(this,je).insert(a,t,s,u(this,xe),r),s}buildRegExp(){let e=u(this,je).buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const r=[],s=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(n,a,o)=>a!==void 0?(r[++t]=Number(a),"$()"):(o!==void 0&&(s[Number(o)]=++t),"")),[new RegExp(`^${e}`),r,s]}},xe=new WeakMap,je=new WeakMap,Ve),Wt=[/^$/,[],Object.create(null)],Oe=Object.create(null);function pt(e){return Oe[e]??(Oe[e]=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`))}function Vt(){Oe=Object.create(null)}function Jt(e){var l;const t=new Kt,r=[];if(e.length===0)return Wt;const s=e.map(d=>[!/\*|\/:/.test(d[0]),...d]).sort(([d,h],[p,g])=>d?1:p?-1:h.length-g.length),n=Object.create(null);for(let d=0,h=-1,p=s.length;d<p;d++){const[g,w,N]=s[d];g?n[w]=[N.map(([R])=>[R,Object.create(null)]),ht]:h++;let v;try{v=t.insert(w,h,g)}catch(R){throw R===ie?new ut(w):R}g||(r[h]=N.map(([R,x])=>{const O=Object.create(null);for(x-=1;x>=0;x--){const[W,A]=v[x];O[W]=A}return[R,O]}))}const[a,o,i]=t.buildRegExp();for(let d=0,h=r.length;d<h;d++)for(let p=0,g=r[d].length;p<g;p++){const w=(l=r[d][p])==null?void 0:l[1];if(!w)continue;const N=Object.keys(w);for(let v=0,R=N.length;v<R;v++)w[N[v]]=i[w[N[v]]]}const c=[];for(const d in o)c[d]=r[o[d]];return[a,c,n]}function ne(e,t){if(e){for(const r of Object.keys(e).sort((s,n)=>n.length-s.length))if(pt(r).test(t))return[...e[r]]}}var G,z,Ce,ft,Je,Qt=(Je=class{constructor(){E(this,Ce);m(this,"name","RegExpRouter");E(this,G);E(this,z);m(this,"match",Xt);f(this,G,{[_]:Object.create(null)}),f(this,z,{[_]:Object.create(null)})}add(e,t,r){var i;const s=u(this,G),n=u(this,z);if(!s||!n)throw new Error(lt);s[e]||[s,n].forEach(c=>{c[e]=Object.create(null),Object.keys(c[_]).forEach(l=>{c[e][l]=[...c[_][l]]})}),t==="/*"&&(t="*");const a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const c=pt(t);e===_?Object.keys(s).forEach(l=>{var d;(d=s[l])[t]||(d[t]=ne(s[l],t)||ne(s[_],t)||[])}):(i=s[e])[t]||(i[t]=ne(s[e],t)||ne(s[_],t)||[]),Object.keys(s).forEach(l=>{(e===_||e===l)&&Object.keys(s[l]).forEach(d=>{c.test(d)&&s[l][d].push([r,a])})}),Object.keys(n).forEach(l=>{(e===_||e===l)&&Object.keys(n[l]).forEach(d=>c.test(d)&&n[l][d].push([r,a]))});return}const o=rt(t)||[t];for(let c=0,l=o.length;c<l;c++){const d=o[c];Object.keys(n).forEach(h=>{var p;(e===_||e===h)&&((p=n[h])[d]||(p[d]=[...ne(s[h],d)||ne(s[_],d)||[]]),n[h][d].push([r,a-l+c+1]))})}}buildAllMatchers(){const e=Object.create(null);return Object.keys(u(this,z)).concat(Object.keys(u(this,G))).forEach(t=>{e[t]||(e[t]=y(this,Ce,ft).call(this,t))}),f(this,G,f(this,z,void 0)),Vt(),e}},G=new WeakMap,z=new WeakMap,Ce=new WeakSet,ft=function(e){const t=[];let r=e===_;return[u(this,G),u(this,z)].forEach(s=>{const n=s[e]?Object.keys(s[e]).map(a=>[a,s[e][a]]):[];n.length!==0?(r||(r=!0),t.push(...n)):e!==_&&t.push(...Object.keys(s[_]).map(a=>[a,s[_][a]]))}),r?Jt(t):null},Je),Y,F,Qe,Zt=(Qe=class{constructor(e){m(this,"name","SmartRouter");E(this,Y,[]);E(this,F,[]);f(this,Y,e.routers)}add(e,t,r){if(!u(this,F))throw new Error(lt);u(this,F).push([e,t,r])}match(e,t){if(!u(this,F))throw new Error("Fatal error");const r=u(this,Y),s=u(this,F),n=r.length;let a=0,o;for(;a<n;a++){const i=r[a];try{for(let c=0,l=s.length;c<l;c++)i.add(...s[c]);o=i.match(e,t)}catch(c){if(c instanceof ut)continue;throw c}this.match=i.match.bind(i),f(this,Y,[i]),f(this,F,void 0);break}if(a===n)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(u(this,F)||u(this,Y).length!==1)throw new Error("No active router has been determined yet.");return u(this,Y)[0]}},Y=new WeakMap,F=new WeakMap,Qe),Te=Object.create(null),K,b,te,pe,I,H,J,fe,er=(fe=class{constructor(t,r,s){E(this,H);E(this,K);E(this,b);E(this,te);E(this,pe,0);E(this,I,Te);if(f(this,b,s||Object.create(null)),f(this,K,[]),t&&r){const n=Object.create(null);n[t]={handler:r,possibleKeys:[],score:0},f(this,K,[n])}f(this,te,[])}insert(t,r,s){f(this,pe,++$e(this,pe)._);let n=this;const a=bt(r),o=[];for(let i=0,c=a.length;i<c;i++){const l=a[i],d=a[i+1],h=xt(l,d),p=Array.isArray(h)?h[0]:l;if(p in u(n,b)){n=u(n,b)[p],h&&o.push(h[1]);continue}u(n,b)[p]=new fe,h&&(u(n,te).push(h),o.push(h[1])),n=u(n,b)[p]}return u(n,K).push({[t]:{handler:s,possibleKeys:o.filter((i,c,l)=>l.indexOf(i)===c),score:u(this,pe)}}),n}search(t,r){var c;const s=[];f(this,I,Te);let a=[this];const o=et(r),i=[];for(let l=0,d=o.length;l<d;l++){const h=o[l],p=l===d-1,g=[];for(let w=0,N=a.length;w<N;w++){const v=a[w],R=u(v,b)[h];R&&(f(R,I,u(v,I)),p?(u(R,b)["*"]&&s.push(...y(this,H,J).call(this,u(R,b)["*"],t,u(v,I))),s.push(...y(this,H,J).call(this,R,t,u(v,I)))):g.push(R));for(let x=0,O=u(v,te).length;x<O;x++){const W=u(v,te)[x],A=u(v,I)===Te?{}:{...u(v,I)};if(W==="*"){const $=u(v,b)["*"];$&&(s.push(...y(this,H,J).call(this,$,t,u(v,I))),f($,I,A),g.push($));continue}const[Le,He,Ee]=W;if(!h&&!(Ee instanceof RegExp))continue;const P=u(v,b)[Le],vt=o.slice(l).join("/");if(Ee instanceof RegExp){const $=Ee.exec(vt);if($){if(A[He]=$[0],s.push(...y(this,H,J).call(this,P,t,u(v,I),A)),Object.keys(u(P,b)).length){f(P,I,A);const De=((c=$[0].match(/\//))==null?void 0:c.length)??0;(i[De]||(i[De]=[])).push(P)}continue}}(Ee===!0||Ee.test(h))&&(A[He]=h,p?(s.push(...y(this,H,J).call(this,P,t,A,u(v,I))),u(P,b)["*"]&&s.push(...y(this,H,J).call(this,u(P,b)["*"],t,A,u(v,I)))):(f(P,I,A),g.push(P)))}}a=g.concat(i.shift()??[])}return s.length>1&&s.sort((l,d)=>l.score-d.score),[s.map(({handler:l,params:d})=>[l,d])]}},K=new WeakMap,b=new WeakMap,te=new WeakMap,pe=new WeakMap,I=new WeakMap,H=new WeakSet,J=function(t,r,s,n){const a=[];for(let o=0,i=u(t,K).length;o<i;o++){const c=u(t,K)[o],l=c[r]||c[_],d={};if(l!==void 0&&(l.params=Object.create(null),a.push(l),s!==Te||n&&n!==Te))for(let h=0,p=l.possibleKeys.length;h<p;h++){const g=l.possibleKeys[h],w=d[l.score];l.params[g]=n!=null&&n[g]&&!w?n[g]:s[g]??(n==null?void 0:n[g]),d[l.score]=!0}}return a},fe),re,Ze,tr=(Ze=class{constructor(){m(this,"name","TrieRouter");E(this,re);f(this,re,new er)}add(e,t,r){const s=rt(t);if(s){for(let n=0,a=s.length;n<a;n++)u(this,re).insert(e,s[n],r);return}u(this,re).insert(e,t,r)}match(e,t){return u(this,re).search(e,t)}},re=new WeakMap,Ze),mt=class extends Bt{constructor(e={}){super(e),this.router=e.router??new Zt({routers:[new Qt,new tr]})}},rr=e=>{const r={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},s=(a=>typeof a=="string"?a==="*"?()=>a:o=>a===o?o:null:typeof a=="function"?a:o=>a.includes(o)?o:null)(r.origin),n=(a=>typeof a=="function"?a:Array.isArray(a)?()=>a:()=>[])(r.allowMethods);return async function(o,i){var d;function c(h,p){o.res.headers.set(h,p)}const l=await s(o.req.header("origin")||"",o);if(l&&c("Access-Control-Allow-Origin",l),r.credentials&&c("Access-Control-Allow-Credentials","true"),(d=r.exposeHeaders)!=null&&d.length&&c("Access-Control-Expose-Headers",r.exposeHeaders.join(",")),o.req.method==="OPTIONS"){r.origin!=="*"&&c("Vary","Origin"),r.maxAge!=null&&c("Access-Control-Max-Age",r.maxAge.toString());const h=await n(o.req.header("origin")||"",o);h.length&&c("Access-Control-Allow-Methods",h.join(","));let p=r.allowHeaders;if(!(p!=null&&p.length)){const g=o.req.header("Access-Control-Request-Headers");g&&(p=g.split(/\s*,\s*/))}return p!=null&&p.length&&(c("Access-Control-Allow-Headers",p.join(",")),o.res.headers.append("Vary","Access-Control-Request-Headers")),o.res.headers.delete("Content-Length"),o.res.headers.delete("Content-Type"),new Response(null,{headers:o.res.headers,status:204,statusText:"No Content"})}await i(),r.origin!=="*"&&o.header("Vary","Origin",{append:!0})}},sr=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i,ze=(e,t=ar)=>{const r=/\.([a-zA-Z0-9]+?)$/,s=e.match(r);if(!s)return;let n=t[s[1]];return n&&n.startsWith("text")&&(n+="; charset=utf-8"),n},nr={aac:"audio/aac",avi:"video/x-msvideo",avif:"image/avif",av1:"video/av1",bin:"application/octet-stream",bmp:"image/bmp",css:"text/css",csv:"text/csv",eot:"application/vnd.ms-fontobject",epub:"application/epub+zip",gif:"image/gif",gz:"application/gzip",htm:"text/html",html:"text/html",ico:"image/x-icon",ics:"text/calendar",jpeg:"image/jpeg",jpg:"image/jpeg",js:"text/javascript",json:"application/json",jsonld:"application/ld+json",map:"application/json",mid:"audio/x-midi",midi:"audio/x-midi",mjs:"text/javascript",mp3:"audio/mpeg",mp4:"video/mp4",mpeg:"video/mpeg",oga:"audio/ogg",ogv:"video/ogg",ogx:"application/ogg",opus:"audio/opus",otf:"font/otf",pdf:"application/pdf",png:"image/png",rtf:"application/rtf",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",ts:"video/mp2t",ttf:"font/ttf",txt:"text/plain",wasm:"application/wasm",webm:"video/webm",weba:"audio/webm",webmanifest:"application/manifest+json",webp:"image/webp",woff:"font/woff",woff2:"font/woff2",xhtml:"application/xhtml+xml",xml:"application/xml",zip:"application/zip","3gp":"video/3gpp","3g2":"video/3gpp2",gltf:"model/gltf+json",glb:"model/gltf-binary"},ar=nr,or=(...e)=>{let t=e.filter(n=>n!=="").join("/");t=t.replace(new RegExp("(?<=\\/)\\/+","g"),"");const r=t.split("/"),s=[];for(const n of r)n===".."&&s.length>0&&s.at(-1)!==".."?s.pop():n!=="."&&s.push(n);return s.join("/")||"."},Et={br:".br",zstd:".zst",gzip:".gz"},ir=Object.keys(Et),cr="index.html",lr=e=>{const t=e.root??"./",r=e.path,s=e.join??or;return async(n,a)=>{var d,h,p,g;if(n.finalized)return a();let o;if(e.path)o=e.path;else try{if(o=decodeURIComponent(n.req.path),/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(o))throw new Error}catch{return await((d=e.onNotFound)==null?void 0:d.call(e,n.req.path,n)),a()}let i=s(t,!r&&e.rewriteRequestPath?e.rewriteRequestPath(o):o);e.isDir&&await e.isDir(i)&&(i=s(i,cr));const c=e.getContent;let l=await c(i,n);if(l instanceof Response)return n.newResponse(l.body,l);if(l){const w=e.mimes&&ze(i,e.mimes)||ze(i);if(n.header("Content-Type",w||"application/octet-stream"),e.precompressed&&(!w||sr.test(w))){const N=new Set((h=n.req.header("Accept-Encoding"))==null?void 0:h.split(",").map(v=>v.trim()));for(const v of ir){if(!N.has(v))continue;const R=await c(i+Et[v],n);if(R){l=R,n.header("Content-Encoding",v),n.header("Vary","Accept-Encoding",{append:!0});break}}}return await((p=e.onFound)==null?void 0:p.call(e,i,n)),n.body(l)}await((g=e.onNotFound)==null?void 0:g.call(e,i,n)),await a()}},ur=async(e,t)=>{let r;t&&t.manifest?typeof t.manifest=="string"?r=JSON.parse(t.manifest):r=t.manifest:typeof __STATIC_CONTENT_MANIFEST=="string"?r=JSON.parse(__STATIC_CONTENT_MANIFEST):r=__STATIC_CONTENT_MANIFEST;let s;t&&t.namespace?s=t.namespace:s=__STATIC_CONTENT;const n=r[e];if(!n)return null;const a=await s.get(n,{type:"stream"});return a||null},dr=e=>async function(r,s){return lr({...e,getContent:async a=>ur(a,{manifest:e.manifest,namespace:e.namespace?e.namespace:r.env?r.env.__STATIC_CONTENT:void 0})})(r,s)},hr=e=>dr(e),me={};const T=new mt;T.use("/api/*",rr());T.use("/static/*",hr({root:"./public"}));async function Tt(e){const r=new TextEncoder().encode(e),s=await crypto.subtle.digest("SHA-256",r);return Array.from(new Uint8Array(s)).map(o=>o.toString(16).padStart(2,"0")).join("")}T.get("/api/init-db",async e=>{try{const t=e.env.DB;return console.log("🔄 Initialisation des tables leads et clients..."),await t.prepare(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        source_ref TEXT NOT NULL UNIQUE,
        from_name TEXT,
        from_email TEXT,
        subject TEXT,
        snippet TEXT,
        body TEXT,
        stage TEXT NOT NULL DEFAULT 'new',
        priority TEXT DEFAULT 'normal',
        confidence INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run(),await t.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)
    `).run(),await t.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leads_from_email ON leads(from_email)
    `).run(),await t.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        company TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      )
    `).run(),await t.prepare(`
      CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id)
    `).run(),console.log("✅ Tables leads et clients initialisées"),e.json({success:!0,message:"Tables leads et clients initialisées avec succès"})}catch(t){return console.error("❌ Erreur init-db:",t),e.json({error:"Erreur lors de l'initialisation de la base de données",details:t instanceof Error?t.message:String(t)},500)}});T.post("/api/auth/login",async e=>{try{const{email:t,password:r}=await e.req.json();if(!t||!r)return e.json({error:"Email et mot de passe requis"},400);const s=await Tt(r),n=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE email = ? AND password = ?").bind(t,s).first();if(!n)return e.json({error:"Email ou mot de passe incorrect"},401);const a=btoa(JSON.stringify({id:n.id,email:n.email,exp:Date.now()+24*60*60*1e3}));return e.json({token:a,user:{id:n.id,email:n.email,name:n.name,role:n.role,company_name:n.company_name}})}catch(t){return console.error("Login error:",t),e.json({error:"Erreur serveur"},500)}});T.post("/api/auth/signup",async e=>{try{const{email:t,name:r,password:s,company_name:n}=await e.req.json();if(!t||!r||!s)return e.json({error:"Tous les champs sont requis"},400);if(await e.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(t).first())return e.json({error:"Un compte existe déjà avec cet email"},409);const o=await Tt(s),i=await e.env.DB.prepare("INSERT INTO users (email, name, password, role, company_name) VALUES (?, ?, ?, ?, ?)").bind(t,r,o,"user",n||"Ma Société").run(),c=btoa(JSON.stringify({id:i.meta.last_row_id,email:t,exp:Date.now()+24*60*60*1e3}));return e.json({token:c,user:{id:i.meta.last_row_id,email:t,name:r,role:"user",company_name:n||"Ma Société"}},201)}catch(t){return console.error("Signup error:",t),e.json({error:"Erreur serveur"},500)}});T.get("/api/auth/gmail",async e=>{const r=`${new URL(e.req.url).origin}/api/auth/gmail/callback`,s=e.env.GOOGLE_CLIENT_ID||"YOUR_GOOGLE_CLIENT_ID",n=["https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/userinfo.email","openid","profile"].join(" "),a=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${s}&redirect_uri=${encodeURIComponent(r)}&response_type=code&scope=${encodeURIComponent(n)}&access_type=offline&prompt=consent`;return e.redirect(a,302)});T.get("/api/auth/gmail/callback",async e=>{try{const t=new URL(e.req.url),r=t.searchParams.get("code");if(!r)return e.text("Code manquant",400);const s=e.env.GOOGLE_CLIENT_ID||"YOUR_GOOGLE_CLIENT_ID",n=e.env.GOOGLE_CLIENT_SECRET||"YOUR_GOOGLE_CLIENT_SECRET",a=`${t.origin}/api/auth/gmail/callback`,i=await(await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code:r,client_id:s,client_secret:n,redirect_uri:a,grant_type:"authorization_code"})})).json();if(!i.access_token)return e.text("Erreur d'authentification",401);const l=await(await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:`Bearer ${i.access_token}`}})).json(),d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connexion Gmail réussie</title>
      </head>
      <body>
        <script>
          localStorage.setItem('gmail_access_token', '${i.access_token}');
          localStorage.setItem('gmail_refresh_token', '${i.refresh_token||""}');
          localStorage.setItem('gmail_email', '${l.email}');
          localStorage.setItem('gmail_expires_at', '${Date.now()+i.expires_in*1e3}');
          
          alert('✅ Gmail connecté avec succès !');
          window.location.href = '/';
        <\/script>
      </body>
      </html>
    `;return e.html(d)}catch(t){return console.error("Gmail callback error:",t),e.text("Erreur serveur",500)}});T.post("/api/init-db",async e=>{try{return console.log("🔧 Initializing database tables..."),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        company_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        company TEXT,
        status TEXT DEFAULT 'lead',
        archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        client_id INTEGER,
        title TEXT NOT NULL DEFAULT 'Nouveau dossier',
        amount REAL DEFAULT 0,
        stage TEXT DEFAULT 'lead',
        probability INTEGER DEFAULT 30,
        expected_close_date TEXT,
        notes TEXT,
        archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL DEFAULT 'email',
        source_ref TEXT NOT NULL UNIQUE,
        from_name TEXT,
        from_email TEXT,
        subject TEXT,
        snippet TEXT,
        body TEXT,
        stage TEXT NOT NULL DEFAULT 'new',
        priority TEXT DEFAULT 'normal',
        confidence INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        title TEXT,
        amount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        deal_id INTEGER,
        type TEXT DEFAULT 'event',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(),await e.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_categories (
        email_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run(),console.log("✅ Database tables initialized"),e.json({success:!0,message:"Database initialized successfully",tables:["users","clients","deals","leads","quotes","tasks","calendar_events","email_categories"]})}catch(t){return console.error("Database initialization error:",t),e.json({error:"Erreur initialisation base de données",details:t instanceof Error?t.message:String(t)},500)}});T.get("/api/emails",async e=>{try{const t=e.req.query("access_token");if(!t)return e.json({error:"Access token manquant"},401);const r=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox",{headers:{Authorization:`Bearer ${t}`}});if(!r.ok)return e.json({error:"Erreur Gmail API"},r.status);const a=((await r.json()).messages||[]).slice(0,10).map(async c=>(await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${c.id}`,{headers:{Authorization:`Bearer ${t}`}})).json()),i=(await Promise.all(a)).map(c=>{var w,N,v,R,x;const l=((w=c.payload)==null?void 0:w.headers)||[],d=((N=l.find(O=>O.name==="Subject"))==null?void 0:N.value)||"(Sans objet)",h=((v=l.find(O=>O.name==="From"))==null?void 0:v.value)||"Inconnu",p=((R=l.find(O=>O.name==="Date"))==null?void 0:R.value)||"",g=((x=l.find(O=>O.name==="To"))==null?void 0:x.value)||"";return{id:c.id,threadId:c.threadId,subject:d,from:h,to:g,date:p,snippet:c.snippet||"",labelIds:c.labelIds||[]}});return e.json({emails:i})}catch(t){return console.error("Emails fetch error:",t),e.json({error:"Erreur serveur"},500)}});T.get("/api/emails/thread/:threadId",async e=>{try{const t=e.req.query("access_token"),r=e.req.param("threadId");if(!t)return e.json({error:"Access token manquant"},401);const s=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${r}`,{headers:{Authorization:`Bearer ${t}`}});if(!s.ok)return e.json({error:"Erreur Gmail API"},s.status);const n=await s.json(),o=(n.messages||[]).map(i=>{var w,N,v,R,x,O,W;const c=((w=i.payload)==null?void 0:w.headers)||[],l=((N=c.find(A=>A.name==="Subject"))==null?void 0:N.value)||"(Sans objet)",d=((v=c.find(A=>A.name==="From"))==null?void 0:v.value)||"Inconnu",h=((R=c.find(A=>A.name==="To"))==null?void 0:R.value)||"",p=((x=c.find(A=>A.name==="Date"))==null?void 0:x.value)||"";let g="";if(i.payload.parts){const A=i.payload.parts.find(Le=>Le.mimeType==="text/plain");A&&((O=A.body)!=null&&O.data)&&(g=atob(A.body.data.replace(/-/g,"+").replace(/_/g,"/")))}else(W=i.payload.body)!=null&&W.data&&(g=atob(i.payload.body.data.replace(/-/g,"+").replace(/_/g,"/")));return{id:i.id,subject:l,from:d,to:h,date:p,snippet:i.snippet||"",body:g||i.snippet||"",labelIds:i.labelIds||[]}});return e.json({threadId:n.id,messages:o})}catch(t){return console.error("Thread fetch error:",t),e.json({error:"Erreur serveur"},500)}});T.post("/api/emails/classify",async e=>{try{const{emails:t}=await e.req.json();if(!t||!Array.isArray(t))return e.json({error:"Emails requis"},400);const r=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,s=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://www.genspark.ai/api/llm_proxy/v1";if(!r)return e.json({error:"OpenAI API key non configurée"},500);const n=await Promise.all(t.map(async a=>{var o,i;try{const c=`Tu es un assistant intelligent qui classe les emails professionnels.

Email à classifier :
- Sujet : ${a.subject}
- Expéditeur : ${a.from}
- Aperçu : ${a.snippet}

Catégories disponibles :
1. prospect - Demandes de devis, projets, nouveaux clients potentiels
2. factures - Factures, paiements, règlements
3. commandes - Commandes, achats, livraisons
4. clients - Communications avec les clients existants
5. fournisseurs - Communications avec les fournisseurs
6. urgent - Messages urgents ou importants
7. autres - Tout le reste

Réponds UNIQUEMENT avec un JSON au format :
{
  "category": "nom_categorie",
  "confidence": 0.95,
  "reason": "Raison courte",
  "priority": "high|medium|low",
  "suggested_action": "Action suggérée"
}

Ne rajoute AUCUN texte avant ou après le JSON.`,l=await fetch(`${s}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Tu es un assistant de classification d'emails. Réponds UNIQUEMENT en JSON valide."},{role:"user",content:c}],temperature:.3,max_tokens:200})});if(!l.ok)throw new Error(`OpenAI API error: ${l.status}`);const h=((i=(o=(await l.json()).choices[0])==null?void 0:o.message)==null?void 0:i.content)||"{}";let p;try{const g=h.match(/\{[\s\S]*\}/);p=g?JSON.parse(g[0]):{}}catch{p={category:"autres",confidence:.5,reason:"Erreur parsing",priority:"low"}}return{...a,ai_category:p.category||"autres",ai_confidence:p.confidence||.5,ai_reason:p.reason||"",ai_priority:p.priority||"medium",ai_suggested_action:p.suggested_action||""}}catch(c){return console.error("Classification error:",c),{...a,ai_category:"autres",ai_confidence:0,ai_reason:"Erreur classification",ai_priority:"medium"}}}));return e.json({emails:n})}catch(t){return console.error("Classify error:",t),e.json({error:"Erreur serveur"},500)}});T.post("/api/emails/send",async e=>{try{const{to:t,subject:r,message:s,accessToken:n,inReplyTo:a,threadId:o}=await e.req.json();if(!t||!r||!s||!n)return e.json({error:"Paramètres manquants"},400);const i=[`To: ${t}`,`Subject: ${r}`,"Content-Type: text/plain; charset=utf-8","MIME-Version: 1.0"];a&&(i.push(`In-Reply-To: ${a}`),i.push(`References: ${a}`)),i.push(""),i.push(s);const c=i.join(`\r
`),l=btoa(unescape(encodeURIComponent(c))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),d="https://gmail.googleapis.com/gmail/v1/users/me/messages/send",h={raw:l};o&&(h.threadId=o);const p=await fetch(d,{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify(h)});if(!p.ok){const w=await p.text();return console.error("Gmail send error:",w),e.json({error:"Erreur envoi email"},p.status)}const g=await p.json();return e.json({success:!0,messageId:g.id})}catch(t){return console.error("Send email error:",t),e.json({error:"Erreur serveur"},500)}});T.post("/api/emails/generate-reply",async e=>{var t,r;try{const{email:s,tone:n,instruction:a}=await e.req.json(),o=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,i=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://api.openai.com/v1";if(!o)return e.json({error:"OpenAI non configuré"},500);const c=`Tu es un assistant qui aide à rédiger des emails professionnels.

Email reçu :
De : ${s.from}
Objet : ${s.subject}
Contenu : ${s.snippet}

${a}

Rédige une réponse appropriée en français. Commence directement par le contenu de la réponse (pas de "Cher X," si l'email original n'est pas formel). Sois naturel et professionnel.

IMPORTANT : Termine TOUJOURS la réponse par :

Cordialement,
Guillaume PINOIT
PSM Portails Sur Mesure
06 60 60 45 11`,l=await fetch(`${i}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Tu es un assistant qui aide à rédiger des emails professionnels. Réponds directement avec le contenu de l'email, sans formule de politesse initiale excessive."},{role:"user",content:c}],temperature:.7,max_tokens:500})});if(!l.ok)throw new Error("OpenAI API error");const h=((r=(t=(await l.json()).choices[0])==null?void 0:t.message)==null?void 0:r.content)||"";return e.json({reply:h.trim()})}catch(s){return console.error("Generate reply error:",s),e.json({error:"Erreur génération IA"},500)}});T.post("/api/emails/improve-text",async e=>{var t,r;try{const{text:s}=await e.req.json(),n=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,a=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://api.openai.com/v1";if(!n)return e.json({error:"OpenAI non configuré"},500);const o=`Améliore ce texte d'email en le rendant plus professionnel, clair et courtois. Corrige les fautes si besoin. Garde le même ton général.

Texte original :
${s}

Texte amélioré :`,i=await fetch(`${a}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Tu es un assistant qui améliore des emails. Réponds uniquement avec le texte amélioré."},{role:"user",content:o}],temperature:.5,max_tokens:500})});if(!i.ok)throw new Error("OpenAI API error");const l=((r=(t=(await i.json()).choices[0])==null?void 0:t.message)==null?void 0:r.content)||"";return e.json({improved:l.trim()})}catch(s){return console.error("Improve text error:",s),e.json({error:"Erreur amélioration IA"},500)}});T.get("/api/profile",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ",""),s=JSON.parse(atob(r)),n=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE id = ?").bind(s.id).first();return n?e.json(n):e.json({error:"Utilisateur non trouvé"},404)}catch{return e.json({error:"Token invalide"},401)}});T.put("/api/profile",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ",""),s=JSON.parse(atob(r)),{name:n,company_name:a}=await e.req.json();await e.env.DB.prepare("UPDATE users SET name = ?, company_name = ? WHERE id = ?").bind(n,a,s.id).run();const o=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE id = ?").bind(s.id).first();return e.json(o)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/clients",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const s=e.req.query("archived")==="true"?"SELECT * FROM clients WHERE archived = 1 ORDER BY created_at DESC":"SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC",n=await e.env.DB.prepare(s).all();return e.json({clients:n.results||[]})}catch{return e.json({clients:[]})}});T.post("/api/clients",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json();if(r.email){const n=await e.env.DB.prepare("SELECT * FROM clients WHERE email = ? LIMIT 1").bind(r.email).first();if(n)return console.log("Client existant trouvé pour",r.email),e.json({id:n.id,...n,_existing:!0},200)}const s=await e.env.DB.prepare("INSERT INTO clients (name, email, phone, company, status) VALUES (?, ?, ?, ?, ?)").bind(r.name||null,r.email||null,r.phone||null,r.company||null,r.status||"lead").run();return e.json({id:s.meta.last_row_id,...r},201)}catch(t){return console.error("Error creating client:",t),e.json({error:"Erreur serveur",details:t instanceof Error?t.message:String(t)},500)}});T.get("/api/deals",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const s=e.req.query("archived")==="true"?"SELECT * FROM deals WHERE archived = 1 ORDER BY created_at DESC":"SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC",n=await e.env.DB.prepare(s).all();return e.json({deals:n.results||[]})}catch(t){return console.error("Error fetching deals:",t),e.json({deals:[]})}});T.post("/api/deals",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ","");let s;try{s=JSON.parse(atob(r))}catch(o){return console.error("❌ Erreur décodage token:",o),e.json({error:"Token invalide",details:"Le token d'authentification est mal formé ou corrompu"},401)}const n=await e.req.json(),a=await e.env.DB.prepare("INSERT INTO deals (user_id, client_id, title, amount, stage, probability, expected_close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(s.id,n.client_id||null,n.title||"Nouveau dossier",n.amount||0,n.stage||"lead",n.probability||30,n.expected_close_date||null,n.notes||null).run();return e.json({id:a.meta.last_row_id,...n},201)}catch(t){return console.error("Error creating deal:",t),e.json({error:"Erreur serveur",details:t instanceof Error?t.message:String(t)},500)}});T.get("/api/quotes",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.env.DB.prepare("SELECT * FROM quotes ORDER BY created_at DESC").all();return e.json(r.results||[])}catch(t){return console.error("Error fetching quotes:",t),e.json([])}});T.post("/api/quotes",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO quotes (quote_number, client_id, amount, status, notes) VALUES (?, ?, ?, ?, ?)").bind(r.quote_number,r.client_id,r.amount||0,r.status||"brouillon",r.notes||null).run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/tasks",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.env.DB.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();return e.json(r.results||[])}catch(t){return console.error("Error fetching tasks:",t),e.json([])}});T.post("/api/tasks",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO tasks (title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?)").bind(r.title,r.description||null,r.due_date||null,r.priority||"medium",r.status||"todo").run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/calendar-events",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.env.DB.prepare("SELECT * FROM calendar_events ORDER BY start_date ASC").all();return e.json(r.results||[])}catch(t){return console.error("Error fetching calendar events:",t),e.json([])}});T.post("/api/calendar-events",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO calendar_events (title, description, start_date, end_date, deal_id) VALUES (?, ?, ?, ?, ?)").bind(r.title,r.description||null,r.start_date,r.end_date||null,r.deal_id||null).run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/notifications",async e=>{try{return e.req.header("Authorization")?e.json({notifications:[],unread_count:0}):e.json({error:"Non autorisé"},401)}catch(t){return console.error("Error fetching notifications:",t),e.json({notifications:[],unread_count:0})}});T.post("/api/notifications/:id/read",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});T.post("/api/notifications/read-all",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});T.delete("/api/notifications/:id",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});T.post("/api/notifications/generate",async e=>{try{return e.req.header("Authorization")?e.json({success:!0,notifications:[]}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/reports/weekly/history",async e=>{try{return e.req.header("Authorization")?e.json({reports:[]}):e.json({error:"Non autorisé"},401)}catch(t){return console.error("Error fetching reports:",t),e.json({reports:[]})}});T.post("/api/reports/weekly/generate",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=new Date,s=Math.ceil(r.getDate()/7);return e.json({report:{id:Date.now(),week:s,year:r.getFullYear(),stats:{new_leads:0,quotes_sent:0,quotes_accepted:0,revenue:0,time_saved:"0h0m"}}})}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/api/stats/advanced",async e=>{try{return e.req.header("Authorization")?e.json({totalTimeManual:285,totalTimeKarl:65,timeSaved:220,percentageSaved:77,tasksAutomated:15,avgTimePerTask:14.7}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});T.get("/",e=>e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="KARL CRM - Votre assistant commercial intelligent pour gérer clients, devis et tâches">
        <meta name="theme-color" content="#2563eb">
        <title>KARL CRM - Votre Assistant Commercial Intelligent</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <link rel="icon" type="image/svg+xml" href="/icons/icon-512.svg">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="KARL CRM">
        
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
        <script src="/static/karl-app.js"><\/script>
        
        <!-- Service Worker Registration - DÉSACTIVÉ pour debug -->
        <script>
          // Service Worker temporairement désactivé
          console.log('⚠️ Service Worker désactivé pour éviter les erreurs de cache');
          
          // Désenregistrer tous les SW existants
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              for (let registration of registrations) {
                registration.unregister().then(() => {
                  console.log('🗑️ Service Worker désenregistré');
                });
              }
            });
          }
        <\/script>
    </body>
    </html>
  `));T.get("/*",e=>e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="KARL CRM - Votre assistant commercial intelligent pour gérer clients, devis et tâches">
        <meta name="theme-color" content="#2563eb">
        <title>KARL CRM - Votre Assistant Commercial Intelligent</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <link rel="icon" type="image/svg+xml" href="/icons/icon-512.svg">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="KARL CRM">
        
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
        <script src="/static/karl-app.js"><\/script>
        
        <!-- Service Worker Registration - DÉSACTIVÉ pour debug -->
        <script>
          // Service Worker temporairement désactivé
          console.log('⚠️ Service Worker désactivé pour éviter les erreurs de cache');
          
          // Désenregistrer tous les SW existants
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              for (let registration of registrations) {
                registration.unregister().then(() => {
                  console.log('🗑️ Service Worker désenregistré');
                });
              }
            });
          }
        <\/script>
    </body>
    </html>
  `));const Ye=new mt,pr=Object.assign({"/src/index.tsx":T});let gt=!1;for(const[,e]of Object.entries(pr))e&&(Ye.route("/",e),Ye.notFound(e.notFoundHandler),gt=!0);if(!gt)throw new Error("Can't import modules from ['/src/index.tsx','/app/server.ts']");export{Ye as default};
