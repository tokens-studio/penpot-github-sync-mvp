import React, { useState, useEffect } from "react";
import "./style.css";

const App: React.FC = () => {
  const [tokens, setTokens] = useState<string>("");

  useEffect(() => {
    // Set theme from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    document.body.dataset.theme = searchParams.get("theme") ?? "light";

    // Listen for messages from the plugin
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.source === "penpot" &&
        event.data.type === "getTokensResult"
      ) {
        let tokens = event.data.tokens;
        // If tokens is already a string, parse it first
        if (typeof tokens === "string") {
          try {
            tokens = JSON.parse(tokens);
          } catch (e) {
            // If parsing fails, use the string as-is
          }
        }
        setTokens(JSON.stringify(tokens, null, 4));
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleGetTokens = () => {
    parent.postMessage("getTokens", "*");
  };

  const handleSetTokens = () => {
    parent.postMessage({ type: "setTokens", tokens }, "*");
  };

  const handleTokensChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setTokens(event.target.value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button type="button" data-appearance="primary" onClick={handleGetTokens}>
        Get
      </button>
      <textarea
        data-appearance="code"
        rows={10}
        placeholder="Tokens"
        value={tokens}
        onChange={handleTokensChange}
      />
      <button type="button" data-appearance="primary" onClick={handleSetTokens}>
        Set
      </button>
    </div>
  );
};

export default App;
