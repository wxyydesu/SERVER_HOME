require('dotenv').config();
const WebSocket = require('ws');
const pty = require('node-pty');

console.log("Agent starting...");
console.log("Connecting to:", process.env.WS_URL);

const ws = new WebSocket(process.env.WS_URL);

let shell = null;

ws.on('open', () => {
  console.log("Connected to relay");

  ws.send(JSON.stringify({
    role: 'windows',
    token: process.env.TOKEN
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());

  if (data.type === 'start') {
    if (shell) return;

    console.log("Starting Python script...");

    shell = pty.spawn('python', ['run.py'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.SCRIPT_PATH
    });

    shell.onData((output) => {
      ws.send(JSON.stringify({
        type: 'output',
        data: output
      }));
    });

    shell.onExit(() => {
      console.log("Python stopped");
      shell = null;
    });
  }

  if (data.type === 'input' && shell) {
    shell.write(data.data);
  }

  if (data.type === 'stop' && shell) {
    shell.kill();
    shell = null;
    console.log("Stopped");
  }
});

ws.on('error', (err) => {
  console.log("WS Error:", err.message);
});

ws.on('close', () => {
  console.log("Disconnected from relay");
});