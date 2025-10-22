# Chat Page Layout & Message Components

## Overview
Implements the chat interface for the Chat to Your PDF application, providing a responsive layout for displaying conversation history between users and the AI assistant.

## Components

### ChatPage (`/web/src/app/chat/page.tsx`)
Main chat interface with:
- Header with session info and sign-out button
- Scrollable message container
- Fixed input area at bottom
- Mobile-responsive design

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

## Features

- **Responsive Design**: Mobile-first approach with breakpoints
- **Auto-scroll**: Automatically scrolls to bottom on new messages
- **Loading States**: Typing indicators for pending responses
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast
- **Dark Mode**: Supports both light and dark themes
- **Empty State**: Shows helpful message when no conversations exist

## Styling

- CSS variables for consistent theming
- Smooth animations for typing indicators
- Mobile-optimized touch targets
- Proper focus management for keyboard navigation

## Testing

- Complete test suite with 28 passing tests
- TDD approach with tests written first
- Covers all components and functionality
- Tests responsive behavior and accessibility

## Files Created

```
web/src/app/chat/page.tsx
web/src/components/chat/UserMessage.tsx
web/src/components/chat/AssistantMessage.tsx
web/src/components/chat/SystemMessage.tsx
web/src/components/chat/MessageList.tsx
web/src/hooks/useSession.ts
+ corresponding test files
```

## Integration

- Uses mock `useSession` hook (to be replaced with real auth)
- Ready for integration with chat input and message submission
- Prepared for backend API integration
