import React from 'react';

interface MessageBubbleProps {
  message: string;
  sender: 'user' | 'bot';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender }) => {
  return (
    <div className={`p-2 m-2 rounded-lg max-w-xs ${sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 self-start'}`}>
      {message}
    </div>
  );
};

export default MessageBubble;
