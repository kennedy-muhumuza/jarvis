import { useEffect, useRef, useState } from "react";
import JarvisVoiceUI from "./components/jarvis-voice-ui";
import Waveform from "./components/waveform";

type Message = {
  id: string;
  sender: "user" | "jarvis";
  text?: string;
  audioUrl?: string;
};

function App() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws");
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    setTimeout(() => {
      ws.send(JSON.stringify({ type: "chat", text: "__greet__" }));
    }, 900);

    ws.onmessage = async (event) => {
      // We try parse JSON first (for tts_result)
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tts_result") {
          // base64 audio -> Blob URL
          const b64 = data.audio;
          const binary = atob(b64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes.buffer], { type: "audio/mp3" });
          const url = URL.createObjectURL(blob);

          // Attach audio url to the last jarvis message (or create one)
          setMessages((prev) => {
            const copy = [...prev];
            // find last jarvis without audio
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].sender === "jarvis" && !copy[i].audioUrl) {
                copy[i] = { ...copy[i], audioUrl: url };
                return copy;
              }
            }
            // else create a new jarvis message with audio only
            copy.push({
              id: Math.random().toString(36),
              sender: "jarvis",
              audioUrl: url,
            });
            return copy;
          });

          // Play audio after slight delay to allow UI update
          setTimeout(() => playAudio(url), 120);
          return;
        } else if (data.type === "error") {
          // show error bubble
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36),
              sender: "jarvis",
              text: `⚠️ ${data.message}`,
            },
          ]);
          return;
        }
      } catch (err) {
        // not json — fallback to plain text message
      }

      // Plain text messages
      const text = (event.data as string).trim();
      if (!text) return;
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36), sender: "jarvis", text },
      ]);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  const sendText = (text: string) => {
    if (!text.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", text }));
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36), sender: "user", text },
      ]);
    }
  };

  const playAudio = async (url: string) => {
    if (!audioRef.current) {
      audioRef.current = document.createElement("audio");
      audioRef.current.onplay = () => setPlaying(true);
      audioRef.current.onended = () => setPlaying(false);
    }
    audioRef.current.src = url;
    try {
      await audioRef.current.play();
    } catch (e) {
      // play failed (autoplay restrictions). Ask user to click Start Listening (counts as gesture).
      console.warn("Playback failed:", e);
    }
  };

  // wire Wake -> send greet
  const handleWake = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat", text: "__greet__" }));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Jarvis — Live</h1>
            <div className="text-sm">
              Status:{" "}
              {connected ? (
                <span className="text-green-400">● Connected</span>
              ) : (
                <span className="text-red-400">● Offline</span>
              )}
            </div>
          </header>

          <div className="bg-gray-900/30 rounded-xl p-4 shadow-lg">
            {/* Chat area */}
            <div className="h-96 overflow-y-auto p-3 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] ${
                    m.sender === "user"
                      ? "ml-auto text-right"
                      : "mr-auto text-left"
                  }`}
                >
                  <div
                    className={`${
                      m.sender === "user"
                        ? "bg-blue-600/80 text-white"
                        : "bg-gray-800/80 text-gray-100"
                    } inline-block px-4 py-2 rounded-2xl`}
                  >
                    {m.text && (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    )}
                    {m.audioUrl && (
                      <>
                        <div className="mt-2">
                          <button
                            onClick={() => playAudio(m.audioUrl!)}
                            className="px-3 py-1 rounded-full bg-blue-500/70 hover:bg-blue-600"
                          >
                            ▶️ Play
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Waveform shown only when audio is playing */}
            <div className="mt-3">
              <div className="bg-black/20 rounded p-3">
                <Waveform audioRef={audioRef} playing={playing} />
              </div>
            </div>

            {/* Input area */}
            <div className="mt-4 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type a message or say 'Hey Jarvis'..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendText((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector("input");
                  if (!input) return;
                  const val = (input as HTMLInputElement).value;
                  sendText(val);
                  (input as HTMLInputElement).value = "";
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Send
              </button>
            </div>

            {/* Jarvis Voice UI */}
            <div className="mt-6">
              <JarvisVoiceUI onWake={handleWake} />
            </div>
          </div>
        </div>
      </div>

      {/* <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
      <JarvisVoiceUI
        onWake={() => {
          if (wsRef.current) {
            wsRef.current.send(
              JSON.stringify({ type: "chat", text: "__greet__" })
            );
          }
        }}
      /> */}
    </>
  );
}

export default App;

// import { useEffect, useState, useRef } from "react";
// import Jarvis from "./components/jarvis";
// import JarvisListener from "./components/jarvis-listener";

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

//       setTimeout(() => {
//         ws.send(JSON.stringify({ type: "chat", text: "__greet__" }));
//       }, 1500);
//     };

//     // ws.onmessage = (event) => {
//     //   const msg = event.data;
//     //   setConversation((prev) => [...prev, `🤖 Jarvis: ${msg}`]);
//     // };

//     ws.onmessage = (event) => {
//       const msg = event.data;

//       try {
//         const data = JSON.parse(msg);
//         if (data.type === "tts_result") {
//           const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
//           audio.play();
//           return;
//         }
//       } catch (err) {
//         // Normal text message
//         setConversation((prev) => [...prev, `🤖 Jarvis: ${msg}`]);
//       }
//     };

//     ws.onclose = () => {
//       console.log("❌ Disconnected");
//       setConnected(false);
//     };

//     return () => ws.close();
//   }, []);

//   const sendMessage = () => {
//     if (wsRef.current && inputText.trim()) {
//       const msg = {
//         type: "chat",
//         text: inputText,
//       };
//       wsRef.current.send(JSON.stringify(msg));
//       // wsRef.current.send(inputText);
//       setConversation((prev) => [...prev, `🧑 You: ${inputText}`]);
//       setInputText("");
//     }
//   };

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
//       <JarvisListener
//         onWakeWord={() => {
//           console.log("🎙️ Jarvis activated!");
//           wsRef.current?.send(
//             JSON.stringify({ type: "chat", text: "__greet__" })
//           );
//         }}
//       />

//       {/* <Jarvis /> */}
//     </div>
//   );
// }

// export default App;
