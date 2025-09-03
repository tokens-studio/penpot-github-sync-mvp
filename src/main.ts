import "./style.css";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

document.getElementById("getTokens").addEventListener("click", () => {
  parent.postMessage("getTokens", "*");
});

window.addEventListener("message", (event) => {
  console.log("MESSAGE", event);
  // if (event.data.source === "penpot") {
  //   document.body.dataset.theme = event.data.theme;
  // }
});
