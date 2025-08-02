import{u as K}from"./warehouseStore-B9n1r2kT.js";import{u as Y}from"./itemDefinitionStore-04-9rTHn.js";import{u as Z}from"./itemStore-CnjFUNoz.js";import{_ as ee}from"./ItemDefinitionForm.vue_vue_type_script_setup_true_lang-B4qtHwhO.js";import{Q as te}from"./browser-B5Ll5lpq.js";import{d as ne,r as g,H as T,o as ae,b as v,c as t,k as h,e as o,w as n,l as c,F as $,n as j,q as B,j as f,t as b,E as oe,g as d,h as r}from"./index-DXAPKMDa.js";import{_ as ie}from"./_plugin-vue_export-helper-DlAUqK2U.js";import"./categoryStore-BfRDAmHJ.js";const se={class:"page-container"},re={key:0},le={id:"print-area",class:"label-grid"},de={class:"item-name"},me=["id"],ue={class:"item-id"},ce={class:"date"},fe=ne({__name:"Inbound",setup(pe){const E=K(),p=Y(),s=Z(),S=g(),R=g(),L=g(null),I=g(!1),k=g(!1),l=T({itemDefinitionId:void 0,quantity:1}),D=T({warehouseId:void 0}),V={itemDefinitionId:[{required:!0,message:"请选择物品！"}],quantity:[{required:!0,message:"请输入数量！",type:"number",min:1}]},A={warehouseId:[{required:!0,message:"请选择目标仓库！"}]};ae(()=>{E.fetchWarehouses(),p.fetchItemDefinitions(),s.preInboundItems=[]});const M=()=>I.value=!0,Q=async()=>{try{const i=await L.value?.validate();if(!i)return;await p.addItemDefinition(i),d.success("新物品定义创建成功！"),l.itemDefinitionId=p.itemDefinitions[0].id,I.value=!1}catch{d.error("请检查表单")}},W=async()=>{try{await S.value?.validate(),s.preInbound(l.itemDefinitionId,l.quantity),k.value=!0,await oe(),O()}catch{d.error("请先选择物品和数量")}},H=async()=>{try{await R.value?.validate(),await s.confirmInbound(D.warehouseId),d.success("确认入库成功！"),S.value?.resetFields(),R.value?.resetFields()}catch{d.error("请选择目标仓库")}},O=()=>{s.preInboundItems.forEach(i=>{const e=document.getElementById(`qr-${i.id}`);e&&te.toCanvas(e,i.shortId,{width:80,margin:1},_=>{_&&console.error(_)})})},U=i=>p.itemDefinitions.find(e=>e.id===i)?.name||"未知",P=()=>{const i=document.getElementById("print-area");if(!i){d.error("找不到打印区域");return}const e=i.getElementsByTagName("canvas");if(e.length===0){d.error("没有找到要打印的二维码");return}const _=Array.from(e).map((x,m)=>{const y=s.preInboundItems[m];if(!y)return"";const u=x.toDataURL("image/png"),N=U(y.itemDefinitionId),q=y.shortId,C=new Date().toLocaleDateString();return`
      <div class="label-wrapper">
        <div class="label">
          <div class="qr-container">
            <img src="${u}" class="qrcode" />
          </div>
          <div class="info-container">
            <p class="item-name">${N}</p>
            <p class="item-id">${q}</p>
            <p class="date">${C}</p>
          </div>
        </div>
      </div>
    `}).join(""),w=window.open("","_blank");w?(w.document.write(`
      <html>
        <head>
          <title>打印标签</title>
          <style>
            /* 
             * Counter-intuitive Rotated Layout.
             * This attempts a different transform order to achieve the same result,
             * which may bypass certain browser/driver rendering bugs.
            */
            @page {
              size: 30mm 40mm;
              margin: 0;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
            }
            body { 
              margin: 0; 
              font-family: 'Arial', sans-serif;
            }
            .label-wrapper {
              width: 30mm;
              height: 40mm;
              page-break-after: always;
              overflow: hidden;
            }
            .label { 
              width: 40mm;
              height: 30mm;
              padding: 2mm;
              box-sizing: border-box;
              
              transform-origin: top left;
              
              /* The counter-intuitive approach: translate then rotate(-90deg) */
              transform: rotate(-90deg) translateX(30mm) ;

              /* --- Content layout (remains horizontal) --- */
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
            }
            .qr-container {
              flex-shrink: 0;
              width: 24mm;
              height: 24mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qrcode {
              max-width: 100%;
              max-height: 100%;
            }
            .info-container {
              flex-grow: 1;
              padding-left: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              text-align: left;
              overflow: hidden;
              height: 100%;
            }
            .item-name { 
              font-weight: bold; 
              font-size: 9pt; 
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .item-id { 
              font-size: 8pt; 
              word-break: break-all; 
              margin: auto 0;
            }
            .date {
              font-size: 7pt;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${_}
          <script>
            window.addEventListener('afterprint', () => window.close());
            window.onload = () => {
              window.focus();
              window.print();
            };
          <\/script>
        </body>
      </html>
    `),w.document.close()):d.error("无法打开打印窗口，请检查是否被浏览器拦截。")};return(i,e)=>{const _=o("a-page-header"),w=o("a-select-option"),x=o("a-select"),m=o("a-button"),y=o("a-space-compact"),u=o("a-form-item"),N=o("a-input-number"),q=o("a-form"),C=o("a-card"),z=o("a-col"),G=o("a-alert"),X=o("a-empty"),J=o("a-row"),F=o("a-modal");return r(),v("div",null,[t(_,{title:"入库操作","sub-title":"先生成并打印标签，再确认入库"}),h("div",se,[t(J,{gutter:16},{default:n(()=>[t(z,{span:10},{default:n(()=>[t(C,{title:"第一步：生成标签"},{default:n(()=>[t(q,{ref_key:"form1Ref",ref:S,model:l,rules:V,layout:"vertical"},{default:n(()=>[t(u,{label:"入库物品",name:"itemDefinitionId"},{default:n(()=>[t(y,{style:{width:"100%"}},{default:n(()=>[t(x,{value:l.itemDefinitionId,"onUpdate:value":e[0]||(e[0]=a=>l.itemDefinitionId=a),placeholder:"请选择或新建物品",style:{width:"calc(100% - 120px)"},"show-search":""},{default:n(()=>[(r(!0),v($,null,j(c(p).itemDefinitions,a=>(r(),B(w,{key:a.id,value:a.id},{default:n(()=>[f(b(a.name),1)]),_:2},1032,["value"]))),128))]),_:1},8,["value"]),t(m,{type:"dashed",onClick:M},{default:n(()=>e[6]||(e[6]=[f("新建物品定义",-1)])),_:1,__:[6]})]),_:1})]),_:1}),t(u,{label:"数量",name:"quantity"},{default:n(()=>[t(N,{value:l.quantity,"onUpdate:value":e[1]||(e[1]=a=>l.quantity=a),min:1,style:{width:"100%"}},null,8,["value"])]),_:1}),t(u,null,{default:n(()=>[t(m,{type:"primary",onClick:W},{default:n(()=>e[7]||(e[7]=[f("生成并准备打印",-1)])),_:1,__:[7]})]),_:1})]),_:1},8,["model"])]),_:1})]),_:1}),t(z,{span:14},{default:n(()=>[t(C,{title:"第二步：确认入库"},{default:n(()=>[c(s).preInboundItems.length>0?(r(),v("div",re,[t(G,{message:`已生成 ${c(s).preInboundItems.length} 个待入库物品标签`,type:"info","show-icon":"",style:{"margin-bottom":"16px"}},null,8,["message"]),t(q,{ref_key:"form2Ref",ref:R,model:D,rules:A,layout:"vertical"},{default:n(()=>[t(u,{label:"目标仓库",name:"warehouseId"},{default:n(()=>[t(x,{value:D.warehouseId,"onUpdate:value":e[2]||(e[2]=a=>D.warehouseId=a),placeholder:"请选择一个仓库","show-search":""},{default:n(()=>[(r(!0),v($,null,j(c(E).warehouses,a=>(r(),B(w,{key:a.id,value:a.id},{default:n(()=>[f(b(a.name),1)]),_:2},1032,["value"]))),128))]),_:1},8,["value"])]),_:1}),t(u,null,{default:n(()=>[t(m,{type:"success",onClick:H,loading:c(s).loading},{default:n(()=>e[8]||(e[8]=[f("确认入库",-1)])),_:1,__:[8]},8,["loading"])]),_:1})]),_:1},8,["model"])])):(r(),B(X,{key:1,description:"请先在左侧生成物品标签"}))]),_:1})]),_:1})]),_:1})]),t(F,{open:I.value,"onUpdate:open":e[3]||(e[3]=a=>I.value=a),title:"新建物品定义",onOk:Q,"confirm-loading":c(p).loading},{default:n(()=>[t(ee,{ref_key:"newItemDefFormRef",ref:L},null,512)]),_:1},8,["open","confirm-loading"]),t(F,{open:k.value,"onUpdate:open":e[5]||(e[5]=a=>k.value=a),title:"打印入库标签",width:"80%"},{footer:n(()=>[t(m,{key:"back",onClick:e[4]||(e[4]=a=>k.value=!1)},{default:n(()=>e[9]||(e[9]=[f("关闭",-1)])),_:1,__:[9]}),t(m,{key:"submit",type:"primary",onClick:P},{default:n(()=>e[10]||(e[10]=[f("打印",-1)])),_:1,__:[10]})]),default:n(()=>[h("div",le,[(r(!0),v($,null,j(c(s).preInboundItems,a=>(r(),v("div",{key:a.id,class:"label"},[h("p",de,b(U(a.itemDefinitionId)),1),h("canvas",{id:"qr-"+a.id,class:"qrcode"},null,8,me),h("p",ue,b(a.shortId),1),h("p",ce,b(new Date().toLocaleDateString()),1)]))),128))])]),_:1},8,["open"])])}}}),ke=ie(fe,[["__scopeId","data-v-f23819a7"]]);export{ke as default};
