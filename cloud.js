import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app=initializeApp(window.LEDRA_CLOUD);
const auth=getAuth(app);
const db=getFirestore(app);
let user=null,timer=null,busy=false;

// Union of entries from both sides, minus anything deleted on either side.
export const merge=(a,b)=>{
  const del=[...new Set([...(a.del||[]),...(b.del||[])])],gone=new Set(del),m=new Map();
  [...(a.txs||[]),...(b.txs||[])].forEach(t=>{if(!gone.has(t.id))m.set(t.id,t)});
  const useB=(b.openAt||0)>(a.openAt||0);
  return {txs:[...m.values()],del,open:useB?b.open:a.open,openAt:Math.max(a.openAt||0,b.openAt||0)};
};

async function sync(){
  if(!user||busy)return;
  busy=true;
  try{
    const ref=doc(db,'users',user.uid);
    const snap=await getDoc(ref);
    const remote=snap.exists()?JSON.parse(snap.data().data||'{}'):{};
    const m=merge(window.ledraApp.get(),remote);
    window.ledraApp.set(m.txs,m.del,m.open,m.openAt);
    await setDoc(ref,{data:JSON.stringify(m),updated:Date.now()});
  }finally{busy=false}
}

window.ledraCloud={
  get user(){return user},
  queue(){clearTimeout(timer);timer=setTimeout(()=>sync().catch(()=>{}),1500)},
  sync,
  signIn:(e,p)=>signInWithEmailAndPassword(auth,e,p),
  signUp:(e,p)=>createUserWithEmailAndPassword(auth,e,p),
  signOut:()=>signOut(auth)
};
onAuthStateChanged(auth,u=>{user=u;if(u)sync().catch(()=>{});window.ledraApp.redraw()});
window.ledraApp.redraw();
