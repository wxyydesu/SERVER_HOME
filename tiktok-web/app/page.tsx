'use client';

import { useEffect, useRef } from 'react';
import 'xterm/css/xterm.css';

export default function Home() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import xterm hanya di client-side
    const initTerminal = async () => {
      const { Terminal } = await import('xterm');
      
      if (!terminalRef.current) return;
      
      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff'
        }
      });
      
      termRef.current = term;
      term.open(terminalRef.current);

      // WebSocket connection
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.error('NEXT_PUBLIC_WS_URL is not defined');
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          role: 'browser',
          token: process.env.NEXT_PUBLIC_TOKEN
        }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'output') {
            term.write(data.data);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        term.write('\r\n\x1b[31mWebSocket connection error\x1b[0m\r\n');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        term.write('\r\n\x1b[33mDisconnected from server\x1b[0m\r\n');
      };

      term.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input',
            data
          }));
        }
      });
    };

    initTerminal();

    // Cleanup
    return () => {
      if (termRef.current) {
        termRef.current.dispose();
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleStart = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start' }));
    }
  };

  const handleStop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={handleStart}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start
        </button>
        <button 
          onClick={handleStop}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Stop
        </button>
      </div>
      <div 
        ref={terminalRef}
        style={{ 
          height: '500px', 
          backgroundColor: '#1e1e1e',
          borderRadius: '4px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
}