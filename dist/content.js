/*
 * 六朝松 · 剧情与文案数据
 * 经典脚本：浏览器读取 window.PineContent；Node 测试可 require 本文件。
 * 本文件只保存数据，不保存进度，也不包含渲染或状态推进逻辑。
 */
(function (root, factory) {
  "use strict";

  var content = factory();

  if (root) {
    root.PineContent = content;
  }
  if (typeof module === "object" && module.exports) {
    module.exports = content;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var eras = {
    prologue: { title: "序章", label: "当代" },
    act1: { title: "第一章", label: "一九三三年末" },
    act2: { title: "第二章", label: "一九五九年" },
    act3: { title: "第三章", label: "一九八八年" },
    act4: { title: "第四章", label: "二〇〇二年" },
    epilogue: { title: "尾声", label: "当代" }
  };

  // §6 全部指定台词与文本；act2.treeIntro 采用 §10-C 默认两句。
  var dialogues = {
    prologue: {
      sprout: {
        afterSupport: "别松手，等它站稳。",
        afterCare: "有些东西，要有人接着照看。"
      }
    },

    act1: {
      treeIntro: [
        "原来，这一次是你。",
        "一页没有翻完的纸，一段停住的回声，还有一个没有结束的日子。",
        "它们还留在这里。",
        "找到以后，带回树下。我会等你。"
      ],
      library: {
        blueprintNote: "让坐在最后一排的人，也能看懂它怎样转动。",
        memoryVoice: "这张先留着。以后会有人用得上。",
        cornerNote: "让最后一排，也能看清。"
      },
      treeReturn: [
        "这道纹路……原来还在。",
        "放回去吧。"
      ],
      treeHook: "下一次……别让它停在最后一声。"
    },

    act2: {
      treeIntro: [
        "楼里还有没做完的事。",
        "去看看吧。"
      ],
      building54: {
        studentRecord: "转得起来，但后面的人看不清。",
        teacherNote: "先让人看见，再让人听见。",
        deskNote: "最后一处，回来再调。",
        luggageTag: "刘长睿"
      },
      building55: {
        laterLabel: "多年后",
        conclusion: "他并不是没有回来。只是回来得太晚了。"
      },
      treeRefusal: "这一段……可以不放回去吗？",
      treeAfterIdentity: "我以为，只要不记得那次回来，就不会总觉得自己欠着什么。"
    },

    act3: {
      treeIntro: "那两栋楼……我很久没进去了。",
      letter: {
        front: [
          "三片音：低、高、中。",
          "指示叶片再薄一分，后排就看得见了。"
        ],
        inside: [
          "这最后一步，我替你走了一半。",
          "剩下的不是你没做完，是老师没等到。"
        ]
      },
      selfAccount: [
        "最后一处，回来再调。",
        "回来的时候，老师已经不在了。",
        "后来我在这个学校教书。很多年。",
        "我想知道那些学生后来做了什么。",
        "……没等到。"
      ],
      request: "你能替我看看吗。"
    },

    act4: {
      treeIntro: "替我看看……他们后来做了什么。",
      // 三句只核对当前物证，不安慰、不解释主题。
      evidenceReactions: {
        ceremony: "沈立，二〇〇二年毕业。",
        roster: "沈立的名字，在我下面。",
        repair: "铭牌上，是沈立的名字。"
      },
      final: "这次，换我等你们。"
    },

    epilogue: {
      subtitle: "六朝松下见证的下一个故事，就由我们这一代SEUer书写"
    }
  };

  var scenes = {
    prologue_campus: {
      act: "prologue",
      name: "当代校园",
      description: "第一次来到四牌楼的访客沿校园道路寻找六朝松；树旁留着固定机位相机、相机包与一张旧照片。"
    },
    prologue_camera: {
      act: "prologue",
      name: "六朝松前 · 相机",
      description: "普通镜头已经装好，旁边留着空滤镜框；装上特殊镜片后，取景器中多出树旁的黑影。"
    },
    prologue_pine: {
      act: "prologue",
      name: "六朝松前 · 裂口",
      description: "退出取景后，肉眼只看见真实的树干裂口；一滴树脂逆着重力停在裂口前。"
    },
    prologue_memory_entry: {
      act: "prologue",
      name: "树干裂口 · 回溯",
      description: "年轮珀贴入不完整的纹路，周围建筑褪去，只留下泥土与一株已经种下的幼苗。"
    },
    prologue_sprout: {
      act: "prologue",
      name: "植松记忆",
      description: "幼苗已经种在土里，旁边留着水罐与 Y 形支撑木；种植者不在画面中，也不标注种植年份。"
    },
    prologue_graft: {
      act: "prologue",
      name: "植松记忆 · 初次接合",
      description: "幼苗站稳后，脚边出现与年轮珀对应的树脂印记；旋转一圈即可完成第一次极简接合。"
    },

    act1_tree: {
      act: "act1",
      name: "1933 年末 · 六朝松前",
      description: "守忆者指出图书馆、大礼堂与体育馆三处模糊轮廓，请玩家找回记忆并带回树下。"
    },
    act1_library: {
      act: "act1",
      building: "library",
      name: "孟芳图书馆",
      description: "书页反复翻回同一页，桌上没有窗外树影；残缺图纸、上锁抽屉与描图架留在阅览室内。"
    },
    act1_hall: {
      act: "act1",
      building: "hall",
      name: "大礼堂",
      description: "空礼堂的舞台上有三片高低不同的发声片，一束光始终照着最后一排的空座。"
    },
    act1_gym: {
      act: "act1",
      building: "gym",
      name: "体育馆",
      description: "场边旧展示台是一处虚构刻轮装置；两个齿轮空位分别刻着窗格纹与声波纹。"
    },
    act1_graft: {
      act: "act1",
      name: "六朝松前 · 第一圈接合",
      description: "旋转新刻的一圈，让窗格与声波纹同树干痕迹对应；枯枝长叶，裂口的一小段被树脂填上。"
    },

    act2_tree: {
      act: "act2",
      name: "1959 年 · 六朝松前",
      description: "年轮珀指向五四楼、动力楼与五五楼；模型传来的声音每次都在同一处停下。"
    },
    act2_bldg54: {
      act: "act2",
      building: "building54",
      name: "五四楼教室",
      description: "年轻学生伏桌制作模型，图样抄本上满是修改与擦痕；另一段记忆里，桌上留下行李标签和字条。"
    },
    act2_power: {
      act: "act2",
      building: "power",
      name: "动力楼实验空间",
      description: "模型的传动轮能够旋转，但一处连接位置错误；墙上的实验记录与年轮珀保存的音序共同提供规则。"
    },
    act2_bldg55: {
      act: "act2",
      building: "building55",
      name: "五五楼走廊",
      description: "关闭的门旁有两段时间片段；第二段必须标注“多年后”。走廊内还有一处传动错位的刻轮装置。"
    },
    act2_graft: {
      act: "act2",
      name: "六朝松前 · 第二圈接合",
      description: "第二圈对齐时，年轻学生的影子与守忆者动作完全一致；新枝长出，一道裂纹也更加清晰。"
    },

    act3_tree: {
      act: "act3",
      name: "1988 年 · 六朝松前",
      description: "守忆者站得比以前更远，只指向前工院与校友会堂；两栋建筑完成后才再次回树。"
    },
    act3_frontyard: {
      act: "act3",
      building: "frontyard",
      name: "前工院",
      description: "重建后的新窗格投下旧建筑的窗影；无风房间里，窗影曾自行缓慢偏移一小段。"
    },
    act3_alumni: {
      act: "act3",
      building: "alumni",
      name: "校友会堂",
      description: "返校纪念墙上找不到刘长睿；1959 年名册、周老师的教案与完全展开的信构成后续线索。"
    },
    act3_graft: {
      act: "act3",
      name: "六朝松旁 · 树根刻轮与第三圈接合",
      description: "先把旧窗影与名册两段记忆对入齿轮槽，再装齿轮刻轮；第三圈接合后开启 2002 年。"
    },

    act4_tree: {
      act: "act4",
      name: "2002 年 · 六朝松前",
      description: "守忆者的投影更淡、边缘更散；他托付玩家查看三件成果物证，随后站到一旁。"
    },
    act4_evidence: {
      act: "act4",
      name: "2002 年校园 · 成果物证",
      description: "在大礼堂、校友会堂与前工院分别完成一次微操作，收集三件成果物证；本幕没有齿轮和刻轮装置。"
    },
    act4_hall: {
      act: "act4",
      building: "hall",
      name: "大礼堂 · 典礼记录",
      description: "最后一排放着不同年份的典礼册；用年轮珀显影到沈立毕业那年，再翻到他的名字。"
    },
    act4_alumni: {
      act: "act4",
      building: "alumni",
      name: "校友会堂 · 名册续页",
      description: "把名册往后翻，在刘长睿名字下面几行找到沈立的签名。"
    },
    act4_frontyard: {
      act: "act4",
      building: "frontyard",
      name: "前工院 · 新修缮痕迹",
      description: "一处新修缮痕迹旁有施工铭牌，年轮珀照亮后可以看清沈立的名字。"
    },
    act4_memorial: {
      act: "act4",
      building: "memorial",
      name: "吴健雄纪念馆",
      description: "可自由进出的真实层展陈，只呈现吴健雄的手稿、实验器具、生平与展陈，不承担谜题或虚构师生线。"
    },
    act4_project: {
      act: "act4",
      name: "六朝松前 · 逐件投射",
      description: "三件物证集齐后，点击年轮珀逐件投射三次；每件只触发守忆者的一句事实反应。"
    },
    act4_ending: {
      act: "act4",
      name: "六朝松前 · 新芽",
      description: "守忆者散成细墨粒与松针归向树干；裂口内长出新芽，整道裂痕仍然保留。"
    },
    act4_camera: {
      act: "act4",
      name: "相机旁 · 放回信件",
      description: "玩家主动把信放回相机包后侧夹层；镜头拉开，新芽与相机同框。"
    },
    epilogue: {
      act: "epilogue",
      name: "当代 · 六朝松",
      description: "与序章同一机位，树干裂痕与新芽并存，环境声恢复；无操作，只浮现结尾字幕。"
    }
  };

  var buildings = {
    library: {
      name: "孟芳图书馆",
      description: "第一章核心建筑，保存残缺图纸与窗格图样，完成谜题后获得窗格纹齿轮。"
    },
    hall: {
      name: "大礼堂",
      description: "第一章核心建筑与第四章物证地点；三片发声片及最后一排座席贯穿相关线索。"
    },
    gym: {
      name: "体育馆",
      description: "第一章轻交互建筑，场边旧展示台承载第一幕刻轮装置。"
    },
    building54: {
      name: "五四楼",
      description: "第二章核心建筑，教室内制作指示叶片，并首次从行李标签看见刘长睿的名字。"
    },
    power: {
      name: "动力楼",
      description: "第二章核心建筑，依据实验记录与低—高—中—低音序调整模型传动。"
    },
    building55: {
      name: "五五楼",
      description: "第二章轻交互建筑，走廊汇合两段时间片段，并承载修复传动后的刻轮装置。"
    },
    frontyard: {
      name: "前工院",
      description: "第三章以投射图样对位旧窗影；第四章以年轮珀照亮新修缮痕迹旁的铭牌。"
    },
    alumni: {
      name: "校友会堂",
      description: "第三章由名册找到教案并展开信件；第四章在同一名册续页找到沈立签名。"
    },
    memorial: {
      name: "吴健雄纪念馆",
      description: "第四章可自由探索的真实层场馆，只有吴健雄的手稿、实验器具、生平与展陈。"
    }
  };

  var items = {
    ringAmber: {
      name: "年轮珀",
      description: "掌心大小的烟茶色扁圆琥珀，内有三层嵌套薄环与炭黑树心；全程只有一枚，可保存记忆、投射并主动提供提示。"
    },
    camera: {
      name: "固定机位相机",
      description: "三脚架上的相机正对树干，普通镜头已经装好，旁边留着一个空滤镜框。"
    },
    cameraBag: {
      name: "相机包",
      description: "放在三脚架脚边，装有特殊镜片；夹层深处卡着一封折信，结尾仍由玩家把信放回这里。"
    },
    oldPhoto: {
      name: "旧照片",
      description: "贴在相机旁，照片里的树旁站着一个小人影；照片与相机的来历不作解释。"
    },
    filterFrame: {
      name: "空滤镜框",
      description: "相机旁的空框，形状与特殊镜片及其细小缺口对应。"
    },
    specialLens: {
      name: "特殊镜片",
      description: "暗橄榄色玻璃，带一个细小缺口；装上后才会在取景器中多出守忆者。"
    },
    resinDrop: {
      name: "悬浮树脂",
      description: "从裂口逆着重力缓慢上升的一滴树脂，点击后凝成年轮珀。"
    },
    foldedLetter: {
      name: "夹层里的折信",
      description: "序章只能抽出正面；第三章完全展开后才能读到内侧，守忆者始终看不到这封信。"
    },
    waterCan: {
      name: "水罐",
      description: "植松记忆里留下的浇水工具，选中后用于浇灌幼苗。"
    },
    ySupport: {
      name: "Y 形支撑木",
      description: "幼苗旁的支撑木，点击或拖动后可将幼苗扶稳。"
    },

    libraryBook: {
      name: "反复翻动的书",
      description: "总翻回同一页的书，点击后露出第一片图纸的一角。"
    },
    blueprintFragment1: {
      name: "第一片图纸",
      description: "从书页间露出的残缺图纸，可与抽屉里的另一片拼合。"
    },
    blueprintFragment2: {
      name: "第二片图纸",
      description: "图书馆抽屉里的残缺图纸，撕口与线条可同第一片对应。"
    },
    loanCard: {
      name: "借阅卡",
      description: "写着三本书的名称与排列顺序；到书架核对对应书脊图案即可开启抽屉。"
    },
    completePattern: {
      name: "完整图样",
      description: "两片图纸拼成的窗边教学装置图，画有传动轮与三个发声片，并留有给最后一排看的批注。"
    },
    draftingRack: {
      name: "描图架",
      description: "可装上图样并切换三档倾斜角度；正确角度会让三处明显标记同时重合。"
    },
    windowGear: {
      name: "窗格纹齿轮",
      description: "第一章图书馆谜题的产物，纹样来自修补后的窗格图样。"
    },

    mallet: {
      name: "木槌",
      description: "掉落在舞台边，装回支架后才能敲响发声片。"
    },
    malletStand: {
      name: "木槌支架",
      description: "舞台上的归位点，选中木槌后点击支架即可装回。"
    },
    soundPlates: {
      name: "三片金属发声片",
      description: "高、中、低三片舞台发声装置，可按排练记录依次敲响。"
    },
    rehearsalRecord: {
      name: "排练记录",
      description: "最后一排座位上的记录，以三个不同高度的图形标出低—高—中—低。"
    },
    smallBell: {
      name: "小铃",
      description: "排练记录旁的示范装置，点击后播放一次示范，同时依次亮起对应图形。"
    },
    soundGear: {
      name: "声波纹齿轮",
      description: "第一章大礼堂谜题的产物，保存低—高—中—低四个音的声波纹样。"
    },
    oldDisplayDevice: {
      name: "旧展示台刻轮装置",
      description: "体育馆场边的虚构机械演示器，带传动轮、手柄、刻针及与年轮珀吻合的中央凹槽。"
    },

    modelPatternCopy: {
      name: "图样抄本",
      description: "第一章图样在五四楼桌上的抄本，多了修改、擦痕与学生自己的笔记。"
    },
    studentRecord: {
      name: "学生记录",
      description: "写着模型虽然转得起来，后面的人却看不清。"
    },
    indicatorMaterials: {
      name: "指示叶片材料",
      description: "教室内可收集并组合的模型材料，用来做出老师所画的更大指示叶片。"
    },
    indicatorBlade: {
      name: "指示叶片",
      description: "由教室材料组合而成，安装到模型缺件处，让后排先看清再听清。"
    },
    indicatorLeafGear: {
      name: "指示叶片纹齿轮",
      description: "第二章五四楼谜题的产物，采用 §10-B 的默认指示叶片纹样。"
    },
    teachingModel: {
      name: "机械教学模型",
      description: "师生共同制作的模型，由指示叶片、传动轮与三个发声片等部分组成。"
    },
    luggageTag: {
      name: "行李标签",
      description: "另一段桌面记忆里留下的标签，首次揭示学生姓名为刘长睿。"
    },
    departureNote: {
      name: "离校字条",
      description: "五四楼桌上留下的字条：最后一处，回来再调。"
    },
    experimentRecord: {
      name: "实验记录",
      description: "动力楼墙上的机械操作规则，需与年轮珀重现的低—高—中—低音序结合。"
    },
    transmissionModel: {
      name: "模型传动部分",
      description: "动力楼里的另一部分模型，其中一处连接位置错误，导致三个发声片无法按顺序工作。"
    },
    smallPatch: {
      name: "小小补件",
      description: "老师在学生原有结构上增加的一枚补件，没有拆掉学生做好的部分。"
    },
    transmissionGear: {
      name: "传动三轮纹齿轮",
      description: "第二章动力楼谜题的产物，采用 §10-B 的默认传动三轮纹样。"
    },
    returnedPart: {
      name: "准备交给老师的零件",
      description: "五五楼两段线索汇合后才看清，归来者手里一直攥着这枚零件。"
    },
    corridorDevice: {
      name: "五五楼刻轮装置",
      description: "走廊里的刻轮装置有一处传动错位，必须先修复，再装两枚齿轮刻入第二圈。"
    },

    oldWindowShadow: {
      name: "旧窗影",
      description: "前工院墙上不该存在的旧建筑窗格影子，可由年轮珀投出的图样进行位置与角度对位。"
    },
    nestedWindowGear: {
      name: "新旧窗格嵌套纹齿轮",
      description: "边缘是旧建筑窗格形，轮毂是 1987 年的新窗格形，两者嵌套在同一枚齿轮上。"
    },
    memorialWall: {
      name: "返校纪念墙",
      description: "校友会堂里刻满历届返校者名字与年份的墙，玩家在上面找不到刘长睿。"
    },
    roster1959: {
      name: "1959 年学生名册",
      description: "周老师保留的课堂／实验记录表，学生离校后也没有划掉刘长睿的名字。"
    },
    lessonPlan: {
      name: "周老师的教案",
      description: "由名册指向的教案，记着学生当年解决的问题；这一改法在 1987 年重建时被参考。"
    },
    signatureGear: {
      name: "签名刻痕纹齿轮",
      description: "同心短刻痕像名册上的签名，外圈留着一段空白，刻轮时由年轮珀补上。"
    },
    rootDevice: {
      name: "树根刻轮装置",
      description: "从六朝松树根间长出的齿轮槽与刻针，须先对入旧窗影和名册记忆，再装齿轮。"
    },

    ceremonyBooks: {
      name: "不同年份的典礼册",
      description: "大礼堂最后一排的几本册子，用年轮珀贴近后显影到沈立毕业那年。"
    },
    evidenceCeremony: {
      name: "成果物证① · 典礼记录",
      description: "显影后的典礼册中翻到的沈立名字，来自每年都会举行的毕业典礼或学位授予场景。"
    },
    rosterContinuation: {
      name: "名册续页",
      description: "同一名册往后翻到的页面，沈立签名就在刘长睿名字下面几行。"
    },
    evidenceRoster: {
      name: "成果物证② · 名册续页",
      description: "刘长睿与沈立的名字在同一页纸上前后相接的签名记录。"
    },
    repairPlaque: {
      name: "施工铭牌",
      description: "前工院新修缮痕迹旁的小铭牌，年轮珀照亮后可看清沈立的签名。"
    },
    evidenceRepair: {
      name: "成果物证③ · 新修缮痕迹",
      description: "前工院的新修缮痕迹及刻有沈立名字的施工铭牌。"
    },
    newShoot: {
      name: "裂口中的新芽",
      description: "结尾从完整保留的裂口内长出的新芽，是全篇唯一一次真正饱和的绿色。"
    }
  };

  // 每个谜题固定三级：关注哪里 → 物件关系 → 具体操作。
  // 由玩家主动点击年轮珀逐级查看，不在此处自动触发。
  var hints = {
    "P-0": {
      name: "特殊镜片",
      scene: "prologue_camera",
      levels: [
        "先看看相机旁的空滤镜框，再检查三脚架脚边的相机包。",
        "特殊镜片的细小缺口与滤镜框的形状相对应；普通镜头不必取下。",
        "从相机包取得特殊镜片，把它拖进相机的空滤镜框。"
      ]
    },
    "P-1": {
      name: "照看幼苗",
      scene: "prologue_sprout",
      levels: [
        "留意幼苗脚下的干土，以及旁边尚未收好的两件工具。",
        "水罐处理干土，Y 形支撑木处理倾斜的幼苗；两件事都要完成。",
        "先取水罐并选中浇灌幼苗，再点击或拖动 Y 形支撑木把幼苗扶稳。"
      ]
    },
    "P-2": {
      name: "手绘校园走位",
      scene: "campus",
      levels: [
        "寻找地图上标有名称的建筑入口。",
        "靠近入口后会进入交互范围；手机用摇杆，桌面也可用 WASD 或方向键。",
        "移动到目标建筑入口的提示范围内，再点交互按钮或按 E 进入。"
      ]
    },

    A1: {
      name: "图书馆抽屉",
      scene: "act1_library",
      levels: [
        "查看借阅卡和书架，不用猜测任何建筑年份。",
        "借阅卡给出三本书的顺序，对应书脊各有一个图案；把书名顺序换成图案顺序。",
        "按借阅卡列出的三本书依次读取书脊图案，再把三个转盘调成同一顺序。"
      ]
    },
    A2: {
      name: "图纸拼合",
      scene: "act1_library",
      levels: [
        "把两片残缺图纸放在同一近景里观察。",
        "不仅要看撕口，还要让图样线条跨过接缝继续延伸。",
        "选中一片图纸后点击另一片进入近景，拖动碎片，让撕口与线条同时吻合。"
      ]
    },
    A3: {
      name: "描图架对齐",
      scene: "act1_library",
      levels: [
        "装好完整图样后，留意描图架上的三处明显标记。",
        "三档倾斜角度会改变投影位置；正确的一档会让三处标记同时重合。",
        "把完整图样装上描图架，逐档切换角度，停在三处标记全部重合的一档。"
      ]
    },
    A4: {
      name: "发声片顺序",
      scene: "act1_hall",
      levels: [
        "最后一排的排练记录和小铃都在提示舞台发声片的顺序。",
        "三个高度图形对应低、中、高发声片；小铃示范时也会依次亮起图形，不开声音同样可看。",
        "先装回木槌，再依次敲响低—高—中—低；第四次要回到最低的一片。"
      ]
    },
    A5: {
      name: "木槌归位",
      scene: "act1_hall",
      levels: [
        "舞台边有一件掉落的小工具，舞台上还留着空支架。",
        "木槌装回支架后，三片发声片才可以被敲响。",
        "拾取舞台边的木槌，在物品栏选中它，再点击舞台上的木槌支架。"
      ]
    },
    A6: {
      name: "第一章刻轮",
      scene: "act1_gym",
      levels: [
        "查看旧展示台的两个齿轮空位与中央凹槽。",
        "窗格纹和声波纹分别对应两个空位；两枚齿轮齐备后，中央凹槽才需要年轮珀。",
        "把窗格纹、声波纹齿轮分别装入对应槽位，再嵌入年轮珀并转动手柄。"
      ]
    },
    A7: {
      name: "第一圈接合",
      scene: "act1_graft",
      levels: [
        "观察树干裂口里残留的窗格与声波痕迹。",
        "只需要转动新刻的第一圈，让珀中纹路与树干痕迹对应。",
        "把年轮珀放入裂口，旋转第一圈；接近正确角度时会自然吸附。"
      ]
    },

    B1: {
      name: "指示叶片",
      scene: "act2_bldg54",
      levels: [
        "先观察模型最明显的缺件位置，再看桌边老师画下的更大叶片。",
        "老师的图样指出缺件形状，教室里的材料可以组合成这片指示叶片。",
        "在教室找齐材料，组合成指示叶片，再把它安装到模型的缺件位。"
      ]
    },
    B2: {
      name: "传动调整",
      scene: "act2_power",
      levels: [
        "对照墙上的实验记录与三个发声片，先找出那处错误的传动连接。",
        "实验记录给出机械规则，年轮珀保存的低—高—中—低给出最终工作顺序。",
        "按实验记录调整错误连接，再用低—高—中—低核对发声片；连接正确后模型会完整发声。"
      ]
    },
    B3: {
      name: "五五楼汇合",
      scene: "act2_bldg55",
      levels: [
        "门旁的两段时间片段需要分别查看，第二段明确标着“多年后”。",
        "把五四楼的离校字条与动力楼的修补痕迹放在一起，才能看清归来者手中的东西。",
        "完成两栋核心建筑后，在五五楼将离校字条与修补痕迹对照，再查看两段时间片段。"
      ]
    },
    B4: {
      name: "第二章刻轮",
      scene: "act2_bldg55",
      levels: [
        "刻轮前，先检查装置上那处卡住的传动连接。",
        "本幕不能直接装齿轮；先修复传动错位，再按两个槽位准备两枚齿轮。",
        "修复装置的传动错位，将两枚齿轮分别入槽，嵌入年轮珀并转动手柄。"
      ]
    },
    B5: {
      name: "第二圈接合",
      scene: "act2_graft",
      levels: [
        "回到六朝松裂口，观察刚刻入的第二圈纹路。",
        "这一圈仍要与树干上对应的残留痕迹对齐，前两圈不必转动。",
        "嵌入年轮珀后只旋转第二圈，等待纹路对齐并自然吸附。"
      ]
    },

    C1: {
      name: "投射对位",
      scene: "act3_frontyard",
      levels: [
        "注意新窗格与墙上旧窗影的差异；无风时窗影曾自行偏移。",
        "用年轮珀投出第一章修补的图样；这次既要移动投影位置，也要调整图样角度。",
        "把图样投到旧窗影处，拖动年轮珀平移投影并旋转图样，直到位置与角度同时重合。"
      ]
    },
    C2: {
      name: "名册、教案与投射",
      scene: "act3_alumni",
      levels: [
        "纪念墙之外，继续找周老师保留的 1959 年学生名册。",
        "名册指向教案；再用年轮珀把 1959 年调试模型的记忆投到教案上比对。",
        "依次找到名册和教案，完成 1959 年记忆投射；随后把随身携带的折信完全展开，读取内侧。"
      ]
    },
    C3: {
      name: "第三章刻轮",
      scene: "act3_graft",
      levels: [
        "树根装置的两个齿轮槽先需要记忆，不是直接装齿轮。",
        "前工院的旧窗影与校友会堂的名册，分别对应两个槽位；对齐后齿轮才能咬合。",
        "先把旧窗影、名册记忆分别对入两个槽位，再装入对应齿轮，嵌入年轮珀并转动装置。"
      ]
    },
    C4: {
      name: "第三圈接合",
      scene: "act3_graft",
      levels: [
        "回到裂口，辨认刚刻好的第三圈与已经接合的前两圈。",
        "第三圈既要对应树干痕迹，也要与前两圈形成完整对齐。",
        "嵌入年轮珀，只旋转第三圈，让它与树干痕迹及前两圈对齐后吸附。"
      ]
    },

    D1: {
      name: "典礼册显影",
      scene: "act4_hall",
      levels: [
        "去大礼堂最后一排，查看那几本不同年份的典礼册。",
        "年轮珀会让属于沈立毕业那年的册页显影；当前时代就是二〇〇二年。",
        "把年轮珀贴近二〇〇二年的典礼册，待其显影后翻到沈立的名字。"
      ]
    },
    D2: {
      name: "名册续页",
      scene: "act4_alumni",
      levels: [
        "在校友会堂重新打开有刘长睿名字的名册。",
        "这次要往后翻；沈立的签名就在刘长睿名字下面几行。",
        "翻到刘长睿名字所在的续页，查看其下方几行，找到并记录沈立的签名。"
      ]
    },
    D3: {
      name: "修缮铭牌",
      scene: "act4_frontyard",
      levels: [
        "在前工院寻找一处新的修缮痕迹。",
        "痕迹旁的小施工铭牌需要年轮珀照亮，才能看清签名。",
        "把年轮珀移到新修缮痕迹旁的铭牌上，照亮签名区域，读取沈立的名字。"
      ]
    },
    D4: {
      name: "逐件投射",
      scene: "act4_project",
      levels: [
        "三件成果物证都找到后，回到六朝松前。",
        "年轮珀会分别投射典礼记录、名册续页和新修缮痕迹，每件各有一次短反应。",
        "集齐三件物证后点击年轮珀，依次完成三次投射，再等待最后一句台词。"
      ]
    }
  };

  // 可选档案不阻断主线；真实建筑信息仅采用交接文档已经给出的内容。
  var archives = {
    library: {
      title: "孟芳图书馆",
      kind: "building",
      optional: true,
      unlock: "act1_library",
      sections: [
        {
          title: "建筑记年",
          lines: [
            "1920 年代建成，1933 年扩建。",
            "更早期建成时间有不同记年口径，本游戏不以此设置谜题答案。"
          ]
        }
      ]
    },
    hall: {
      title: "大礼堂",
      kind: "building",
      optional: true,
      unlock: "act1_hall",
      sections: [
        {
          title: "建筑记年",
          lines: ["1931 年竣工。"]
        }
      ]
    },
    gym: {
      title: "体育馆",
      kind: "building",
      optional: true,
      unlock: "act1_gym",
      sections: [
        {
          title: "建筑记年",
          lines: ["1923 年建成。"]
        }
      ]
    },
    building54: {
      title: "五四楼",
      kind: "building",
      optional: true,
      unlock: "act2_bldg54",
      sections: [
        {
          title: "建筑记年",
          lines: ["1954 年建成。"]
        }
      ]
    },
    power: {
      title: "动力楼",
      kind: "building",
      optional: true,
      unlock: "act2_power",
      sections: [
        {
          title: "记年说明",
          lines: ["建设记年有 1956、1957、1958 三种口径，本游戏不以此设置谜题答案。"]
        }
      ]
    },
    building55: {
      title: "五五楼",
      kind: "building",
      optional: true,
      unlock: "act2_bldg55",
      sections: [
        {
          title: "建筑记年",
          lines: ["1955 年建成。"]
        }
      ]
    },
    frontyard: {
      title: "前工院",
      kind: "building",
      optional: true,
      unlock: "act3_frontyard",
      sections: [
        {
          title: "建筑记年",
          lines: ["1987 年重建。"]
        }
      ]
    },
    alumni: {
      title: "校友会堂",
      kind: "building",
      optional: true,
      unlock: "act3_alumni",
      sections: [
        {
          title: "建筑与纪念墙",
          lines: [
            "1986 年翻建。",
            "返校纪念墙在翻建后设立；刘长睿于 1988 年才回校任教。"
          ]
        }
      ]
    },
    memorial: {
      title: "吴健雄纪念馆",
      kind: "building",
      optional: true,
      unlock: "act4_memorial",
      sections: [
        {
          title: "开放时间与真实层概述",
          lines: [
            "2002 年 5 月 31 日建成开放。",
            "真实层仅包括吴健雄的手稿、实验器具、生平与展陈。",
            "本馆不承担谜题与齿轮，也不放入任何虚构人物或虚构物证。"
          ]
        }
      ]
    },
    roster1959: {
      title: "周老师保留的学生名册",
      kind: "document",
      optional: true,
      unlock: "act3_alumni_roster",
      sections: [
        {
          title: "1959 年课堂／实验记录",
          lines: ["学生离校后，刘长睿的名字一直留在名册上，没有被划掉。"]
        }
      ]
    },
    lessonPlan: {
      title: "周老师的教案",
      kind: "document",
      optional: true,
      unlock: "act3_alumni_lesson",
      sections: [
        {
          title: "教案所记的改法",
          lines: ["刘长睿当年解决的问题被记进教案；这一改法在 1987 年重建时被参考。"]
        }
      ]
    },
    letter: {
      title: "相机包夹层里的信",
      kind: "document",
      optional: true,
      unlock: "act3_alumni_letter",
      sections: [
        {
          title: "正面",
          lines: dialogues.act3.letter.front
        },
        {
          title: "内侧",
          lines: dialogues.act3.letter.inside
        }
      ]
    }
  };

  var credits = {
    ending: [dialogues.epilogue.subtitle]
  };

  return {
    version: 1,
    language: "zh-CN",
    eras: eras,
    dialogues: dialogues,
    scenes: scenes,
    buildings: buildings,
    items: items,
    hintLevelLabels: ["关注哪里", "物件关系", "具体操作"],
    hints: hints,
    archives: archives,
    credits: credits
  };
});
