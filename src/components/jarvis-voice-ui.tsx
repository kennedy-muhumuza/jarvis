import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

export default function JarvisVoiceUI({ onWake }: any) {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const result =
        event.results[event.results.length - 1][0].transcript.toLowerCase();
      setTranscript(result);
      if (result.includes("hey")) {
        setIsActive(true);
        onWake?.();
        setTimeout(() => setIsActive(false), 2500);
      }
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };

    if (isListening) recognition.start();

    return () => recognition.stop();
  }, [isListening, onWake]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Voice Circle */}
      <div className="relative">
        <AnimatePresence>
          {isActive && (
            <motion.div
              key="pulse"
              initial={{ scale: 0.8, opacity: 0.4 }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-10 rounded-full bg-blue-500/30 blur-2xl"
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`relative z-10 flex items-center justify-center w-32 h-32 rounded-full shadow-2xl border-2 ${
            isActive
              ? "border-blue-400 bg-blue-700/30"
              : "border-gray-700 bg-gray-800/30"
          }`}
        >
          {isListening ? (
            <Mic
              className={`w-10 h-10 ${
                isActive ? "text-blue-400" : "text-gray-400"
              }`}
            />
          ) : (
            <MicOff className="w-10 h-10 text-gray-600" />
          )}
        </motion.div>
      </div>

      {/* Transcript display */}
      <div className="mt-8 text-center">
        <p className="text-lg text-gray-300">
          {isListening
            ? isActive
              ? "🎙️ Jarvis is awake..."
              : "Listening for 'Hey Jarvis'..."
            : "Mic is off"}
        </p>
        {transcript && (
          <p className="text-sm text-gray-500 mt-2 italic">{transcript}</p>
        )}
      </div>

      {/* Toggle Listening */}
      <button
        onClick={() => setIsListening((p) => !p)}
        className="absolute bottom-16 px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition text-white shadow-lg cursor-pointer"
      >
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
    </div>
  );
}
