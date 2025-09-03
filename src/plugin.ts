penpot.ui.open("Penpot plugin starter template", `?theme=${penpot.theme}`);

penpot.ui.onMessage<any>((message) => {
  if (message === "getTokens") {
    const tokens = penpot.getTokens();
    penpot.ui.sendMessage({
      source: "penpot",
      type: "getTokensResult",
      tokens,
    });
  } else if (message.type === "setTokens") {
    penpot.setTokens(message.tokens);
  }
});
