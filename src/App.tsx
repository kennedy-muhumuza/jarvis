import { useEffect, useRef, useState } from "react";
import Jarvis from "./components/jarvis";

function VoiceChat() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws/voice");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to backend voice WebSocket");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        );
        const url = URL.createObjectURL(audioBlob);
        new Audio(url).play();
      }
    };

    ws.onclose = () => {
      console.log("❌ Voice socket closed");
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  const sendText = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    } else {
      console.warn("⚠️ WebSocket not ready yet");
    }
  };

  const handleSpeak = async () => {
    if (!connected) return alert("WebSocket not connected yet!");
    const text = prompt("Say something to Jarvis:");
    if (text) sendText(text);
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>🎤 Jarvis Voice Assistant</h2>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
      <button
        onClick={handleSpeak}
        disabled={!connected}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
      >
        Talk to Jarvis
      </button>

      <Jarvis />
    </div>
  );
}

export default VoiceChat;

// import { useEffect, useState, useRef } from "react";

// function App() {
//   const [connected, setConnected] = useState(false);
//   const [conversation, setConversation] = useState<string[]>([]);
//   const [inputText, setInputText] = useState("");
//   const wsRef = useRef<WebSocket | null>(null);

//   // Connect to backend WebSocket
//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:5000/ws");
//     wsRef.current = ws;

//     ws.onopen = () => {
//       console.log("✅ Connected to backend");
//       setConnected(true);
//     };

//     ws.onmessage = (event) => {
//       const msg = event.data;
//       setConversation((prev) => [...prev, `🤖 Jarvis: ${msg}`]);
//     };

//     ws.onclose = () => {
//       console.log("❌ Disconnected");
//       setConnected(false);
//     };

//     return () => ws.close();
//   }, []);

//   // Send text message
//   const sendMessage = () => {
//     if (wsRef.current && inputText.trim()) {
//       wsRef.current.send(inputText);
//       setConversation((prev) => [...prev, `🧑 You: ${inputText}`]);
//       setInputText("");
//     }
//   };

//   // Handle Enter key
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") sendMessage();
//   };

//   return (
//     <div
//       style={{
//         fontFamily: "sans-serif",
//         padding: "2rem",
//         maxWidth: 600,
//         margin: "auto",
//       }}
//     >
//       <h1>🎙️ Jarvis Live Chat</h1>
//       <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

//       <div
//         style={{
//           border: "1px solid #ccc",
//           borderRadius: "10px",
//           padding: "1rem",
//           height: "300px",
//           overflowY: "auto",
//           marginBottom: "1rem",
//           background: "#fafafa",
//           color: "#000",
//         }}
//       >
//         {conversation.map((msg, i) => (
//           <p key={i} style={{ margin: "0.5rem 0" }}>
//             {msg}
//           </p>
//         ))}
//       </div>

//       <input
//         type="text"
//         placeholder="Type your message..."
//         value={inputText}
//         onChange={(e) => setInputText(e.target.value)}
//         onKeyDown={handleKeyDown}
//         style={{ padding: "0.5rem", width: "80%" }}
//       />
//       <button
//         onClick={sendMessage}
//         style={{ padding: "0.5rem", marginLeft: "0.5rem" }}
//       >
//         Send
//       </button>
//     </div>
//   );
// }

// export default App;

// --------------------------------------------------------------------------------

// import { useState } from "react";

// function App() {
//   const [message, setMessage] = useState("Waiting for backend...");
//   const [response, setResponse] = useState("");

//   const pingBackend = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/");
//       const data = await res.json();
//       setMessage(data.message);
//     } catch (err) {
//       setMessage("❌ Backend not reachable");
//     }
//   };

//   const sendAudio = async (e: any) => {
//     const file = e.target.files[0];
//     const formData = new FormData();
//     formData.append("file", file);
//     const res = await fetch("http://localhost:5000/voice", {
//       method: "POST",
//       body: formData,
//     });
//     const data = await res.json();
//     setResponse(data.transcript);
//   };

//   return (
//     <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
//       <h1>🎙️ Jarvis Starter</h1>
//       <button onClick={pingBackend}>Ping Backend</button>
//       <p>{message}</p>

//       <h3>Send Audio File</h3>
//       <input type="file" accept="audio/*" onChange={sendAudio} />
//       <p>{response}</p>
//     </div>
//   );
// }

// export default App;
