## Implementation Prompts

Each prompt below is designed to be given to a code-generation LLM in sequence. Each builds on previous work and should be implemented in a test-driven manner.

---

### **Prompt 6: Chat Page Layout & Message Components** ✅ COMPLETED

```
Create the chat interface layout and message components for displaying conversation history.

Current state:
- Authentication and session management are complete
- Upload and indexing UI exists
- No chat interface exists yet

Task:
1. Create a new chat page at `/web/src/app/chat/page.tsx`
2. Implement chat layout with:
   - Header showing session info and sign-out button
   - Message container (scrollable area)
   - Fixed input area at bottom
   - Responsive design (mobile and desktop)
3. Create message components:
   - UserMessage component (user's questions)
   - AssistantMessage component (AI responses)
   - SystemMessage component (indexing status, errors)
4. Implement message list with:
   - Auto-scroll to bottom on new messages
   - Proper spacing and visual hierarchy
   - Loading indicators for pending responses
5. Write tests for:
   - Chat page renders correctly
   - Message components render with correct content
   - Messages display in correct order
   - Auto-scroll behavior works
   - Loading states display correctly

Requirements:
- Clean, modern UI design
- Accessible color contrast (WCAG 2.1 AA)
- Smooth scrolling animation
- Empty state when no messages exist
- Keyboard navigation support

Test-Driven Approach:
- Write tests for chat page structure
- Write tests for each message component
- Test auto-scroll functionality
- Test empty state rendering
- Implement components to pass tests

Files to create/modify:
- `/web/src/app/chat/page.tsx` (Chat page)
- `/web/src/components/chat/UserMessage.tsx` (User message)
- `/web/src/components/chat/AssistantMessage.tsx` (Assistant message)
- `/web/src/components/chat/SystemMessage.tsx` (System message)
- `/web/src/components/chat/MessageList.tsx` (Message container)
- `/web/src/app/chat/page.test.tsx` (Page tests)
- `/web/src/components/chat/UserMessage.test.tsx` (Component tests)
- `/web/src/components/chat/AssistantMessage.test.tsx` (Component tests)

Integration:
- Link to chat page from upload page after successful indexing
- Ensure chat page is protected (requires authentication)
- Verify responsive behavior on mobile devices
```

---

### **Prompt 7: Chat Input & Message Submission**

```
Implement the chat input field and message submission logic, connecting the UI to the backend query endpoint.

Current state:
- Chat page layout is complete
- Message components exist
- No input handling or submission logic

Task:
1. Create ChatInput component with:
   - Multi-line textarea with auto-resize
   - Send button (disabled when empty)
   - Character limit indicator (optional)
   - Enter key to submit (Shift+Enter for new line)
2. Implement message submission logic:
   - Add user message to chat history immediately (optimistic UI)
   - Send POST request to `/fastapi/query`
   - Show loading indicator in chat
   - Handle submission errors
3. Create chat state management:
   - Store messages in React state
   - Track loading state
   - Track input value
4. Write tests for:
   - Chat input renders and accepts text
   - Send button is disabled when input is empty
   - Enter key submits message
   - Shift+Enter creates new line
   - User message appears immediately in chat
   - Loading state is shown during submission
   - Error handling for failed submissions

Requirements:
- Disable input during message submission
- Clear input after successful submission
- Show error message if submission fails
- Preserve input text if submission fails
- Accessible form with proper labels

Test-Driven Approach:
- Write tests for input component behavior
- Write tests for message submission flow
- Test keyboard shortcuts
- Test error scenarios
- Implement chat input to pass tests

Files to create/modify:
- `/web/src/components/chat/ChatInput.tsx` (Input component)
- `/web/src/hooks/useChat.ts` (Chat state management hook)
- `/web/src/lib/api/query.ts` (Query API client)
- `/web/src/components/chat/ChatInput.test.tsx` (Input tests)
- `/web/src/hooks/useChat.test.ts` (Hook tests)

Integration:
- Add ChatInput component to chat page
- Connect to useChat hook for state management
- Verify messages are sent to backend correctly
- Test that loading states work properly
```

---

### **Prompt 8: Indexing Status Integration in Chat** ✅ COMPLETED

```
Display indexing status in the chat interface and disable input until indexing is complete.

Current state:
- Chat input and message submission work
- Indexing status endpoint exists (GET /fastapi/index/status)
- No indexing status display in chat

Task:
1. Poll indexing status when chat page loads
2. Display indexing progress in chat:
   - Show "Indexing X/Y files" system message
   - Show progress bar with percentage
   - Show estimated time remaining (if available)
3. Disable chat input during indexing:
   - Gray out textarea and button
   - Show disabled state message
   - Display "Chat will be enabled once indexing completes"
4. Enable chat input when indexing completes:
   - Remove indexing message
   - Enable input field
   - Auto-focus input for better UX
5. Write tests for:
   - Indexing status is fetched on page load
   - Progress message displays correctly
   - Chat input is disabled during indexing
   - Chat input is enabled after indexing completes
   - Polling stops when indexing is complete
   - Error handling for status check failures

Requirements:
- Poll status every 2 seconds during indexing
- Stop polling once indexing completes
- Handle case where no files are uploaded
- Show clear visual feedback for disabled state
- Accessible status announcements (aria-live)

Test-Driven Approach:
- Write tests for status polling logic
- Test input disabled state during indexing
- Test input enabled state after indexing
- Test status message rendering
- Implement indexing integration to pass tests

Files to create/modify:
- `/web/src/hooks/useIndexingStatus.ts` (Status polling hook)
- `/web/src/components/chat/IndexingStatus.tsx` (Status component)
- `/web/src/app/chat/page.tsx` (Integrate status)
- `/web/src/hooks/useIndexingStatus.test.ts` (Hook tests)
- `/web/src/components/chat/IndexingStatus.test.tsx` (Component tests)

Integration:
- Add IndexingStatus component to chat page
- Connect to useIndexingStatus hook
- Update ChatInput to accept disabled prop
- Test complete flow: upload → navigate to chat → see indexing → chat enables
```

---

### **Prompt 9: Query Response Display** ✅ COMPLETED

```
Handle and display query responses from the FastAPI backend in the chat interface.

Current state:
- Chat input submits queries to backend
- Backend returns responses (structure from spec)
- Responses are displayed with enhanced handling

Task:
1. ✅ Update query API client to handle response structure:
   - Parse response JSON
   - Extract answer text and citations
   - Handle error responses
2. ✅ Display assistant responses in chat:
   - Add assistant message after query completes
   - Show answer text with 150-word truncation
   - Handle loading-to-response transition
3. ✅ Handle special responses:
   - "Not found in your files." (no sources case) with special styling
   - Timeout errors with specific messages
   - Query processing errors with appropriate feedback
4. ✅ Update loading states:
   - Show typing indicator while waiting
   - Replace with response when received
   - Show error state if query fails
5. ✅ Write tests for:
   - Query response is parsed correctly
   - Assistant message displays response text
   - Loading indicator is replaced by response
   - "Not found" messages display correctly
   - Error messages display correctly
   - Response character limit (150 words) is respected

Requirements:
- ✅ Clear visual distinction between user and assistant messages
- ✅ Smooth transition from loading to response
- ✅ Error recovery (allow retry on failure)
- ✅ Preserve conversation history across queries

Test-Driven Approach:
- ✅ Write tests for response parsing
- ✅ Test assistant message rendering
- ✅ Test loading-to-response transition
- ✅ Test error handling
- ✅ Implement response display to pass tests

Files to modify:
- ✅ `/web/src/lib/api/query.ts` (Response parsing)
- ✅ `/web/src/components/chat/AssistantMessage.tsx` (Response display)
- ✅ `/web/src/hooks/useChat.ts` (Response handling)
- ✅ `/web/src/lib/api/query.test.ts` (Parsing tests)
- ✅ `/web/src/hooks/useChat.test.ts` (Response handling tests)

Integration:
- ✅ Verify end-to-end query flow: input → submit → loading → response
- ✅ Test with various response types
- Confirm error messages are user-friendly
```

---

### **Prompt 10: Conversation History & Context**

```
Implement conversation history management and context passing for follow-up questions.

Current state:
- Individual queries work
- Responses are displayed
- No conversation context is maintained across queries

Task:
1. Enhance chat state to maintain full conversation history:
   - Store all messages (user and assistant) with timestamps
   - Persist history in React state
   - Clear history on sign-out or new session
2. Update query submission to include conversation context:
   - Send last N messages with each query (e.g., last 5 turns)
   - Format context for backend consumption
   - Trim context if too large
3. Update FastAPI query endpoint to handle conversation context:
   - Accept optional conversation history in request
   - Include context in LLM prompt (prepared for Ollama integration)
   - Test context improves follow-up question handling
4. Add conversation controls:
   - "Clear conversation" button
   - Confirmation dialog before clearing
   - Visual indication of conversation length
5. Write tests for:
   - Conversation history is stored correctly
   - Context is included in subsequent queries
   - Context is properly formatted
   - Clear conversation works
   - History persists during session
   - History is cleared on sign-out

Requirements:
- Limit context to last 5 conversation turns (10 messages)
- Trim very long messages in context to stay within token limits
- Handle empty conversation (first message)
- Context should improve answer quality for follow-ups

Test-Driven Approach:
- Write tests for conversation history storage
- Test context formatting and trimming
- Test clear conversation functionality
- Test context is sent to backend
- Implement conversation history to pass tests

Files to modify:
- `/web/src/hooks/useChat.ts` (History management)
- `/web/src/lib/api/query.ts` (Add context parameter)
- `/api/app/api/routes/query.py` (Accept context)
- `/api/app/core/query_processor.py` (Use context in prompt)
- `/web/src/components/chat/ChatHeader.tsx` (Clear button)
- `/web/src/hooks/useChat.test.ts` (History tests)
- `/api/tests/test_query.py` (Context tests)

Integration:
- Test follow-up questions use conversation history
- Verify context improves answer relevance
- Confirm clear conversation resets state correctly
```

---

### **Prompt 11: Ollama Service Setup & Health Check**

```
Set up the Ollama service with Llama 3.1 8B Instruct model and implement health checking.

Current state:
- Docker Compose includes Ollama container (or needs to be added)
- No model is pulled or verified
- No health checking exists

Task:
1. Update docker-compose.yml to include Ollama service:
   - Use official Ollama image
   - Configure CPU-only mode
   - Mount volume for model storage
   - Set appropriate memory limits (8GB+)
2. Create initialization script to pull Llama 3.1 8B model:
   - Pull model on first startup
   - Verify model is available
   - Log model info
3. Implement Ollama health check endpoint:
   - GET /api/ollama/health
   - Check Ollama service is responsive
   - Verify model is loaded
   - Return model status and metadata
4. Create Ollama client wrapper in FastAPI:
   - Connection management
   - Health checking
   - Timeout configuration
   - Error handling
5. Write tests for:
   - Ollama container starts successfully
   - Model is pulled and available
   - Health endpoint returns correct status
   - Ollama client can connect
   - Error handling for unavailable service

Requirements:
- Ollama must be ready before accepting queries
- Health check should be fast (<500ms)
- Clear error messages if Ollama is unavailable
- Automatic retry on temporary failures

Test-Driven Approach:
- Write tests for Ollama client initialization
- Test health check functionality
- Test error handling for unavailable service
- Implement Ollama setup to pass tests

Files to create/modify:
- `/docker-compose.yml` (Add Ollama service)
- `/api/scripts/init_ollama.sh` (Model initialization)
- `/api/app/core/ollama_client.py` (Ollama client)
- `/api/app/api/routes/health.py` (Health endpoint)
- `/api/tests/test_ollama_client.py` (Client tests)
- `/api/tests/test_health.py` (Health endpoint tests)

Integration:
- Start Ollama service with docker-compose up
- Verify model pulls successfully
- Test health endpoint returns success
- Confirm Ollama is accessible from FastAPI
```

---

### **Prompt 12: Prompt Template & Grounding Logic**

```
Create the prompt template for Llama 3.1 8B Instruct that ensures grounded, concise answers with citations.

Current state:
- Ollama service is running with Llama 3.1 8B
- Query endpoint retrieves relevant snippets
- No LLM generation is connected yet

Task:
1. Create prompt template for grounded Q&A:
   - System prompt emphasizing grounding and citations
   - Format for including retrieved snippets
   - Format for including conversation context
   - Instructions for 150-word limit
   - Instructions for citation markers [1]–[3]
2. Implement prompt builder function:
   - Takes question, snippets, and context
   - Constructs full prompt
   - Handles edge cases (no snippets, very long snippets)
   - Logs prompt for debugging
3. Implement "Not found" logic:
   - Check if retrieved snippets are relevant
   - Return "Not found in your files." if confidence is low
   - Use retrieval scores for decision
4. Write tests for:
   - Prompt template includes all required elements
   - Snippets are formatted correctly in prompt
   - Conversation context is included properly
   - "Not found" logic triggers when appropriate
   - Prompt stays within token limits
   - System instructions are clear and effective

Requirements:
- Prompt must enforce strict grounding (no hallucination)
- Prompt must request inline citation markers
- Prompt must enforce 150-word response limit
- Handle cases with 0, 1, 2, or 3+ snippets
- Trim snippets if they exceed token budget

Test-Driven Approach:
- Write tests for prompt builder with various inputs
- Test "Not found" decision logic
- Test token limit enforcement
- Test snippet formatting
- Implement prompt template to pass tests

Files to create/modify:
- `/api/app/core/prompt_builder.py` (Prompt template)
- `/api/app/core/grounding.py` (Grounding logic)
- `/api/tests/test_prompt_builder.py` (Prompt tests)
- `/api/tests/test_grounding.py` (Grounding tests)

Integration:
- Prepare prompt builder for use in query endpoint
- Test with sample questions and snippets
- Verify prompt format is compatible with Llama 3.1 8B
```

---

### **Prompt 13: Ollama Integration in Query Endpoint**

```
Connect the Ollama LLM service to the query endpoint to generate grounded answers.

Current state:
- Ollama service is running and healthy
- Prompt template is ready
- Query endpoint retrieves snippets but doesn't generate answers

Task:
1. Update query endpoint to generate answers with Ollama:
   - Build prompt from question, snippets, and context
   - Call Ollama API to generate response
   - Handle streaming or non-streaming responses
   - Parse LLM output
   - Extract answer text
2. Implement timeout and fallback logic:
   - Set 10-second timeout for generation
   - Return timeout error if exceeded
   - Log generation time for monitoring
   - Retry once on transient failures
3. Handle LLM errors gracefully:
   - Invalid responses
   - Empty responses
   - Malformed citations
   - Timeout scenarios
4. Write tests for:
   - Query endpoint calls Ollama correctly
   - Prompt is constructed properly
   - Answer is extracted from LLM response
   - Timeout errors are handled
   - Retry logic works
   - Generated answers respect 150-word limit
   - "Not found" responses when appropriate

Requirements:
- Answer generation must complete within 10 seconds
- Responses must be grounded in retrieved snippets
- Handle both successful and failed generations
- Log all LLM interactions for debugging

Test-Driven Approach:
- Write tests mocking Ollama API responses
- Test successful answer generation
- Test timeout handling
- Test error scenarios
- Implement Ollama integration to pass tests

Files to modify:
- `/api/app/api/routes/query.py` (Add Ollama call)
- `/api/app/core/query_processor.py` (Answer generation)
- `/api/app/core/ollama_client.py` (Generation method)
- `/api/tests/test_query.py` (Query endpoint tests)
- `/api/tests/test_query_processor.py` (Generation tests)

Integration:
- Test end-to-end query with answer generation
- Verify answers are grounded and concise
- Confirm timeout errors are returned properly
- Test "Not found" responses work correctly
```

---

### **Prompt 14: Citation Extraction from LLM Response**

```
Parse LLM responses to extract citation markers and match them to retrieved snippets.

Current state:
- Ollama generates answers with citation markers [1], [2], [3]
- Retrieved snippets are available
- Citations are not being extracted or structured

Task:
1. Implement citation parser:
   - Extract all citation markers [1]–[3] from answer text
   - Validate markers are within range
   - Remove duplicate markers
   - Sort markers in order
2. Match citations to retrieved snippets:
   - Map [1] to first snippet, [2] to second, etc.
   - Extract snippet metadata (file, page, sentence span)
   - Create citation objects with all required data
3. Structure citation response:
   - Include citation marker number
   - Include file name and page number
   - Include snippet text (for display)
   - Include sentence character spans (for highlighting)
   - Include unique citation ID
4. Handle edge cases:
   - LLM doesn't include citations
   - LLM includes invalid citation numbers
   - Fewer citations than snippets
   - More citation markers than available snippets
5. Write tests for:
   - Citation markers are extracted correctly
   - Markers are matched to correct snippets
   - Citation objects have all required fields
   - Invalid markers are handled gracefully
   - Citations are returned in correct order
   - Response structure matches API specification

Requirements:
- Always return 1-3 citations (spec requirement)
- Citations must match the order in answer text
- Each citation must have complete metadata
- Handle LLM non-compliance gracefully

Test-Driven Approach:
- Write tests for citation parsing with various inputs
- Test marker-to-snippet matching
- Test edge cases and error handling
- Test response structure validation
- Implement citation extraction to pass tests

Files to create/modify:
- `/api/app/core/citation_parser.py` (Citation extraction)
- `/api/app/core/query_processor.py` (Use citation parser)
- `/api/app/models/citation.py` (Citation data models)
- `/api/tests/test_citation_parser.py` (Parser tests)
- `/api/tests/test_query.py` (End-to-end citation tests)

Integration:
- Update query endpoint response to include structured citations
- Test that frontend receives citation data correctly
- Verify citation IDs are unique and stable
```

---

### **Prompt 15: Inline Citation Markers in Chat UI**

```
Parse assistant messages to render inline citation markers [1]–[3] as clickable, styled elements.

Current state:
- Assistant messages display plain text with [1], [2], [3] markers
- Citations data is available in response
- Markers are not interactive or styled

Task:
1. Create citation marker parser for message text:
   - Find all [1]–[3] patterns in text
   - Split text into segments (text + markers)
   - Preserve original text structure
2. Create CitationMarker component:
   - Render as superscript or inline badge
   - Style with distinct color and border
   - Show hover state
   - Handle click events
   - Accessible with keyboard navigation
3. Update AssistantMessage to render parsed content:
   - Split message text into segments
   - Render text segments and marker components
   - Maintain proper text flow and wrapping
4. Store citation click handler (preparation for modal):
   - Accept onCitationClick prop
   - Pass citation ID on click
   - Log citation clicks for analytics
5. Write tests for:
   - Citation markers are parsed correctly
   - Text segments are split properly
   - CitationMarker renders with correct number
   - Click handlers are called with correct citation ID
   - Keyboard navigation works (Enter/Space)
   - Hover states display correctly
   - Accessibility attributes are present

Requirements:
- Markers must be visually distinct but not distracting
- Markers must be keyboard accessible
- Original text must remain readable
- Handle messages with 0, 1, 2, or 3 markers

Test-Driven Approach:
- Write tests for marker parsing logic
- Test CitationMarker component rendering
- Test click and keyboard interactions
- Test accessibility attributes
- Implement citation markers to pass tests

Files to create/modify:
- `/web/src/utils/parseCitations.ts` (Marker parser)
- `/web/src/components/chat/CitationMarker.tsx` (Marker component)
- `/web/src/components/chat/AssistantMessage.tsx` (Update to use markers)
- `/web/src/utils/parseCitations.test.ts` (Parser tests)
- `/web/src/components/chat/CitationMarker.test.tsx` (Component tests)
- `/web/src/components/chat/AssistantMessage.test.tsx` (Integration tests)

Integration:
- Update AssistantMessage to use new marker rendering
- Verify markers appear correctly in chat
- Test click handlers are triggered
- Confirm accessibility with screen reader
```

---

### **Prompt 16: "Show Citations" Toggle Panel**

```
Implement the collapsible citations panel that displays source information below assistant messages.

Current state:
- Citation markers are clickable in messages
- Citation data is available
- No citations panel exists

Task:
1. Create CitationsPanel component:
   - Collapsible panel with show/hide toggle
   - Display up to 3 sources
   - Show file name, page number, and snippet for each
   - Number citations [1], [2], [3]
2. Create "Show citations" toggle button:
   - Button below assistant message
   - Toggle text between "Show citations" and "Hide citations"
   - Smooth expand/collapse animation
   - Icon indicating expanded/collapsed state
3. Implement panel content:
   - List of citation sources
   - Clickable citation entries
   - Clear visual hierarchy
   - Truncate long snippets with "..." if needed
4. Add accessibility attributes:
   - aria-expanded on toggle button
   - aria-controls linking button to panel
   - role="region" for panel
   - aria-label for each citation
5. Write tests for:
   - Toggle button shows/hides panel
   - Panel renders correct number of citations
   - Citation entries display correct data
   - Clicking citations (preparation for modal)
   - Accessibility attributes are correct
   - Panel state persists until toggled
   - Animation completes smoothly

Requirements:
- Panel hidden by default (per spec)
- Smooth animation (300ms)
- Citations numbered consistently with inline markers
- Clear visual design with good spacing
- Mobile responsive

Test-Driven Approach:
- Write tests for CitationsPanel component
- Test toggle functionality
- Test citation data rendering
- Test accessibility
- Implement citations panel to pass tests

Files to create/modify:
- `/web/src/components/chat/CitationsPanel.tsx` (Panel component)
- `/web/src/components/chat/AssistantMessage.tsx` (Add panel)
- `/web/src/components/chat/CitationEntry.tsx` (Individual citation)
- `/web/src/components/chat/CitationsPanel.test.tsx` (Panel tests)
- `/web/src/components/chat/CitationEntry.test.tsx` (Entry tests)

Integration:
- Add CitationsPanel to AssistantMessage component
- Pass citations data from query response
- Test panel with 1, 2, and 3 citations
- Verify panel works on mobile devices
```

---

### **Prompt 17: Citation Click Handling (Modal Preparation)**

```
Implement click handling for both inline markers and panel citations to prepare for PDF viewer modal.

Current state:
- Inline citation markers are clickable
- Citations panel entries exist
- No click handling is implemented

Task:
1. Create citation click state management:
   - Store selected citation in React state
   - Track citation ID and metadata
   - Handle clicks from both markers and panel
2. Create usePDFViewer hook:
   - Manage modal open/close state
   - Store current citation data
   - Provide openViewer and closeViewer functions
3. Connect click handlers to state:
   - Inline marker onClick calls openViewer
   - Panel citation onClick calls openViewer
   - Pass citation metadata to hook
4. Add visual feedback for clicks:
   - Active/clicked state styling
   - Focus management
   - Keyboard shortcuts (ESC to close, prepared for modal)
5. Write tests for:
   - Clicking inline marker updates state
   - Clicking panel citation updates state
   - State contains correct citation metadata
   - Multiple clicks update state correctly
   - ESC key handling (for future modal)
   - usePDFViewer hook manages state correctly

Requirements:
- Both click sources should open the same modal (future)
- State should include all data needed for PDF viewer
- Clean state management with TypeScript types
- Prepare for modal integration in next steps

Test-Driven Approach:
- Write tests for usePDFViewer hook
- Test click handlers update state correctly
- Test keyboard event handling
- Test state contains required metadata
- Implement click handling to pass tests

Files to create/modify:
- `/web/src/hooks/usePDFViewer.ts` (PDF viewer state hook)
- `/web/src/components/chat/AssistantMessage.tsx` (Connect handlers)
- `/web/src/components/chat/CitationMarker.tsx` (Add click handler)
- `/web/src/components/chat/CitationEntry.tsx` (Add click handler)
- `/web/src/hooks/usePDFViewer.test.ts` (Hook tests)
- `/web/src/components/chat/AssistantMessage.test.tsx` (Integration tests)

Integration:
- Test clicking inline markers triggers state update
- Test clicking panel citations triggers state update
- Verify state includes citation ID, file, page, span
- Log click events for debugging
```

---

### **Prompt 18: Citation Metadata Endpoint**

```
Create the FastAPI endpoint to fetch detailed citation metadata for the PDF viewer.

Current state:
- Citations include basic metadata (file, page)
- No detailed positioning data is available
- PDF viewer will need sentence character spans

Task:
1. Create citation metadata endpoint:
   - GET /fastapi/citation?id={citation_id}
   - Validate session_id
   - Fetch citation metadata from session storage
2. Return detailed citation data:
   - File name and path
   - Page number
   - Sentence character span (start, end)
   - Full paragraph text
   - Query terms for highlighting
3. Implement citation ID indexing:
   - Generate unique citation IDs during query processing
   - Store citation metadata in session storage
   - Map citation ID to full metadata
4. Handle edge cases:
   - Invalid citation ID
   - Expired session
   - Deleted files
   - Missing metadata
5. Write tests for:
   - Endpoint returns correct metadata for valid ID
   - Endpoint returns 404 for invalid ID
   - Endpoint validates session_id
   - Metadata includes all required fields
   - Query terms are extracted correctly
   - Character spans are accurate

Requirements:
- Fast response time (<100ms)
- Complete metadata for PDF viewer positioning
- Clear error messages for failures
- Secure access (session validation)

Test-Driven Approach:
- Write tests for endpoint with valid citation ID
- Test error cases (invalid ID, expired session)
- Test metadata structure and completeness
- Implement endpoint to pass tests

Files to create/modify:
- `/api/app/api/routes/citation.py` (Citation endpoint)
- `/api/app/core/citation_store.py` (Citation metadata storage)
- `/api/app/core/query_processor.py` (Store citation metadata)
- `/api/tests/test_citation.py` (Endpoint tests)
- `/api/tests/test_citation_store.py` (Storage tests)

Integration:
- Store citation metadata during query processing
- Test fetching metadata for various citations
- Verify metadata matches retrieved snippets
- Confirm character spans are correct
```

---

### **Prompt 19: PDF Viewer Modal Component & Setup**

```
Create the modal PDF viewer component with pdf.js integration and basic rendering.

Current state:
- Citation clicks are handled
- Citation metadata endpoint exists
- No PDF viewer exists

Task:
1. Install and configure pdf.js library:
   - Install pdfjs-dist package
   - Configure worker script
   - Set up TypeScript types
2. Create PDFViewerModal component:
   - Modal overlay with backdrop
   - Close button and ESC key handler
   - Focus trap (keep focus within modal)
   - PDF canvas rendering
3. Implement basic PDF rendering:
   - Load PDF file from URL
   - Render specific page
   - Scale to fit viewport
   - Handle PDF loading states
4. Add modal controls:
   - Close button (top right)
   - Loading spinner
   - Error state display
5. Write tests for:
   - Modal opens when triggered
   - Modal closes on close button click
   - Modal closes on ESC key
   - Focus is trapped within modal
   - PDF loads and renders correctly
   - Loading state displays during PDF load
   - Error state displays on load failure
   - Focus returns to trigger element on close

Requirements:
- Accessible modal (WCAG 2.1 AA)
- Focus management (trap and restore)
- Smooth open/close animations
- Handle large PDF files gracefully
- Mobile responsive

Test-Driven Approach:
- Write tests for modal open/close behavior
- Test focus trap and keyboard handling
- Test PDF loading and rendering
- Test accessibility attributes
- Implement PDF viewer to pass tests

Files to create/modify:
- `/web/src/components/pdf/PDFViewerModal.tsx` (Modal component)
- `/web/src/components/pdf/PDFCanvas.tsx` (PDF rendering)
- `/web/src/hooks/usePDFLoader.ts` (PDF loading logic)
- `/web/src/lib/pdf/config.ts` (pdf.js configuration)
- `/web/src/components/pdf/PDFViewerModal.test.tsx` (Modal tests)
- `/web/src/hooks/usePDFLoader.test.ts` (Loader tests)
- `/web/package.json` (Add pdfjs-dist)

Integration:
- Connect PDFViewerModal to usePDFViewer hook
- Add modal to chat page
- Test opening modal from citation clicks
- Verify modal displays and renders PDFs
```

---

### **Prompt 20: PDF Page Navigation & Controls**

```
Implement PDF page navigation and zoom controls in the viewer modal.

Current state:
- PDF viewer modal renders PDFs
- Basic open/close functionality works
- No navigation or zoom controls exist

Task:
1. Create page navigation controls:
   - Previous page button
   - Next page button
   - Current page indicator (e.g., "Page 3 of 10")
   - Jump to page input
   - Disable prev/next at boundaries
2. Implement zoom controls:
   - Zoom in button (+25%)
   - Zoom out button (-25%)
   - Fit to width button
   - Fit to page button
   - Zoom level indicator (e.g., "100%")
3. Add keyboard shortcuts:
   - Left arrow: previous page
   - Right arrow: next page
   - +/=: zoom in
   - -: zoom out
   - 0: reset zoom
4. Implement zoom logic:
   - Track current zoom level (default: fit to width)
   - Recalculate canvas size on zoom
   - Re-render page at new scale
   - Maintain scroll position
5. Write tests for:
   - Page navigation buttons work correctly
   - Buttons are disabled at boundaries
   - Jump to page input navigates correctly
   - Zoom controls change zoom level
   - Keyboard shortcuts trigger correct actions
   - Zoom level updates canvas rendering
   - Page indicator displays correct information

Requirements:
- Smooth page transitions
- Preserve zoom level across page changes
- Clear visual feedback for disabled buttons
- Accessible controls with proper labels
- Mobile-friendly touch controls

Test-Driven Approach:
- Write tests for navigation button behavior
- Test zoom functionality
- Test keyboard shortcuts
- Test boundary conditions
- Implement controls to pass tests

Files to create/modify:
- `/web/src/components/pdf/PDFControls.tsx` (Control bar)
- `/web/src/components/pdf/PDFCanvas.tsx` (Add zoom logic)
- `/web/src/hooks/usePDFNavigation.ts` (Navigation state)
- `/web/src/components/pdf/PDFControls.test.tsx` (Controls tests)
- `/web/src/hooks/usePDFNavigation.test.ts` (Navigation tests)

Integration:
- Add PDFControls to PDFViewerModal
- Connect controls to PDF rendering
- Test navigation and zoom work together
- Verify keyboard shortcuts work correctly
```

---

### **Prompt 21: Sentence-Level Highlighting**

```
Implement sentence-level highlighting in the PDF viewer based on citation character spans.

Current state:
- PDF viewer displays pages correctly
- Citation metadata includes sentence character spans
- No highlighting exists

Task:
1. Implement text layer extraction from PDF:
   - Get text content and positions for current page
   - Extract character bounding boxes
   - Map character positions to viewport coordinates
2. Create sentence highlighting logic:
   - Receive sentence character span (start, end) from citation
   - Find corresponding text items on page
   - Calculate highlight bounding boxes
   - Handle spans across multiple lines
3. Create SentenceHighlight component:
   - Render highlight overlay on PDF canvas
   - Use distinct color (e.g., yellow with transparency)
   - Position correctly over text
   - Handle multi-line spans
4. Handle edge cases:
   - Sentence spans multiple text items
   - Text not found on page (citation mismatch)
   - Viewport zoom affects coordinates
   - Page rotation
5. Write tests for:
   - Text layer is extracted correctly
   - Character spans are mapped to coordinates
   - Highlights render in correct positions
   - Multi-line spans are handled correctly
   - Highlight scales with zoom level
   - Missing text is handled gracefully

Requirements:
- Highlight must be precisely positioned
- Highlight color: rgba(255, 255, 0, 0.3) or similar
- Update highlight position on zoom/pan
- Highlight should not obscure text
- Handle PDFs with complex layouts

Test-Driven Approach:
- Write tests for text layer extraction
- Test character span mapping
- Test highlight positioning calculations
- Test zoom and scale adjustments
- Implement sentence highlighting to pass tests

Files to create/modify:
- `/web/src/components/pdf/SentenceHighlight.tsx` (Highlight component)
- `/web/src/lib/pdf/textLayer.ts` (Text extraction)
- `/web/src/lib/pdf/highlightCalculator.ts` (Position calculation)
- `/web/src/components/pdf/PDFCanvas.tsx` (Add highlights)
- `/web/src/lib/pdf/textLayer.test.ts` (Extraction tests)
- `/web/src/lib/pdf/highlightCalculator.test.ts` (Calculation tests)

Integration:
- Pass citation metadata to PDFViewerModal
- Extract and display sentence highlight
- Test with various PDF layouts
- Verify highlight accuracy across pages
```

---

### **Prompt 22: Keyword Highlighting in Viewer**

```
Add query term highlighting in the PDF viewer to show all matching keywords on the page.

Current state:
- PDF viewer shows sentence highlighting
- Citation metadata includes query terms
- No keyword highlighting exists

Task:
1. Extract query terms from citation metadata:
   - Get original user question
   - Tokenize and extract keywords
   - Remove stopwords
   - Store terms with citation metadata
2. Implement keyword search in PDF text layer:
   - Find all occurrences of query terms on page
   - Get character positions for each match
   - Calculate bounding boxes for highlights
   - Handle case-insensitive matching
3. Create KeywordHighlight component:
   - Render keyword highlights with different color than sentence
   - Use distinct color (e.g., light blue with transparency)
   - Position correctly over matching text
   - Layer under sentence highlight (z-index)
4. Handle multiple keyword matches:
   - Highlight all occurrences of each term
   - Merge overlapping highlights
   - Handle partial word matches (optional)
5. Write tests for:
   - Query terms are extracted correctly
   - Keyword search finds all matches
   - Highlights render in correct positions
   - Highlight color differs from sentence highlight
   - Multiple keywords are all highlighted
   - Case-insensitive matching works
   - Stopwords are excluded

Requirements:
- Keyword highlight color: rgba(0, 150, 255, 0.2) or similar
- Highlight all occurrences on visible page
- Don't highlight stopwords (a, the, is, etc.)
- Sentence highlight should be on top (more visible)
- Performance: handle PDFs with many matches

Test-Driven Approach:
- Write tests for keyword extraction
- Test keyword search functionality
- Test highlight positioning
- Test color and z-index layering
- Implement keyword highlighting to pass tests

Files to create/modify:
- `/web/src/components/pdf/KeywordHighlight.tsx` (Keyword highlight)
- `/web/src/lib/pdf/keywordExtractor.ts` (Extract query terms)
- `/web/src/lib/pdf/keywordSearch.ts` (Find matches in text)
- `/web/src/components/pdf/PDFCanvas.tsx` (Add keyword highlights)
- `/web/src/lib/pdf/keywordExtractor.test.ts` (Extraction tests)
- `/web/src/lib/pdf/keywordSearch.test.ts` (Search tests)

Integration:
- Pass query terms to PDFViewerModal
- Render both sentence and keyword highlights
- Test with various query types
- Verify layering and colors are correct
```

---

### **Prompt 23: PDF Viewer Accessibility & UX Polish**

```
Implement full accessibility features and UX improvements for the PDF viewer modal.

Current state:
- PDF viewer works with navigation and highlighting
- Basic accessibility is in place
- Needs WCAG 2.1 AA compliance and polish

Task:
1. Implement complete focus management:
   - Focus trap within modal (can't tab outside)
   - Focus close button on open
   - Restore focus to trigger element on close
   - Visible focus indicators (2px outline)
2. Add ARIA attributes and roles:
   - role="dialog" on modal
   - aria-modal="true"
   - aria-labelledby for modal title
   - aria-describedby for modal description
   - aria-label on all buttons
   - aria-live for page changes
3. Add keyboard navigation:
   - ESC closes modal
   - Arrow keys navigate pages
   - Tab/Shift+Tab moves between controls
   - Enter activates buttons
   - Keyboard shortcuts don't conflict with screen readers
4. Implement loading and error announcements:
   - Announce "Loading PDF" to screen readers
   - Announce page changes "Now viewing page X of Y"
   - Announce errors clearly
   - Use aria-live regions
5. Add fallback for PDF viewer failures:
   - Show error message with explanation
   - Provide "Download PDF" button
   - Display page number and snippet text
   - Allow closing modal without PDF
6. Visual improvements:
   - Smooth fade-in animation
   - Loading skeleton
   - Professional styling
   - Mobile responsive design
   - Touch gestures for mobile (swipe to change pages)
7. Write tests for:
   - Focus trap works correctly
   - Focus is restored on close
   - All ARIA attributes are present
   - Keyboard shortcuts work
   - Screen reader announcements fire
   - Fallback displays on PDF load failure
   - Mobile touch gestures work
   - Modal is responsive on small screens

Requirements:
- WCAG 2.1 AA compliance
- Color contrast ≥ 4.5:1
- All functionality available via keyboard
- Screen reader compatible
- Mobile-friendly with touch support
- Graceful degradation on failures

Test-Driven Approach:
- Write tests for focus management
- Test ARIA attributes
- Test keyboard navigation
- Test screen reader announcements
- Test mobile responsiveness
- Implement accessibility to pass tests

Files to modify:
- `/web/src/components/pdf/PDFViewerModal.tsx` (Add accessibility)
- `/web/src/hooks/useFocusTrap.ts` (Focus trap hook)
- `/web/src/components/pdf/PDFErrorFallback.tsx` (Error fallback)
- `/web/src/hooks/useFocusTrap.test.ts` (Focus trap tests)
- `/web/src/components/pdf/PDFViewerModal.test.tsx` (Accessibility tests)

Integration:
- Test with screen reader (VoiceOver/NVDA)
- Verify keyboard navigation works end-to-end
- Test on mobile devices
- Confirm WCAG 2.1 AA compliance
```

---

### **Prompt 24: Session Inactivity Tracking**

```
Implement activity tracking for session management to detect inactivity and prepare for expiry.

Current state:
- Sessions are created on login
- No activity tracking exists
- Sessions never expire

Task:
1. Create activity tracking middleware:
   - Record timestamp on every API request
   - Store last_activity in session registry
   - Update timestamp in session metadata file
2. Implement activity timestamp storage:
   - Add last_activity field to session data structure
   - Persist timestamp to session metadata file
   - Load timestamp on session validation
3. Create session extension endpoint:
   - POST /fastapi/session/extend
   - Update last_activity to current time
   - Return new expiry time
   - Validate session exists
4. Add activity tracking to frontend:
   - Send extend request on user interactions
   - Throttle extension requests (max 1 per minute)
   - Track time since last activity
   - Log activity updates for debugging
5. Write tests for:
   - Middleware updates last_activity on requests
   - Timestamp is persisted correctly
   - Session extension endpoint works
   - Frontend throttles extension requests
   - Timestamps are accurate
   - Inactive sessions are detectable

Requirements:
- Low overhead (<1ms per request)
- Accurate activity timestamps
- Persist to disk for reliability
- Throttle frontend activity pings

Test-Driven Approach:
- Write tests for activity middleware
- Test timestamp persistence
- Test extension endpoint
- Test frontend throttling
- Implement activity tracking to pass tests

Files to create/modify:
- `/api/app/middleware/activity_tracker.py` (Activity middleware)
- `/api/app/api/routes/session.py` (Extension endpoint)
- `/api/app/core/session.py` (Add last_activity field)
- `/web/src/hooks/useSessionActivity.ts` (Frontend tracking)
- `/api/tests/test_activity_tracker.py` (Middleware tests)
- `/api/tests/test_session.py` (Extension tests)
- `/web/src/hooks/useSessionActivity.test.ts` (Hook tests)

Integration:
- Add activity middleware to FastAPI app
- Use useSessionActivity hook in chat page
- Test activity updates on various interactions
- Verify timestamps are accurate
```

---

### **Prompt 25: 60-Minute Session Expiry & Auto-Deletion**

```
Implement automatic session expiry after 60 minutes of inactivity with complete data deletion.

Current state:
- Activity tracking is in place
- Sessions have last_activity timestamps
- No expiry or cleanup exists

Task:
1. Create session reaper background task:
   - Run every 5 minutes
   - Check all sessions for inactivity
   - Identify sessions with >60 minutes inactivity
   - Delete expired sessions
2. Implement session deletion function:
   - Remove session from registry
   - Delete all session files from disk
   - Log deletion with session_id and reason
   - Handle already-deleted sessions gracefully
3. Add expiry checks to session validation:
   - Check last_activity on each request
   - Return 401 if session expired
   - Include expiry reason in error response
4. Implement cleanup logging:
   - Log session creation with timestamp
   - Log activity updates periodically
   - Log expiry and deletion events
   - Include session duration in logs
5. Write tests for:
   - Reaper task identifies expired sessions
   - Expired sessions are deleted completely
   - Session validation rejects expired sessions
   - Deletion handles edge cases (missing files, etc.)
   - Reaper runs on schedule
   - Cleanup logs are written correctly
   - Active sessions are not deleted

Requirements:
- Expiry exactly 60 minutes after last activity
- Complete data deletion (no remnants)
- Reliable background task execution
- Clear logging for audit trail
- Handle server restarts (reload sessions from disk)

Test-Driven Approach:
- Write tests for expiry detection logic
- Test session deletion function
- Test reaper task execution
- Test session validation with expired sessions
- Implement session expiry to pass tests

Files to create/modify:
- `/api/app/tasks/session_reaper.py` (Reaper task)
- `/api/app/core/session.py` (Expiry and deletion logic)
- `/api/app/core/dependencies.py` (Expiry validation)
- `/api/app/main.py` (Start reaper task)
- `/api/tests/test_session_reaper.py` (Reaper tests)
- `/api/tests/test_session.py` (Expiry tests)

Integration:
- Start reaper task on FastAPI startup
- Test with artificially short expiry time (e.g., 2 minutes)
- Verify session data is deleted completely
- Confirm logs show expiry events
- Test that expired sessions return 401
```

---

### **Prompt 26: Session Expiry UI Handling**

```
Handle session expiry in the frontend with clear user communication and graceful logout.

Current state:
- Backend expires sessions after 60 minutes
- Frontend doesn't handle expiry errors
- No user notification for expiry

Task:
1. Create session expiry detection:
   - Detect 401 errors from API
   - Check error response for expiry reason
   - Distinguish expiry from other auth errors
2. Implement expiry modal/notification:
   - Show "Session expired" modal
   - Explain data has been deleted
   - Provide "Sign in again" button
   - Auto-dismiss after 10 seconds
   - Block interactions during modal display
3. Add session countdown timer (optional):
   - Show time remaining until expiry
   - Display warning at 5 minutes
   - Allow manual session extension
   - Hide when user is active
4. Handle expiry gracefully:
   - Save draft message (if any) before clearing
   - Clear all session state
   - Redirect to login page
   - Show helpful message explaining what happened
5. Write tests for:
   - 401 errors trigger expiry detection
   - Expiry modal displays correctly
   - Modal auto-dismisses after timeout
   - User can manually sign in again
   - Session state is cleared on expiry
   - Draft message is not lost unexpectedly
   - Countdown timer displays correctly
   - Warning appears at 5 minutes

Requirements:
- Clear, non-technical error messages
- Explain that data was deleted per privacy policy
- Smooth UX without jarring errors
- Preserve user's work if possible (show what they were typing)
- Accessible modal with proper focus management

Test-Driven Approach:
- Write tests for expiry detection
- Test modal display and auto-dismiss
- Test state cleanup on expiry
- Test countdown timer logic
- Implement expiry handling to pass tests

Files to create/modify:
- `/web/src/hooks/useSessionExpiry.ts` (Expiry detection)
- `/web/src/components/SessionExpiredModal.tsx` (Expiry modal)
- `/web/src/hooks/useSessionCountdown.ts` (Countdown timer)
- `/web/src/lib/api/client.ts` (Handle 401 errors)
- `/web/src/hooks/useSessionExpiry.test.ts` (Expiry tests)
- `/web/src/components/SessionExpiredModal.test.tsx` (Modal tests)

Integration:
- Add useSessionExpiry to chat page and other protected pages
- Test with artificially short expiry time
- Verify modal appears on expiry
- Confirm redirect to login works
- Test user experience is smooth and clear
```

---

### **Prompt 27: File Scope Filtering UI**

```
Implement file scope filtering to allow users to query specific PDFs instead of all uploaded files.

Current state:
- Queries search across all uploaded PDFs
- No file selection UI exists
- Backend supports file filtering (to be verified)

Task:
1. Create file selector component:
   - Multi-select dropdown for uploaded files
   - Default to "All files" selected
   - Show file names and page counts
   - Display selection count (e.g., "3 of 5 files selected")
   - Allow select all / deselect all
2. Implement file selection state:
   - Store selected file IDs in React state
   - Persist selection across queries
   - Reset to "All files" on new uploads
   - Sync with uploaded files list
3. Update chat UI to include file selector:
   - Place above chat input
   - Show selected files count
   - Collapse to summary when not in focus
   - Expand on click for selection
4. Update query submission to include file scope:
   - Send selected file IDs with query
   - Validate files exist in session
   - Handle empty selection (default to all)
5. Write tests for:
   - File selector renders with uploaded files
   - Selection state updates correctly
   - Select all / deselect all works
   - Query includes selected file IDs
   - "All files" default works
   - Selection persists across queries
   - UI displays selection count correctly

Requirements:
- Clear visual indication of selected files
- Easy to use multi-select (checkboxes)
- Accessible with keyboard navigation
- Mobile-friendly design
- Show file names, not paths

Test-Driven Approach:
- Write tests for file selector component
- Test selection state management
- Test query submission with file scope
- Test accessibility
- Implement file filtering to pass tests

Files to create/modify:
- `/web/src/components/chat/FileSelector.tsx` (Selector component)
- `/web/src/hooks/useFileSelection.ts` (Selection state)
- `/web/src/app/chat/page.tsx` (Add file selector)
- `/web/src/lib/api/query.ts` (Add file_ids parameter)
- `/web/src/components/chat/FileSelector.test.tsx` (Selector tests)
- `/web/src/hooks/useFileSelection.test.ts` (State tests)

Integration:
- Add FileSelector to chat page above input
- Connect to uploaded files list from session
- Test queries with different file selections
- Verify backend filters results correctly
```

---

### **Prompt 28: File Scope Backend Implementation**

```
Implement file filtering in the backend query endpoint to restrict retrieval to selected files.

Current state:
- Query endpoint searches all files in session
- Frontend sends file_ids in query request
- No filtering logic exists

Task:
1. Update query endpoint to accept file_ids parameter:
   - Add optional file_ids array to request model
   - Validate file IDs exist in session
   - Default to all files if not provided
2. Implement retrieval filtering:
   - Filter FAISS index to selected files
   - Filter BM25 index to selected files
   - Ensure hybrid retrieval respects file scope
   - Maintain retrieval quality with fewer files
3. Update snippet metadata with file information:
   - Include file ID in retrieved snippets
   - Verify snippets are from selected files only
   - Filter out snippets from excluded files
4. Handle edge cases:
   - Empty file_ids list (default to all)
   - Invalid file IDs in list (ignore or error)
   - Single file selection
   - All files selected (optimize to not filter)
5. Write tests for:
   - Query with specific file_ids returns only those files
   - Query without file_ids returns all files
   - Invalid file IDs are handled gracefully
   - Single file filtering works
   - Retrieval quality is maintained
   - Citations reference only selected files

Requirements:
- No performance degradation with filtering
- Maintain retrieval accuracy and relevance
- Clear error messages for invalid file IDs
- Consistent behavior with hybrid retrieval

Test-Driven Approach:
- Write tests for query with file filtering
- Test edge cases (empty, invalid IDs)
- Test retrieval quality with filtering
- Test citations match filtered files
- Implement file filtering to pass tests

Files to modify:
- `/api/app/models/query.py` (Add file_ids field)
- `/api/app/core/retrieval.py` (Add filtering logic)
- `/api/app/core/faiss_index.py` (Filter FAISS results)
- `/api/app/core/bm25_index.py` (Filter BM25 results)
- `/api/app/api/routes/query.py` (Handle file_ids parameter)
- `/api/tests/test_query.py` (File filtering tests)
- `/api/tests/test_retrieval.py` (Filtering logic tests)

Integration:
- Test end-to-end file filtering from frontend
- Verify results match selected files
- Test with various file combinations
- Confirm performance is acceptable
```

---

### **Prompt 29: Rate Limiting Implementation**

```
Implement rate limiting across all API endpoints according to specification: 6/min, 30/session, 100/day.

Current state:
- No rate limiting exists
- All endpoints are unprotected
- Potential for abuse or overload

Task:
1. Install and configure rate limiting library:
   - Use slowapi or similar for FastAPI
   - Configure Redis for distributed rate limiting (or in-memory for MVP)
   - Set up rate limit storage
2. Implement three-tier rate limiting:
   - Per-minute: 6 requests (burst up to 3)
   - Per-session (60 min): 30 requests
   - Per-user daily: 100 requests
3. Apply rate limits to query endpoint:
   - Most critical endpoint
   - Count only successful queries
   - Don't count failed/invalid requests
4. Add rate limit headers to responses:
   - X-RateLimit-Limit
   - X-RateLimit-Remaining
   - X-RateLimit-Reset
   - Retry-After (on 429 errors)
5. Implement rate limit error handling:
   - Return 429 Too Many Requests
   - Include clear error message
   - Suggest retry time
   - Log rate limit violations
6. Write tests for:
   - Per-minute rate limit enforced
   - Per-session rate limit enforced
   - Per-day rate limit enforced
   - Headers are included in responses
   - 429 errors include Retry-After
   - Rate limits reset correctly
   - Different sessions have independent limits

Requirements:
- Accurate counting (no duplicate counts)
- Efficient implementation (<5ms overhead)
- Clear error messages to users
- Admin bypass for testing (optional)
- Logs for monitoring and abuse detection

Test-Driven Approach:
- Write tests for each rate limit tier
- Test header inclusion
- Test error responses
- Test limit reset behavior
- Implement rate limiting to pass tests

Files to create/modify:
- `/api/app/middleware/rate_limiter.py` (Rate limiting logic)
- `/api/app/core/redis_client.py` (Redis connection, if used)
- `/api/app/api/routes/query.py` (Apply rate limits)
- `/api/requirements.txt` (Add slowapi or equivalent)
- `/api/tests/test_rate_limiter.py` (Rate limit tests)

Integration:
- Apply rate limiting middleware to app
- Test rate limits with rapid requests
- Verify headers are returned
- Confirm 429 errors display correctly in frontend
```

---

### **Prompt 30: Error Handling & User Feedback Improvements**

```
Standardize error handling across all endpoints and improve user-facing error messages.

Current state:
- Errors are handled inconsistently
- Error messages may be too technical
- No centralized error handling

Task:
1. Create error response standardization:
   - Consistent error response format
   - Include error code, message, and details
   - Add request_id for debugging
   - User-friendly messages
2. Implement error types with friendly messages:
   - File too large: "File exceeds 50MB limit. Please upload a smaller file."
   - Scanned PDF: "This file appears to be scanned/unsearchable. Scanned PDFs aren't supported in the MVP."
   - Indexing failure: "Indexing failed. Please try re-uploading your files."
   - Query timeout: "Your question took too long to process. Please try a more specific question."
   - Session expired: "Your session has expired. Your data has been deleted for privacy."
   - Rate limited: "You've sent too many questions. Please wait {X} seconds before trying again."
3. Create error display components in frontend:
   - Toast notifications for transient errors
   - Inline error messages for form validation
   - Modal for critical errors (session expired)
   - Banner for system-wide issues
4. Add retry logic for transient failures:
   - Automatic retry for network errors (1 retry with backoff)
   - Manual retry button for failed operations
   - Clear indication of retry attempts
5. Implement error logging:
   - Log all errors with context (session_id, user_id, request_id)
   - Include stack traces for 500 errors
   - Structured JSON logs for parsing
   - Separate user errors from system errors
6. Write tests for:
   - All error types return correct format
   - Error messages are user-friendly
   - Frontend displays errors correctly
   - Retry logic works for transient errors
   - Error logs are written with required fields
   - Request IDs are included in errors

Requirements:
- No technical jargon in user-facing messages
- Actionable guidance (what to do next)
- Consistent error format across all endpoints
- Errors are logged for debugging
- Clear distinction between user errors and system errors

Test-Driven Approach:
- Write tests for each error type
- Test error display components
- Test retry logic
- Test error logging
- Implement error handling to pass tests

Files to create/modify:
- `/api/app/core/errors.py` (Error types and messages)
- `/api/app/middleware/error_handler.py` (Global error handler)
- `/web/src/components/ErrorToast.tsx` (Toast component)
- `/web/src/components/ErrorModal.tsx` (Modal component)
- `/web/src/hooks/useErrorHandler.ts` (Error handling hook)
- `/api/tests/test_errors.py` (Error handling tests)
- `/web/src/components/ErrorToast.test.tsx` (Component tests)

Integration:
- Apply error handler middleware globally
- Use error components throughout frontend
- Test various error scenarios end-to-end
- Verify error messages are clear and helpful
```

---

### **Prompt 31: Integration Testing Suite**

```
Create comprehensive integration tests covering the complete user flow from login to PDF viewing.

Current state:
- Unit tests exist for individual components
- No end-to-end integration tests
- Need to verify complete workflows

Task:
1. Set up integration testing framework:
   - Use Playwright or Cypress for E2E tests
   - Configure test environment with test databases
   - Set up test data fixtures (sample PDFs)
   - Create test user accounts
2. Implement full flow test:
   - Login with Google/Apple (mock OAuth)
   - Upload PDF files
   - Wait for indexing to complete
   - Submit a query
   - Verify response appears
   - Click citation marker
   - Verify PDF viewer opens
   - Verify sentence highlighting appears
   - Close viewer
   - Sign out
   - Verify session is deleted
3. Create error scenario tests:
   - Upload invalid file (too large, scanned)
   - Submit query during indexing (should be blocked)
   - Submit query with no files (should error)
   - Trigger rate limit (multiple rapid queries)
   - Wait for session expiry (with time acceleration)
   - Try to access after sign-out
4. Test multi-file scenarios:
   - Upload multiple PDFs
   - Query with file scope filter
   - Verify results from correct files only
   - Test with "All files" vs specific selection
5. Test conversation context:
   - Submit initial question
   - Submit follow-up question
   - Verify context is used (answers make sense)
   - Clear conversation
   - Verify context is reset
6. Write tests for:
   - Complete happy path (login to sign-out)
   - File upload and indexing flow
   - Query and response flow
   - Citation and PDF viewer flow
   - Error handling flows
   - Session expiry flow
   - Rate limiting flow
   - File filtering flow

Requirements:
- Tests should run in isolated environment
- Use test fixtures for consistent data
- Tests should be repeatable
- Fast execution (< 5 minutes for full suite)
- Clear test reports with screenshots on failure

Test Organization:
- Organize tests by user flow
- Use descriptive test names
- Include setup and teardown
- Mock external services (OAuth, Ollama in some tests)

Files to create:
- `/tests/integration/test_full_flow.spec.ts` (Main flow)
- `/tests/integration/test_upload_flow.spec.ts` (Upload tests)
- `/tests/integration/test_query_flow.spec.ts` (Query tests)
- `/tests/integration/test_citation_flow.spec.ts` (Citation tests)
- `/tests/integration/test_error_scenarios.spec.ts` (Error tests)
- `/tests/integration/fixtures/sample_pdfs/` (Test PDFs)
- `/tests/integration/helpers/auth.ts` (Auth helpers)
- `/tests/integration/helpers/api.ts` (API helpers)

Integration:
- Run integration tests in CI/CD pipeline
- Generate test reports
- Take screenshots on failures
- Verify all critical paths are tested
```

---

### **Prompt 32: Performance Testing & Optimization**

```
Implement performance testing and optimize the application to meet latency targets (≤10s query time).

Current state:
- Application is functionally complete
- No performance testing exists
- Need to verify meets latency requirements

Task:
1. Set up performance testing framework:
   - Use Locust or k6 for load testing
   - Configure test scenarios
   - Set up monitoring and metrics collection
2. Implement query latency testing:
   - Measure end-to-end query time
   - Break down by component: retrieval, generation, total
   - Test with various PDF sizes and counts
   - Test with different query complexities
   - Target: ≤10 seconds on CPU-only
3. Create load testing scenarios:
   - Single user, multiple queries
   - Multiple concurrent users
   - Stress test: maximum concurrent sessions
   - Sustained load over time
4. Implement performance monitoring:
   - Add timing instrumentation to key functions
   - Log latency metrics (p50, p95, p99)
   - Track resource usage (CPU, memory)
   - Monitor Ollama inference time
5. Identify and optimize bottlenecks:
   - Profile slow endpoints
   - Optimize retrieval queries
   - Tune FAISS index parameters
   - Optimize embedding generation
   - Cache where appropriate
6. Test with realistic data:
   - Long policy PDFs (100+ pages)
   - Medical/scientific articles
   - Workplace handbooks
   - Multiple file uploads (10 files)
7. Write tests for:
   - Query latency ≤10 seconds (p95)
   - Upload and indexing time reasonable
   - Concurrent session handling
   - Memory usage stays within limits
   - CPU usage is efficient
   - No memory leaks over time

Requirements:
- Target: 95th percentile query time ≤10 seconds
- Handle 10 concurrent sessions
- Memory usage stable over extended use
- No degradation over time (session accumulation)
- Clear performance baselines documented

Test-Driven Approach:
- Write performance test suite
- Establish baseline metrics
- Identify bottlenecks through profiling
- Implement optimizations
- Re-test to verify improvements

Files to create/modify:
- `/tests/performance/query_latency.py` (Latency tests)
- `/tests/performance/load_test.py` (Load tests)
- `/api/app/middleware/timing.py` (Timing instrumentation)
- `/api/app/core/metrics.py` (Metrics collection)
- `/tests/performance/test_scenarios.py` (Test scenarios)
- `/docs/performance_baseline.md` (Document baseline)

Optimization targets:
- Retrieval: < 2 seconds
- Ollama inference: < 7 seconds
- Overhead: < 1 second
- Total: ≤10 seconds (p95)

Integration:
- Run performance tests regularly
- Monitor metrics in production
- Set up alerts for degradation
- Document optimization approaches
```
### **Prompt 1: OAuth Configuration & Environment Setup** ✅ COMPLETED

```
We're implementing OAuth authentication for the Chat to Your PDF application. The project uses Next.js (React) for the frontend and FastAPI for the backend.

Current state:
- Next.js application is running with upload UI completed
- FastAPI backend has upload, indexing, and query endpoints
- No authentication is currently in place

Task:
1. Create a configuration module for OAuth credentials (Google and Apple)
2. Set up environment variables structure in Next.js for:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - APPLE_CLIENT_ID
   - APPLE_CLIENT_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
3. Create a utility module for session cookie management with the following:
   - Secure, httpOnly, sameSite=strict cookie settings
   - Session token generation (cryptographically secure)
   - Session validation helpers
4. Write tests for:
   - Environment variable loading and validation
   - Session token generation (uniqueness, format)
   - Cookie security settings

Requirements:
- Use industry-standard libraries (e.g., NextAuth.js or similar)
- All secrets must be loaded from environment variables
- Follow OAuth 2.0 best practices (PKCE, state parameter)
- Include TypeScript types for all configuration objects

Test-Driven Approach:
- Write tests first that validate environment configuration
- Write tests that verify secure cookie settings
- Implement the configuration module to pass the tests
- Verify all tests pass before moving to next step

Files to create/modify:
- `/web/src/lib/auth/config.ts` (OAuth configuration)
- `/web/src/lib/auth/session.ts` (Session utilities)
- `/web/src/lib/auth/config.test.ts` (Configuration tests)
- `/web/src/lib/auth/session.test.ts` (Session tests)
- `/web/.env.example` (Example environment variables)

Ensure the code is well-documented, follows best practices, and integrates cleanly with the existing Next.js structure.
```

---

### **Prompt 2: Google OAuth Flow Implementation** ✅ COMPLETED

```
Building on the OAuth configuration from the previous step, implement the Google OAuth authentication flow.

Current state:
- OAuth configuration and session utilities are in place
- Environment variables are configured
- No actual OAuth flow is implemented yet

Task:
1. Implement Google OAuth provider configuration using NextAuth.js
2. Create the NextAuth API route handler at `/web/src/app/api/auth/[...nextauth]/route.ts`
3. Implement OAuth callback handling for Google
4. Create session creation logic after successful authentication
5. Build a protected route middleware that validates sessions
6. Create a simple login page with "Sign in with Google" button
7. Write tests for:
   - OAuth callback handler
   - Session creation after successful login
   - Protected route middleware (allows authenticated, blocks unauthenticated)
   - Login page rendering

Requirements:
- Use NextAuth.js GoogleProvider
- Store session_id in secure cookie after authentication
- Generate a unique session_id for each login (UUID v4)
- Implement proper error handling for OAuth failures
- Redirect authenticated users to upload page
- Redirect unauthenticated users trying to access protected routes to login

Test-Driven Approach:
- Write tests that mock Google OAuth responses
- Test successful authentication flow
- Test authentication failure scenarios
- Test session validation logic
- Implement OAuth flow to pass tests

Files to create/modify:
- `/web/src/app/api/auth/[...nextauth]/route.ts` (NextAuth handler)
- `/web/src/middleware.ts` (Protected route middleware)
- `/web/src/app/login/page.tsx` (Login page)
- `/web/src/app/api/auth/[...nextauth]/route.test.ts` (OAuth tests)
- `/web/src/middleware.test.ts` (Middleware tests)

Integration:
- Ensure the existing upload page is now protected
- Verify unauthorized access redirects to login
- Test end-to-end: login with Google → redirect to upload page
```

---

### **Prompt 3: Apple OAuth Flow Implementation** ✅ COMPLETED

```
Extend the OAuth implementation to support Apple Sign-In, building on the existing Google OAuth flow.

Current state:
- Google OAuth is fully implemented and tested
- NextAuth.js is configured
- Session management is working

Task:
1. Add Apple provider to NextAuth configuration
2. Configure Apple OAuth settings (client ID, team ID, key ID, private key)
3. Handle Apple-specific token validation
4. Update login page to include "Sign in with Apple" button
5. Write tests for:
   - Apple OAuth callback handling
   - Apple token validation
   - Login page with both providers
   - Session creation from Apple authentication

Requirements:
- Use NextAuth.js AppleProvider
- Handle Apple's unique authentication requirements (JWT signing)
- Maintain consistent session_id generation across providers
- Both providers should create identical session structures
- Style buttons according to Apple and Google brand guidelines

Test-Driven Approach:
- Write tests that mock Apple OAuth responses
- Test Apple-specific token handling
- Test session creation consistency across providers
- Implement Apple OAuth to pass tests

Files to modify:
- `/web/src/app/api/auth/[...nextauth]/route.ts` (Add Apple provider)
- `/web/src/app/login/page.tsx` (Add Apple button)
- `/web/src/lib/auth/config.ts` (Apple configuration)
- `/web/src/app/api/auth/[...nextauth]/route.test.ts` (Apple tests)

Integration:
- Verify both Google and Apple logins work independently
- Confirm sessions are identical in structure regardless of provider
- Test switching between accounts from different providers
```

---

### **Prompt 4: Session Propagation to Backend** ✅ COMPLETED

```
Connect the Next.js session management with the FastAPI backend, ensuring all API calls include and validate the session_id.

Current state:
- OAuth authentication is working (Google and Apple)
- Session_id is stored in secure cookies
- FastAPI endpoints exist but don't validate sessions

Task:
1. Create a Next.js API client utility that:
   - Automatically includes session_id in all FastAPI requests
   - Handles session validation errors (401/403)
   - Redirects to login on authentication failures
2. Update FastAPI to accept and validate session_id:
   - Add session_id validation dependency
   - Validate session exists and is active
   - Return 401 for invalid/missing sessions
3. Modify existing endpoints to use session validation:
   - POST /fastapi/upload
   - GET /fastapi/index/status
   - POST /fastapi/query
4. Write tests for:
   - API client includes session_id in headers
   - Backend validates session_id correctly
   - Backend rejects requests without session_id
   - Backend rejects requests with invalid session_id
   - Frontend handles 401 errors and redirects to login

Requirements:
- Pass session_id in Authorization header or custom header
- Backend maintains a session registry (in-memory for MVP)
- Session validation should be fast (<5ms overhead)
- Clear error messages for authentication failures

Test-Driven Approach:
- Write tests for API client with session injection
- Write tests for backend session validation
- Test error handling for invalid sessions
- Implement session propagation to pass tests

Files to create/modify:
- `/web/src/lib/api/client.ts` (API client with session)
- `/api/app/core/session.py` (Session validation logic)
- `/api/app/core/dependencies.py` (FastAPI dependency for session)
- `/api/app/api/routes/upload.py` (Add session validation)
- `/api/app/api/routes/index.py` (Add session validation)
- `/api/app/api/routes/query.py` (Add session validation)
- `/web/src/lib/api/client.test.ts` (Client tests)
- `/api/tests/test_session.py` (Session validation tests)

Integration:
- Update all existing FastAPI calls in the Next.js app to use the new API client
- Verify upload flow still works with session validation
- Test that expired/invalid sessions are rejected
```

---

### **Prompt 5: Sign-Out Flow & Session Deletion** ✅ COMPLETED

```
Implement the sign-out functionality that logs users out and immediately deletes all their session data.

Current state:
- Authentication is fully working
- Sessions are validated across all endpoints
- No sign-out mechanism exists yet

Task:
1. Create sign-out button in the UI (in header/navbar)
2. Implement sign-out API endpoint in Next.js that:
   - Calls NextAuth signOut()
   - Calls FastAPI session deletion endpoint
   - Clears session cookie
   - Redirects to login page
3. Implement FastAPI session deletion endpoint:
   - POST /fastapi/session/delete
   - Delete all session data from temp directory
   - Remove session from session registry
   - Log deletion event
4. Create a utility function for secure session data deletion:
   - Delete all files in session directory
   - Verify deletion completed
   - Handle errors gracefully
5. Write tests for:
   - Sign-out button triggers logout flow
   - Session cookie is cleared
   - FastAPI receives deletion request
   - Session data is completely removed from disk
   - User is redirected to login page
   - Attempting to use deleted session returns 401

Requirements:
- Session deletion must be immediate and complete
- Handle case where session data doesn't exist (already deleted)
- Log all deletion events for audit trail
- Secure deletion (overwrite sensitive data if possible)

Test-Driven Approach:
- Write tests for sign-out UI interaction
- Write tests for session deletion endpoint
- Write tests for file deletion utility
- Test that deleted sessions cannot be reused
- Implement sign-out flow to pass tests

Files to create/modify:
- `/web/src/components/Header.tsx` (Add sign-out button)
- `/web/src/app/api/auth/signout/route.ts` (Sign-out handler)
- `/api/app/api/routes/session.py` (Session deletion endpoint)
- `/api/app/core/storage.py` (Secure deletion utility)
- `/web/src/components/Header.test.tsx` (UI tests)
- `/api/tests/test_session.py` (Session deletion tests)

Integration:
- Verify sign-out works from any page
- Confirm session data is deleted from disk
- Test that subsequent API calls with old session_id fail
- Ensure user can sign in again after signing out
```


---

### **Prompt 33: Production Readiness & Final Validation**

```
Complete production readiness checklist, security audit, and final validation before deployment.

Current state:
- Application is feature complete
- Testing is comprehensive
- Need final production validation

Task:
1. Security audit:
   - Review OAuth implementation (PKCE, state, CSRF)
   - Validate session cookie security (httpOnly, secure, sameSite)
   - Check authorization on all endpoints
   - Test for common vulnerabilities (OWASP Top 10)
   - Verify temp file encryption
   - Confirm secure deletion of session data
   - Review secrets management (SSM Parameter Store)
2. Accessibility validation:
   - Test with screen readers (VoiceOver, NVDA)
   - Verify keyboard navigation on all pages
   - Check color contrast ratios (≥4.5:1)
   - Test focus management in modal
   - Verify ARIA attributes are correct
   - Test with browser zoom (up to 200%)
   - Validate with accessibility tools (axe, Lighthouse)
3. Browser and device testing:
   - Chrome, Firefox, Safari, Edge (latest versions)
   - Mobile: iOS Safari, Android Chrome
   - Tablet: iPad, Android tablets
   - Various screen sizes (320px to 4K)
   - Test file upload on mobile
   - Test PDF viewer on touch devices
4. Docker and deployment validation:
   - Test docker-compose build
   - Verify all containers start correctly
   - Test container health checks
   - Validate environment variable loading
   - Test with AWS SSM Parameter Store
   - Verify logging to CloudWatch
   - Test TLS with Caddy and Let's Encrypt
5. Operational readiness:
   - Document deployment procedure
   - Create troubleshooting guide
   - Verify monitoring and alerting
   - Test backup and restore (N/A for MVP)
   - Create incident response runbook
   - Document known limitations
6. Final validation checklist:
   - [ ] All tests passing (unit, integration, performance)
   - [ ] Security audit complete with no critical issues
   - [ ] Accessibility WCAG 2.1 AA compliant
   - [ ] Cross-browser testing complete
   - [ ] Mobile/tablet testing complete
   - [ ] Docker deployment tested
   - [ ] Environment variables documented
   - [ ] Secrets in SSM Parameter Store
   - [ ] Logging configured and tested
   - [ ] Error handling validated
   - [ ] Rate limiting enforced
   - [ ] Session expiry working correctly
   - [ ] Data deletion verified
   - [ ] Performance targets met
   - [ ] Documentation complete
   - [ ] Deployment runbook updated
7. Create production deployment plan:
   - Pre-deployment checklist
   - Deployment steps
   - Post-deployment validation
   - Rollback procedure
   - Monitoring checklist

Files to create/modify:
- `/docs/security_audit.md` (Security audit report)
- `/docs/accessibility_report.md` (Accessibility validation)
- `/docs/browser_compatibility.md` (Browser test results)
- `/docs/deployment_guide.md` (Deployment procedure)
- `/docs/troubleshooting.md` (Troubleshooting guide)
- `/docs/production_checklist.md` (Final checklist)
- `/docs/incident_runbook.md` (Incident response)

Final validation:
- Run full test suite one final time
- Deploy to staging environment
- Perform smoke tests
- Get final approval
- Document any known issues or limitations
```

---
