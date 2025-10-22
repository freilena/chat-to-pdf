# Component API Documentation

## Chat Components

This document provides detailed API documentation for all chat-related components implemented in Prompt 6.

### ChatPage Component

**Location**: `/web/src/app/chat/page.tsx`

**Purpose**: Main chat interface providing the complete chat experience.

**Props**: None (uses hooks internally)

**Features**:
- Responsive layout (mobile and desktop)
- Authentication protection
- Auto-scroll to bottom
- Session management integration

**Dependencies**:
- `useSession` hook for authentication
- `MessageList` component for message display

**Accessibility**:
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly

### MessageList Component

**Location**: `/web/src/components/chat/MessageList.tsx`

**Purpose**: Container component that manages and displays all messages in the chat.

**Props**:
```typescript
interface MessageListProps {
  messages: Message[];           // Array of messages to display
  isLoading?: boolean;          // Whether to show loading indicator
  scrollToBottom?: () => void;  // Callback for auto-scroll functionality
}
```

**Message Interface**:
```typescript
interface Message {
  id: string;                    // Unique message identifier
  type: 'user' | 'assistant' | 'system';  // Message type
  content: string;               // Message content
  timestamp: Date;               // When the message was created
}
```

**Features**:
- Renders different message types with appropriate components
- Handles empty state with helpful message
- Auto-scroll functionality
- Loading indicator support
- Graceful handling of unknown message types

### UserMessage Component

**Location**: `/web/src/components/chat/UserMessage.tsx`

**Purpose**: Displays user-asked questions in the chat.

**Props**:
```typescript
interface UserMessageProps {
  message: string;    // The user's question text
  timestamp: Date;    // When the message was sent
}
```

**Features**:
- Right-aligned message bubble
- Formatted timestamp display
- Proper text wrapping for long messages
- Special character support
- Multiline message support

**Styling**:
- Blue background (`var(--primary)`)
- Rounded corners with tail on right
- White text for contrast

### AssistantMessage Component

**Location**: `/web/src/components/chat/AssistantMessage.tsx`

**Purpose**: Displays AI assistant responses with optional loading state.

**Props**:
```typescript
interface AssistantMessageProps {
  message: string;        // The assistant's response text
  timestamp: Date;        // When the message was created
  isLoading?: boolean;    // Whether to show loading indicator
}
```

**Features**:
- Left-aligned message bubble
- Loading state with animated typing indicator
- Formatted timestamp display
- Support for long responses
- Special character and multiline support

**Loading State**:
- Animated three-dot indicator
- "AI is thinking..." text
- Smooth animation with CSS keyframes

**Styling**:
- White background with border
- Rounded corners with tail on left
- Dark text for readability

### SystemMessage Component

**Location**: `/web/src/components/chat/SystemMessage.tsx`

**Purpose**: Displays system notifications, status updates, and error messages.

**Props**:
```typescript
interface SystemMessageProps {
  message: string;                    // The system message text
  type?: 'success' | 'error' | 'info';  // Message type for styling
}
```

**Features**:
- Center-aligned message
- Color-coded by message type
- No timestamp (system messages are immediate)
- Support for long messages
- Special character and multiline support

**Message Types**:
- **Success**: Green background, for positive confirmations
- **Error**: Red background, for error messages
- **Info**: Blue background, for general information (default)

**Styling**:
- Centered alignment
- Color-coded backgrounds based on type
- Smaller font size than user/assistant messages
- Rounded corners

## CSS Classes

### Layout Classes
- `.chat-container` - Main chat container
- `.chat-header` - Header section
- `.message-container` - Scrollable message area
- `.input-area` - Fixed input section at bottom

### Message Classes
- `.message` - Base message styling
- `.user-message` - User message specific styling
- `.assistant-message` - Assistant message specific styling
- `.system-message` - System message specific styling
- `.message-content` - Message text content
- `.message-timestamp` - Timestamp styling

### State Classes
- `.typing-indicator` - Loading state container
- `.typing-dots` - Animated dots container
- `.empty-state` - Empty message list state

### Responsive Classes
- `.mobile-responsive` - Mobile-specific styling
- `.scrollable` - Scrollable container

## Usage Examples

### Basic Chat Page
```tsx
import ChatPage from '@/app/chat/page';

export default function App() {
  return <ChatPage />;
}
```

### Custom Message List
```tsx
import { MessageList, Message } from '@/components/chat/MessageList';

const messages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'What is the main topic?',
    timestamp: new Date()
  },
  {
    id: '2',
    type: 'assistant',
    content: 'The main topic is artificial intelligence.',
    timestamp: new Date()
  }
];

function MyChat() {
  return (
    <MessageList 
      messages={messages}
      isLoading={false}
      scrollToBottom={() => {}}
    />
  );
}
```

### Individual Message Components
```tsx
import { UserMessage } from '@/components/chat/UserMessage';
import { AssistantMessage } from '@/components/chat/AssistantMessage';
import { SystemMessage } from '@/components/chat/SystemMessage';

function MessageExamples() {
  return (
    <div>
      <UserMessage 
        message="Hello, how are you?"
        timestamp={new Date()}
      />
      
      <AssistantMessage 
        message="I'm doing well, thank you!"
        timestamp={new Date()}
        isLoading={false}
      />
      
      <SystemMessage 
        message="Indexing completed successfully"
        type="success"
      />
    </div>
  );
}
```

## Testing

All components include comprehensive test suites with:
- Rendering tests
- Props validation
- User interaction tests
- Accessibility tests
- Responsive behavior tests
- Edge case handling

Run tests with:
```bash
npm test
```

## Accessibility

All components are built with accessibility in mind:
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management
