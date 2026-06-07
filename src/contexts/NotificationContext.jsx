import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Toaster, toast } from "sonner";
import Button from "../components/Button";

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);

  // Lock body scroll when a dialog is open
  useEffect(() => {
    if (confirmDialog || promptDialog) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [confirmDialog, promptDialog]);

  const showSuccess = useCallback((message) => toast.success(message), []);
  const showError = useCallback((message) => toast.error(message), []);
  const showInfo = useCallback((message) => toast.info(message), []);

  const confirm = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        variant: options.variant || "primary", // 'danger' or 'primary'
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
      });
    });
  }, []);

  const prompt = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setPromptDialog({
        title,
        message,
        placeholder: options.placeholder || "Nhập thông tin...",
        defaultValue: options.defaultValue || "",
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        variant: options.variant || "primary",
        onConfirm: (inputValue) => {
          setPromptDialog(null);
          resolve(inputValue);
        },
        onCancel: () => {
          setPromptDialog(null);
          resolve(null);
        },
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo, confirm, prompt }}>
      {children}

      <Toaster position="top-right" richColors closeButton />

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={confirmDialog.onCancel}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-zoom-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={confirmDialog.onCancel}>
                {confirmDialog.cancelText}
              </Button>
              <Button 
                variant={confirmDialog.variant} 
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog Modal */}
      {promptDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={promptDialog.onCancel}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-zoom-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {promptDialog.title}
            </h3>
            {promptDialog.message && (
              <p className="text-sm text-slate-600 mb-4">
                {promptDialog.message}
              </p>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              promptDialog.onConfirm(e.target.promptInput.value);
            }}>
              <input
                name="promptInput"
                type="text"
                autoFocus
                defaultValue={promptDialog.defaultValue}
                placeholder={promptDialog.placeholder}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={promptDialog.onCancel}>
                  {promptDialog.cancelText}
                </Button>
                <Button type="submit" variant={promptDialog.variant}>
                  {promptDialog.confirmText}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
