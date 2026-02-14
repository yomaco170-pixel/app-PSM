var yt=Object.defineProperty;var Be=e=>{throw TypeError(e)};var _t=(e,t,r)=>t in e?yt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var f=(e,t,r)=>_t(e,typeof t!="symbol"?t+"":t,r),Ue=(e,t,r)=>t.has(e)||Be("Cannot "+r);var u=(e,t,r)=>(Ue(e,t,"read from private field"),r?r.call(e):t.get(e)),g=(e,t,r)=>t.has(e)?Be("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),m=(e,t,r,s)=>(Ue(e,t,"write to private field"),s?s.call(e,r):t.set(e,r),r),y=(e,t,r)=>(Ue(e,t,"access private method"),r);var ke=(e,t,r,s)=>({set _(n){m(e,t,n,r)},get _(){return u(e,t,s)}});var Xe=(e,t,r)=>(s,n)=>{let o=-1;return a(0);async function a(i){if(i<=o)throw new Error("next() called multiple times");o=i;let l,c=!1,d;if(e[i]?(d=e[i][0][0],s.req.routeIndex=i):d=i===e.length&&n||void 0,d)try{l=await d(s,()=>a(i+1))}catch(p){if(p instanceof Error&&t)s.error=p,l=await t(p,s),c=!0;else throw p}else s.finalized===!1&&r&&(l=await r(s));return l&&(s.finalized===!1||c)&&(s.res=l),s}},Rt=Symbol(),wt=async(e,t=Object.create(null))=>{const{all:r=!1,dot:s=!1}=t,o=(e instanceof at?e.raw.headers:e.headers).get("Content-Type");return o!=null&&o.startsWith("multipart/form-data")||o!=null&&o.startsWith("application/x-www-form-urlencoded")?At(e,{all:r,dot:s}):{}};async function At(e,t){const r=await e.formData();return r?Nt(r,t):{}}function Nt(e,t){const r=Object.create(null);return e.forEach((s,n)=>{t.all||n.endsWith("[]")?It(r,n,s):r[n]=s}),t.dot&&Object.entries(r).forEach(([s,n])=>{s.includes(".")&&(jt(r,s,n),delete r[s])}),r}var It=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},jt=(e,t,r)=>{let s=e;const n=t.split(".");n.forEach((o,a)=>{a===n.length-1?s[o]=r:((!s[o]||typeof s[o]!="object"||Array.isArray(s[o])||s[o]instanceof File)&&(s[o]=Object.create(null)),s=s[o])})},et=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},St=e=>{const{groups:t,path:r}=Ot(e),s=et(r);return bt(s,t)},Ot=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(r,s)=>{const n=`@${s}`;return t.push([n,r]),n}),{groups:t,path:e}},bt=(e,t)=>{for(let r=t.length-1;r>=0;r--){const[s]=t[r];for(let n=e.length-1;n>=0;n--)if(e[n].includes(s)){e[n]=e[n].replace(s,t[r][1]);break}}return e},Ie={},Dt=(e,t)=>{if(e==="*")return"*";const r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){const s=`${e}#${t}`;return Ie[s]||(r[2]?Ie[s]=t&&t[0]!==":"&&t[0]!=="*"?[s,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:Ie[s]=[e,r[1],!0]),Ie[s]}return null},Fe=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Lt=e=>Fe(e,decodeURI),tt=e=>{const t=e.url,r=t.indexOf("/",t.indexOf(":")+4);let s=r;for(;s<t.length;s++){const n=t.charCodeAt(s);if(n===37){const o=t.indexOf("?",s),a=t.slice(r,o===-1?void 0:o);return Lt(a.includes("%25")?a.replace(/%25/g,"%2525"):a)}else if(n===63)break}return t.slice(r,s)},Ct=e=>{const t=tt(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ae=(e,t,...r)=>(r.length&&(t=ae(t,...r)),`${(e==null?void 0:e[0])==="/"?"":"/"}${e}${t==="/"?"":`${(e==null?void 0:e.at(-1))==="/"?"":"/"}${(t==null?void 0:t[0])==="/"?t.slice(1):t}`}`),rt=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),r=[];let s="";return t.forEach(n=>{if(n!==""&&!/\:/.test(n))s+="/"+n;else if(/\:/.test(n))if(/\?/.test(n)){r.length===0&&s===""?r.push("/"):r.push(s);const o=n.replace("?","");s+="/"+o,r.push(s)}else s+="/"+n}),r.filter((n,o,a)=>a.indexOf(n)===o)},Me=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Fe(e,nt):e):e,st=(e,t,r)=>{let s;if(!r&&t&&!/[%+]/.test(t)){let a=e.indexOf("?",8);if(a===-1)return;for(e.startsWith(t,a+1)||(a=e.indexOf(`&${t}`,a+1));a!==-1;){const i=e.charCodeAt(a+t.length+1);if(i===61){const l=a+t.length+2,c=e.indexOf("&",l);return Me(e.slice(l,c===-1?void 0:c))}else if(i==38||isNaN(i))return"";a=e.indexOf(`&${t}`,a+1)}if(s=/[%+]/.test(e),!s)return}const n={};s??(s=/[%+]/.test(e));let o=e.indexOf("?",8);for(;o!==-1;){const a=e.indexOf("&",o+1);let i=e.indexOf("=",o);i>a&&a!==-1&&(i=-1);let l=e.slice(o+1,i===-1?a===-1?void 0:a:i);if(s&&(l=Me(l)),o=a,l==="")continue;let c;i===-1?c="":(c=e.slice(i+1,a===-1?void 0:a),s&&(c=Me(c))),r?(n[l]&&Array.isArray(n[l])||(n[l]=[]),n[l].push(c)):n[l]??(n[l]=c)}return t?n[t]:n},xt=st,Ut=(e,t)=>st(e,t,!0),nt=decodeURIComponent,$e=e=>Fe(e,nt),le,L,B,ot,it,He,X,Ye,at=(Ye=class{constructor(e,t="/",r=[[]]){g(this,B);f(this,"raw");g(this,le);g(this,L);f(this,"routeIndex",0);f(this,"path");f(this,"bodyCache",{});g(this,X,e=>{const{bodyCache:t,raw:r}=this,s=t[e];if(s)return s;const n=Object.keys(t)[0];return n?t[n].then(o=>(n==="json"&&(o=JSON.stringify(o)),new Response(o)[e]())):t[e]=r[e]()});this.raw=e,this.path=t,m(this,L,r),m(this,le,{})}param(e){return e?y(this,B,ot).call(this,e):y(this,B,it).call(this)}query(e){return xt(this.url,e)}queries(e){return Ut(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((r,s)=>{t[s]=r}),t}async parseBody(e){var t;return(t=this.bodyCache).parsedBody??(t.parsedBody=await wt(this,e))}json(){return u(this,X).call(this,"text").then(e=>JSON.parse(e))}text(){return u(this,X).call(this,"text")}arrayBuffer(){return u(this,X).call(this,"arrayBuffer")}blob(){return u(this,X).call(this,"blob")}formData(){return u(this,X).call(this,"formData")}addValidatedData(e,t){u(this,le)[e]=t}valid(e){return u(this,le)[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[Rt](){return u(this,L)}get matchedRoutes(){return u(this,L)[0].map(([[,e]])=>e)}get routePath(){return u(this,L)[0].map(([[,e]])=>e)[this.routeIndex].path}},le=new WeakMap,L=new WeakMap,B=new WeakSet,ot=function(e){const t=u(this,L)[0][this.routeIndex][1][e],r=y(this,B,He).call(this,t);return r&&/\%/.test(r)?$e(r):r},it=function(){const e={},t=Object.keys(u(this,L)[0][this.routeIndex][1]);for(const r of t){const s=y(this,B,He).call(this,u(this,L)[0][this.routeIndex][1][r]);s!==void 0&&(e[r]=/\%/.test(s)?$e(s):s)}return e},He=function(e){return u(this,L)[1]?u(this,L)[1][e]:e},X=new WeakMap,Ye),Mt={Stringify:1},lt=async(e,t,r,s,n)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const o=e.callbacks;return o!=null&&o.length?(n?n[0]+=e:n=[e],Promise.all(o.map(i=>i({phase:t,buffer:n,context:s}))).then(i=>Promise.all(i.filter(Boolean).map(l=>lt(l,t,!1,s,n))).then(()=>n[0]))):Promise.resolve(e)},Pt="text/plain; charset=UTF-8",Pe=(e,t)=>({"Content-Type":e,...t}),ye,_e,P,ce,H,b,Re,ue,de,Q,we,Ae,$,oe,Ke,Ht=(Ke=class{constructor(e,t){g(this,$);g(this,ye);g(this,_e);f(this,"env",{});g(this,P);f(this,"finalized",!1);f(this,"error");g(this,ce);g(this,H);g(this,b);g(this,Re);g(this,ue);g(this,de);g(this,Q);g(this,we);g(this,Ae);f(this,"render",(...e)=>(u(this,ue)??m(this,ue,t=>this.html(t)),u(this,ue).call(this,...e)));f(this,"setLayout",e=>m(this,Re,e));f(this,"getLayout",()=>u(this,Re));f(this,"setRenderer",e=>{m(this,ue,e)});f(this,"header",(e,t,r)=>{this.finalized&&m(this,b,new Response(u(this,b).body,u(this,b)));const s=u(this,b)?u(this,b).headers:u(this,Q)??m(this,Q,new Headers);t===void 0?s.delete(e):r!=null&&r.append?s.append(e,t):s.set(e,t)});f(this,"status",e=>{m(this,ce,e)});f(this,"set",(e,t)=>{u(this,P)??m(this,P,new Map),u(this,P).set(e,t)});f(this,"get",e=>u(this,P)?u(this,P).get(e):void 0);f(this,"newResponse",(...e)=>y(this,$,oe).call(this,...e));f(this,"body",(e,t,r)=>y(this,$,oe).call(this,e,t,r));f(this,"text",(e,t,r)=>!u(this,Q)&&!u(this,ce)&&!t&&!r&&!this.finalized?new Response(e):y(this,$,oe).call(this,e,t,Pe(Pt,r)));f(this,"json",(e,t,r)=>y(this,$,oe).call(this,JSON.stringify(e),t,Pe("application/json",r)));f(this,"html",(e,t,r)=>{const s=n=>y(this,$,oe).call(this,n,t,Pe("text/html; charset=UTF-8",r));return typeof e=="object"?lt(e,Mt.Stringify,!1,{}).then(s):s(e)});f(this,"redirect",(e,t)=>{const r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)});f(this,"notFound",()=>(u(this,de)??m(this,de,()=>new Response),u(this,de).call(this,this)));m(this,ye,e),t&&(m(this,H,t.executionCtx),this.env=t.env,m(this,de,t.notFoundHandler),m(this,Ae,t.path),m(this,we,t.matchResult))}get req(){return u(this,_e)??m(this,_e,new at(u(this,ye),u(this,Ae),u(this,we))),u(this,_e)}get event(){if(u(this,H)&&"respondWith"in u(this,H))return u(this,H);throw Error("This context has no FetchEvent")}get executionCtx(){if(u(this,H))return u(this,H);throw Error("This context has no ExecutionContext")}get res(){return u(this,b)||m(this,b,new Response(null,{headers:u(this,Q)??m(this,Q,new Headers)}))}set res(e){if(u(this,b)&&e){e=new Response(e.body,e);for(const[t,r]of u(this,b).headers.entries())if(t!=="content-type")if(t==="set-cookie"){const s=u(this,b).headers.getSetCookie();e.headers.delete("set-cookie");for(const n of s)e.headers.append("set-cookie",n)}else e.headers.set(t,r)}m(this,b,e),this.finalized=!0}get var(){return u(this,P)?Object.fromEntries(u(this,P)):{}}},ye=new WeakMap,_e=new WeakMap,P=new WeakMap,ce=new WeakMap,H=new WeakMap,b=new WeakMap,Re=new WeakMap,ue=new WeakMap,de=new WeakMap,Q=new WeakMap,we=new WeakMap,Ae=new WeakMap,$=new WeakSet,oe=function(e,t,r){const s=u(this,b)?new Headers(u(this,b).headers):u(this,Q)??new Headers;if(typeof t=="object"&&"headers"in t){const o=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[a,i]of o)a.toLowerCase()==="set-cookie"?s.append(a,i):s.set(a,i)}if(r)for(const[o,a]of Object.entries(r))if(typeof a=="string")s.set(o,a);else{s.delete(o);for(const i of a)s.append(o,i)}const n=typeof t=="number"?t:(t==null?void 0:t.status)??u(this,ce);return new Response(e,{status:n,headers:s})},Ke),A="ALL",Ft="all",qt=["get","post","put","delete","options","patch"],ct="Can not add a route since the matcher is already built.",ut=class extends Error{},Bt="__COMPOSED_HANDLER",kt=e=>e.text("404 Not Found",404),ze=(e,t)=>{if("getResponse"in e){const r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},C,N,dt,x,V,je,Se,he,Xt=(he=class{constructor(t={}){g(this,N);f(this,"get");f(this,"post");f(this,"put");f(this,"delete");f(this,"options");f(this,"patch");f(this,"all");f(this,"on");f(this,"use");f(this,"router");f(this,"getPath");f(this,"_basePath","/");g(this,C,"/");f(this,"routes",[]);g(this,x,kt);f(this,"errorHandler",ze);f(this,"onError",t=>(this.errorHandler=t,this));f(this,"notFound",t=>(m(this,x,t),this));f(this,"fetch",(t,...r)=>y(this,N,Se).call(this,t,r[1],r[0],t.method));f(this,"request",(t,r,s,n)=>t instanceof Request?this.fetch(r?new Request(t,r):t,s,n):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ae("/",t)}`,r),s,n)));f(this,"fire",()=>{addEventListener("fetch",t=>{t.respondWith(y(this,N,Se).call(this,t.request,t,void 0,t.request.method))})});[...qt,Ft].forEach(o=>{this[o]=(a,...i)=>(typeof a=="string"?m(this,C,a):y(this,N,V).call(this,o,u(this,C),a),i.forEach(l=>{y(this,N,V).call(this,o,u(this,C),l)}),this)}),this.on=(o,a,...i)=>{for(const l of[a].flat()){m(this,C,l);for(const c of[o].flat())i.map(d=>{y(this,N,V).call(this,c.toUpperCase(),u(this,C),d)})}return this},this.use=(o,...a)=>(typeof o=="string"?m(this,C,o):(m(this,C,"*"),a.unshift(o)),a.forEach(i=>{y(this,N,V).call(this,A,u(this,C),i)}),this);const{strict:s,...n}=t;Object.assign(this,n),this.getPath=s??!0?t.getPath??tt:Ct}route(t,r){const s=this.basePath(t);return r.routes.map(n=>{var a;let o;r.errorHandler===ze?o=n.handler:(o=async(i,l)=>(await Xe([],r.errorHandler)(i,()=>n.handler(i,l))).res,o[Bt]=n.handler),y(a=s,N,V).call(a,n.method,n.path,o)}),this}basePath(t){const r=y(this,N,dt).call(this);return r._basePath=ae(this._basePath,t),r}mount(t,r,s){let n,o;s&&(typeof s=="function"?o=s:(o=s.optionHandler,s.replaceRequest===!1?n=l=>l:n=s.replaceRequest));const a=o?l=>{const c=o(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};n||(n=(()=>{const l=ae(this._basePath,t),c=l==="/"?0:l.length;return d=>{const p=new URL(d.url);return p.pathname=p.pathname.slice(c)||"/",new Request(p,d)}})());const i=async(l,c)=>{const d=await r(n(l.req.raw),...a(l));if(d)return d;await c()};return y(this,N,V).call(this,A,ae(t,"*"),i),this}},C=new WeakMap,N=new WeakSet,dt=function(){const t=new he({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,m(t,x,u(this,x)),t.routes=this.routes,t},x=new WeakMap,V=function(t,r,s){t=t.toUpperCase(),r=ae(this._basePath,r);const n={basePath:this._basePath,path:r,method:t,handler:s};this.router.add(t,r,[s,n]),this.routes.push(n)},je=function(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t},Se=function(t,r,s,n){if(n==="HEAD")return(async()=>new Response(null,await y(this,N,Se).call(this,t,r,s,"GET")))();const o=this.getPath(t,{env:s}),a=this.router.match(n,o),i=new Ht(t,{path:o,matchResult:a,env:s,executionCtx:r,notFoundHandler:u(this,x)});if(a[0].length===1){let c;try{c=a[0][0][0][0](i,async()=>{i.res=await u(this,x).call(this,i)})}catch(d){return y(this,N,je).call(this,d,i)}return c instanceof Promise?c.then(d=>d||(i.finalized?i.res:u(this,x).call(this,i))).catch(d=>y(this,N,je).call(this,d,i)):c??u(this,x).call(this,i)}const l=Xe(a[0],this.errorHandler,u(this,x));return(async()=>{try{const c=await l(i);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return y(this,N,je).call(this,c,i)}})()},he),ht=[];function $t(e,t){const r=this.buildAllMatchers(),s=(n,o)=>{const a=r[n]||r[A],i=a[2][o];if(i)return i;const l=o.match(a[0]);if(!l)return[[],ht];const c=l.indexOf("",1);return[a[1][c],l]};return this.match=s,s(e,t)}var be="[^/]+",ge=".*",ve="(?:|/.*)",ie=Symbol(),zt=new Set(".\\+*[^]$()");function Gt(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===ge||e===ve?1:t===ge||t===ve?-1:e===be?1:t===be?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Z,ee,U,se,Wt=(se=class{constructor(){g(this,Z);g(this,ee);g(this,U,Object.create(null))}insert(t,r,s,n,o){if(t.length===0){if(u(this,Z)!==void 0)throw ie;if(o)return;m(this,Z,r);return}const[a,...i]=t,l=a==="*"?i.length===0?["","",ge]:["","",be]:a==="/*"?["","",ve]:a.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let c;if(l){const d=l[1];let p=l[2]||be;if(d&&l[2]&&(p===".*"||(p=p.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(p))))throw ie;if(c=u(this,U)[p],!c){if(Object.keys(u(this,U)).some(h=>h!==ge&&h!==ve))throw ie;if(o)return;c=u(this,U)[p]=new se,d!==""&&m(c,ee,n.varIndex++)}!o&&d!==""&&s.push([d,u(c,ee)])}else if(c=u(this,U)[a],!c){if(Object.keys(u(this,U)).some(d=>d.length>1&&d!==ge&&d!==ve))throw ie;if(o)return;c=u(this,U)[a]=new se}c.insert(i,r,s,n,o)}buildRegExpStr(){const r=Object.keys(u(this,U)).sort(Gt).map(s=>{const n=u(this,U)[s];return(typeof u(n,ee)=="number"?`(${s})@${u(n,ee)}`:zt.has(s)?`\\${s}`:s)+n.buildRegExpStr()});return typeof u(this,Z)=="number"&&r.unshift(`#${u(this,Z)}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}},Z=new WeakMap,ee=new WeakMap,U=new WeakMap,se),De,Ne,Ve,Yt=(Ve=class{constructor(){g(this,De,{varIndex:0});g(this,Ne,new Wt)}insert(e,t,r){const s=[],n=[];for(let a=0;;){let i=!1;if(e=e.replace(/\{[^}]+\}/g,l=>{const c=`@\\${a}`;return n[a]=[c,l],a++,i=!0,c}),!i)break}const o=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let a=n.length-1;a>=0;a--){const[i]=n[a];for(let l=o.length-1;l>=0;l--)if(o[l].indexOf(i)!==-1){o[l]=o[l].replace(i,n[a][1]);break}}return u(this,Ne).insert(o,t,s,u(this,De),r),s}buildRegExp(){let e=u(this,Ne).buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const r=[],s=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(n,o,a)=>o!==void 0?(r[++t]=Number(o),"$()"):(a!==void 0&&(s[Number(a)]=++t),"")),[new RegExp(`^${e}`),r,s]}},De=new WeakMap,Ne=new WeakMap,Ve),Kt=[/^$/,[],Object.create(null)],Oe=Object.create(null);function pt(e){return Oe[e]??(Oe[e]=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`))}function Vt(){Oe=Object.create(null)}function Jt(e){var c;const t=new Yt,r=[];if(e.length===0)return Kt;const s=e.map(d=>[!/\*|\/:/.test(d[0]),...d]).sort(([d,p],[h,T])=>d?1:h?-1:p.length-T.length),n=Object.create(null);for(let d=0,p=-1,h=s.length;d<h;d++){const[T,_,j]=s[d];T?n[_]=[j.map(([R])=>[R,Object.create(null)]),ht]:p++;let v;try{v=t.insert(_,p,T)}catch(R){throw R===ie?new ut(_):R}T||(r[p]=j.map(([R,D])=>{const O=Object.create(null);for(D-=1;D>=0;D--){const[K,w]=v[D];O[K]=w}return[R,O]}))}const[o,a,i]=t.buildRegExp();for(let d=0,p=r.length;d<p;d++)for(let h=0,T=r[d].length;h<T;h++){const _=(c=r[d][h])==null?void 0:c[1];if(!_)continue;const j=Object.keys(_);for(let v=0,R=j.length;v<R;v++)_[j[v]]=i[_[j[v]]]}const l=[];for(const d in a)l[d]=r[a[d]];return[o,l,n]}function ne(e,t){if(e){for(const r of Object.keys(e).sort((s,n)=>n.length-s.length))if(pt(r).test(t))return[...e[r]]}}var z,G,Le,Et,Je,Qt=(Je=class{constructor(){g(this,Le);f(this,"name","RegExpRouter");g(this,z);g(this,G);f(this,"match",$t);m(this,z,{[A]:Object.create(null)}),m(this,G,{[A]:Object.create(null)})}add(e,t,r){var i;const s=u(this,z),n=u(this,G);if(!s||!n)throw new Error(ct);s[e]||[s,n].forEach(l=>{l[e]=Object.create(null),Object.keys(l[A]).forEach(c=>{l[e][c]=[...l[A][c]]})}),t==="/*"&&(t="*");const o=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const l=pt(t);e===A?Object.keys(s).forEach(c=>{var d;(d=s[c])[t]||(d[t]=ne(s[c],t)||ne(s[A],t)||[])}):(i=s[e])[t]||(i[t]=ne(s[e],t)||ne(s[A],t)||[]),Object.keys(s).forEach(c=>{(e===A||e===c)&&Object.keys(s[c]).forEach(d=>{l.test(d)&&s[c][d].push([r,o])})}),Object.keys(n).forEach(c=>{(e===A||e===c)&&Object.keys(n[c]).forEach(d=>l.test(d)&&n[c][d].push([r,o]))});return}const a=rt(t)||[t];for(let l=0,c=a.length;l<c;l++){const d=a[l];Object.keys(n).forEach(p=>{var h;(e===A||e===p)&&((h=n[p])[d]||(h[d]=[...ne(s[p],d)||ne(s[A],d)||[]]),n[p][d].push([r,o-c+l+1]))})}}buildAllMatchers(){const e=Object.create(null);return Object.keys(u(this,G)).concat(Object.keys(u(this,z))).forEach(t=>{e[t]||(e[t]=y(this,Le,Et).call(this,t))}),m(this,z,m(this,G,void 0)),Vt(),e}},z=new WeakMap,G=new WeakMap,Le=new WeakSet,Et=function(e){const t=[];let r=e===A;return[u(this,z),u(this,G)].forEach(s=>{const n=s[e]?Object.keys(s[e]).map(o=>[o,s[e][o]]):[];n.length!==0?(r||(r=!0),t.push(...n)):e!==A&&t.push(...Object.keys(s[A]).map(o=>[o,s[A][o]]))}),r?Jt(t):null},Je),W,F,Qe,Zt=(Qe=class{constructor(e){f(this,"name","SmartRouter");g(this,W,[]);g(this,F,[]);m(this,W,e.routers)}add(e,t,r){if(!u(this,F))throw new Error(ct);u(this,F).push([e,t,r])}match(e,t){if(!u(this,F))throw new Error("Fatal error");const r=u(this,W),s=u(this,F),n=r.length;let o=0,a;for(;o<n;o++){const i=r[o];try{for(let l=0,c=s.length;l<c;l++)i.add(...s[l]);a=i.match(e,t)}catch(l){if(l instanceof ut)continue;throw l}this.match=i.match.bind(i),m(this,W,[i]),m(this,F,void 0);break}if(o===n)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,a}get activeRouter(){if(u(this,F)||u(this,W).length!==1)throw new Error("No active router has been determined yet.");return u(this,W)[0]}},W=new WeakMap,F=new WeakMap,Qe),Te=Object.create(null),Y,S,te,pe,I,q,J,Ee,er=(Ee=class{constructor(t,r,s){g(this,q);g(this,Y);g(this,S);g(this,te);g(this,pe,0);g(this,I,Te);if(m(this,S,s||Object.create(null)),m(this,Y,[]),t&&r){const n=Object.create(null);n[t]={handler:r,possibleKeys:[],score:0},m(this,Y,[n])}m(this,te,[])}insert(t,r,s){m(this,pe,++ke(this,pe)._);let n=this;const o=St(r),a=[];for(let i=0,l=o.length;i<l;i++){const c=o[i],d=o[i+1],p=Dt(c,d),h=Array.isArray(p)?p[0]:c;if(h in u(n,S)){n=u(n,S)[h],p&&a.push(p[1]);continue}u(n,S)[h]=new Ee,p&&(u(n,te).push(p),a.push(p[1])),n=u(n,S)[h]}return u(n,Y).push({[t]:{handler:s,possibleKeys:a.filter((i,l,c)=>c.indexOf(i)===l),score:u(this,pe)}}),n}search(t,r){var l;const s=[];m(this,I,Te);let o=[this];const a=et(r),i=[];for(let c=0,d=a.length;c<d;c++){const p=a[c],h=c===d-1,T=[];for(let _=0,j=o.length;_<j;_++){const v=o[_],R=u(v,S)[p];R&&(m(R,I,u(v,I)),h?(u(R,S)["*"]&&s.push(...y(this,q,J).call(this,u(R,S)["*"],t,u(v,I))),s.push(...y(this,q,J).call(this,R,t,u(v,I)))):T.push(R));for(let D=0,O=u(v,te).length;D<O;D++){const K=u(v,te)[D],w=u(v,I)===Te?{}:{...u(v,I)};if(K==="*"){const k=u(v,S)["*"];k&&(s.push(...y(this,q,J).call(this,k,t,u(v,I))),m(k,I,w),T.push(k));continue}const[Ce,qe,fe]=K;if(!p&&!(fe instanceof RegExp))continue;const M=u(v,S)[Ce],vt=a.slice(c).join("/");if(fe instanceof RegExp){const k=fe.exec(vt);if(k){if(w[qe]=k[0],s.push(...y(this,q,J).call(this,M,t,u(v,I),w)),Object.keys(u(M,S)).length){m(M,I,w);const xe=((l=k[0].match(/\//))==null?void 0:l.length)??0;(i[xe]||(i[xe]=[])).push(M)}continue}}(fe===!0||fe.test(p))&&(w[qe]=p,h?(s.push(...y(this,q,J).call(this,M,t,w,u(v,I))),u(M,S)["*"]&&s.push(...y(this,q,J).call(this,u(M,S)["*"],t,w,u(v,I)))):(m(M,I,w),T.push(M)))}}o=T.concat(i.shift()??[])}return s.length>1&&s.sort((c,d)=>c.score-d.score),[s.map(({handler:c,params:d})=>[c,d])]}},Y=new WeakMap,S=new WeakMap,te=new WeakMap,pe=new WeakMap,I=new WeakMap,q=new WeakSet,J=function(t,r,s,n){const o=[];for(let a=0,i=u(t,Y).length;a<i;a++){const l=u(t,Y)[a],c=l[r]||l[A],d={};if(c!==void 0&&(c.params=Object.create(null),o.push(c),s!==Te||n&&n!==Te))for(let p=0,h=c.possibleKeys.length;p<h;p++){const T=c.possibleKeys[p],_=d[c.score];c.params[T]=n!=null&&n[T]&&!_?n[T]:s[T]??(n==null?void 0:n[T]),d[c.score]=!0}}return o},Ee),re,Ze,tr=(Ze=class{constructor(){f(this,"name","TrieRouter");g(this,re);m(this,re,new er)}add(e,t,r){const s=rt(t);if(s){for(let n=0,o=s.length;n<o;n++)u(this,re).insert(e,s[n],r);return}u(this,re).insert(e,t,r)}match(e,t){return u(this,re).search(e,t)}},re=new WeakMap,Ze),mt=class extends Xt{constructor(e={}){super(e),this.router=e.router??new Zt({routers:[new Qt,new tr]})}},rr=e=>{const r={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},s=(o=>typeof o=="string"?o==="*"?()=>o:a=>o===a?a:null:typeof o=="function"?o:a=>o.includes(a)?a:null)(r.origin),n=(o=>typeof o=="function"?o:Array.isArray(o)?()=>o:()=>[])(r.allowMethods);return async function(a,i){var d;function l(p,h){a.res.headers.set(p,h)}const c=await s(a.req.header("origin")||"",a);if(c&&l("Access-Control-Allow-Origin",c),r.credentials&&l("Access-Control-Allow-Credentials","true"),(d=r.exposeHeaders)!=null&&d.length&&l("Access-Control-Expose-Headers",r.exposeHeaders.join(",")),a.req.method==="OPTIONS"){r.origin!=="*"&&l("Vary","Origin"),r.maxAge!=null&&l("Access-Control-Max-Age",r.maxAge.toString());const p=await n(a.req.header("origin")||"",a);p.length&&l("Access-Control-Allow-Methods",p.join(","));let h=r.allowHeaders;if(!(h!=null&&h.length)){const T=a.req.header("Access-Control-Request-Headers");T&&(h=T.split(/\s*,\s*/))}return h!=null&&h.length&&(l("Access-Control-Allow-Headers",h.join(",")),a.res.headers.append("Vary","Access-Control-Request-Headers")),a.res.headers.delete("Content-Length"),a.res.headers.delete("Content-Type"),new Response(null,{headers:a.res.headers,status:204,statusText:"No Content"})}await i(),r.origin!=="*"&&a.header("Vary","Origin",{append:!0})}},sr=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i,Ge=(e,t=ar)=>{const r=/\.([a-zA-Z0-9]+?)$/,s=e.match(r);if(!s)return;let n=t[s[1]];return n&&n.startsWith("text")&&(n+="; charset=utf-8"),n},nr={aac:"audio/aac",avi:"video/x-msvideo",avif:"image/avif",av1:"video/av1",bin:"application/octet-stream",bmp:"image/bmp",css:"text/css",csv:"text/csv",eot:"application/vnd.ms-fontobject",epub:"application/epub+zip",gif:"image/gif",gz:"application/gzip",htm:"text/html",html:"text/html",ico:"image/x-icon",ics:"text/calendar",jpeg:"image/jpeg",jpg:"image/jpeg",js:"text/javascript",json:"application/json",jsonld:"application/ld+json",map:"application/json",mid:"audio/x-midi",midi:"audio/x-midi",mjs:"text/javascript",mp3:"audio/mpeg",mp4:"video/mp4",mpeg:"video/mpeg",oga:"audio/ogg",ogv:"video/ogg",ogx:"application/ogg",opus:"audio/opus",otf:"font/otf",pdf:"application/pdf",png:"image/png",rtf:"application/rtf",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",ts:"video/mp2t",ttf:"font/ttf",txt:"text/plain",wasm:"application/wasm",webm:"video/webm",weba:"audio/webm",webmanifest:"application/manifest+json",webp:"image/webp",woff:"font/woff",woff2:"font/woff2",xhtml:"application/xhtml+xml",xml:"application/xml",zip:"application/zip","3gp":"video/3gpp","3g2":"video/3gpp2",gltf:"model/gltf+json",glb:"model/gltf-binary"},ar=nr,or=(...e)=>{let t=e.filter(n=>n!=="").join("/");t=t.replace(new RegExp("(?<=\\/)\\/+","g"),"");const r=t.split("/"),s=[];for(const n of r)n===".."&&s.length>0&&s.at(-1)!==".."?s.pop():n!=="."&&s.push(n);return s.join("/")||"."},ft={br:".br",zstd:".zst",gzip:".gz"},ir=Object.keys(ft),lr="index.html",cr=e=>{const t=e.root??"./",r=e.path,s=e.join??or;return async(n,o)=>{var d,p,h,T;if(n.finalized)return o();let a;if(e.path)a=e.path;else try{if(a=decodeURIComponent(n.req.path),/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(a))throw new Error}catch{return await((d=e.onNotFound)==null?void 0:d.call(e,n.req.path,n)),o()}let i=s(t,!r&&e.rewriteRequestPath?e.rewriteRequestPath(a):a);e.isDir&&await e.isDir(i)&&(i=s(i,lr));const l=e.getContent;let c=await l(i,n);if(c instanceof Response)return n.newResponse(c.body,c);if(c){const _=e.mimes&&Ge(i,e.mimes)||Ge(i);if(n.header("Content-Type",_||"application/octet-stream"),e.precompressed&&(!_||sr.test(_))){const j=new Set((p=n.req.header("Accept-Encoding"))==null?void 0:p.split(",").map(v=>v.trim()));for(const v of ir){if(!j.has(v))continue;const R=await l(i+ft[v],n);if(R){c=R,n.header("Content-Encoding",v),n.header("Vary","Accept-Encoding",{append:!0});break}}}return await((h=e.onFound)==null?void 0:h.call(e,i,n)),n.body(c)}await((T=e.onNotFound)==null?void 0:T.call(e,i,n)),await o()}},ur=async(e,t)=>{let r;t&&t.manifest?typeof t.manifest=="string"?r=JSON.parse(t.manifest):r=t.manifest:typeof __STATIC_CONTENT_MANIFEST=="string"?r=JSON.parse(__STATIC_CONTENT_MANIFEST):r=__STATIC_CONTENT_MANIFEST;let s;t&&t.namespace?s=t.namespace:s=__STATIC_CONTENT;const n=r[e];if(!n)return null;const o=await s.get(n,{type:"stream"});return o||null},dr=e=>async function(r,s){return cr({...e,getContent:async o=>ur(o,{manifest:e.manifest,namespace:e.namespace?e.namespace:r.env?r.env.__STATIC_CONTENT:void 0})})(r,s)},hr=e=>dr(e),me={};const E=new mt;E.use("/api/*",rr());E.use("/static/*",hr({root:"./public"}));async function Tt(e){const r=new TextEncoder().encode(e),s=await crypto.subtle.digest("SHA-256",r);return Array.from(new Uint8Array(s)).map(a=>a.toString(16).padStart(2,"0")).join("")}E.get("/api/init-db",async e=>{try{const t=e.env.DB;return console.log("🔄 Initialisation des tables leads et clients..."),await t.prepare(`
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
    `).run(),console.log("✅ Tables leads et clients initialisées"),e.json({success:!0,message:"Tables leads et clients initialisées avec succès"})}catch(t){return console.error("❌ Erreur init-db:",t),e.json({error:"Erreur lors de l'initialisation de la base de données",details:t instanceof Error?t.message:String(t)},500)}});E.post("/api/auth/login",async e=>{try{const{email:t,password:r}=await e.req.json();if(!t||!r)return e.json({error:"Email et mot de passe requis"},400);const s=await Tt(r),n=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE email = ? AND password = ?").bind(t,s).first();if(!n)return e.json({error:"Email ou mot de passe incorrect"},401);const o=btoa(JSON.stringify({id:n.id,email:n.email,exp:Date.now()+24*60*60*1e3}));return e.json({token:o,user:{id:n.id,email:n.email,name:n.name,role:n.role,company_name:n.company_name}})}catch(t){return console.error("Login error:",t),e.json({error:"Erreur serveur"},500)}});E.post("/api/auth/signup",async e=>{try{const{email:t,name:r,password:s,company_name:n}=await e.req.json();if(!t||!r||!s)return e.json({error:"Tous les champs sont requis"},400);if(await e.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(t).first())return e.json({error:"Un compte existe déjà avec cet email"},409);const a=await Tt(s),i=await e.env.DB.prepare("INSERT INTO users (email, name, password, role, company_name) VALUES (?, ?, ?, ?, ?)").bind(t,r,a,"user",n||"Ma Société").run(),l=btoa(JSON.stringify({id:i.meta.last_row_id,email:t,exp:Date.now()+24*60*60*1e3}));return e.json({token:l,user:{id:i.meta.last_row_id,email:t,name:r,role:"user",company_name:n||"Ma Société"}},201)}catch(t){return console.error("Signup error:",t),e.json({error:"Erreur serveur"},500)}});E.get("/api/auth/gmail",async e=>{const r=`${new URL(e.req.url).origin}/api/auth/gmail/callback`,s=e.env.GOOGLE_CLIENT_ID||"YOUR_GOOGLE_CLIENT_ID",n=["https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/gmail.send","https://www.googleapis.com/auth/userinfo.email","openid","profile"].join(" "),o=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${s}&redirect_uri=${encodeURIComponent(r)}&response_type=code&scope=${encodeURIComponent(n)}&access_type=offline&prompt=consent`;return e.redirect(o,302)});E.get("/api/auth/gmail/callback",async e=>{try{const t=new URL(e.req.url),r=t.searchParams.get("code");if(!r)return e.text("Code manquant",400);const s=e.env.GOOGLE_CLIENT_ID||"YOUR_GOOGLE_CLIENT_ID",n=e.env.GOOGLE_CLIENT_SECRET||"YOUR_GOOGLE_CLIENT_SECRET",o=`${t.origin}/api/auth/gmail/callback`,i=await(await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code:r,client_id:s,client_secret:n,redirect_uri:o,grant_type:"authorization_code"})})).json();if(!i.access_token)return e.text("Erreur d'authentification",401);const c=await(await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:`Bearer ${i.access_token}`}})).json(),d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connexion Gmail réussie</title>
      </head>
      <body>
        <script>
          localStorage.setItem('gmail_access_token', '${i.access_token}');
          localStorage.setItem('gmail_refresh_token', '${i.refresh_token||""}');
          localStorage.setItem('gmail_email', '${c.email}');
          localStorage.setItem('gmail_expires_at', '${Date.now()+i.expires_in*1e3}');
          
          alert('✅ Gmail connecté avec succès !');
          window.location.href = '/';
        <\/script>
      </body>
      </html>
    `;return e.html(d)}catch(t){return console.error("Gmail callback error:",t),e.text("Erreur serveur",500)}});E.post("/api/init-db",async e=>{try{console.log("🔧 Initializing database tables..."),await e.env.DB.prepare(`
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
    `).run();const t=async(r,s,n)=>{try{await e.env.DB.prepare(`ALTER TABLE ${r} ADD COLUMN ${s} ${n}`).run(),console.log(`✅ Colonne ${s} ajoutée à ${r}`)}catch{}};return await t("clients","status","TEXT DEFAULT 'lead'"),await t("clients","archived","INTEGER DEFAULT 0"),await t("clients","updated_at","DATETIME DEFAULT CURRENT_TIMESTAMP"),await t("clients","lead_id","INTEGER"),await t("clients","name","TEXT"),await t("clients","address","TEXT"),await t("deals","archived","INTEGER DEFAULT 0"),await t("deals","updated_at","DATETIME DEFAULT CURRENT_TIMESTAMP"),await t("deals","probability","INTEGER DEFAULT 30"),await t("deals","notes","TEXT"),await t("deals","rdv_date","TEXT"),await t("deals","rdv_notes","TEXT"),console.log("✅ Database tables initialized + migrations applied"),e.json({success:!0,message:"Database initialized successfully",tables:["users","clients","deals","leads","quotes","tasks","calendar_events","email_categories"]})}catch(t){return console.error("Database initialization error:",t),e.json({error:"Erreur initialisation base de données",details:t instanceof Error?t.message:String(t)},500)}});E.get("/api/emails",async e=>{try{const t=e.req.query("access_token");if(!t)return e.json({error:"Access token manquant"},401);const r=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox",{headers:{Authorization:`Bearer ${t}`}});if(!r.ok)return e.json({error:"Erreur Gmail API"},r.status);const o=((await r.json()).messages||[]).slice(0,10).map(async l=>(await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${l.id}`,{headers:{Authorization:`Bearer ${t}`}})).json()),i=(await Promise.all(o)).map(l=>{var _,j,v,R,D;const c=((_=l.payload)==null?void 0:_.headers)||[],d=((j=c.find(O=>O.name==="Subject"))==null?void 0:j.value)||"(Sans objet)",p=((v=c.find(O=>O.name==="From"))==null?void 0:v.value)||"Inconnu",h=((R=c.find(O=>O.name==="Date"))==null?void 0:R.value)||"",T=((D=c.find(O=>O.name==="To"))==null?void 0:D.value)||"";return{id:l.id,threadId:l.threadId,subject:d,from:p,to:T,date:h,snippet:l.snippet||"",labelIds:l.labelIds||[]}});return e.json({emails:i})}catch(t){return console.error("Emails fetch error:",t),e.json({error:"Erreur serveur"},500)}});E.get("/api/emails/thread/:threadId",async e=>{try{const t=e.req.query("access_token"),r=e.req.param("threadId");if(!t)return e.json({error:"Access token manquant"},401);const s=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${r}`,{headers:{Authorization:`Bearer ${t}`}});if(!s.ok)return e.json({error:"Erreur Gmail API"},s.status);const n=await s.json(),a=(n.messages||[]).map(i=>{var _,j,v,R,D,O,K;const l=((_=i.payload)==null?void 0:_.headers)||[],c=((j=l.find(w=>w.name==="Subject"))==null?void 0:j.value)||"(Sans objet)",d=((v=l.find(w=>w.name==="From"))==null?void 0:v.value)||"Inconnu",p=((R=l.find(w=>w.name==="To"))==null?void 0:R.value)||"",h=((D=l.find(w=>w.name==="Date"))==null?void 0:D.value)||"";let T="";if(i.payload.parts){const w=i.payload.parts.find(Ce=>Ce.mimeType==="text/plain");w&&((O=w.body)!=null&&O.data)&&(T=atob(w.body.data.replace(/-/g,"+").replace(/_/g,"/")))}else(K=i.payload.body)!=null&&K.data&&(T=atob(i.payload.body.data.replace(/-/g,"+").replace(/_/g,"/")));return{id:i.id,subject:c,from:d,to:p,date:h,snippet:i.snippet||"",body:T||i.snippet||"",labelIds:i.labelIds||[]}});return e.json({threadId:n.id,messages:a})}catch(t){return console.error("Thread fetch error:",t),e.json({error:"Erreur serveur"},500)}});E.post("/api/emails/classify",async e=>{try{const{emails:t}=await e.req.json();if(!t||!Array.isArray(t))return e.json({error:"Emails requis"},400);const r=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,s=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://www.genspark.ai/api/llm_proxy/v1";if(!r)return e.json({error:"OpenAI API key non configurée"},500);const n=await Promise.all(t.map(async o=>{var a,i;try{const l=`Tu es un assistant intelligent qui classe les emails professionnels.

Email à classifier :
- Sujet : ${o.subject}
- Expéditeur : ${o.from}
- Aperçu : ${o.snippet}

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

Ne rajoute AUCUN texte avant ou après le JSON.`,c=await fetch(`${s}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Tu es un assistant de classification d'emails. Réponds UNIQUEMENT en JSON valide."},{role:"user",content:l}],temperature:.3,max_tokens:200})});if(!c.ok)throw new Error(`OpenAI API error: ${c.status}`);const p=((i=(a=(await c.json()).choices[0])==null?void 0:a.message)==null?void 0:i.content)||"{}";let h;try{const T=p.match(/\{[\s\S]*\}/);h=T?JSON.parse(T[0]):{}}catch{h={category:"autres",confidence:.5,reason:"Erreur parsing",priority:"low"}}return{...o,ai_category:h.category||"autres",ai_confidence:h.confidence||.5,ai_reason:h.reason||"",ai_priority:h.priority||"medium",ai_suggested_action:h.suggested_action||""}}catch(l){return console.error("Classification error:",l),{...o,ai_category:"autres",ai_confidence:0,ai_reason:"Erreur classification",ai_priority:"medium"}}}));return e.json({emails:n})}catch(t){return console.error("Classify error:",t),e.json({error:"Erreur serveur"},500)}});E.post("/api/emails/send",async e=>{try{const{to:t,subject:r,message:s,accessToken:n,inReplyTo:o,threadId:a}=await e.req.json();if(!t||!r||!s||!n)return e.json({error:"Paramètres manquants"},400);const i=[`To: ${t}`,`Subject: ${r}`,"Content-Type: text/plain; charset=utf-8","MIME-Version: 1.0"];o&&(i.push(`In-Reply-To: ${o}`),i.push(`References: ${o}`)),i.push(""),i.push(s);const l=i.join(`\r
`),c=btoa(unescape(encodeURIComponent(l))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),d="https://gmail.googleapis.com/gmail/v1/users/me/messages/send",p={raw:c};a&&(p.threadId=a);const h=await fetch(d,{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify(p)});if(!h.ok){const _=await h.text();return console.error("Gmail send error:",_),e.json({error:"Erreur envoi email"},h.status)}const T=await h.json();return e.json({success:!0,messageId:T.id})}catch(t){return console.error("Send email error:",t),e.json({error:"Erreur serveur"},500)}});E.post("/api/emails/generate-reply",async e=>{var t,r;try{const{email:s,tone:n,instruction:o,userContext:a}=await e.req.json(),i=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,l=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://api.openai.com/v1";if(!i)return e.json({error:"OpenAI non configuré"},500);const c=a?`

CONTEXTE DE L'UTILISATEUR :
${a}

Utilise ce contexte pour personnaliser ta réponse. N'invente JAMAIS d'informations qui ne sont pas dans ce contexte.`:"",d=`Tu es un assistant qui aide à rédiger des emails professionnels.

Email reçu :
De : ${s.from}
Objet : ${s.subject}
Contenu : ${s.body||s.snippet}${c}

${o}

RÈGLES STRICTES ET OBLIGATOIRES :
1. COMMENCE TOUJOURS PAR UNE FORMULE DE POLITESSE :
   - "Bonjour [Prénom]," si tu connais le prénom
   - "Bonjour," si tu ne connais pas le prénom
   - JAMAIS sans salutation initiale

2. STYLE PROFESSIONNEL :
   - Utilise le vouvoiement systématiquement
   - Utilise un vocabulaire soutenu et courtois
   - Évite les tournures familières ("caler", "afin de", etc.)
   - Préfère : "convenir d'un rendez-vous", "dans les plus brefs délais", "je vous remercie"

3. STRUCTURE DE L'EMAIL :
   - Salutation (Bonjour)
   - Corps du message (professionnel et courtois)
   - Formule de politesse finale
   - Signature

4. INTERDICTIONS :
   - N'invente JAMAIS de pièces jointes, documents ou informations non mentionnées
   - Si le contexte utilisateur mentionne quelque chose, utilise-le. Sinon, ne mentionne RIEN
   - Reste factuel et basé uniquement sur les informations fournies

Termine TOUJOURS par :

Cordialement,
Guillaume PINOIT
PSM Portails Sur Mesure
06 60 60 45 11`,p=await fetch(`${l}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:`Tu es un assistant qui rédige des emails professionnels B2B de haut niveau. Tu DOIS toujours commencer par "Bonjour," ou "Bonjour [Prénom],". Utilise un français soutenu, courtois et professionnel. Vouvoie TOUJOURS. N'invente RIEN.`},{role:"user",content:d}],temperature:.7,max_tokens:500})});if(!p.ok)throw new Error("OpenAI API error");const T=((r=(t=(await p.json()).choices[0])==null?void 0:t.message)==null?void 0:r.content)||"";return e.json({reply:T.trim()})}catch(s){return console.error("Generate reply error:",s),e.json({error:"Erreur génération IA"},500)}});E.post("/api/emails/improve-text",async e=>{var t,r;try{const{text:s}=await e.req.json(),n=e.env.OPENAI_API_KEY||me.OPENAI_API_KEY,o=e.env.OPENAI_BASE_URL||me.OPENAI_BASE_URL||"https://api.openai.com/v1";if(!n)return e.json({error:"OpenAI non configuré"},500);const a=`Améliore ce texte d'email en le rendant plus professionnel, clair et courtois. Corrige les fautes si besoin. Garde le même ton général.

Texte original :
${s}

Texte amélioré :`,i=await fetch(`${o}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"Tu es un assistant qui améliore des emails. Réponds uniquement avec le texte amélioré."},{role:"user",content:a}],temperature:.5,max_tokens:500})});if(!i.ok)throw new Error("OpenAI API error");const c=((r=(t=(await i.json()).choices[0])==null?void 0:t.message)==null?void 0:r.content)||"";return e.json({improved:c.trim()})}catch(s){return console.error("Improve text error:",s),e.json({error:"Erreur amélioration IA"},500)}});E.get("/api/profile",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ",""),s=JSON.parse(atob(r)),n=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE id = ?").bind(s.id).first();return n?e.json(n):e.json({error:"Utilisateur non trouvé"},404)}catch{return e.json({error:"Token invalide"},401)}});E.put("/api/profile",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ",""),s=JSON.parse(atob(r)),{name:n,company_name:o}=await e.req.json();await e.env.DB.prepare("UPDATE users SET name = ?, company_name = ? WHERE id = ?").bind(n,o,s.id).run();const a=await e.env.DB.prepare("SELECT id, email, name, role, company_name FROM users WHERE id = ?").bind(s.id).first();return e.json(a)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/clients",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.query("archived")==="true";let s;try{const n=r?"SELECT * FROM clients WHERE archived = 1 ORDER BY created_at DESC":"SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC";s=await e.env.DB.prepare(n).all()}catch{console.log("⚠️ Colonne archived manquante, fallback sans filtre"),s=await e.env.DB.prepare("SELECT * FROM clients ORDER BY created_at DESC").all()}return e.json({clients:s.results||[]})}catch(t){return console.error("Error fetching clients:",t),e.json({clients:[]})}});E.post("/api/clients",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json();if(r.email){const s=await e.env.DB.prepare("SELECT * FROM clients WHERE email = ? LIMIT 1").bind(r.email).first();if(s)return console.log("Client existant trouvé pour",r.email),e.json({id:s.id,...s,_existing:!0},200)}console.log("📝 Création client:",{name:r.name,email:r.email,phone:r.phone,address:r.address});try{await e.env.DB.prepare("ALTER TABLE clients ADD COLUMN address TEXT").run()}catch{}try{const s=await e.env.DB.prepare("INSERT INTO clients (name, email, phone, company, status, address) VALUES (?, ?, ?, ?, ?, ?)").bind(r.name||null,r.email||null,r.phone||null,r.company||null,r.status||"lead",r.address||null).run();return console.log("✅ Client créé, id:",s.meta.last_row_id),e.json({id:s.meta.last_row_id,...r},201)}catch(s){const n=s instanceof Error?s.message:String(s);if(console.error("❌ Erreur INSERT client:",n),n.includes("UNIQUE constraint failed")){console.log("🔄 UNIQUE constraint - recherche client existant pour",r.email);const o=await e.env.DB.prepare("SELECT * FROM clients WHERE email = ? LIMIT 1").bind(r.email).first();if(o)return e.json({id:o.id,...o,_existing:!0},200)}if(n.includes("no column named")){console.log("🔄 Colonne manquante, retry sans status...");const o=await e.env.DB.prepare("INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)").bind(r.name||null,r.email||null,r.phone||null,r.company||null).run();return e.json({id:o.meta.last_row_id,...r},201)}throw s}}catch(t){return console.error("❌ Error creating client:",t),e.json({error:"Erreur serveur",details:t instanceof Error?t.message:String(t)},500)}});E.get("/api/clients/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id"),s=await e.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(r).first();return s?e.json({client:s}):e.json({error:"Client non trouvé"},404)}catch(t){return console.error("Error fetching client:",t),e.json({error:"Erreur serveur"},500)}});E.put("/api/clients/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id"),s=await e.req.json(),n=[],o=[];if(s.name!==void 0&&(n.push("name = ?"),o.push(s.name)),s.email!==void 0&&(n.push("email = ?"),o.push(s.email)),s.phone!==void 0&&(n.push("phone = ?"),o.push(s.phone)),s.company!==void 0&&(n.push("company = ?"),o.push(s.company)),s.status!==void 0&&(n.push("status = ?"),o.push(s.status)),s.address!==void 0){try{await e.env.DB.prepare("ALTER TABLE clients ADD COLUMN address TEXT").run()}catch{}n.push("address = ?"),o.push(s.address)}if(s.archived!==void 0)try{n.push("archived = ?"),o.push(s.archived?1:0)}catch{}n.push("updated_at = CURRENT_TIMESTAMP"),o.push(r),n.length>1&&await e.env.DB.prepare(`UPDATE clients SET ${n.join(", ")} WHERE id = ?`).bind(...o).run();const a=await e.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(r).first();return e.json({client:a,success:!0})}catch(t){return console.error("Error updating client:",t),e.json({error:"Erreur serveur",details:t instanceof Error?t.message:String(t)},500)}});E.delete("/api/clients/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id");return await e.env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(r).run(),e.json({success:!0})}catch(t){return console.error("Error deleting client:",t),e.json({error:"Erreur serveur"},500)}});E.get("/api/deals",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.query("archived")==="true";let s;try{const o=r?"SELECT * FROM deals WHERE archived = 1 ORDER BY created_at DESC":"SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC";s=await e.env.DB.prepare(o).all()}catch{console.log("⚠️ Colonne archived manquante pour deals, fallback sans filtre"),s=await e.env.DB.prepare("SELECT * FROM deals ORDER BY created_at DESC").all()}const n=await Promise.all((s.results||[]).map(async o=>{var i,l,c;let a=null;if(o.client_id)try{a=await e.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(o.client_id).first()}catch{}return{...o,status:o.stage||o.status||"lead",first_name:((i=a==null?void 0:a.name)==null?void 0:i.split(" ")[0])||((l=o.title)==null?void 0:l.split(" ")[0])||"",last_name:((c=a==null?void 0:a.name)==null?void 0:c.split(" ").slice(1).join(" "))||"",email:(a==null?void 0:a.email)||"",phone:(a==null?void 0:a.phone)||"",company:(a==null?void 0:a.company)||"",address:(a==null?void 0:a.address)||"",client_name:(a==null?void 0:a.name)||"",client_email:(a==null?void 0:a.email)||"",client_phone:(a==null?void 0:a.phone)||"",client_address:(a==null?void 0:a.address)||"",estimated_amount:o.amount||0,type:o.title||"Dossier"}}));return e.json({deals:n})}catch(t){return console.error("Error fetching deals:",t),e.json({deals:[]})}});E.post("/api/deals",async e=>{try{const t=e.req.header("Authorization");if(!t)return e.json({error:"Non autorisé"},401);const r=t.replace("Bearer ","");let s;try{s=JSON.parse(atob(r))}catch(o){return console.error("❌ Erreur décodage token:",o),e.json({error:"Token invalide",details:"Le token d'authentification est mal formé ou corrompu"},401)}const n=await e.req.json();console.log("📝 Création deal:",{title:n.title,client_id:n.client_id,user_id:s.id});try{const o=await e.env.DB.prepare("INSERT INTO deals (user_id, client_id, title, amount, stage, probability, expected_close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(s.id,n.client_id||null,n.title||"Nouveau dossier",n.amount||0,n.stage||"lead",n.probability||30,n.expected_close_date||null,n.notes||null).run();return console.log("✅ Deal créé, id:",o.meta.last_row_id),e.json({id:o.meta.last_row_id,...n},201)}catch(o){const a=o instanceof Error?o.message:String(o);if(console.error("❌ Erreur INSERT deal:",a),a.includes("no column named")){console.log("🔄 Colonne manquante, retry avec colonnes de base...");const i=await e.env.DB.prepare("INSERT INTO deals (user_id, client_id, title, amount, stage) VALUES (?, ?, ?, ?, ?)").bind(s.id,n.client_id||null,n.title||"Nouveau dossier",n.amount||0,n.stage||"lead").run();return console.log("✅ Deal créé (colonnes de base), id:",i.meta.last_row_id),e.json({id:i.meta.last_row_id,...n},201)}throw o}}catch(t){return console.error("❌ Error creating deal:",t),e.json({error:"Erreur serveur",details:t instanceof Error?t.message:String(t)},500)}});E.get("/api/deals/priority",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);let r;try{r=await e.env.DB.prepare("SELECT * FROM deals WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC LIMIT 20").all()}catch{r=await e.env.DB.prepare("SELECT * FROM deals ORDER BY created_at DESC LIMIT 20").all()}return e.json({deals:r.results||[],priorities:[]})}catch(t){return console.error("Error fetching priority deals:",t),e.json({deals:[],priorities:[]})}});E.get("/api/deals/:id",async e=>{var t,r,s;try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const o=e.req.param("id"),a=await e.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(o).first();if(!a)return e.json({error:"Deal non trouvé"},404);let i=null;if(a.client_id)try{i=await e.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(a.client_id).first()}catch{}const l={...a,status:a.stage||a.status||"lead",first_name:((t=i==null?void 0:i.name)==null?void 0:t.split(" ")[0])||((r=a.title)==null?void 0:r.split(" ")[0])||"",last_name:((s=i==null?void 0:i.name)==null?void 0:s.split(" ").slice(1).join(" "))||"",email:(i==null?void 0:i.email)||"",phone:(i==null?void 0:i.phone)||"",company:(i==null?void 0:i.company)||"",address:(i==null?void 0:i.address)||"",client_name:(i==null?void 0:i.name)||"",client_email:(i==null?void 0:i.email)||"",client_phone:(i==null?void 0:i.phone)||"",client_address:(i==null?void 0:i.address)||"",estimated_amount:a.amount||0,type:a.title||"Dossier"};return e.json({deal:l})}catch(n){return console.error("Error fetching deal:",n),e.json({error:"Erreur serveur"},500)}});E.put("/api/deals/:id",async e=>{var t,r,s;try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const o=e.req.param("id"),a=await e.req.json();console.log(`📝 PUT /api/deals/${o}:`,JSON.stringify(a));const i=[],l=[],c=a.stage||a.status;if(c!==void 0&&(i.push("stage = ?"),l.push(c)),a.title!==void 0&&(i.push("title = ?"),l.push(a.title)),a.amount!==void 0&&(i.push("amount = ?"),l.push(a.amount)),a.probability!==void 0&&(i.push("probability = ?"),l.push(a.probability)),a.expected_close_date!==void 0&&(i.push("expected_close_date = ?"),l.push(a.expected_close_date)),a.notes!==void 0&&(i.push("notes = ?"),l.push(a.notes)),a.client_id!==void 0&&(i.push("client_id = ?"),l.push(a.client_id)),a.archived!==void 0&&(i.push("archived = ?"),l.push(a.archived?1:0)),a.rdv_date!==void 0||a.rdv_notes!==void 0){try{await e.env.DB.prepare("ALTER TABLE deals ADD COLUMN rdv_date TEXT").run()}catch{}try{await e.env.DB.prepare("ALTER TABLE deals ADD COLUMN rdv_notes TEXT").run()}catch{}a.rdv_date!==void 0&&(i.push("rdv_date = ?"),l.push(a.rdv_date)),a.rdv_notes!==void 0&&(i.push("rdv_notes = ?"),l.push(a.rdv_notes))}i.push("updated_at = CURRENT_TIMESTAMP"),l.push(o),console.log(`📝 SQL: UPDATE deals SET ${i.join(", ")} WHERE id = ?`,l),await e.env.DB.prepare(`UPDATE deals SET ${i.join(", ")} WHERE id = ?`).bind(...l).run();const p=await e.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(o).first();let h=null;if(p!=null&&p.client_id)try{h=await e.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(p.client_id).first()}catch{}const T={...p,status:(p==null?void 0:p.stage)||"lead",first_name:((t=h==null?void 0:h.name)==null?void 0:t.split(" ")[0])||((r=p==null?void 0:p.title)==null?void 0:r.split(" ")[0])||"",last_name:((s=h==null?void 0:h.name)==null?void 0:s.split(" ").slice(1).join(" "))||"",client_name:(h==null?void 0:h.name)||"",client_email:(h==null?void 0:h.email)||"",client_phone:(h==null?void 0:h.phone)||"",client_address:(h==null?void 0:h.address)||"",email:(h==null?void 0:h.email)||"",phone:(h==null?void 0:h.phone)||"",company:(h==null?void 0:h.company)||"",address:(h==null?void 0:h.address)||"",estimated_amount:(p==null?void 0:p.amount)||0,type:(p==null?void 0:p.title)||"Dossier"};return console.log(`✅ Deal ${o} mis à jour:`,JSON.stringify(T)),e.json({deal:T,success:!0})}catch(n){return console.error("❌ Error updating deal:",n),e.json({error:"Erreur serveur",details:n instanceof Error?n.message:String(n)},500)}});E.delete("/api/deals/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id");return await e.env.DB.prepare("DELETE FROM deals WHERE id = ?").bind(r).run(),e.json({success:!0})}catch(t){return console.error("Error deleting deal:",t),e.json({error:"Erreur serveur"},500)}});E.get("/api/quotes",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.query("deal_id");let s;if(r)try{s=await e.env.DB.prepare("SELECT * FROM quotes WHERE deal_id = ? ORDER BY created_at DESC").bind(r).all()}catch{s={results:[]}}else s=await e.env.DB.prepare("SELECT * FROM quotes ORDER BY created_at DESC").all();return e.json({quotes:s.results||[]})}catch(t){return console.error("Error fetching quotes:",t),e.json({quotes:[]})}});E.post("/api/quotes",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO quotes (quote_number, client_id, amount, status, notes) VALUES (?, ?, ?, ?, ?)").bind(r.quote_number,r.client_id,r.amount||0,r.status||"brouillon",r.notes||null).run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/photos",async e=>{try{return e.req.header("Authorization")?e.json({photos:[]}):e.json({error:"Non autorisé"},401)}catch{return e.json({photos:[]})}});E.post("/api/photos",async e=>e.json({error:"Fonctionnalité en cours de développement"},501));E.delete("/api/photos/:id",async e=>e.json({success:!0}));E.get("/api/tasks",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.env.DB.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();return e.json(r.results||[])}catch(t){return console.error("Error fetching tasks:",t),e.json([])}});E.post("/api/tasks",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO tasks (title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?)").bind(r.title,r.description||null,r.due_date||null,r.priority||"medium",r.status||"todo").run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/calendar-events",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.env.DB.prepare("SELECT * FROM calendar_events ORDER BY start_date ASC").all();return e.json(r.results||[])}catch(t){return console.error("Error fetching calendar events:",t),e.json([])}});E.post("/api/calendar-events",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.json(),s=await e.env.DB.prepare("INSERT INTO calendar_events (title, description, start_date, end_date, deal_id) VALUES (?, ?, ?, ?, ?)").bind(r.title,r.description||null,r.start_date,r.end_date||null,r.deal_id||null).run();return e.json({id:s.meta.last_row_id,...r},201)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/notifications",async e=>{try{return e.req.header("Authorization")?e.json({notifications:[],unread_count:0}):e.json({error:"Non autorisé"},401)}catch(t){return console.error("Error fetching notifications:",t),e.json({notifications:[],unread_count:0})}});E.post("/api/notifications/:id/read",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});E.post("/api/notifications/read-all",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});E.delete("/api/notifications/:id",async e=>{try{return e.req.header("Authorization")?e.json({success:!0}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});E.post("/api/notifications/generate",async e=>{try{return e.req.header("Authorization")?e.json({success:!0,notifications:[]}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/reports/weekly/history",async e=>{try{return e.req.header("Authorization")?e.json({reports:[]}):e.json({error:"Non autorisé"},401)}catch(t){return console.error("Error fetching reports:",t),e.json({reports:[]})}});E.post("/api/reports/weekly/generate",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=new Date,s=Math.ceil(r.getDate()/7);return e.json({report:{id:Date.now(),week:s,year:r.getFullYear(),stats:{new_leads:0,quotes_sent:0,quotes_accepted:0,revenue:0,time_saved:"0h0m"}}})}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/api/stats/advanced",async e=>{try{return e.req.header("Authorization")?e.json({totalTimeManual:285,totalTimeKarl:65,timeSaved:220,percentageSaved:77,tasksAutomated:15,avgTimePerTask:14.7}):e.json({error:"Non autorisé"},401)}catch{return e.json({error:"Erreur serveur"},500)}});E.get("/",e=>e.html(`
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
  `));E.get("/*",e=>e.html(`
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
  `));E.post("/api/documents/upload",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=await e.req.formData(),s=r.get("client_id"),n=r.get("type"),o=r.get("title"),a=r.get("file");if(!s||!n||!a)return e.json({error:"Paramètres manquants"},400);const i=await a.arrayBuffer(),l=btoa(String.fromCharCode(...new Uint8Array(i))),c=e.env.DB;await c.prepare(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        file_data TEXT,
        content TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run();const d=await c.prepare(`
      INSERT INTO client_documents (client_id, type, title, file_name, file_size, file_type, file_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(s,n,o||a.name,a.name,a.size,a.type,l).run();return e.json({id:d.meta.last_row_id,client_id:s,type:n,title:o||a.name,file_name:a.name,file_size:a.size,file_type:a.type,message:"Document uploadé avec succès"})}catch(t){return console.error("Upload error:",t),e.json({error:"Erreur upload document"},500)}});E.get("/api/documents/:clientId",async e=>{var t;try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const s=e.req.param("clientId"),n=e.req.query("type"),o=e.env.DB;let a=`
      SELECT id, client_id, type, title, description, file_name, 
             file_size, file_type, created_at, updated_at
      FROM client_documents 
      WHERE client_id = ?
    `;const i=[s];n&&(a+=" AND type = ?",i.push(n)),a+=" ORDER BY created_at DESC";const l=await o.prepare(a).bind(...i).all();return e.json({documents:l.results||[],total:((t=l.results)==null?void 0:t.length)||0})}catch(r){return console.error("List documents error:",r),e.json({error:"Erreur récupération documents"},500)}});E.get("/api/documents/file/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id"),n=await e.env.DB.prepare(`
      SELECT file_data, file_name, file_type 
      FROM client_documents 
      WHERE id = ?
    `).bind(r).first();if(!n||!n.file_data)return e.json({error:"Document introuvable"},404);const o=atob(n.file_data),a=new Uint8Array(o.length);for(let i=0;i<o.length;i++)a[i]=o.charCodeAt(i);return new Response(a,{headers:{"Content-Type":n.file_type||"application/octet-stream","Content-Disposition":`attachment; filename="${n.file_name}"`}})}catch(t){return console.error("Download error:",t),e.json({error:"Erreur téléchargement document"},500)}});E.delete("/api/documents/:id",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const r=e.req.param("id");return await e.env.DB.prepare(`
      DELETE FROM client_documents WHERE id = ?
    `).bind(r).run(),e.json({message:"Document supprimé"})}catch(t){return console.error("Delete error:",t),e.json({error:"Erreur suppression document"},500)}});E.post("/api/documents/note",async e=>{try{if(!e.req.header("Authorization"))return e.json({error:"Non autorisé"},401);const{client_id:r,title:s,content:n,id:o}=await e.req.json();if(!r||!s||!n)return e.json({error:"Paramètres manquants"},400);const a=e.env.DB;if(await a.prepare(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        file_size INTEGER,
        file_type TEXT,
        file_data TEXT,
        content TEXT,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `).run(),o)return await a.prepare(`
        UPDATE client_documents 
        SET title = ?, content = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(s,n,o).run(),e.json({id:o,message:"Note mise à jour"});{const i=await a.prepare(`
        INSERT INTO client_documents (client_id, type, title, content)
        VALUES (?, 'note', ?, ?)
      `).bind(r,s,n).run();return e.json({id:i.meta.last_row_id,message:"Note créée"})}}catch(t){return console.error("Note error:",t),e.json({error:"Erreur note"},500)}});const We=new mt,pr=Object.assign({"/src/index.tsx":E});let gt=!1;for(const[,e]of Object.entries(pr))e&&(We.route("/",e),We.notFound(e.notFoundHandler),gt=!0);if(!gt)throw new Error("Can't import modules from ['/src/index.tsx','/app/server.ts']");export{We as default};
