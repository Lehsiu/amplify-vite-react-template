import React, { useState } from 'react';
import './App.css';

const ChatApp: React.FC = () => {
  const [chats, setChats] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Chat 1' },
  ]);
  const [activeChat, setActiveChat] = useState(1);
  const [messages, setMessages] = useState<{ chatId: number; sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleNewChat = () => {
    const newId = chats.length + 1;
    setChats([...chats, { id: newId, name: `Chat ${newId}` }]);
    setActiveChat(newId);
  };

  const handleEditChatName = (chatId: number) => {
    const newName = prompt('編輯聊天室名稱：', chats.find((chat) => chat.id === chatId)?.name);
    if (newName !== null) {
      setChats((prev) => prev.map((chat) => chat.id === chatId ? { ...chat, name: newName } : chat));
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { chatId: activeChat, sender: 'user', text: input }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { chatId: activeChat, sender: 'bot', text: '這是機器人回覆！' }]);
    }, 500);
    setInput('');
  };

  const handleDeleteMessage = (index: number) => {
    if (window.confirm('確定要刪除這則訊息嗎？')) {
      setMessages((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleEditMessage = (index: number) => {
    const newText = prompt('編輯訊息：', messages[index].text);
    if (newText !== null) {
      setMessages((prev) => prev.map((msg, idx) => idx === index ? { ...msg, text: newText } : msg));
    }
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>智慧製造Chatbot</h2>
          <button onClick={handleNewChat}>＋</button>
        </div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChat(chat.id)}
              onDoubleClick={() => handleEditChatName(chat.id)}
            >
              {chat.name}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-content">
        <div className="messages">
          {messages.filter((msg) => msg.chatId === activeChat).map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <span>{msg.text}</span>
              {msg.sender === 'user' && (
                <div className="message-actions">
                  <button onClick={() => handleEditMessage(idx)}>編輯</button>
                  <button onClick={() => handleDeleteMessage(idx)}>刪除</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="輸入訊息..."
          />
          <button onClick={handleSend}>送出</button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
