import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';

export const ChatWindow = ({ conversation, currentUser, isOnline = false }) => {
  const [editingMessage, setEditingMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { messages, loading, sending, hasMore, sendMessage, editMessage, deleteMessage, loadMore, refreshMessages } = useChatMessages(conversation?.id);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(conversation?.id);

  if (!conversation) {
    return <EmptyState />;
  }

  const handleSend = async (content) => {
    await sendMessage(content);
    stopTyping();
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMessages();
    } finally {
      // Keep spinning for at least 500ms for visual feedback
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      <ChatHeader 
        conversation={conversation} 
        currentUser={currentUser} 
        isOnline={isOnline} 
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <MessageList 
        messages={messages} 
        typingUsers={typingUsers} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onLoadMore={loadMore} 
        hasMore={hasMore} 
        loading={loading} 
      />
      <MessageInput onSend={handleSend} onTyping={startTyping} disabled={sending} />
    </div>
  );
};

export default ChatWindow;
