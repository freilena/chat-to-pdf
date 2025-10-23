# Component API Documentation

## Chat Components

This document provides detailed API documentation for all chat-related components implemented in Prompts 6, 7, 8, 9, and 10.

### ChatPage Component

**Location**: `/web/src/app/chat/page.tsx`

**Purpose**: Main chat interface providing the complete chat experience.

**Props**: None (uses hooks internally)

**Features**:
- Responsive layout (mobile and desktop)
- Authentication protection
- Auto-scroll to bottom
- Session management integration
- Conversation history management
- Clear conversation functionality
- Conversation length indicator

**Dependencies**:
- `useSession` hook for authentication
- `useChat` hook for chat state management
- `useIndexingStatus` hook for indexing status polling
- `MessageList` component for message display
- `ChatInput` component for user input
- `IndexingStatus` component for indexing progress

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

### ChatInput Component

**Location**: `/web/src/components/chat/ChatInput.tsx`

**Purpose**: Provides input field and send button for user messages with auto-resize and keyboard shortcuts.

**Props**:
```typescript
interface ChatInputProps {
  value: string;                    // Current input value
  onChange: (value: string) => void; // Callback for input changes
  onSubmit: (message: string) => void; // Callback for message submission
  disabled?: boolean;               // Whether input is disabled
  isLoading?: boolean;              // Whether to show loading state
}
```

**Features**:
- Multi-line textarea with auto-resize
- Send button (disabled when empty or loading)
- Enter key to submit (Shift+Enter for new line)
- Loading state with "Sending..." text
- Disabled state during indexing or loading
- Proper accessibility attributes

**Keyboard Shortcuts**:
- `Enter`: Submit message
- `Shift+Enter`: Create new line
- `Tab`: Navigate to send button

**Styling**:
- Auto-resizing textarea (min 40px height)
- Disabled state with grayed out appearance
- Loading state with disabled button

### IndexingStatus Component

**Location**: `/web/src/components/chat/IndexingStatus.tsx`

**Purpose**: Displays indexing progress with progress bar and status messages.

**Props**:
```typescript
interface IndexingStatusProps {
  status: IndexingStatusType;       // Current indexing status
  progress: number;                 // Progress percentage (0-100)
}

interface IndexingStatusType {
  status: 'indexing' | 'done' | 'error';
  total_files: number;
  files_indexed: number;
  error?: string;
}
```

**Features**:
- Progress bar with percentage display
- File count display ("Processing X of Y files...")
- Error state with helpful message
- Accessibility announcements (aria-live)
- Auto-hides when indexing is complete

**States**:
- **Indexing**: Shows progress bar and file counts
- **Done**: Component returns null (hidden)
- **Error**: Shows error message with warning icon

**Styling**:
- Progress bar with smooth animation
- Color-coded status (blue for indexing, red for error)
- Responsive design for mobile

### useIndexingStatus Hook

**Location**: `/web/src/hooks/useIndexingStatus.ts`

**Purpose**: Manages indexing status polling and state for the chat interface.

**Parameters**:
```typescript
useIndexingStatus(sessionId: string | null)
```

**Returns**:
```typescript
interface UseIndexingStatusReturn {
  status: IndexingStatusType | null;  // Current status data
  isLoading: boolean;                // Whether currently fetching
  isIndexing: boolean;               // Whether indexing is in progress
  isComplete: boolean;               // Whether indexing is complete
  hasError: boolean;                 // Whether there's an error
  progress: number;                  // Progress percentage (0-100)
  error: string | null;              // Error message if any
  refetch: () => Promise<void>;      // Manual refetch function
}
```

**Features**:
- Polls `/api/index/status` every 2 seconds during indexing
- Stops polling when indexing completes or errors
- Handles network errors gracefully
- Calculates progress percentage
- Provides manual refetch capability

**Polling Behavior**:
- Starts polling when sessionId is provided
- Polls every 2 seconds while status is 'indexing'
- Stops polling when status is 'done' or 'error'
- Handles 404 errors (session not found)
- Handles network errors with retry

### useChat Hook

**Location**: `/web/src/hooks/useChat.ts`

**Purpose**: Manages chat state including messages, input, and submission logic.

**Returns**:
```typescript
interface UseChatReturn {
  messages: Message[];               // Array of chat messages
  setMessages: (messages: Message[]) => void; // Set messages (for testing)
  inputValue: string;                // Current input value
  setInputValue: (value: string) => void; // Set input value
  isLoading: boolean;               // Whether submitting message
  handleSubmit: () => Promise<void>; // Submit current input
  clearMessages: () => void;         // Clear all messages
  conversationLength: number;        // Number of messages in conversation
}
```

**Features**:
- Optimistic UI (adds user message immediately)
- Handles API errors gracefully
- Preserves input text on submission failure
- Generates unique message IDs
- Manages loading states
- Prevents multiple simultaneous submissions
- Conversation history management
- Context passing to backend API
- Conversation length tracking

**Message Flow**:
1. User types message
2. User submits (Enter or button click)
3. User message added immediately to chat
4. Input cleared and loading state set
5. Conversation history converted to API format
6. API call made to `/api/query` with context
7. Assistant response added to chat
8. Loading state cleared

**Conversation History**:
- Maintains last 10 messages (5 conversation turns)
- Filters out system messages from context
- Truncates long assistant responses in context
- Passes context to backend for improved responses

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
- `.indexing-status` - Indexing status container
- `.indexing-content` - Indexing status content
- `.indexing-progress` - Progress bar container
- `.progress-bar` - Progress bar background
- `.progress-fill` - Progress bar fill
- `.indexing-message` - Indexing disabled message

### Conversation Control Classes
- `.conversation-controls` - Container for conversation controls
- `.conversation-length` - Message count indicator
- `.clear-conversation-btn` - Clear conversation button

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
import { ChatInput } from '@/components/chat/ChatInput';
import { IndexingStatus } from '@/components/chat/IndexingStatus';

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
      
      <IndexingStatus 
        status={{
          status: 'indexing',
          total_files: 3,
          files_indexed: 1
        }}
        progress={33}
      />
      
      <ChatInput
        value=""
        onChange={(value) => console.log(value)}
        onSubmit={(message) => console.log(message)}
        disabled={false}
        isLoading={false}
      />
    </div>
  );
}
```

### Using Hooks
```tsx
import { useChat } from '@/hooks/useChat';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';
import { useSession } from '@/hooks/useSession';

function ChatWithHooks() {
  const { sessionId } = useSession();
  const { status, isIndexing, progress } = useIndexingStatus(sessionId);
  const { messages, inputValue, setInputValue, isLoading, handleSubmit } = useChat();

  return (
    <div>
      {status && <IndexingStatus status={status} progress={progress} />}
      
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={isLoading || isIndexing}
        isLoading={isLoading}
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
- Hook behavior testing
- Polling logic testing

**Test Coverage**:
- ChatInput: 13 tests
- IndexingStatus: 8 tests  
- useIndexingStatus: 2 tests
- useChat: 13 tests
- Total: 127 frontend tests passing

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
