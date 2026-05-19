import { h, ref } from "vue";
import type { Component } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import LoginComponent from "./Login.tsx";

type ModalOptions = {
  props?: Record<string, unknown>;
  [key: string]: unknown;
};

const createModal = <T = unknown>(component: Component, params = {}) => {
  return async function (options: { [key: string]: any } = {}) {
    const { props = {}, ...args } = options;
    try {
      const elRef = ref();
      const onDestroy = () => {
        ElMessageBox.close();
      };
      await ElMessageBox.confirm(
        () => h(component, { ref: elRef, ...{ ...props, onDestroy } }),
        {
          ...{
            autofocus: false,
            ...params,
            ...args,
          },
          ...(props.type === "manage"
            ? { showCancelButton: false, showConfirmButton: false }
            : {}),
          autofocus: false,
          async beforeClose(action, instance, done) {
            if (action === "cancel") {
              return done();
            }
            const beforeClose =
              elRef.value?.beforeClose ?? (() => ({ success: true }));
            const { success, msg } = await Promise.resolve(beforeClose());
            if (!success) {
              return msg ? ElMessage.error(msg) : "";
            }
            return done();
          },
        },
      );

      const data = elRef.value?.onOk ? elRef.value?.onOk() : undefined;
      return Promise.resolve(data);
    } catch (error) {
      console.log(error);
      return Promise.reject("用户关闭弹框了");
    }
  };
};

export const Login = createModal(LoginComponent, {
  title: "",
  showCancelButton: false,
  showConfirmButton: false,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
  customStyle: { width: "500px", maxWidth: "500px" },
  customClass: "login-modal auth-login-dialog",
});
