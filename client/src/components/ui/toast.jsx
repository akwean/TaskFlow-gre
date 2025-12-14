import React, { useRef, useState } from "react";

export function useToasts() {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);
    const add = (msg, type = "info") => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => remove(id), 3000);
    };
    const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
    const ToastContainer = () => (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`px-3 py-2 rounded shadow text-white text-sm ${t.type === "error" ? "bg-red-600" : t.type === "success" ? "bg-emerald-600" : "bg-black/80"}`}
                >
                    {t.msg}
                </div>
            ))}
        </div>
    );
    return { add, ToastContainer };
}

export default useToasts;
