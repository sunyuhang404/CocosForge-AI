<template>
  <div class="preview-toolbar flex items-center justify-between border-b border-[#edf0f6] bg-white px-4 py-3">
    <div class="preview-toolbar-title-wrap flex items-center gap-2">
      <span class="preview-toolbar-title text-sm font-semibold text-[#111827]">游戏预览</span>
      <el-tag size="small" effect="plain" type="info">{{ props.loading ? "加载中" : "就绪" }}</el-tag>
    </div>
    <div class="preview-toolbar-actions flex items-center gap-2">
      <el-button size="small" :disabled="!props.hasPreview" @click="emit('refresh')">刷新</el-button>
      <el-button size="small" :disabled="!props.hasPreview" @click="emit('download')">下载代码</el-button>
      <el-button size="small" :disabled="!props.hasPreview" @click="emit('fullscreen')">全屏</el-button>
      <el-button size="small" @click="emit('close')">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  hasPreview: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  fullscreen: [];
  download: [];
  close: [];
}>();
</script>
