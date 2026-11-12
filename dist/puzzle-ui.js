/* SVG puzzle views. They submit values to the pure state machine; no progression is decided here. */
(function (global) {
  'use strict';
  let ctx = null, local = {}, active = null;
  const $ = id => document.getElementById(id);
  const esc = value => PineSceneUtil.esc(value);
  function bind(selector, event, fn) {
    document.querySelectorAll('#modal-body ' + selector).forEach(element => element.addEventListener(event, () => fn(element)));
  }
  function send(action) {
    const result = ctx.dispatch(action); ctx.state = PineSceneUtil.adapt(result.state || ctx.state, ctx.runtime);
    return result;
  }
  function accepted(result) { return result && result.accepted !== false && result.changed !== false && !result.error; }
  function toast(text) { PineRenderer.toast(text); }
  function status(text, error) { const el = $('puzzle-status'); if (el) { el.textContent = text; el.style.color = error ? '#7b493d' : ''; } }
  function openView(title, html, key) { active = key; PineRenderer.openModal(title, html); }
  function tolerance() {
    const svg = document.querySelector('#modal-body svg');
    return svg ? Math.max(56, 24 * 1280 / svg.getBoundingClientRect().width) : 64;
  }
  function angleDiff(a,b) { return Math.abs(((a-b+540)%360)-180); }
  function gears() {
    const act = ctx.state.act || {};
    if (act.device && act.device.slots) return Object.values(act.device.slots);
    return act.installed || act.installedGears || ctx.state.installedGears || [];
  }
  function hasItem(ids) { return ids.some(id => (ctx.state.inventory||[]).includes(id) || (ctx.state.gears||[]).includes(id)); }
  function openLibraryLock() {
    local.dials = local.dials || [0,0,0];
    const symbols = ['○','△','□','星'], symbolIds = ['circle','triangle','square','star'];
    openView('抽屉 · 三个图案转盘', `<p class="puzzle-instruction">借阅卡的顺序：《声学札记》《窗格集》《机械图册》。对应书脊图案依次是圆、三角、方形。</p>
      <div class="control-row">${local.dials.map((v,i)=>`<button class="paper-button dial" data-index="${i}" style="font-size:28px;min-width:90px;min-height:80px">${symbols[v]}</button>`).join('')}</div>
      <div class="control-row"><button class="paper-button" id="unlock-drawer">打开抽屉</button></div><p id="puzzle-status" class="puzzle-status"></p>`, 'A1');
    bind('.dial','click',el => { const i=Number(el.dataset.index); local.dials[i]=(local.dials[i]+1)%symbols.length; openLibraryLock(); });
    bind('#unlock-drawer','click',() => {
      const value = local.dials.map(i=>symbolIds[i]);
      const result = send({type:'PUZZLE',id:'A1_LOCK',value});
      if (accepted(result)) { local.dials=null; PineRenderer.closeModal(true); toast('抽屉开了。里面还有一片图纸。'); }
      else status('转盘轻轻回弹，顺序还不对。',true);
    });
  }
  function openBlueprint() {
    local.blueprint = {x:850,y:350,angle:0};
    openView('图纸拼合', `<p class="puzzle-instruction">拖动右侧碎片，让撕口与传动线条同时接上。接近时会吸附。</p>
      <svg class="puzzle-svg" viewBox="0 0 1280 620" aria-label="两片图纸">
        <rect width="1280" height="620" fill="#c9bfa7"/>
        <g transform="translate(280 170)"><path d="M0 0H300L275 70 310 125 270 185 300 250H0Z" fill="#e0d4b5" stroke="#574834" stroke-width="5"/>
          <path d="M40 190H240V70H40ZM140 70V190M40 130H240" fill="none" stroke="#756444" stroke-width="5"/><circle cx="140" cy="130" r="35" fill="none" stroke="#756444" stroke-width="5"/></g>
        <path d="M580 170L555 240 590 295 550 355 580 420H900V170Z" fill="none" stroke="#8a795c" stroke-width="3" stroke-dasharray="8 8" opacity=".55"/>
        <g id="blueprint-piece" data-drag="blueprint" class="draggable" transform="translate(850 170)"><path d="M0 0L-25 70 10 125-30 185 0 250H320V0Z" fill="#e0d4b5" stroke="#574834" stroke-width="5"/>
          <path d="M20 190H250V70H20ZM130 70V190M20 130H250" fill="none" stroke="#756444" stroke-width="5"/><path d="M65 180l30-80 40 65 35-95 50 110" fill="none" stroke="#756444" stroke-width="5"/></g>
      </svg><p id="puzzle-status" class="puzzle-status">撕口附近有一条跨页传动线。</p>`, 'A2');
  }
  function openDraft() {
    local.draftAngle = local.draftAngle || 0;
    const angles=[-30,0,30];
    openView('描图架 · 三档倾斜', `<p class="puzzle-instruction">装上完整图样，切换倾斜角度，让三个圆形标记同时重合。</p>
      <svg class="puzzle-svg" viewBox="0 0 1000 430"><rect width="1000" height="430" fill="#c7bda5"/>
        <g transform="translate(500 210) rotate(${local.draftAngle})"><rect x="-300" y="-140" width="600" height="280" fill="#ded2b2" stroke="#554633" stroke-width="7"/>
        <path d="M-240 80H190V-80H-240ZM-20-80V80M-240 0H190" fill="none" stroke="#756444" stroke-width="5"/>
        <g fill="none" stroke="#806a43" stroke-width="4"><circle cx="-190" cy="-80" r="14"/><circle cx="20" cy="0" r="14"/><circle cx="180" cy="85" r="14"/></g></g>
        <g fill="none" stroke="#4e4535" stroke-width="4"><circle cx="310" cy="130" r="18"/><circle cx="520" cy="210" r="18"/><circle cx="680" cy="295" r="18"/></g></svg>
      <div class="control-row">${angles.map(a=>`<button class="paper-button draft-angle ${a===local.draftAngle?'selected':''}" data-angle="${a}">${a<0?'左倾':a>0?'右倾':'水平'}</button>`).join('')}</div><p id="puzzle-status" class="puzzle-status"></p>`, 'A3');
    bind('.draft-angle','click',el=>{
      local.draftAngle=Number(el.dataset.angle); openDraft();
      if(local.draftAngle===30){const result=send({type:'PUZZLE',id:'A3',value:30});if(accepted(result)){PineRenderer.closeModal(true);toast('三处标记重合，桌面恢复了阳光。');}}
      else status('投影仍有偏移。',true);
    });
  }
  function openBlade() {
    const materials = hasItem(['indicatorMaterials','bladePartA','materialA']);
    openView('指示叶片', `<svg viewBox="0 0 800 300" width="100%" height="260"><path d="M400 250V100M400 150L260 45M400 150L540 45" stroke="#5d4932" stroke-width="15" fill="none"/><path d="M400 160Q500 70 580 120Q530 230 400 160Z" fill="${materials?'#7b8270':'none'}" stroke="#4d5144" stroke-width="6" stroke-dasharray="${materials?'0':'10 8'}"/></svg>
      <p>老师画下的指示叶片更大、更薄。薄木片提供形状，铜片卡住转轴。</p><div class="control-row"><button id="assemble-blade" class="paper-button" ${materials?'':'disabled'}>组合材料</button><button id="install-blade" class="paper-button" ${hasItem(['indicatorBlade'])?'':'disabled'}>安装到模型</button></div><p id="puzzle-status" class="puzzle-status"></p>`, 'B1');
    bind('#assemble-blade','click',()=>{const r=send({type:'COMBINE',items:['leafFrame','leafFilm'],result:'indicatorLeaf'});if(accepted(r))openBlade();else status('还缺能固定转轴的材料。',true);});
    bind('#install-blade','click',()=>{const r=send({type:'USE',item:'indicatorLeaf',target:'modelSocket'});if(accepted(r)){PineRenderer.closeModal(true);toast('叶片装上了。学生影像抬起了头。');}else status('这个位置装不上。',true);});
  }
  function openTransmission() {
    local.transmission = local.transmission || [0,0,0];
    const labels=['左→中','左→右','中→右'];
    openView('传动调整', `<p class="puzzle-instruction">实验记录：低片由左轮驱动，高片由右轮驱动，中片最后接入。让动力按“左 → 右 → 中”通过。</p>
      <svg viewBox="0 0 1000 360" width="100%" height="310"><g fill="#8b8068" stroke="#493d2e" stroke-width="7">${[250,500,750].map((x,i)=>`<circle cx="${x}" cy="170" r="90"/><circle cx="${x}" cy="170" r="25" fill="#4e4638"/><text x="${x}" y="185" text-anchor="middle" font-size="30">${['低','高','中'][i]}</text>`).join('')}</g><path d="M250 170L${local.transmission[0]===1?750:500} 170M500 170L${local.transmission[1]===2?750:250} 170" stroke="#a18a58" stroke-width="12"/></svg>
      <div class="control-row">${local.transmission.map((v,i)=>`<button class="paper-button transmission" data-index="${i}">${['低片连接','高片连接','中片连接'][i]}：${labels[v]}</button>`).join('')}<button class="paper-button" id="play-memory">重现四个音</button><button class="paper-button" id="test-transmission">试运行</button></div><p id="puzzle-status" class="puzzle-status">音序：低 — 高 — 中 — 低</p>`, 'B2');
    bind('.transmission','click',el=>{const i=Number(el.dataset.index);local.transmission[i]=(local.transmission[i]+1)%3;openTransmission();});
    bind('#play-memory','click',()=>ctx.visualFourNotes());
    bind('#test-transmission','click',()=>{const correct=local.transmission[0]===1&&local.transmission[1]===2&&local.transmission[2]===0;const value=correct?{links:['input-middle','middle-output'],notes:['low','high','medium','low']}:{links:['wrong'],notes:['low','high','medium','low']};const r=send({type:'PUZZLE',id:'B2',value});if(accepted(r)){local.transmission=null;PineRenderer.closeModal(true);ctx.visualFourNotes();toast('几次停顿后，模型第一次发出了完整的声音。');}else status('声音仍停在同一处，有一根连接不对。',true);});
  }
  function openConvergence() {
    local.views = local.views || new Set(); local.clues = local.clues || new Set();
    const ready=local.views.has('leave')&&local.views.has('return')&&local.clues.has('note')&&local.clues.has('patch');
    openView('五五楼 · 时间片段', `<div class="control-row"><button class="paper-button memory-view" data-id="leave">离校的脚步</button><button class="paper-button memory-view" data-id="return">归来的脚步 · 多年后</button></div>
      <div class="document-paper" id="memory-description">门旁留着两段脚步。第二段属于<strong>多年后</strong>。</div>
      <div class="control-row"><button class="paper-button secondary clue" data-id="note">离校字条</button><button class="paper-button secondary clue" data-id="patch">修补痕迹</button><button class="paper-button" id="combine-clues" ${ready?'':'disabled'}>放在一起看</button></div>`, 'B3');
    bind('.memory-view','click',el=>{local.views.add(el.dataset.id);$('memory-description').innerHTML=el.dataset.id==='leave'?'年轻学生提着行李经过，脚步很快，没有停下。':'<strong>多年后</strong><br>脚步慢了下来。门前站着归来的学生，门内已经空了。';openConvergence();});
    bind('.clue','click',el=>{local.clues.add(el.dataset.id);openConvergence();});
    bind('#combine-clues','click',()=>{const r=send({type:'PUZZLE',id:'B3',value:{note:'departureNote',trace:'repairTrace'}});if(accepted(r)){local={};PineRenderer.closeModal(true);toast('归来者手里，一直攥着一枚准备交给老师的零件。',3600);}});
  }
  function openDevice() {
    const chapter=ctx.state.chapter, installed=gears();
    const ids=chapter==='act1'?['windowGear','soundGear']:chapter==='act2'?['indicatorGear','transmissionGear']:['nestedWindowGear','signatureGear'];
    const labels={windowGear:'窗格纹',soundGear:'声波纹',indicatorGear:'指示叶片纹',transmissionGear:'传动三轮纹',nestedWindowGear:'新旧窗格嵌套纹',signatureGear:'签名刻痕纹'};
    const slots={windowGear:'windowSlot',soundGear:'soundSlot',indicatorGear:'indicatorSlot',transmissionGear:'transmissionSlot',nestedWindowGear:'nestedWindowSlot',signatureGear:'signatureSlot'};
    const repaired=chapter!=='act2'||PineSceneUtil.flag(ctx.state,['deviceRepaired','b55DeviceRepaired']);
    const memories=chapter!=='act3'||PineSceneUtil.flag(ctx.state,['memoriesAligned','rootMemoriesAligned']);
    openView(chapter==='act3'?'树根刻轮装置':'刻轮装置', `<p class="puzzle-instruction">${chapter==='act2'?'先修复卡住的传动连接。':chapter==='act3'?'先把旧窗影与名册对入两个槽位。':'两个空位分别刻着窗格纹与声波纹。'}</p>
      <svg viewBox="0 0 1000 330" width="100%" height="280"><rect x="70" y="60" width="860" height="220" rx="25" fill="#817259" stroke="#3d3227" stroke-width="8"/>
      ${[330,670].map((x,i)=>`<g>${PineArt.gear(ids[i],{x,y:165,scale:1.1,installed:installed.includes(ids[i])})}<text x="${x}" y="275" text-anchor="middle" font-size="20">${labels[ids[i]]}<br>${installed.includes(ids[i])?'已装入':'空槽'}</text></g>`).join('')}
      <circle cx="500" cy="165" r="52" fill="#4d4233" stroke="#a58b58" stroke-width="5"/><path d="M500 165L860 65" stroke="#41362a" stroke-width="14"/></svg>
      ${chapter==='act2'&&!repaired?'<div class="control-row"><button class="paper-button repair-link" data-value="0">接左轴</button><button class="paper-button repair-link" data-value="1">接中轴</button><button class="paper-button repair-link" data-value="2">接右轴</button></div>':''}
      ${chapter==='act3'&&!memories?'<div class="control-row"><button class="paper-button align-memory" data-memory="oldWindowShadow">旋转旧窗影至 30°</button><button class="paper-button align-memory" data-memory="roster1959">旋转名册至 330°</button></div>':''}
      <div class="control-row">${ids.map(id=>`<button class="paper-button install-gear" data-gear="${id}" ${installed.includes(id)||!hasItem([id])?'disabled':''}>装入${labels[id]}</button>`).join('')}<button class="paper-button" id="seat-amber">嵌入年轮珀</button><button class="paper-button" id="turn-device">转动手柄</button></div><p id="puzzle-status" class="puzzle-status"></p>`, 'DEVICE');
    bind('.repair-link','click',el=>{const r=send({type:'PUZZLE',id:'B4_REPAIR',value:Number(el.dataset.value)===1?'aligned':'misaligned'});if(accepted(r))openDevice();else status('装置卡住了，这个轴仍错位。',true);});
    bind('.align-memory','click',el=>{const memory=el.dataset.memory,slot=memory==='oldWindowShadow'?'nestedWindowSlot':'signatureSlot';const r=send({type:'PUZZLE',id:'C3_MEMORY',value:{memory,slot}});if(accepted(r))openDevice();else status('记忆尚未对齐，齿轮无法咬合。',true);});
    bind('.install-gear','click',el=>{const gear=el.dataset.gear,r=send({type:'USE',item:gear,target:slots[gear]});if(accepted(r))openDevice();else status('这个槽位与齿轮纹样不对应。',true);});
    bind('#seat-amber','click',()=>{const r=send({type:'USE',item:'amber',target:'amberSocket'});if(accepted(r))openDevice();else status('还缺少能带动刻针的结构。',true);});
    bind('#turn-device','click',()=>{const r=send({type:'ENGRAVE',act:chapter});if(accepted(r)){PineRenderer.closeModal(true);PineAudio.play('engrave');toast('刻针停下后，松针光迹亮了起来。',3000);}else status('手柄空转。齿轮、连接或记忆还没有准备好。',true);});
  }
  function openProjection() {
    local.projection=local.projection||{x:350,y:380,angle:0};
    const p=local.projection;
    openView('投射对位', `<p class="puzzle-instruction">拖动年轮珀移动投影，再用旋转按钮调整图样。位置与角度要同时重合。</p>
      <svg class="puzzle-svg" viewBox="0 0 1280 620"><rect width="1280" height="620" fill="#c8bfa8"/>
        <g transform="translate(730 300) rotate(45)" opacity=".4" class="shadow-drift"><path d="M-170-110H170V110H-170ZM0-110V110M-170 0H170" fill="none" stroke="#49483c" stroke-width="13"/></g>
        <g id="projection-piece" data-drag="projection" class="draggable" transform="translate(${p.x} ${p.y}) rotate(${p.angle})"><path d="M-170-110H170V110H-170ZM0-110V110M-170 0H170" fill="rgba(218,204,164,.22)" stroke="#8a7045" stroke-width="8"/><circle cx="-210" cy="140" r="42" fill="#765a38" stroke="#9b7e4f" stroke-width="5"/><path d="M-190 105l15 10-12 12" fill="#c7b995"/></g></svg>
      <div class="control-row"><button class="paper-button rotate-projection" data-delta="-10">逆时针 10°</button><span id="projection-angle">${p.angle}°</span><button class="paper-button rotate-projection" data-delta="10">顺时针 10°</button><button class="paper-button" id="check-projection">观察重合处</button></div><p id="puzzle-status" class="puzzle-status">墙上的旧窗影保持 45°。</p>`, 'C1');
    bind('.rotate-projection','click',el=>{local.projection.angle=(local.projection.angle+Number(el.dataset.delta)+360)%360;openProjection();});
    bind('#check-projection','click',checkProjection);
  }
  function checkProjection() {
    const p=local.projection;
    const aligned=Math.hypot(p.x-730,p.y-300)<=tolerance()&&angleDiff(p.angle,45)<=8;
    const value=aligned?{x:220,y:140,angle:45}:{x:p.x,y:p.y,angle:p.angle};
    const r=send({type:'PUZZLE',id:'C1',value});
    if(accepted(r)){local.projection=null;PineRenderer.closeModal(true);toast('差异显形了。教案上抄着同一个改法。',3400);}
    else status(angleDiff(p.angle,45)>8?'位置接近了，但角度还没有对齐。':'投影仍有偏移。',true);
  }
  function openAlumniStep(data) {
    const step=data.step||'wall';
    if(step==='wall'){
      openView('返校纪念墙','<div class="document-paper">一九八六年后，历届返校者的名字刻满墙面。<br><br>你找了很久，没有找到「刘长睿」。</div><div class="control-row"><button class="paper-button" data-action="OPEN_ALUMNI_STEP" data-step="roster">查看旁边的旧名册</button></div>','C2');
      // 纪念墙可自由查看，不推进必要线索门槛。
    } else if(step==='roster'){
      openView('1959 年学生名册','<div class="document-paper">课堂／实验记录<br><br>……<br>刘长睿<br>……<br><br>名字没有被划掉。名册边角标着一份教案的编号。</div><div class="control-row"><button class="paper-button" data-action="OPEN_ALUMNI_STEP" data-step="lesson">按编号找教案</button></div>','C2');
      send({type:'PUZZLE',id:'C2_ROSTER',value:{year:1959,name:'刘长睿'}});
    } else if(step==='lesson'){
      openView('周老师的教案','<div class="document-paper">指示叶片再薄一分。<br>三片音：低、高、中。<br><br>旁边贴着前工院重建时参考的图样摘记。</div><div class="control-row"><button class="paper-button" data-action="OPEN_ALUMNI_STEP" data-step="projection">把 1959 年的记忆投上去</button></div>','C2');
      send({type:'PUZZLE',id:'C2_LESSON',value:'lessonPlan'});
    } else if(step==='projection'){
      openView('记忆投射','<div class="document-paper">当年那处改法，被一笔一笔抄进教案。<br><br>后来，它又出现在一九八七年重建的图样里。</div><div class="control-row"><button class="paper-button" data-action="OPEN_ALUMNI_STEP" data-step="letter">完全展开随身携带的信</button></div>','C2');
      send({type:'PUZZLE',id:'C2_PROJECT',value:{memory:'modelTuning1959',target:'lessonPlan'}});
    } else {
      const d=PineContent.dialogues.act3.letter;
      openView('信 · 内侧',`<div class="document-paper">${d.front.join('<br>')}<div class="fold"></div>${d.inside.join('<br>')}</div><div class="control-row"><button class="paper-button" id="fold-letter">折好，收回来</button></div>`,'C2');
      send({type:'PUZZLE',id:'C2_LETTER',value:'unfold'});
      bind('#fold-letter','click',()=>PineRenderer.closeModal());
    }
  }
  function openGraft(data) {
    const act=data.act||ctx.state.chapter; local.graftAngle=local.graftAngle||0; local.graftAct=act;
    const target={prologue:40,act1:90,act2:220,act3:320}[act];
    openView('年轮接合', `<p class="puzzle-instruction">只旋转新刻的那一圈。树干的亮痕指向 ${target}°，接近时会自然吸附。</p>
      <svg class="puzzle-svg" viewBox="0 0 1000 540"><rect width="1000" height="540" fill="#302f26"/>
        <path d="M470 540Q420 350 480 0H580Q530 250 590 540Z" fill="#594a36" stroke="#241f19" stroke-width="10"/><path d="M520 450Q470 300 535 90" fill="none" stroke="#211d17" stroke-width="14"/>
        <g transform="translate(520 280) rotate(${target})" opacity=".65"><path d="M0-130V-90M0 90V130M-130 0H-90M90 0H130" stroke="#b39a61" stroke-width="8"/></g>
        <g id="graft-ring" data-drag="graft" class="draggable" transform="translate(520 280)"><circle r="115" fill="#6d5335" stroke="#9d814f" stroke-width="6"/><g class="ring-turn" transform="rotate(${local.graftAngle})"><circle r="88" fill="none" stroke="#c0a064" stroke-width="5" stroke-dasharray="130 20"/><path d="M0-88V-55" stroke="#d0b476" stroke-width="9"/></g><circle r="58" fill="none" stroke="#9d814f" stroke-width="4"/><circle r="29" fill="#302920"/></g></svg>
      <div class="control-row"><button class="paper-button rotate-graft" data-delta="-10">−10°</button><span>${local.graftAngle}°</span><button class="paper-button rotate-graft" data-delta="10">＋10°</button></div><p id="puzzle-status" class="puzzle-status"></p>`, 'GRAFT');
    bind('.rotate-graft','click',el=>{local.graftAngle=(local.graftAngle+Number(el.dataset.delta)+360)%360;openGraft({act});checkGraft(act,target);});
  }
  function checkGraft(act,target) {
    if(angleDiff(local.graftAngle,target)>8)return;
    PineRenderer.closeModal(true);
    const r=send({type:'GRAFT',act,angle:local.graftAngle,value:local.graftAngle});
    if(accepted(r)){local.graftAngle=0;PineAudio.play('graft');}else toast('纹路还没有吸附。');
  }
  function openEvidence(data) {
    const id=data.id;
    if(id==='ceremony'){
      local.ceremonyYear=local.ceremonyYear||null;
      openView('最后一排 · 典礼册',`<p>年轮珀贴近后，属于沈立毕业那年的字显了出来。</p><div class="control-row">${[2000,2001,2002].map(y=>`<button class="paper-button ceremony-year" data-year="${y}">${y} 年</button>`).join('')}</div>${local.ceremonyYear===2002?'<div class="document-paper">二〇〇二年典礼记录<br><br>最后一排座席名单<br>……<br><strong>沈立</strong></div><div class="control-row"><button class="paper-button" id="record-ceremony">翻到名字</button></div>':'<p id="puzzle-status">选择一册，让纸页显影。</p>'}`,'D1');
      bind('.ceremony-year','click',el=>{local.ceremonyYear=Number(el.dataset.year);openEvidence({id});});
      bind('#record-ceremony','click',()=>{const r=send({type:'PUZZLE',id:'D1',value:{year:2002,name:'沈立'}});if(accepted(r))PineRenderer.closeModal(true);});
    } else if(id==='roster'){
      local.rosterPage=local.rosterPage||1;
      openView('名册续页',`<div class="document-paper">${local.rosterPage<3?'课堂记录与返校签名<br><br>……<br>这一页还没有沈立。':'续页<br><br>刘长睿<br>……<br>……<br><strong>沈立</strong><br><span class="evidence-stamp">二〇〇二</span>'}</div><div class="control-row"><button class="paper-button" id="roster-next">${local.rosterPage<3?'往后翻':'记录这个签名'}</button></div>`,'D2');
      bind('#roster-next','click',()=>{if(local.rosterPage<3){local.rosterPage++;openEvidence({id});}else{const r=send({type:'PUZZLE',id:'D2',value:{page:'continuation',name:'沈立'}});if(accepted(r))PineRenderer.closeModal(true);}});
    } else {
      local.plaque=local.plaque||{x:280,y:390};
      openView('新修缮痕迹 · 施工铭牌',`<p class="puzzle-instruction">拖动年轮珀，照亮新修缮痕迹旁的铭牌。</p><svg class="puzzle-svg" viewBox="0 0 1100 560"><rect width="1100" height="560" fill="#bcb49c"/><path d="M500 80L580 480M540 100L650 430" stroke="#7b6d53" stroke-width="15"/><rect x="650" y="250" width="240" height="140" fill="#6f6754" stroke="#453f33" stroke-width="6"/><text x="770" y="330" text-anchor="middle" fill="#39382f" font-size="30">沈　立</text><g id="plaque-amber" data-drag="plaque" class="draggable" transform="translate(${local.plaque.x} ${local.plaque.y})">${PineArt.amber(ctx.state.amber||{},{x:0,y:0,scale:.8})}</g></svg><p id="puzzle-status">铭牌上的字太暗，还看不清。</p>`,'D3');
    }
  }
  function open(action,data) {
    ctx=data;ctx.state=data.state;active=action;
    if(action==='OPEN_LIBRARY_LOCK')openLibraryLock();
    else if(action==='OPEN_BLUEPRINT')openBlueprint();
    else if(action==='OPEN_DRAFT')openDraft();
    else if(action==='OPEN_BLADE')openBlade();
    else if(action==='OPEN_TRANSMISSION')openTransmission();
    else if(action==='OPEN_CONVERGENCE')openConvergence();
    else if(action==='OPEN_DEVICE')openDevice();
    else if(action==='OPEN_PROJECTION')openProjection();
    else if(action==='OPEN_ALUMNI_STEP')openAlumniStep(data);
    else if(action==='OPEN_GRAFT')openGraft(data);
    else if(action==='OPEN_EVIDENCE')openEvidence(data);
  }
  function drag(data, context) {
    if(context)ctx=context;
    if(!ctx)return;
    if(data.id==='blueprint'&&active==='A2'){
      const piece=$('blueprint-piece');if(!piece)return;
      const x=850+data.dx,y=170+data.dy;
      if(data.phase!=='end'&&data.phase!=='cancel')piece.setAttribute('transform',`translate(${x} ${y})`);
      if(data.phase==='end'){
        if(Math.hypot(x-580,y-170)<=tolerance()){piece.setAttribute('transform','translate(580 170)');const r=send({type:'PUZZLE',id:'A2',value:{x:160,y:96,angle:90}});if(accepted(r)){PineRenderer.closeModal(true);toast('撕口与线条接上了。');}else toast('线条还没有接上。');}
        else{piece.setAttribute('transform','translate(850 170)');status('碎片弹回原位。',true);}
      }
    } else if(data.id==='projection'&&active==='C1'){
      local.projection.x=Math.max(180,Math.min(1100,350+data.dx));local.projection.y=Math.max(130,Math.min(500,380+data.dy));
      const piece=$('projection-piece');if(piece)piece.setAttribute('transform',`translate(${local.projection.x} ${local.projection.y}) rotate(${local.projection.angle})`);
      if(data.phase==='end')checkProjection();
    } else if(data.id==='graft'&&active==='GRAFT'){
      local.graftAngle=(Math.atan2(data.y-280,data.x-520)*180/Math.PI+450)%360;
      const ring=document.querySelector('#graft-ring .ring-turn');
      if(ring)ring.setAttribute('transform',`rotate(${local.graftAngle})`);
      if(data.phase==='end'){
        const targets={prologue:40,act1:90,act2:220,act3:320};
        checkGraft(local.graftAct,targets[local.graftAct]);
      }
    } else if(data.id==='plaque'&&active==='D3'){
      local.plaque.x=280+data.dx;local.plaque.y=390+data.dy;
      const piece=$('plaque-amber');if(piece)piece.setAttribute('transform',`translate(${local.plaque.x} ${local.plaque.y})`);
      if(data.phase==='end'){
        if(Math.hypot(local.plaque.x-770,local.plaque.y-320)<=tolerance()*1.5){const r=send({type:'PUZZLE',id:'D3',value:{target:'repairPlaque',name:'沈立'}});if(accepted(r)){PineRenderer.closeModal(true);toast('施工铭牌上，是沈立的名字。');}}
        else status('这一片还没有被照亮。',true);
      }
    } else if(data.id==='support'){
      const wood=$('support-wood');
      if(wood&&data.phase!=='end')wood.setAttribute('transform',`translate(${900+data.dx} ${380+data.dy})`);
      if(data.phase==='end'){
        const x=900+data.dx,y=380+data.dy;
        if(Math.hypot(x-700,y-380)<=120)send({type:'USE',item:'supportWood',target:'seedling'});
        else { if(wood)wood.setAttribute('transform','translate(900 380)'); toast('把支撑木拖到幼苗两侧，让它站稳。'); }
      }
    }
  }
  global.PinePuzzleUI={open,drag};
})(window);
