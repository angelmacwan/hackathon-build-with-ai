'use client';

import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'ai', text: `Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', text: data.text }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Failed to connect to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50">
      <div className="z-10 w-full max-w-2xl flex flex-col h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-4 text-white font-bold text-center">
          Gemini Vertex AI Chat
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-10">Start a conversation!</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        Deployable to GCP Cloud Run
      </div>
    </main>
  );
}
