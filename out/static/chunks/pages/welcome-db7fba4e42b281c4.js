(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[832],{3250:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/welcome",function(){return r(3307)}])},3307:function(e,t,r){"use strict";r.r(t);var s=r(7568),n=r(6042),a=r(9396),l=r(9534),i=r(92),o=r(5893),u=r(7294),c=r(3299),d=r(1163),f=r(720),g=r.n(f),m=r(6154),h=r(5675),x=r.n(h),p=g()({peers:["https://peer.wallie.io/gun"]});t.default=function(){var e=function(e){var t=e.target.files[0];if(t){var r=new FileReader;r.onload=function(e){_(e.target.result)},r.readAsDataURL(t)}},t=function(){er&&(p.get(null==h?void 0:h.user.address).get("pfp").put(er.metadata.image),_(er.metadata.image),es(null),eg(!1))},r=function(){ec(!eu)},f=function(){eg(!0)},g=function(){eg(!1)},h=(0,c.useSession)().data,b=(0,d.useRouter)(),y=(0,u.useState)(""),v=y[0],j=y[1],w=(0,u.useState)(!0),N=(w[0],w[1]),k=(0,u.useState)(""),S=k[0],E=k[1],F=(0,u.useState)(""),T=F[0],_=F[1],C=(0,u.useState)(!1);C[0],C[1];var P=(0,u.useState)(1),Z=P[0],L=P[1],A=(0,u.useState)([]),M=A[0],O=A[1],R=(0,u.useState)(!1),U=R[0],H=R[1],B=(0,u.useState)(null),D=B[0],I=B[1],W=(0,u.useState)(!1),X=W[0],G=W[1];(0,u.useEffect)(function(){p.get("allusers").get(null==h?void 0:h.user.address).once(function(e){e?G(!0):(N(!1),L(1))})},[h]),(0,u.useEffect)(function(){X&&b.push("/dashboard")},[X,b]);var J=function(e){if(e.preventDefault(),!v.trim()){E("Username cannot be empty");return}p.get(null==h?void 0:h.user.address).get("username").put(v.trim()),p.get("allusers").get(null==h?void 0:h.user.address).put(v.trim()),console.log(p.get("allusers").get(null==h?void 0:h.user.address).put(v.trim())),L(2)};(0,u.useEffect)(function(){if(h){var e=p.get(h.user.address);e.get("pfp").once(function(t){if(t)_(t);else{var r="/user.png";e.get("pfp").put(r),_(r)}})}},[h]);var V,q,z=function(){p.get(null==h?void 0:h.user.address).get("pfp").put(T),b.push("/dashboard")},K="mainnet",Q=(0,u.useState)([]),Y=Q[0],$=Q[1],ee=Y.length>0?Y[0].mint:"",et=(0,u.useState)(null),er=et[0],es=et[1],en=(null==h?void 0:h.user.address)||"",ea=(V=(0,s.Z)(function(){var e,t,r,s;return(0,i.__generator)(this,function(t){switch(t.label){case 0:H(!0),I(null),t.label=1;case 1:return t.trys.push([1,4,5,6]),[4,fetch("/api/getNFTs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:en,network:K})})];case 2:if(!(e=t.sent()).ok)throw Error("Failed to fetch NFTs");return[4,e.json()];case 3:return $(t.sent().map(function(e){return{associatedTokenAddress:e.associatedTokenAddress,mint:e.mint}})),[3,6];case 4:return I(t.sent().message),[3,6];case 5:return H(!1),[7];case 6:return[2]}})}),function(){return V.apply(this,arguments)});(0,u.useEffect)(function(){en&&ea()},[en]);var el=(q=(0,s.Z)(function(){var e,t,r,s,o,u,c,d,f,g,h,x,p,b,y;return(0,i.__generator)(this,function(i){switch(i.label){case 0:H(!0),I(null),i.label=1;case 1:return i.trys.push([1,9,10,11]),[4,m.Z.post("/api/getNFTMetdata",{contractAddress:ee,network:K})];case 2:if(200!==(e=i.sent()).status)throw Error("Failed to fetch NFTs");if("object"!=typeof(t=e.data)||Array.isArray(t))throw Error("Invalid data format: response data is not an object");for(o in r=[],s=[],t)s.push(o);u=0,i.label=3;case 3:if(!(u<s.length))return[3,8];if(d=s[u],!t.hasOwnProperty(d))return[3,7];g=(f=t[d]).metadataUri,h=(0,l.Z)(f,["metadataUri"]),i.label=4;case 4:return i.trys.push([4,6,,7]),console.log("Metadata URI:",g),[4,m.Z.get(g,{headers:{"Content-Type":"application/json"}})];case 5:return x=i.sent(),p=(0,a.Z)((0,n.Z)({},h),{metadata:x.data}),r.push(p),[3,7];case 6:return b=i.sent(),console.error("Failed to fetch metadata:",b),[3,7];case 7:return u++,[3,3];case 8:return O(r),[3,11];case 9:return I((y=i.sent()).message),console.error("Fetch NFTs error:",y),[3,11];case 10:return H(!1),[7];case 11:return[2]}})}),function(){return q.apply(this,arguments)});(0,u.useEffect)(function(){ee&&el()},[ee,el]),(0,u.useEffect)(function(){el()},[]);var ei=function(e){er===e?es(null):es(e)},eo=(0,u.useState)(!1),eu=eo[0],ec=eo[1],ed=(0,u.useState)(!1),ef=ed[0],eg=ed[1],em=(0,u.useRef)(null);return(0,u.useEffect)(function(){var e=function(e){em.current&&!em.current.contains(e.target)&&ec(!1)};return document.addEventListener("mousedown",e),function(){document.removeEventListener("mousedown",e)}},[]),(0,o.jsx)("div",{className:"flex justify-center items-center h-screen bg-gray-900 text-white",children:(0,o.jsxs)("div",{className:"max-w-md w-full",children:[1===Z&&(0,o.jsxs)("div",{children:[(0,o.jsxs)("h1",{className:"text-2xl font-bold mb-4 text-center",children:["Welcome, ",(0,o.jsxs)("span",{className:"text-sm",children:[null==h?void 0:h.user.address,"!"]})]}),(0,o.jsxs)("form",{onSubmit:J,className:"space-y-4",children:[(0,o.jsxs)("div",{className:"flex",children:[(0,o.jsx)("span",{className:"inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600",children:"@"}),(0,o.jsx)("input",{type:"text",id:"website-admin",className:"rounded-none rounded-r-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300",placeholder:"Enter your username",value:v,onChange:function(e){return j(e.target.value)}})]}),S&&(0,o.jsx)("p",{className:"text-red-500",children:S}),(0,o.jsx)("div",{className:"flex justify-center",children:(0,o.jsx)("button",{type:"submit",className:"px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600",children:"Next"})})]})]}),2===Z&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("h1",{className:"text-2xl font-bold mb-4 text-center",children:["Welcome, ",(0,o.jsxs)("span",{className:"text-xl",children:[v,"!"]})]}),(0,o.jsx)("p",{className:"text-center",children:"Select a Profile Picture"}),(0,o.jsxs)("div",{className:"flex mt-4 justify-center",children:[(0,o.jsx)("label",{className:"flex items-center justify-center bg-gray-100 border-2 border-gray-300 rounded-full cursor-pointer",children:(0,o.jsxs)("div",{className:"relative inline-block",children:[T?(0,o.jsx)(x(),{src:T,alt:"Profile",width:40,height:40,className:"rounded-full hover:bg-gray-900",onClick:r}):(0,o.jsx)("div",{}),T&&(0,o.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-7 h-7 text-gray-300 absolute bottom-2 right-5 bg-gray-400 rounded-full cursor-pointer",viewBox:"0 0 24 24",id:"edit",children:(0,o.jsx)("path",{d:"M5,18H9.24a1,1,0,0,0,.71-.29l6.92-6.93h0L19.71,8a1,1,0,0,0,0-1.42L15.47,2.29a1,1,0,0,0-1.42,0L11.23,5.12h0L4.29,12.05a1,1,0,0,0-.29.71V17A1,1,0,0,0,5,18ZM14.76,4.41l2.83,2.83L16.17,8.66,13.34,5.83ZM6,13.17l5.93-5.93,2.83,2.83L8.83,16H6ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"})})]})}),eu&&(0,o.jsxs)("div",{ref:em,className:"absolute mt-40 -mx-6 py-2 w-40 bg-white rounded-md shadow-lg divide-y divide-gray-100 shadow w-34 h-34 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200",children:[(0,o.jsx)("button",{className:"block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white rounded w-full",onClick:f,children:"Select NFT"}),(0,o.jsxs)("label",{className:"block px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-600 dark:hover:text-white",children:["Select from Gallery",(0,o.jsx)("input",{className:"hidden",type:"file",accept:"image/*",onChange:e})]})]}),ef&&(0,o.jsx)("div",{className:"fixed top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 bg-gray-900",children:(0,o.jsxs)("div",{className:"bg-gray-700 text-white p-8 rounded-lg flex flex-col w-96 h-96",children:[(0,o.jsx)("p",{className:"mb-4 text-xl",children:"Select an NFT as Profile Picture"}),U?(0,o.jsxs)("div",{className:"flex items-center justify-center",children:[(0,o.jsx)("svg",{"aria-hidden":"true",className:"animate-spin w-8 h-8 mr-2 text-gray-200 fill-blue-600",viewBox:"0 0 100 101",fill:"none",xmlns:"http://www.w3.org/2000/svg"}),(0,o.jsx)("span",{children:"Loading..."})]}):(0,o.jsxs)(o.Fragment,{children:[D?(0,o.jsx)("p",{className:"text-red-500 text-sm",children:"Error: No NFTs found"}):0===M.length?(0,o.jsx)("p",{children:"No NFTs available."}):(0,o.jsx)("div",{className:"flex flex-wrap",children:M.map(function(e){return(0,o.jsx)("div",{className:"flex items-center justify-center w-32 h-32 border-2 rounded-lg m-2 cursor-pointer ".concat(er===e?"border-blue-500":"border-gray-300"),onClick:function(){return ei(e)},children:(0,o.jsx)("img",{src:e.metadata.image,alt:"NFT",className:"w-full h-full rounded-lg"})},e.mint)})}),(0,o.jsx)("button",{className:"text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 mt-4 mb-2",onClick:t,disabled:!er,children:"Set as Profile Picture"}),(0,o.jsx)("button",{className:"text-gray-400 hover:text-gray-300 font-medium rounded-lg text-sm px-4 py-2 focus:outline-none",onClick:g,children:"Cancel"})]})]})})]}),(0,o.jsxs)("div",{className:"flex justify-center mt-6",children:[(0,o.jsx)("button",{onClick:function(){return L(1)},className:"px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600 mr-2",children:"Back"}),(0,o.jsx)("button",{onClick:z,className:"px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600",children:"Save"})]})]})]})})}}},function(e){e.O(0,[173,14,774,888,179],function(){return e(e.s=3250)}),_N_E=e.O()}]);