export type RegisterDialogOptions = {
  email?: string;
};

type RegisterDialogController = {
  open: (options?: RegisterDialogOptions) => Promise<boolean>;
};

let controller: RegisterDialogController | null = null;

export function registerRegisterDialogController(nextController: RegisterDialogController) {
  controller = nextController;
}

export function unregisterRegisterDialogController(nextController: RegisterDialogController) {
  if (controller === nextController) {
    controller = null;
  }
}

export function openRegisterDialog(options?: RegisterDialogOptions): Promise<boolean> {
  if (!controller) {
    return Promise.resolve(false);
  }
  return controller.open(options);
}
