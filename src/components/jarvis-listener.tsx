import { useEffect } from "react";

export default function JarvisListener({ onWakeWord }: any) {
  useEffect(() => {
    // const recognition = new (window.SpeechRecognition ||
    //   window.webkitSpeechRecognition)();

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
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
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
