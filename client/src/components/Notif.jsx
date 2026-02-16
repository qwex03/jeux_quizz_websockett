import { useEffect } from "react";

export default function Notif({ text, duration = 3000, onClose }) {
  useEffect(() => {
    if (!text) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [text, duration, onClose]);

  if (!text) return null;

  return (
    <div className="notification">
      {text}
    </div>
  );
}
