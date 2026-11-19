import { createClient } from "@supabase/supabase-js";
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const configured=Boolean(url&&key&&url.startsWith("https://"));
export const supabase=configured?createClient(url!,key!):null;
export type Product={id:string;name_km:string;name_en:string;description:string;category:string;unit:"kg"|"box";purchase_price:number;selling_price:number;price_currency:"USD"|"KHR";stock:number;low_stock_level:number};
export const fmt=(n:number,currency:"USD"|"KHR")=>new Intl.NumberFormat(currency==="USD"?"en-US":"km-KH",{style:"currency",currency,maximumFractionDigits:currency==="USD"?2:0}).format(n||0);
export const today=()=>new Date().toISOString().slice(0,10);
