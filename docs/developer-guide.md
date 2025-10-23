# Developer Guide - Chat Components

## Overview

This guide provides developers with practical information for working with the chat components implemented in Prompts 6, 7, and 8. It covers development setup, common patterns, and best practices.

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript knowledge
- React/Next.js experience

### Getting Started

1. **Install Dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Run Linting**
   ```bash
   npm run lint
   ```

## Project Structure

```
web/src/
├── app/
│   └── chat/
│       ├── page.tsx          # Main chat page
│       └── page.test.tsx     # Chat page tests
├── components/
│   └── chat/
│       ├── MessageList.tsx       # Message container
│       ├── MessageList.test.tsx  # MessageList tests
│       ├── UserMessage.tsx       # User message component
│       ├── UserMessage.test.tsx  # UserMessage tests
│       ├── AssistantMessage.tsx  # Assistant message component
│       ├── AssistantMessage.test.tsx # AssistantMessage tests
│       ├── SystemMessage.tsx     # System message component
│       ├── SystemMessage.test.tsx # SystemMessage tests
│       ├── ChatInput.tsx         # Chat input component
│       ├── ChatInput.test.tsx    # ChatInput tests
│       ├── IndexingStatus.tsx    # Indexing status component
│       └── IndexingStatus.test.tsx # IndexingStatus tests
├── hooks/
│   ├── useSession.ts         # Session management hook
│   ├── useChat.ts            # Chat state management hook
│   └── useIndexingStatus.ts  # Indexing status polling hook
└── app/
    └── globals.css           # Global styles including chat styles
```

## Component Development Patterns

### 1. Message Component Pattern

All message components follow a consistent pattern:

```typescript
interface ComponentProps {
  message: string;
  timestamp?: Date;
  // Additional props specific to component
}

export function Component({ message, timestamp, ...props }: ComponentProps) {
  // Component logic
  return (
    <div data-testid="component-name" className="component-class">
      {/* Component JSX */}
    </div>
  );
}
```

**Key Principles**:
- Always include `data-testid` for testing
- Use semantic class names
- Handle edge cases gracefully
- Support accessibility features

### 2. Testing Pattern

Each component includes comprehensive tests:

```typescript
describe('ComponentName', () => {
  it('renders with correct content', () => {
    // Test basic rendering
  });
  
  it('has correct styling classes', () => {
    // Test CSS classes
  });
  
  it('handles edge cases gracefully', () => {
    // Test error handling
  });
  
  it('has proper accessibility attributes', () => {
    // Test accessibility
  });
});
```

### 3. Styling Pattern

CSS follows a consistent naming convention:

```css
.component-name {
  /* Base styles */
}

.component-name.modifier {
  /* Modifier styles */
}

.component-name__element {
  /* Element styles */
}

@media (max-width: 768px) {
  .component-name {
    /* Mobile styles */
  }
}
```

## Common Development Tasks

### Adding a New Message Type

1. **Create Component**
   ```typescript
   // components/chat/NewMessageType.tsx
   interface NewMessageTypeProps {
     message: string;
     customProp?: string;
   }
   
   export function NewMessageType({ message, customProp }: NewMessageTypeProps) {
     return (
       <div data-testid="new-message-type" className="new-message-type message">
         <div className="message-content">{message}</div>
         {customProp && <div className="custom-element">{customProp}</div>}
       </div>
     );
   }
   ```

2. **Add to MessageList**
   ```typescript
   // In MessageList.tsx
   case 'newType':
     return (
       <NewMessageType
         key={message.id}
         message={message.content}
         customProp={message.customProp}
       />
     );
   ```

3. **Update Message Interface**
   ```typescript
   interface Message {
     id: string;
     type: 'user' | 'assistant' | 'system' | 'newType';
     content: string;
     timestamp: Date;
     customProp?: string; // Add custom properties
   }
   ```

4. **Add Tests**
   ```typescript
   // NewMessageType.test.tsx
   describe('NewMessageType', () => {
     it('renders with correct content', () => {
       render(<NewMessageType message="Test" customProp="value" />);
       expect(screen.getByText('Test')).toBeInTheDocument();
     });
   });
   ```

### Modifying Message Styling

1. **Update CSS Variables** (in `globals.css`)
   ```css
   :root {
     --new-message-bg: #your-color;
     --new-message-text: #your-color;
   }
   ```

2. **Add Component Styles**
   ```css
   .new-message-type {
     background: var(--new-message-bg);
     color: var(--new-message-text);
     /* Additional styles */
   }
   ```

3. **Test Responsive Behavior**
   ```css
   @media (max-width: 768px) {
     .new-message-type {
       /* Mobile-specific styles */
     }
   }
   ```

### Adding New Features

1. **Update Props Interface**
   ```typescript
   interface ComponentProps {
     // Existing props
     newFeature?: boolean;
   }
   ```

2. **Implement Feature Logic**
   ```typescript
   export function Component({ newFeature, ...props }: ComponentProps) {
     return (
       <div>
         {/* Existing JSX */}
         {newFeature && <div>New feature content</div>}
       </div>
     );
   }
   ```

3. **Add Tests**
   ```typescript
   it('shows new feature when enabled', () => {
     render(<Component newFeature={true} />);
     expect(screen.getByText('New feature content')).toBeInTheDocument();
   });
   ```

## Best Practices

### 1. Component Design
- **Single Responsibility**: Each component should have one clear purpose
- **Composition**: Build complex UIs by composing simple components
- **Props Interface**: Always define clear TypeScript interfaces
- **Default Props**: Provide sensible defaults for optional props

### 2. Testing
- **Test Behavior**: Focus on what the component does, not implementation details
- **Edge Cases**: Test empty states, error conditions, and boundary values
- **Accessibility**: Always test keyboard navigation and screen reader compatibility
- **Responsive**: Test on different screen sizes

### 3. Styling
- **CSS Variables**: Use CSS custom properties for theming
- **Mobile First**: Design for mobile, then enhance for desktop
- **Consistent Naming**: Follow BEM or similar naming convention
- **Performance**: Avoid expensive CSS operations

### 4. Performance
- **Memoization**: Use `React.memo` for expensive components
- **Lazy Loading**: Consider code splitting for large components
- **Bundle Size**: Keep component dependencies minimal
- **Re-renders**: Minimize unnecessary re-renders

## Debugging

### Common Issues

1. **Messages Not Scrolling**
   - Check `scrollToBottom` prop is passed correctly
   - Verify `useEffect` dependencies
   - Check CSS `overflow` properties

2. **Styling Issues**
   - Check CSS class names match exactly
   - Verify CSS variables are defined
   - Check for CSS specificity conflicts

3. **Test Failures**
   - Check `data-testid` attributes match
   - Verify component props are correct
   - Check for timing issues in async tests

### Debug Tools

1. **React Developer Tools**
   - Inspect component props and state
   - Profile performance
   - Debug re-renders

2. **Browser DevTools**
   - Inspect CSS styles
   - Test responsive behavior
   - Check accessibility

3. **Testing Tools**
   - Use `screen.debug()` in tests
   - Check test coverage reports
   - Use `--verbose` flag for detailed output

## Integration

### With Backend APIs
```typescript
// Example: Fetching messages from API
const [messages, setMessages] = useState<Message[]>([]);

useEffect(() => {
  fetchMessages().then(setMessages);
}, []);

const sendMessage = async (content: string) => {
  const newMessage: Message = {
    id: generateId(),
    type: 'user',
    content,
    timestamp: new Date()
  };
  
  setMessages(prev => [...prev, newMessage]);
  
  // Send to backend
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: content })
  });
  
  const assistantMessage = await response.json();
  setMessages(prev => [...prev, assistantMessage]);
};
```

### With State Management
```typescript
// Example: Using Redux/Zustand
const { messages, addMessage } = useChatStore();

const handleSendMessage = (content: string) => {
  addMessage({
    id: generateId(),
    type: 'user',
    content,
    timestamp: new Date()
  });
};
```

## Deployment

### Build Process
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Chat to Your PDF
```

### Docker
```dockerfile
# Dockerfile.web
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

### Code Style
- Follow existing patterns and conventions
- Use TypeScript strict mode
- Write tests for new features
- Update documentation

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Run full test suite
5. Submit PR with clear description

### Review Checklist
- [ ] Code follows project patterns
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] Accessibility is maintained
- [ ] Performance is acceptable
- [ ] Mobile responsive
