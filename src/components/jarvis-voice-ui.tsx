import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

export default function JarvisVoiceUI({ onWake }: any) {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    // const SpeechRecognition =
    //   window.SpeechRecognition || window.webkitSpeechRecognition;
    // if (!SpeechRecognition) {
    //   alert("Speech recognition not supported in this browser.");
    //   return;
    // }

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
      if (result.includes("jarvis")) {
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

// // JarvisVoiceUI.tsx
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Mic, MicOff } from "lucide-react";

// type Props = {
//   onWake?: () => void;
// };

// export default function JarvisVoiceUI({ onWake }: Props) {
//   const [isListening, setIsListening] = useState(false);
//   const [isActive, setIsActive] = useState(false);
//   const [transcript, setTranscript] = useState("");

//   useEffect(() => {
//     const SpeechRecognition =
//       (window as any).SpeechRecognition ||
//       (window as any).webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       return;
//     }
//     const recognition = new SpeechRecognition();
//     recognition.continuous = true;
//     recognition.interimResults = false;
//     recognition.lang = "en-US";

//     // recognition.onresult = (event: SpeechRecognitionEvent) => {
//     recognition.onresult = (event: any) => {
//       const result =
//         event.results[event.results.length - 1][0].transcript.toLowerCase();
//       setTranscript(result);
//       if (result.includes("jarvis")) {
//         setIsActive(true);
//         onWake?.();
//         setTimeout(() => setIsActive(false), 2500);
//       }
//     };

//     recognition.onend = () => {
//       if (isListening) recognition.start();
//     };

//     if (isListening) recognition.start();

//     return () => {
//       try {
//         recognition.stop();
//       } catch (e) {}
//     };
//   }, [isListening, onWake]);

//   return (
//     <div className="w-full max-w-md mx-auto text-center">
//       <div className="relative my-8">
//         <AnimatePresence>
//           {isActive && (
//             <motion.div
//               key="pulse"
//               initial={{ scale: 0.9, opacity: 0.3 }}
//               animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
//               transition={{
//                 duration: 1.6,
//                 repeat: Infinity,
//                 ease: "easeInOut",
//               }}
//               className="absolute -inset-6 rounded-full bg-blue-500/30 blur-2xl"
//             />
//           )}
//         </AnimatePresence>

//         <motion.div
//           animate={{ scale: isActive ? 1.05 : 1 }}
//           transition={{ type: "spring", stiffness: 280, damping: 18 }}
//           className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full shadow-2xl border-2 ${
//             isActive
//               ? "border-blue-400 bg-blue-700/20"
//               : "border-gray-700 bg-gray-800/20"
//           }`}
//         >
//           {isListening ? (
//             <Mic
//               className={`w-10 h-10 ${
//                 isActive ? "text-blue-400" : "text-gray-300"
//               }`}
//             />
//           ) : (
//             <MicOff className="w-10 h-10 text-gray-500" />
//           )}
//         </motion.div>
//       </div>

//       <p className="text-gray-300">
//         {isListening
//           ? isActive
//             ? "Jarvis is awake..."
//             : "Listening for 'Hey Jarvis'..."
//           : "Mic is off"}
//       </p>
//       {transcript && (
//         <p className="text-sm text-gray-500 italic mt-2">{transcript}</p>
//       )}

//       <div className="mt-6">
//         <button
//           onClick={() => setIsListening((p) => !p)}
//           className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow"
//         >
//           {isListening ? "Stop Listening" : "Start Listening"}
//         </button>
//       </div>
//     </div>
//   );
// }
