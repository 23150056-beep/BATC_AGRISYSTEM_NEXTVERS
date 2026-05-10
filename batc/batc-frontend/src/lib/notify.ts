import { toast as sonnerToast } from "sonner";

/**
 * Thin wrapper around sonner so the rest of the app uses one consistent API.
 * Always use these helpers — never call sonner.toast directly — so we can
 * change the toast system later without touching the call sites.
 *
 *     notify.success("Farmer registered");
 *     notify.error("Could not save", { description: err.message });
 *     notify.promise(api.save(), { loading: "Saving...", success: "Saved!" });
 */
export const notify = {
  success: (message: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.success(message, opts),

  error: (message: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.error(message, { duration: 6000, ...opts }),

  warning: (message: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.warning(message, opts),

  info: (message: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.info(message, opts),

  message: (message: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast(message, opts),

  promise: <T>(p: Promise<T>, opts: { loading: string; success: string; error: string }) =>
    sonnerToast.promise(p, opts),

  dismiss: () => sonnerToast.dismiss(),
};
