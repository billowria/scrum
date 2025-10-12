import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ScrollableMessageArea from './ScrollableMessageArea';
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
    if (editingMessage) {
      // Update existing message
      try {
        await editMessage(editingMessage.id, content);
      } finally {
        setEditingMessage(null);
      }
    } else {
      // Send new message
      await sendMessage(content);
    }
    stopTyping();
  };

  const handleStartEdit = (message) => {
    setEditingMessage(message);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
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
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative" style={{ minHeight: 0, paddingBottom: '80px' }}>
      {/* FIXED HEADER - Always visible at top */}
      <div 
        className="flex-shrink-0 border-b border-indigo-100 bg-white/90 backdrop-blur-sm z-20 shadow-sm sticky top-0"
      >
        <div className="max-w-5xl w-full mx-auto px-4">
          <ChatHeader 
            conversation={conversation} 
            currentUser={currentUser} 
            isOnline={isOnline} 
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>

      {/* SCROLLABLE MESSAGE AREA - Only this scrolls */}
      <div 
        className="flex-1 overflow-y-auto min-h-0 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col no-scrollbar pb-16"
        style={{ minHeight: 0 }}
      >
        <div className="flex-1 rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col">
          <ScrollableMessageArea
            messages={messages} 
            typingUsers={typingUsers} 
            onEdit={handleStartEdit} 
            onDelete={handleDelete} 
            onLoadMore={loadMore} 
            hasMore={hasMore} 
            loading={loading} 
          />
        </div>
      </div>

      {/* FIXED INPUT - Always visible at bottom within right pane */}
      <div 
        className="absolute bottom-0 w-full border-t border-indigo-100 bg-white/90 backdrop-blur-sm shadow-lg z-10"
      >
        <div className="max-w-5xl w-full mx-auto px-4 py-3">
          <MessageInput 
            onSend={handleSend} 
            onTyping={startTyping} 
            disabled={sending}
            editingMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
