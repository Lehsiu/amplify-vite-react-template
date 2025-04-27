import React, { useState, useRef } from 'react';
import './App.css';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

const client = new BedrockAgentRuntimeClient({ region: "us-west-2" });
const sessionId = uuidv4();

const ChatApp: React.FC = () => {
  const [chats, setChats] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Chat 1' },
  ]);
  const [activeChat, setActiveChat] = useState(1);
  const [messages, setMessages] = useState<{ chatId: number; sender: 'user' | 'bot'; text: string; file?: File }[]>([]);
  const [input, setInput] = useState('');
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


  const exportToExcel = () => {
    // 將聊天訊息轉換為 Excel 資料
    const data = messages.map((msg, idx) => ({
      編號: idx + 1,
      聊天室: chats.find((chat) => chat.id === msg.chatId)?.name || '未知聊天室',
      發送者: msg.sender === 'user' ? '使用者' : '機器人',
      訊息內容: msg.text,
      檔案名稱: msg.file?.name || '無',
    }));
  
    // 建立工作表
    const worksheet = XLSX.utils.json_to_sheet(data);
  
    // 建立工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '聊天記錄');
  
    // 將工作簿匯出為 Excel 檔案
    XLSX.writeFile(workbook, '聊天記錄.xlsx');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = { chatId: activeChat, sender: "user" as "user", text: input }; // Explicitly type "user"
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
  
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
        // Combine all chunks into a single Uint8Array
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
        
        const fileContent = await fetchFileContent(file.name); // 呼叫後端 API
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
      return data.content; // 返回檔案內容
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
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              marginRight: '4px',
            }}
          >
            編輯
          </button>
          <button
            onClick={() => handleDeleteMessage(idx)}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
            }}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
