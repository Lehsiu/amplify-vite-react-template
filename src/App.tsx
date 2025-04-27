import React, { useState, useRef } from 'react';
import './App.css';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { v4 as uuidv4 } from 'uuid';

const client = new BedrockAgentRuntimeClient({ region: "us-west-2" });
const sessionId = uuidv4();

const ChatApp: React.FC = () => {
  const [chats, setChats] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Chat 1' },
  ]);
  const [activeChat, setActiveChat] = useState(1);
  const [messages, setMessages] = useState<{ chatId: number; sender: 'user' | 'bot'; text: string; file?: File }[]>([]);
  const [input, setInput] = useState('');
  const [showTable, setShowTable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { chatId: activeChat, sender: "user" as "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (input.includes('生成表格')) {
      setShowTable(true);
      return;
    }

    try {
      const params = {
        agentId: "GHRJWZ4QFQ",
        agentAliasId: "MGOCOZSTJF",
        sessionId: sessionId,
        inputText: input,
      };
      const command = new InvokeAgentCommand(params);
      const response = await client.send(command);

      if (response.completion) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.completion) {
          if (chunk instanceof Uint8Array) {
            chunks.push(chunk);
          } else if ('payload' in chunk && chunk.payload instanceof Uint8Array) {
            chunks.push(chunk.payload);
          } else {
            console.error("Unexpected chunk format:", chunk);
            throw new Error("Unexpected chunk format");
          }
        }

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const fullBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          fullBuffer.set(chunk, offset);
          offset += chunk.length;
        }

        const fullText = new TextDecoder().decode(fullBuffer);
        setMessages((prev) => [...prev, { chatId: activeChat, sender: "bot", text: fullText }]);
      }

    } catch (error) {
      console.error("Error sending message:", error);
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { chatId: activeChat, sender: 'user', text: `已上傳檔案：${file.name}`, file },
      ]);

      try {
        const fileContent = await fetchFileContent(file.name);
        setMessages((prev) => [
          ...prev,
          { chatId: activeChat, sender: 'bot', text: `檔案內容：\n${fileContent}` },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { chatId: activeChat, sender: 'bot', text: '無法讀取檔案內容，請稍後再試。' },
        ]);
      }
    }
  };

  const fetchFileContent = async (fileName: string) => {
    try {
      const response = await fetch('https://6ejnpn4i1j.execute-api.us-west-2.amazonaws.com/{$default}/amplify-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_name: fileName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch file content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  };

  return (
    <div className="chat-app">
      <div id="js-chatbar" className={`sidebar --is-active`}>
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
                  <button
                    onClick={() => handleEditMessage(idx)}
                    style={{ fontSize: '12px', padding: '4px 8px', marginRight: '4px' }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(idx)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    刪除
                  </button>
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
          <button onClick={triggerFileInput}>+</button>
          <button onClick={() => setShowTable(true)}>生成表格</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* 生成的聊天記錄表格 */}
        {showTable && (
          <div className="chat-log-table">
            <table>
              <thead>
                <tr>
                  <th>編號</th>
                  <th>聊天室</th>
                  <th>發送者</th>
                  <th>訊息內容</th>
                  <th>檔案名稱</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{chats.find((chat) => chat.id === msg.chatId)?.name || '未知聊天室'}</td>
                    <td>{msg.sender === 'user' ? '使用者' : '機器人'}</td>
                    <td>{msg.text}</td>
                    <td>{msg.file?.name || '無'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChatApp;
