import React, { useState } from 'react';
import MessageBubble from './MessageBubble';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    // 模擬 bot 回覆
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: '這是機器人的回覆！', sender: 'bot' }]);
    }, 500);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full p-4 border rounded-lg">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg.text} sender={msg.sender} />
        ))}
      </div>
      <div className="flex mt-4">
        <input
          className="flex-1 p-2 border rounded-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="輸入訊息..."
        />
        <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg" onClick={handleSend}>
          送出
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
