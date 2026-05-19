import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from "element-plus";
import { defineComponent, reactive, ref } from "vue";
import type { PropType } from "vue";
import { useAuthStore } from "../../stores/auth";

export default defineComponent({
  props: {
    email: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "登录后即可继续生成和管理你的游戏项目。",
    },
    onDestroy: Function as PropType<() => void>,
    openRegister: Function as PropType<(email?: string) => void>,
  },

  setup(props, { expose }) {
    const auth = useAuthStore();
    const submitting = ref(false);
    const loggedIn = ref(false);
    const form = reactive({
      email: props.email,
      password: "",
    });

    async function handleSubmit() {
      if (submitting.value) {
        return;
      }
      if (!form.email || !form.password) {
        ElMessage.warning("请输入邮箱和密码");
        return;
      }
      submitting.value = true;
      try {
        await auth.login({ email: form.email, password: form.password });
        ElMessage.success("登录成功");
        loggedIn.value = true;
        props.onDestroy?.();
      } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "登录失败");
      } finally {
        submitting.value = false;
      }
    }

    const goRegister = () => {
      loggedIn.value = false;
      props.onDestroy?.();
      props.openRegister?.(form.email);
    };

    expose({
      onOk: () => loggedIn.value,
    });

    return () => (
      <div class="auth-login login-modal-content">
        <div class="auth-login-header space-y-1">
          <div class="auth-login-title text-lg font-semibold text-[#111827]">
            登录 GameForge AI
          </div>
          <div class="auth-login-description text-sm text-[#6b7280]">
            {props.message}
          </div>
        </div>

        <ElForm class="auth-login-form mt-5" labelPosition="top">
          <ElFormItem label="邮箱" class="auth-login-email-field">
            <ElInput
              modelValue={form.email}
              autocomplete="email"
              placeholder="name@example.com"
              size="large"
              onUpdate:modelValue={(value: string) => {
                form.email = value.trim();
              }}
            />
          </ElFormItem>
          <ElFormItem label="密码" class="auth-login-password-field">
            <ElInput
              modelValue={form.password}
              autocomplete="current-password"
              placeholder="请输入密码"
              showPassword
              size="large"
              type="password"
              onUpdate:modelValue={(value: string) => {
                form.password = value;
              }}
            />
          </ElFormItem>
          <div class="auth-login-actions mt-2 flex items-center justify-between">
            <button
              type="button"
              class="auth-login-register-link text-sm font-medium text-[#2552d9] transition hover:text-[#1f46bb]"
              onClick={goRegister}
            >
              还没有账号？立即注册
            </button>
            <ElButton
              type="primary"
              loading={submitting.value}
              onClick={() => handleSubmit()}
            >
              登录
            </ElButton>
          </div>
        </ElForm>
      </div>
    );
  },
});
