import { useEffect, useState, useRef } from "react";
import Jarvis from "./components/jarvis";
import JarvisListener from "./components/jarvis-listener";

function App() {
  const [connected, setConnected] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to backend WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to backend");
      setConnected(true);

      setTimeout(() => {
        ws.send(JSON.stringify({ type: "chat", text: "__greet__" }));
      }, 1500);
    };

    // ws.onmessage = (event) => {
    //   const msg = event.data;
    //   setConversation((prev) => [...prev, `🤖 Jarvis: ${msg}`]);
    // };

    ws.onmessage = (event) => {
      const msg = event.data;

      try {
        const data = JSON.parse(msg);
        if (data.type === "tts_result") {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          audio.play();
          return;
        }
      } catch (err) {
        // Normal text message
        setConversation((prev) => [...prev, `🤖 Jarvis: ${msg}`]);
      }
    };

    ws.onclose = () => {
      console.log("❌ Disconnected");
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (wsRef.current && inputText.trim()) {
      const msg = {
        type: "chat",
        text: inputText,
      };
      wsRef.current.send(JSON.stringify(msg));
      // wsRef.current.send(inputText);
      setConversation((prev) => [...prev, `🧑 You: ${inputText}`]);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "2rem",
        maxWidth: 600,
        margin: "auto",
      }}
    >
      <h1>🎙️ Jarvis Live Chat</h1>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "1rem",
          height: "300px",
          overflowY: "auto",
          marginBottom: "1rem",
          background: "#fafafa",
          color: "#000",
        }}
      >
        {conversation.map((msg, i) => (
          <p key={i} style={{ margin: "0.5rem 0" }}>
            {msg}
          </p>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type your message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ padding: "0.5rem", width: "80%" }}
      />
      <button
        onClick={sendMessage}
        style={{ padding: "0.5rem", marginLeft: "0.5rem" }}
      >
        Send
      </button>
      <JarvisListener
        onWakeWord={() => {
          console.log("🎙️ Jarvis activated!");
          wsRef.current?.send(
            JSON.stringify({ type: "chat", text: "__greet__" })
          );
        }}
      />

      {/* <Jarvis /> */}
    </div>
  );
}

export default App;
