import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function Toast({ message, type, onClose }) {
  useEffect(() => { 
    const t = setTimeout(onClose, 3000); 
    return () => clearTimeout(t); 
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[9999] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-xl max-w-[300px] ${
      type === 'error' ? 'bg-red-600' : 'bg-green-800'
    }`}>
      {message}
    </div>
  );
}
