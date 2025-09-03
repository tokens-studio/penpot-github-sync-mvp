import "./style.css";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

const $getBtn = document.getElementById("getTokens");
const $setBtn = document.getElementById("setTokens");
const $textArea = document.getElementById("tokensEditor");

$getBtn.addEventListener("click", () => {
  parent.postMessage("getTokens", "*");
});

$setBtn.addEventListener("click", () => {
  parent.postMessage({ type: "setTokens", tokens: $textArea.value }, "*");
});

window.addEventListener("message", (event) => {
  if (event.data.source === "penpot" && event.data.type === "getTokensResult") {
    if ($textArea) {
      let tokens = event.data.tokens;
      // If tokens is already a string, parse it first
      if (typeof tokens === "string") {
        try {
          tokens = JSON.parse(tokens);
        } catch (e) {
          // If parsing fails, use the string as-is
        }
      }
      $textArea.value = JSON.stringify(tokens, null, 4);
    }
  }
});
