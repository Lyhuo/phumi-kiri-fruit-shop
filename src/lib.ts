import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, query, orderBy, limit, where, setDoc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";

const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const configured=Boolean(config.apiKey&&config.authDomain&&config.projectId&&config.appId);
const app=configured?(getApps()[0]||initializeApp(config)):null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
export type Product={id:string;name_km:string;name_en:string;description:string;category:string;unit:"kg"|"box";purchase_price:number;selling_price:number;price_currency:"USD"|"KHR";stock:number;low_stock_level:number};
export const fmt=(n:number,currency:"USD"|"KHR")=>new Intl.NumberFormat(currency==="USD"?"en-US":"km-KH",{style:"currency",currency,maximumFractionDigits:currency==="USD"?2:0}).format(n||0);
export const today=()=>new Date().toISOString().slice(0,10);
const root=(uid:string,table:string)=>collection(db!,"users",uid,table);
const getUid=()=>{const uid=auth?.currentUser?.uid;if(!uid)throw new Error("Please sign in again.");return uid;};
export const supabase:any=!auth||!db?null:{
 auth:{
  getSession:async()=>({data:{session:auth.currentUser?{user:{id:auth.currentUser.uid,email:auth.currentUser.email}}:null}}),
  onAuthStateChange:(_event:any,cb:any)=>{const unsubscribe=onAuthStateChanged(auth,u=>cb("AUTH_STATE",u?{user:{id:u.uid,email:u.email}}:null));return {data:{subscription:{unsubscribe}}};},
  signUp:async({email,password}:any)=>{try{const r=await createUserWithEmailAndPassword(auth,email,password);return {data:{user:{id:r.user.uid,email:r.user.email}},error:null};}catch(error:any){return {data:{user:null},error};}},
  signInWithPassword:async({email,password}:any)=>{try{const r=await signInWithEmailAndPassword(auth,email,password);return {data:{user:{id:r.user.uid,email:r.user.email}},error:null};}catch(error:any){return {data:{user:null},error};}},
  signOut:()=>signOut(auth)
 },
 from:(table:string)=>new QueryAdapter(table),
 rpc:async(fn:string,args:any)=>{try{const uid=getUid();const productRef=doc(db!,"users",uid,"products",args.p_product_id);if(!["stock_in","stock_out","record_sale"].includes(fn))throw new Error("Unknown operation");await runTransaction(db!,async tx=>{const snap=await tx.get(productRef);if(!snap.exists())throw new Error("Fruit product not found");const p=snap.data(),q=Number(args.p_quantity);if(q<=0)throw new Error("Quantity must be greater than zero");if(fn!=="stock_in"&&Number(p.stock)<q)throw new Error("Not enough stock available");const now=new Date().toISOString();tx.update(productRef,{stock:fn==="stock_in"?Number(p.stock)+q:Number(p.stock)-q,...(fn==="stock_in"?{purchase_price:Number(args.p_unit_cost||0)}:{}),updated_at:now});const movement=doc(root(uid,"stock_movements"));tx.set(movement,{id:movement.id,product_id:args.p_product_id,movement_type:fn==="stock_in"?"IN":"OUT",quantity:q,unit_cost:Number(args.p_unit_cost||0),note:fn==="record_sale"?"Sale recorded":args.p_note||"",created_at:now});if(fn==="record_sale"){const sale=doc(root(uid,"sales"));tx.set(sale,{id:sale.id,product_id:args.p_product_id,quantity:q,unit_price:Number(args.p_unit_price),currency:args.p_currency,total:Math.round(q*Number(args.p_unit_price)*100)/100,customer:args.p_customer||"",note:args.p_note||"",created_at:now});}});return {data:null,error:null};}catch(error:any){return {data:null,error};}}
};
class QueryAdapter{
 filters:any[]=[];sort:string|null=null;ascending=true;max:number|undefined;action="read";payload:any;
 constructor(private table:string){}
 select(_fields="*"){return this;} order(field:string,opts:any={}){this.sort=field;this.ascending=opts.ascending!==false;return this;} limit(n:number){this.max=n;return this;} eq(field:string,value:any){this.filters.push(where(field,"==",value));return this;} insert(payload:any){this.action="insert";this.payload=payload;return this;} update(payload:any){this.action="update";this.payload=payload;return this;} delete(){this.action="delete";return this;} then(resolve:any,reject:any){return this.execute().then(resolve,reject);}
 async execute(){try{const uid=getUid(),col=root(uid,this.table);if(this.action==="insert"){const values=Array.isArray(this.payload)?this.payload:[this.payload];for(const value of values){const ref=doc(col);await setDoc(ref,{...value,id:ref.id,created_at:new Date().toISOString()});}return {data:values,error:null};}if(this.action==="update"||this.action==="delete"){const snap=await getDocs(query(col,...this.filters));for(const row of snap.docs){if(this.action==="delete")await deleteDoc(row.ref);else await updateDoc(row.ref,this.payload);}return {data:null,error:null};}const constraints=[...this.filters];if(this.sort)constraints.push(orderBy(this.sort,this.ascending?"asc":"desc"));if(this.max)constraints.push(limit(this.max));const snap=await getDocs(query(col,...constraints));let rows=snap.docs.map(d=>({id:d.id,...d.data()})) as any[];if(this.table==="sales"||this.table==="stock_movements"){rows=await Promise.all(rows.map(async r=>{const product=await getDocs(query(root(uid,"products"),where("id","==",r.product_id)));const p=product.docs[0]?.data();return {...r,products:p?{name_en:p.name_en,name_km:p.name_km,unit:p.unit}:null};}));}return {data:rows,error:null};}catch(error:any){return {data:null,error};}}
}
