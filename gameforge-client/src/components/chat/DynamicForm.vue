<template>
  <div class="rounded-2xl border border-[#dbe6ff] bg-[#f7f9ff] p-4">
    <h4 class="m-0 text-sm font-semibold text-[#1e3a8a]">{{ props.form.title }}</h4>
    <p class="mb-3 mt-1 text-xs text-[#64748b]">{{ props.form.description }}</p>
    <el-form label-position="top" @submit.prevent>
      <el-form-item v-for="field in props.form.fields" :key="field.key" :label="field.label" class="mb-2">
        <el-input
          v-if="field.type === 'text'"
          v-model="model[field.key]"
          :placeholder="field.label"
          size="small"
        />
        <el-input-number v-else-if="field.type === 'number'" v-model="model[field.key]" :min="0" />
        <el-select v-else v-model="model[field.key]" size="small" style="width: 100%">
          <el-option
            v-for="option in field.options || []"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-button type="primary" :loading="props.loading" @click="onSubmit">提交补充信息</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { DynamicFormSchema } from "../../types";

const props = defineProps<{
  form: DynamicFormSchema;
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: Record<string, string | number>];
}>();

const model = reactive<Record<string, string | number>>({});

function onSubmit() {
  emit("submit", { ...model });
}
</script>
