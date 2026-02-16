import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from "react";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const ws = useRef(null);
  const listenersRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);


  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3000/ws");

    ws.current.onopen = () => {
      console.log("[ws] connected");
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      console.log("[ws] disconnected");
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error("[ws] error", error);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[ws] message received:", data);

        listenersRef.current.forEach((listener) => {
          listener(data);
        });

      } catch (err) {
        console.error("[ws] failed to parse message:", event.data, err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const send = useCallback((payload) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("[ws] not connected, cannot send");
      return;
    }

    const message =
      typeof payload === "string"
        ? payload
        : JSON.stringify(payload);

    console.log("[ws] sending:", message);
    ws.current.send(message);
  }, []);


  const addMessageListener = useCallback((callback) => {
    listenersRef.current.push(callback);

    return () => {
      listenersRef.current = listenersRef.current.filter(
        (listener) => listener !== callback
      );
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        send,
        isConnected,
        addMessageListener
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  }
  return context;
}
