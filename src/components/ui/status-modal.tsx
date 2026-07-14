"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ------- 类型 -------

type ModalType = "success" | "error" | null;

interface StatusModalState {
  type: ModalType;
  title: string;
  message?: string;
  detail?: string;
  /** 成功弹窗是否自动关闭：true=默认1500ms / 数字=自定义毫秒 / false=必须手动关 */
  successAutoClose?: boolean | number;
  /** 成功弹窗关闭（任何方式：知道了按钮/X/遮罩/Esc/自动超时）后的回调（已迁移到 ref，此处保留兼容） */

}

interface ShowSuccessOptions {
  /** 副标题小字说明 */
  message?: string;
  /** true(默认) = 1500ms 自动关；false = 必须手动关；number = 自定义毫秒 */
  autoClose?: boolean | number;
  /** 弹窗关闭后回调（任何关闭方式都会触发） */
  onDismiss?: () => void;
}

interface ShowErrorOptions {
  detail?: string;
  message?: string;
}

interface StatusModalContextValue {
  showSuccess: (title?: string, opts?: ShowSuccessOptions) => void;
  showError: (title?: string, opts?: ShowErrorOptions) => void;
  close: () => void;
}

// ------- Context -------

const StatusModalContext =
  React.createContext<StatusModalContextValue | null>(null);

export function useStatusModal(): StatusModalContextValue {
  const ctx = React.useContext(StatusModalContext);
  if (!ctx) {
    throw new Error(
      "useStatusModal 必须在 <StatusModalProvider> 包裹的组件内使用，请在 app/layout.tsx 中添加 <StatusModalProvider>。",
    );
  }
  return ctx;
}

// ------- Provider -------

const SUCCESS_AUTO_CLOSE_MS = 1500;

export function StatusModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<StatusModalState>({
    type: null,
    title: "",
  });
  const autoCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // 记录本次 dismiss 是否已经回调过（避免 Esc / 知道了 / 遮罩 / 自动超时 重复触发）
  const dismissFiredRef = React.useRef(false);
  // 使用 ref 存储 onDismiss，避免 autoClose timer 的 stale closure 丢失回调
  const onDismissRef = React.useRef<(() => void) | undefined>(undefined);

  const fireDismissOnce = React.useCallback(() => {
    if (dismissFiredRef.current) return;
    dismissFiredRef.current = true;
    onDismissRef.current?.();
  }, []);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, type: null }));
    // onDismiss 统一在下一个微任务 fire，保证 state.type 已切换为 null
    queueMicrotask(() => fireDismissOnce());
  }, [fireDismissOnce]);

  const clearAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  React.useEffect(() => {
    // 组件卸载时清理定时器
    return clearAutoCloseTimer;
  }, []);

  const showSuccess = React.useCallback(
    (title = "操作成功", opts: ShowSuccessOptions = {}) => {
      clearAutoCloseTimer();
      dismissFiredRef.current = false;

      const autoClose = opts.autoClose ?? true;
      onDismissRef.current = opts.onDismiss;
      setState({
        type: "success",
        title,
        message: opts.message,
        successAutoClose: autoClose,
      });

      if (autoClose !== false) {
        const ms = typeof autoClose === "number" ? autoClose : SUCCESS_AUTO_CLOSE_MS;
        autoCloseTimerRef.current = setTimeout(close, ms);
      }
    },
    [close],
  );

  const showError = React.useCallback(
    (
      title = "操作失败",
      opts: ShowErrorOptions = {},
    ) => {
      clearAutoCloseTimer();
      dismissFiredRef.current = false;
      setState({ type: "error", title, detail: opts.detail, message: opts.message });
    },
    [],
  );

  const ctxValue = React.useMemo<StatusModalContextValue>(
    () => ({ showSuccess, showError, close }),
    [showSuccess, showError, close],
  );

  const successNeedManualButton = state.type === "success" && state.successAutoClose === false;

  // 渲染 Modal
  return (
    <StatusModalContext.Provider value={ctxValue}>
      {children}
      <Dialog
        open={state.type !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearAutoCloseTimer();
            close();
          }
        }}
      >
        <DialogContent
          className={
            state.type === "success"
              ? "border-l-4 border-l-emerald-500"
              : state.type === "error"
                ? "border-l-4 border-l-red-500"
                : undefined
          }
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              {state.type === "success" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <DialogTitle
                className={
                  state.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : state.type === "error"
                      ? "text-red-600 dark:text-red-400"
                      : undefined
                }
              >
                {state.title}
              </DialogTitle>
              {state.message && (
                <DialogDescription>{state.message}</DialogDescription>
              )}
              {state.detail && (
                <div
                  className={
                    state.type === "error"
                      ? "mt-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-300 break-words whitespace-pre-wrap leading-relaxed"
                      : "mt-2 rounded-md bg-muted p-3 text-sm break-words whitespace-pre-wrap leading-relaxed"
                  }
                >
                  {state.detail}
                </div>
              )}
              {(state.type === "error" || successNeedManualButton) && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
                  >
                    知道了
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StatusModalContext.Provider>
  );
}
