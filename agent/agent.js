require('dotenv').config();
const WebSocket = require('ws');
const pty = require('node-pty');

const ws = new WebSocket(process.env.WS_URL);

let shell = null;

ws.on('open', () => {
  ws.send(JSON.stringify({
    role: 'windows',
    token: process.env.TOKEN
  }));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString());

  if (data.type === 'start') {
    if (shell) return;

    shell = pty.spawn('python', ['run.py'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: 'C:\\path\\ke\\script'
    });

    shell.onData((output) => {
      ws.send(JSON.stringify({
        type: 'output',
        data: output
      }));
    });
  }

  if (data.type === 'input' && shell) {
    shell.write(data.data);
  }

  if (data.type === 'stop' && shell) {
    shell.kill();
    shell = null;
  }
});