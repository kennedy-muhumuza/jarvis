import { useEffect, useState, useRef } from "react";

function App() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to backend");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tts_result") {
          const audioBytes = Uint8Array.from(atob(data.audio), (c) =>
            c.charCodeAt(0)
          );
          const blob = new Blob([audioBytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
        } else if (data.type === "error") {
          console.error(data.message);
        }
      } catch {
        console.log("Message:", event.data);
      }
    };

    ws.onclose = () => {
      console.log("❌ Disconnected");
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  const sendTTS = (text: string, engine: string = "gtts") => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "tts", text, engine }));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎙️ Jarvis Voice Assistant</h1>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <button
        onClick={() =>
          sendTTS("Hello, I’m your assistant using Google TTS!", "gtts")
        }
      >
        🌐 Use gTTS (Cloud)
      </button>

      <button onClick={() => sendTTS("Hello from local pyttsx3!", "pyttsx3")}>
        💻 Use pyttsx3 (Local)
      </button>
    </div>
  );
}

export default App;
