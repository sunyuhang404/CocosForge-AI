<template>
  <section
    class="fixed right-0 top-0 z-50 h-screen w-[min(760px,92vw)] border-l border-[#e8ebf2] bg-[#f8faff] shadow-[-18px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300"
    :class="props.visible ? 'translate-x-0' : 'translate-x-full'"
  >
    <PreviewToolbar
      :has-preview="resolvedHasPreview"
      :loading="loading"
      @refresh="refresh"
      @download="downloadCode"
      @fullscreen="openFullscreen"
      @close="emit('close')"
    />
    <div class="relative h-[calc(100%-57px)] overflow-hidden p-3">
      <div
        v-if="!resolvedHasPreview"
        class="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d6ddf0] bg-white text-sm text-[#6b7280]"
      >
        等待生成预览...
      </div>
      <iframe
        v-else
        ref="iframeRef"
        class="h-full w-full rounded-2xl border border-[#e5e7eb] bg-white transition-all duration-300"
        :class="loading ? 'blur-sm' : 'blur-0'"
        :src="activeUrl || props.previewUrl"
        @load="onLoad"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import PreviewToolbar from "./PreviewToolbar.vue";

const props = defineProps<{
  visible: boolean;
  previewUrl: string;
  sessionId: string;
  hasPreview: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const loading = ref(false);
const activeUrl = ref("");

const resolvedHasPreview = computed(() => props.hasPreview && Boolean(props.previewUrl));

function refresh() {
  if (!props.previewUrl) return;
  loading.value = true;
  activeUrl.value = props.previewUrl;
}

function openFullscreen() {
  iframeRef.value?.requestFullscreen();
}

function downloadCode() {
  if (!props.previewUrl || !props.sessionId) return;
  const url = `http://localhost:3000/api/sessions/${props.sessionId}/assets/code/latest`;
  window.open(url, "_blank");
}

function onLoad() {
  loading.value = false;
}

defineExpose({ refresh });
</script>
