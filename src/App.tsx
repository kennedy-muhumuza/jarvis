import { useEffect, useRef, useState } from "react";
import JarvisVoiceUI from "./components/jarvis-voice-ui";
import Waveform from "./components/waveform";
import { motion, AnimatePresence } from "framer-motion";

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
            <div className="h-66 overflow-y-auto p-3 space-y-3">
              <AnimatePresence>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className={`max-w-[80%] ${
                      m.sender === "user"
                        ? "ml-auto text-right"
                        : "mr-auto text-left"
                    }`}
                  >
                    <div
                      className={`relative inline-block px-4 py-2 rounded-2xl shadow-md backdrop-blur-sm ${
                        m.sender === "user"
                          ? "bg-blue-600/70 text-white"
                          : "bg-gray-800/70 text-gray-100"
                      }`}
                    >
                      {m.text && (
                        <div className="whitespace-pre-wrap text-[15px] leading-snug">
                          {m.text}
                        </div>
                      )}

                      {m.audioUrl && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => playAudio(m.audioUrl!)}
                            className="px-3 py-1 text-sm rounded-full bg-blue-500/70 hover:bg-blue-600 transition"
                          >
                            ▶️ Play
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-3">
              <div className="bg-black/20 rounded p-3">
                <Waveform audioRef={audioRef} playing={playing} />
              </div>
            </div>

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
