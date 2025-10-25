import { useEffect } from "react";

export default function JarvisListener({ onWakeWord }) {
  useEffect(() => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes("jarvis")) {
        onWakeWord();
      }
    };

    recognition.start();

    return () => recognition.stop();
  }, [onWakeWord]);

  return null;
}
