const t=new WeakMap;function n(e){const s=(t.get(e)??0)+1;return t.set(e,s),()=>t.get(e)===s}export{n as b};
