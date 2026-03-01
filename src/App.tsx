import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [name, setName] = useState("");
  const [greetMsg, setGreetMsg] = useState("");

  async function greet(event: React.FormEvent) {
    event.preventDefault();
    const msg = await invoke<string>("greet", { name });
    setGreetMsg(msg);
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite Logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri Logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src="/react.svg" className="logo react" alt="React Logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form className="row" onSubmit={greet}>
        <input
          id="greet-input"
          placeholder="Enter a name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
