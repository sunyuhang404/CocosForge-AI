<template>
  <el-dialog
    v-model="visible"
    width="460px"
    :show-close="!submitting"
    :close-on-click-modal="!submitting"
    class="auth-register-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="auth-register-header space-y-1">
        <div class="auth-register-title text-lg font-semibold text-[#111827]">注册 GameForge AI</div>
        <div class="auth-register-description text-sm text-[#6b7280]">创建账号后即可登录保存你的游戏创作工作流。</div>
      </div>
    </template>

    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item label="显示名称">
        <el-input
          v-model.trim="form.displayName"
          autocomplete="name"
          placeholder="例如：阿卜嚓咔"
          size="large"
        />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input
          v-model.trim="form.email"
          autocomplete="email"
          placeholder="name@example.com"
          size="large"
        />
      </el-form-item>
      <el-form-item label="密码">
        <el-input
          v-model="form.password"
          autocomplete="new-password"
          placeholder="请输入密码"
          show-password
          size="large"
          type="password"
        />
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input
          v-model="form.confirmPassword"
          autocomplete="new-password"
          placeholder="再次输入密码"
          show-password
          size="large"
          type="password"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      <div class="auth-register-actions mt-2 flex items-center justify-between">
        <button
          type="button"
          class="auth-register-login-link text-sm font-medium text-[#2552d9] transition hover:text-[#1f46bb]"
          @click="goLogin"
        >
          已有账号？直接登录
        </button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          注册
        </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { Login } from "@/components/Modal";
import { useAuthStore } from "@/stores/auth";
import {
  type RegisterDialogOptions,
  registerRegisterDialogController,
  unregisterRegisterDialogController,
} from "./registerDialog";

const auth = useAuthStore();
const visible = ref(false);
const submitting = ref(false);
const form = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
});
let resolver: ((value: boolean) => void) | null = null;

const controller = {
  open(options?: RegisterDialogOptions) {
    if (options?.email) {
      form.email = options.email;
    }
    form.password = "";
    form.confirmPassword = "";
    visible.value = true;
    return new Promise<boolean>((resolve) => {
      resolver?.(false);
      resolver = resolve;
    });
  },
};

onMounted(() => {
  registerRegisterDialogController(controller);
});

onUnmounted(() => {
  unregisterRegisterDialogController(controller);
});

async function handleSubmit() {
  if (submitting.value) {
    return;
  }
  if (!form.email || !form.password) {
    ElMessage.warning("请输入邮箱和密码");
    return;
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }
  submitting.value = true;
  try {
    await auth.registerUser({
      email: form.email,
      password: form.password,
      displayName: form.displayName || undefined,
    });
    ElMessage.success("注册成功，请登录");
    resolver?.(true);
    resolver = null;
    visible.value = false;
    void Login({
      props: {
        email: form.email,
        message: "注册成功，请登录后继续使用。",
      },
    });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "注册失败");
  } finally {
    submitting.value = false;
  }
}

function goLogin() {
  visible.value = false;
  void Login({
    props: {
      email: form.email,
    },
  });
}

function handleClosed() {
  if (!submitting.value) {
    resolver?.(false);
    resolver = null;
  }
}
</script>
