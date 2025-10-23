# Chat Page Layout & Message Components

## Overview
Implements the complete chat interface for the Chat to Your PDF application, providing a responsive layout for displaying conversation history between users and the AI assistant, with indexing status integration and message submission capabilities.

## Components

### ChatPage (`/web/src/app/chat/page.tsx`)
Main chat interface with:
- Header with session info and sign-out button
- Scrollable message container with indexing status
- Fixed input area at bottom with disabled state during indexing
- Mobile-responsive design
- Integration with indexing status polling

### Message Components

#### UserMessage
- Displays user questions
- Right-aligned with blue background
- Shows timestamp

#### AssistantMessage  
- Displays AI responses
- Left-aligned with white background
- Supports loading state with typing indicator
- Shows timestamp

#### SystemMessage
- System notifications (success, error, info)
- Center-aligned with colored backgrounds
- No timestamp

#### MessageList
- Container for all messages
- Auto-scroll to bottom on new messages
- Handles empty state
- Supports loading indicators

#### ChatInput
- Multi-line textarea with auto-resize
- Send button with disabled states
- Keyboard shortcuts (Enter to submit, Shift+Enter for new line)
- Loading state during message submission
- Disabled during indexing

#### IndexingStatus
- Progress bar with percentage display
- File count display ("Processing X of Y files...")
- Error state with helpful messages
- Auto-hides when indexing completes
- Accessibility announcements

### Hooks

#### useChat
- Manages chat state and message history
- Handles message submission with optimistic UI
- Error handling and loading states
- Prevents multiple simultaneous submissions

#### useIndexingStatus
- Polls indexing status every 2 seconds
- Calculates progress percentage
- Handles network errors gracefully
- Stops polling when indexing completes

## Features

- **Responsive Design**: Mobile-first approach with breakpoints
- **Auto-scroll**: Automatically scrolls to bottom on new messages
- **Loading States**: Typing indicators for pending responses
- **Indexing Integration**: Real-time indexing status with progress bar
- **Input Management**: Auto-resize textarea with keyboard shortcuts
- **Optimistic UI**: Immediate user message display
- **Error Handling**: Graceful error recovery with user feedback
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast
- **Dark Mode**: Supports both light and dark themes
- **Empty State**: Shows helpful message when no conversations exist
- **Polling Logic**: Automatic status updates every 2 seconds

## Styling

- CSS variables for consistent theming
- Smooth animations for typing indicators
- Mobile-optimized touch targets
- Proper focus management for keyboard navigation

## Testing

- Complete test suite with 127 passing tests
- TDD approach with tests written first
- Covers all components and functionality
- Tests responsive behavior and accessibility
- Hook behavior and polling logic testing
- Error handling and edge case coverage

## Files Created

```
web/src/app/chat/page.tsx
web/src/components/chat/UserMessage.tsx
web/src/components/chat/AssistantMessage.tsx
web/src/components/chat/SystemMessage.tsx
web/src/components/chat/MessageList.tsx
web/src/components/chat/ChatInput.tsx
web/src/components/chat/IndexingStatus.tsx
web/src/hooks/useSession.ts
web/src/hooks/useChat.ts
web/src/hooks/useIndexingStatus.ts
+ corresponding test files
```

## Integration

- Uses `useSession` hook for authentication
- Integrates with `useChat` hook for message management
- Uses `useIndexingStatus` hook for real-time status updates
- Connects to `/api/query` endpoint for message submission
- Polls `/api/index/status` endpoint for indexing progress
- Ready for backend API integration
- Prepared for Ollama LLM integration
