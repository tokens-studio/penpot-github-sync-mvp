penpot.ui.open("Penpot plugin starter template", `?theme=${penpot.theme}`);

penpot.ui.onMessage<string>((message) => {
  if (message === "getTokens") {
    const tokens = penpot.getTokens();
    console.log(tokens);
  }
});

// penpot.on("themechange", (theme) => {
//   penpot.ui.sendMessage({
//     source: "penpot",
//     type: "themechange",
//     theme,
//   });
// });
