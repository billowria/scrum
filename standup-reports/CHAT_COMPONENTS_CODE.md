# Chat System Components - Complete Code

Copy each section below into the specified file path.

## Progress So Far ✅
- ✅ Dependencies installed
- ✅ `src/services/chatService.js`
- ✅ `src/utils/chatUtils.js`
- ✅ `src/hooks/useConversations.js`
- ✅ `src/hooks/useChatMessages.js`
- ✅ `src/hooks/useOnlineStatus.js`
- ✅ `src/hooks/useTypingIndicator.js`

## Remaining Files 📝

### 1. OnlineIndicator Component
**Path:** `src/components/chat/OnlineIndicator.jsx`

```jsx
import React from 'react';
import { motion } from 'framer-motion';

export const OnlineIndicator = ({ isOnline, size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`rounded-full ${sizeClasses[size]} ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      } ${className}`}
    >
      {isOnline && (
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-full h-full rounded-full bg-green-500 opacity-75"
        />
      )}
    </motion.div>
  );
};

export default OnlineIndicator;
```

### 2. UserAvatar Component
**Path:** `src/components/chat/UserAvatar.jsx`

```jsx
import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/chatUtils';
import OnlineIndicator from './OnlineIndicator';

export const UserAvatar = ({ 
  user, 
  size = 'md', 
  showOnline = false, 
  isOnline = false,
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const indicatorPositions = {
    xs: 'bottom-0 right-0',
    sm: 'bottom-0 right-0',
    md: 'bottom-0.5 right-0.5',
    lg: 'bottom-1 right-1',
    xl: 'bottom-1 right-1'
  };

  if (!user) return null;

  const avatarColor = getAvatarColor(user.id);
  const initials = getInitials(user.name);

  return (
    <div className={`relative ${className}`}>
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}
      
      {showOnline && (
        <div className={`absolute ${indicatorPositions[size]}`}>
          <OnlineIndicator isOnline={isOnline} size={size === 'xs' || size === 'sm' ? 'xs' : 'sm'} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
```

### 3. TypingIndicator Component
**Path:** `src/components/chat/TypingIndicator.jsx`

```jsx
import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            delay: i * 0.1
          }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
```

### 4. EmptyState Component
**Path:** `src/components/chat/EmptyState.jsx`

```jsx
import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No conversation selected</h3>
        <p className="mt-2 text-sm text-gray-500">
          Choose a conversation from the sidebar to start messaging
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
```

---

## Next Steps

I have prepared all the code for the remaining components. Would you like me to:

1. **Continue creating files** individually (MessageInput, Message, MessageList, ChatHeader, etc.)
2. **Provide ALL component code** in one document for you to copy
3. **Create a shell script** that generates all files automatically

Which approach would you prefer? This will ensure we get everything implemented quickly and correctly.

Let me know and I'll proceed accordingly! 🚀
