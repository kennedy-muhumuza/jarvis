import { useState } from "react";

function App() {
  const [message, setMessage] = useState("Waiting for backend...");
  const [response, setResponse] = useState("");

  const pingBackend = async () => {
    try {
      const res = await fetch("http://localhost:5000/");
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("❌ Backend not reachable");
    }
  };

  const sendAudio = async (e: any) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:5000/voice", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResponse(data.transcript);
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>🎙️ Jarvis Starter</h1>
      <button onClick={pingBackend}>Ping Backend</button>
      <p>{message}</p>

      <h3>Send Audio File</h3>
      <input type="file" accept="audio/*" onChange={sendAudio} />
      <p>{response}</p>
    </div>
  );
}

export default App;
