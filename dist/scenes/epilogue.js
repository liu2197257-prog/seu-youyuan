/* 尾声：当代同机位、保留裂痕与唯一饱和绿新芽；无场景操作。 */
(function (global) {
  'use strict';

  const scenes = global.PineScenes = global.PineScenes || {};

  scenes.epilogue = function (state, runtime) {
    // act4.js 的 fixedCamera 逐项复用 prologue.js 的边框、树坐标和相机/相机包位置。
    // index.html 保证 act4.js 先于本文件加载；epilogue 模式会移除全部热区并加上指定字幕。
    if (typeof scenes.act4_camera !== 'function') {
      throw new Error('尾声场景需要先加载 scenes/act4.js');
    }
    return scenes.act4_camera(state, runtime, { epilogue: true });
  };

  scenes.epilogue_camera = scenes.epilogue;
})(window);
