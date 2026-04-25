'use client';

import { useEffect } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

export default function Home() {
  useEffect(() => {
    const term = new Terminal();
    term.open(document.getElementById('terminal')!);

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        role: 'browser',
        token: process.env.NEXT_PUBLIC_TOKEN
      }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'output') {
        term.write(data.data);
      }
    };

    term.onData((data) => {
      ws.send(JSON.stringify({
        type: 'input',
        data
      }));
    });

    (window as any).start = () => {
      ws.send(JSON.stringify({ type: 'start' }));
    };

    (window as any).stop = () => {
      ws.send(JSON.stringify({ type: 'stop' }));
    };

  }, []);

  return (
    <>
      <button onClick={() => (window as any).start()}>Start</button>
      <button onClick={() => (window as any).stop()}>Stop</button>
      <div id="terminal" style={{ height: '500px' }} />
    </>
  );
}