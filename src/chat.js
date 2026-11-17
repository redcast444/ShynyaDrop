// Anonymous read-only Twitch chat (official justinfan login, no token, can't post).
export function connectChat(channel, onNick) {
  let ws;
  const open = () => {
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags');
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK justinfan${Math.floor(Math.random() * 90000) + 10000}`);
      ws.send(`JOIN #${channel}`);
    };
    ws.onmessage = (e) => {
      for (const line of e.data.split('\r\n')) {
        if (line.startsWith('PING')) ws.send('PONG :tmi.twitch.tv');
        if (!line.includes(' PRIVMSG ')) continue;
        const name = /display-name=([^;]*)/.exec(line)?.[1] || /:(\w+)!/.exec(line)?.[1];
        if (name) onNick(name);
      }
    };
    ws.onclose = () => setTimeout(open, 5000);
  };
  open();
}
