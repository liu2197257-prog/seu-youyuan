# PineState / PinePuzzles 集成 API

全篇纯状态模块，覆盖序章、1933、1959、1988、2002 与尾声。无构建、无依赖、无 DOM、无网络、无计时器；所有状态均可 JSON 序列化。

## 1. 加载与导出

浏览器 `file://` 直接按顺序加载经典脚本：

```html
<script src="./puzzles.js"></script>
<script src="./state.js"></script>
```

```js
const state = PineState.createInitialState();
const result = PineState.transition(state, {
  type: 'ENTER', scene: 'prologue_pine'
});
```

Node / `node:test`：

```js
const PineState = require('../dist/state.js');
const PinePuzzles = require('../dist/puzzles.js');
```

`state.js` 在 CommonJS 中会自动 `require('./puzzles.js')`；浏览器必须先加载 `puzzles.js`。

## 2. 四个主 API

### `PineState.createInitialState()`

返回新的初始状态。年轮珀此时尚未取得，`ringAmber.owned === false`。

### `PineState.transition(state, action) -> { state, effects }`

- 接受的动作：返回一个新状态，不修改输入状态。
- 拒绝的动作：返回**原状态对象引用**，`effects` 含 `{type:'REJECTED', reason}`。
- `effects` 是给渲染、声音、演出层的即时事件；模块本身不执行动画或延迟回调。
- 不要把 UI 的近景开关、选中道具、拖动过程写进剧情状态；只在操作完成时发高语义 action。

### `PineState.canEnter(state, sceneId) -> boolean`

只判断场景进入权限，不改变状态。旧时代场景始终返回 `false`。

特殊规则：

- `prologue_sprout` 仅在用年轮珀触碰裂口后开放。
- `act3_alumni` 可以提前进入，但 C1 未完成时所有 C2 必要线索动作均以 `C1_REQUIRED` 拒绝。
- `act4_memorial` 在 2002 可自由进出；馆内 `TAKE / USE / PUZZLE / COMBINE / TURN_HANDLE / GRAFT / TOUCH` 全部以 `MEMORIAL_REAL_LAYER_ONLY` 拒绝。
- `act4_ending` 由第三次物证投射自动进入，不能提前进入。

### `PineState.getHint(state, puzzleId, level) -> string | null`

主动读取第 1～3 级提示；不修改状态，不自动弹出。无效 ID 或级别返回 `null`。

### `PinePuzzles.check(id, value) -> boolean`

纯谜题答案判定，容错输入不会抛异常。另有：

```js
PinePuzzles.getHint(id, level);
PinePuzzles.TOLERANCES; // { dragPx: 24, rotationDeg: 8 }
```

## 3. 状态结构

```js
{
  version: 1,
  era: 'prologue',             // prologue | 1933 | 1959 | 1988 | 2002 | epilogue
  phase: 'prologue_camera',
  scene: 'prologue_campus',
  inventory: [],               // 普通道具；年轮珀与信不放在这里
  ringAmber: {
    owned: false,              // 全程只有这一枚
    rings: 0,                  // 已刻入，0～3
    grafted: 0,                // 已接合，0～3
    memories: []               // {id, scene, kind, ...}，跨幕保存
  },
  prologue: {
    cameraBagOpened: false,
    lensInstalled: false,
    guardianSeen: false,
    treeBroken: false,
    crackTouched: false,
    amberTaken: false,
    enteredMemory: false,
    watered: false,
    supported: false,
    grafted: false
  },
  letter: {
    found: false,
    unfolded: false,
    returned: false,
    location: 'cameraBag'      // cameraBag | player
  },
  act: null,                   // 进入第一章后为当前幕数据
  history: [],                 // 最终为 prologue/1933/1959/1988/2002
  solved: [],                  // 已完成谜题 ID，不重复
  epilogue: null
}
```

当前幕 `act`：

```js
{
  id: 'act1',                  // act1 | act2 | act3 | act4
  gears: [],                   // 本幕已获得过的齿轮；装入装置后仍保留记录
  completed: {},               // 核心建筑完成 flags
  steps: {},                   // 建筑内步骤 flags
  evidence: [],                // 仅第四章，三件物证
  projected: [],               // 仅第四章，已投射物证
  device: {
    slots: {},                 // slotId -> gearId；离开房间仍保留
    memories: {},              // 仅第三章，slotId -> memoryId
    repaired: false,           // 第二章传动修复
    amberInserted: false
  },
  engraved: false,
  grafted: false,
  storySeen: false,            // 第三章两栋完成后回树触发自述
  ending: false                // 第四次投射后为 true
}
```

尾声时 `act === null`，结局资料保存在：

```js
epilogue: {
  newSprout: true,
  crackPreserved: true,
  evidence: [...],
  projected: [...]
}
```

## 4. era / scene / phase 命名

| era | 可进入 scene |
|---|---|
| 序章 | `prologue_campus`、`prologue_pine`、`prologue_sprout` |
| 1933 | `act1_map`、`act1_tree`、`act1_library`、`act1_hall`、`act1_gym` |
| 1959 | `act2_map`、`act2_tree`、`act2_bldg54`、`act2_power`、`act2_bldg55` |
| 1988 | `act3_map`、`act3_tree`、`act3_frontyard`、`act3_alumni` |
| 2002 | `act4_map`、`act4_tree`、`act4_hall`、`act4_alumni`、`act4_frontyard`、`act4_memorial`、`act4_ending` |
| 尾声 | `epilogue` |

`phase` 是剧情阶段，不与每个近景弹窗一一对应：

- 序章：`prologue_camera → prologue_pine → prologue_sprout → prologue_graft`。
- 第一章：`act1_tree / act1_library / act1_hall / act1_gym / act1_graft`。
- 第二章：`act2_tree / act2_bldg54 / act2_power / act2_bldg55 / act2_graft`。
- 第三章：`act3_tree / act3_frontyard / act3_alumni / act3_graft`。
- 第四章：`act4_tree / act4_evidence / act4_project / act4_ending`。跑图、纪念馆及物证建筑为 `act4_evidence`；收齐三物证后回树进入 `act4_project`，第三次投射后为 `act4_ending`。
- 尾声：`epilogue`。

进入 `act1_map / act2_map / act3_map` 时 phase 回到对应 `act*_tree`。第一、二章刻好后需从装置场景进入 `act*_tree` 再接合；第三章装置本就在 `act3_tree`。

## 5. 通用 action

| action | 字段 | 用途 |
|---|---|---|
| `ENTER` | `{scene}` | 进入场景 |
| `TAKE` | `{item}` | 拾取道具／树脂凝成唯一一轮珀 |
| `USE` | `{item, target}` | 使用道具、安装齿轮、嵌珀、放回信 |
| `TOUCH` | `{target:'treeCrack'}` | 触碰序章裂口 |
| `COMBINE` | `{items, result}` | 第二章组合指示叶片 |
| `PUZZLE` | `{id, value}` | 完成一次谜题判定或微操作 |
| `TURN_HANDLE` | 无额外字段 | 刻入本幕一圈；齿轮留在装置中 |
| `GRAFT` | 无额外字段 | 序章极简接合或第一～三圈接合并推进时代 |

### 集成兼容别名

以下 action 会在状态机内部规范化，UI 无需再做重复规则：

| 别名 | 等价主 action |
|---|---|
| `ENTER_SCENE` | `ENTER`，字段相同 |
| `USE_ON_TARGET` | `USE`，字段相同 |
| `INSTALL_GEAR` | `USE`，使用 `{item, target}` 或 `{item, slot}` |
| `ENGRAVE` | `TURN_HANDLE` |
| `PROJECT_EVIDENCE` | `PUZZLE id:'D4'`；物证可放在 `value / evidence / evidenceId / item` |
| `RETURN_LETTER` | `USE {item:'letter', target:'cameraBag'}` |

`OPEN_LIBRARY_LOCK / OPEN_BLUEPRINT / OPEN_DRAFT / OPEN_DEVICE / OPEN_GRAFT / OPEN_EVIDENCE` 等近景开关属于 UI 本地状态，不是剧情 action。`PLAY_NOTES` 的示范播放与 `STRIKE` 的动画也由 UI 处理；完成四音序列后提交一次 `PUZZLE A4`。`SELECT_ITEM` 同样不进入状态机。

`specialLens` 可作为输入别名，但规范 inventory ID 是 `lens`。

## 6. 道具、齿轮与槽位

| 幕 | 普通 item ID |
|---|---|
| 序章 | `lens`（输入别名 `specialLens`）、`waterCan`；固定场景物 `supportWood` 无需拾取 |
| 图书馆 | `drawingFragment1`、`drawingFragment2`；拼合后短暂得到 `drawingPattern` |
| 大礼堂 1933 | `mallet` |
| 五四楼 | `leafFrame`、`leafFilm` → `indicatorLeaf`；完成后得到 `departureNote` |
| 第一～三章齿轮 | `windowGear`、`soundGear`、`indicatorGear`、`transmissionGear`、`nestedWindowGear`、`signatureGear` |

齿轮取得时同时写入 `inventory` 与 `act.gears`。装入槽后仅从 inventory 移除；刻轮结束 inventory 清空，装置 slots 与 `act.gears` 保留记录。

| 齿轮 | USE target |
|---|---|
| `windowGear` | `windowSlot` |
| `soundGear` | `soundSlot` |
| `indicatorGear` | `indicatorSlot` |
| `transmissionGear` | `transmissionSlot` |
| `nestedWindowGear` | `nestedWindowSlot` |
| `signatureGear` | `signatureSlot` |

年轮珀不进入 inventory，统一用：

```js
{ type:'USE', item:'amber', target:'amberSocket' }
```

## 7. 各幕操作与 PUZZLE value

### 7.1 序章

```text
ENTER prologue_pine
TAKE lens
USE lens -> filterFrame
TOUCH treeCrack
TAKE amber
USE amber -> treeCrack
TAKE waterCan
USE waterCan -> seedling
USE supportWood -> seedling
GRAFT
```

- 搜索必经相机包取得镜片时，折叠信同时由玩家收起，避免跨幕后无法取信造成软锁。
- 镜片成功使用后一次性发出守忆者出现、转头、伸手、树先断裂、守忆者震动等 effects；不可用其他 action 绕过。
- 未 `TOUCH treeCrack` 不能取得或使用年轮珀进入记忆。
- 浇灌与扶稳缺一不可。

### 7.2 第一章 1933

图书馆与大礼堂可任意先后。

| ID / action | value / target | 完成结果 |
|---|---|---|
| `TAKE drawingFragment1` | — | 书页中取得第一片 |
| `PUZZLE A1_LOCK` | `['circle','triangle','square']` | `steps.drawerOpen=true` |
| `TAKE drawingFragment2` | — | 取得第二片 |
| `PUZZLE A2` | `{x:160,y:96,angle:90}` | 合成图样；24px / ±8° 吸附 |
| `PUZZLE A3` | `30` | `completed.library=true`，得 `windowGear` 与图样记忆 |
| `USE mallet` | `stand` | `steps.malletInstalled=true` |
| `PUZZLE A4` | `['low','high','medium','low']` | `completed.hall=true`，得 `soundGear` 与四音记忆 |

体育馆可提前进入并先装一个齿轮。两齿轮入槽后才能嵌珀，`TURN_HANDLE` 刻第一圈；回 `act1_tree` 后 `GRAFT`。

### 7.3 第二章 1959

五四楼与动力楼可任意先后；动力楼要求第一幕保存的四音记忆。

| ID / action | value / target | 完成结果 |
|---|---|---|
| `COMBINE` | `{items:['leafFrame','leafFilm'],result:'indicatorLeaf'}` | 两件材料顺序不限 |
| `USE indicatorLeaf` | `modelSocket` | `completed.bldg54=true`，得 `indicatorGear`、`departureNote`、模型记忆 |
| `PUZZLE B2` | `{links:['input-middle','middle-output'],notes:['low','high','medium','low']}` | `completed.power=true`，得 `transmissionGear` 与修补痕迹 |
| `PUZZLE B3` | `{note:'departureNote',trace:'repairTrace'}` | 两核心完成后汇合，出现 `TIME_LABEL: 多年后` |
| `PUZZLE B4_REPAIR` | `'aligned'` | `device.repaired=true` |

B3 与传动修复均在 `act2_bldg55`。修复后才允许安装两个齿轮；刻第二圈、回树、接合。

### 7.4 第三章 1988

前工院完成后，校友会堂必要线索才出现；允许直接进入会堂，不要求中途回树。

| ID | value | 前置 / 结果 |
|---|---|---|
| `C1` | `{x:220,y:140,angle:45}` | 需图样记忆；24px / ±8°；得 `nestedWindowGear`、`oldWindowShadow` |
| `C2_ROSTER` | `{year:1959,name:'刘长睿'}` | 需 C1；写 `steps.roster`，保存 `roster1959` |
| `C2_LESSON` | `'lessonPlan'` | 需名册；写 `steps.lesson` |
| `C2_PROJECT` | `{memory:'modelTuning1959',target:'lessonPlan'}` | 需教案；完成会堂、解决执念一、得 `signatureGear` |
| `C2_LETTER` | `'unfold'` | 仅向玩家展开信，不影响齿轮或守忆者释怀 |

两栋完成后进入 `act3_tree`，自动写 `act.storySeen=true` 并发 `SELF_STORY / GUARDIAN_REQUEST`。之后必须先对入两段记忆：

```js
{ type:'PUZZLE', id:'C3_MEMORY',
  value:{memory:'oldWindowShadow', slot:'nestedWindowSlot'} }
{ type:'PUZZLE', id:'C3_MEMORY',
  value:{memory:'roster1959', slot:'signatureSlot'} }
```

对应槽有正确记忆后才可安装对应齿轮。随后嵌珀、刻第三圈、在树前 `GRAFT` 进入 2002。

### 7.5 第四章 2002 与尾声

三处物证顺序自由，纪念馆完全可选。

| ID | scene | value | evidence ID |
|---|---|---|---|
| `D1` | `act4_hall` | `{year:2002,name:'沈立'}` | `ceremonyRecord` |
| `D2` | `act4_alumni` | `{page:'continuation',name:'沈立'}` | `rosterContinuation` |
| `D3` | `act4_frontyard` | `{target:'repairPlaque',name:'沈立'}` | `repairPlaque` |

三物证收齐前，`D4` 在树前以 `EVIDENCE_INCOMPLETE` 拒绝。收齐后逐件投射：

```js
{ type:'PUZZLE', id:'D4', value:'ceremonyRecord' }
// 或 {type:'PROJECT_EVIDENCE', evidence:'ceremonyRecord'}
```

每件只能投射一次。第三次投射自动：

1. 设置 `act.ending=true`、`scene/phase=act4_ending`；
2. 发出 `LAST_LINE`、`GUARDIAN_DISSOLVES`、`NEW_SPROUT`、`CRACK_PRESERVED`；
3. 不增加或改变三圈年轮。

最后执行 `RETURN_LETTER`（或 `USE letter -> cameraBag`），进入 `epilogue`。这是全篇最后一个玩家动作。

## 8. 渲染常用 flags 与 effects

### 建筑完成 flags

```js
act.completed.library
act.completed.hall
act.completed.bldg54
act.completed.power
act.completed.frontyard
act.completed.alumni
```

### 步骤 flags

```js
act.steps.fragment1
act.steps.drawerOpen
act.steps.joined
act.steps.malletInstalled
act.steps.leafAssembled
act.steps.b3
act.steps.roster
act.steps.lesson
```

### 关键 effects

- 序章：`GUARDIAN_VISIBLE`、`GUARDIAN_TURNS`、`GUARDIAN_REACHES`、`TREE_BREAKS_BEFORE_TOUCH`、`GUARDIAN_RECOILS`、`CRACK_VISIBLE`。
- 场景／道具：`SCENE_ENTERED`、`ITEM_TAKEN`、`ITEM_COMBINED`、`GEAR_ACQUIRED`、`GEAR_INSTALLED`。
- 年轮：`AMBER_INSERTED`、`RING_ENGRAVED`、`RING_GRAFTED`、`ERA_CHANGED`、`INVENTORY_CLEARED`。
- 第三章：`SELF_STORY`、`GUARDIAN_REQUEST`、`MEMORY_ALIGNED`、`OBSESSION_ONE_RESOLVED`、`LETTER_INNER_REVEALED`。
- 第四章：`EVIDENCE_COLLECTED`、`EVIDENCE_PROJECTED`、`GUARDIAN_REACTION`（`index` 为 0、1、2）、`LAST_LINE`、`GUARDIAN_DISSOLVES`、`NEW_SPROUT`、`CRACK_PRESERVED`。
- 尾声：`LETTER_RETURNED`、`EPILOGUE`。
- 拒绝：`REJECTED`，以 `reason` 做可选提示；被拒绝时绝不能根据新 state 播放成功演出。

渲染层可按 effects 自行安排 20–30 秒接合演出，但状态转换本身同步完成，不依赖计时器。

## 9. 测试

仓库根目录运行：

```sh
node --test
```

测试覆盖 §8.2 七项门槛、无效操作不变、两种核心建筑顺序、三轮刻入／接合、普通道具清理、单向推进、第三章记忆槽、三物证、纪念馆零任务、放信尾声，以及无 CommonJS 的经典脚本加载。
