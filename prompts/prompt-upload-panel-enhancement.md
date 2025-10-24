# Prompt: Enhance Upload Panel UI for Chat to Your PDF

## Context
You are working on a Next.js web application called "Chat to Your PDF". The upload panel component is currently functional but plain and uninviting. Your task is to modernize it with a larger, more engaging design featuring animations, icons, and better visual feedback.

## Project Structure
- **Location**: `/Users/kate/Documents/Projects/Chat-To-PDF/code/pdf-chat/`
- **Frontend**: Next.js (React) with TypeScript
- **Component File**: `web/src/components/UploadPanel.tsx`
- **CSS File**: `web/src/app/globals.css`

## Current State

The `UploadPanel.tsx` component (lines 1-126) currently has:
- Plain white card with simple dashed border drop zone
- Basic file input
- Simple file list showing names and sizes
- Plain "Upload" button
- Basic black progress bar during indexing
- Minimal visual interest

## Objective

Transform the upload panel into a modern, engaging interface with:
1. Larger drop zone with gradient border and hover effects
2. Animated upload icon (cloud with arrow)
3. Enhanced file list with PDF icons, sizes, and status badges
4. Colorful "Upload & Index" button with icon
5. Gradient animated progress bar

## Design Specifications

### Visual Design
- **Drop Zone**: Large, prominent area with animated gradient border
- **Icon**: Animated cloud with up arrow (using SVG or emoji)
- **File List**: Show PDF icon, filename, size, and status (✓ valid, ⚠️ warning, ✗ error)
- **Button**: Large, colorful button with upload icon
- **Progress Bar**: Gradient fill with animated shimmer effect
- **Colors**: Use the modern purple-blue gradient theme (see color variables below)

### Color Variables to Use
These should already be defined in `globals.css`:
```css
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
--primary: #6366f1;
--accent-success: #10b981;
--accent-warning: #f59e0b;
--accent-error: #ef4444;
--border-light: #e5e7eb;
--border-default: #d1d5db;
--bg-card: #ffffff;
--text-primary: #111827;
--text-secondary: #6b7280;
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

## Implementation Steps

### Step 1: Add CSS Styles to `globals.css`

Add these new styles at the end of `web/src/app/globals.css`:

```css
/* === UPLOAD PANEL STYLES === */

/* Drop Zone Container */
.upload-drop-zone {
  position: relative;
  border: 3px dashed var(--border-default);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  padding: 48px 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-drop-zone:hover {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  box-shadow: var(--shadow-md);
}

.upload-drop-zone.drag-over {
  border-color: var(--accent-success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-style: solid;
}

/* Upload Icon */
.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.upload-icon.uploading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Upload Text */
.upload-text-primary {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.upload-text-secondary {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.upload-text-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

/* File Input (hidden but accessible) */
.upload-file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

/* File List */
.file-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
  border-radius: 12px;
  overflow: hidden;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-bottom: none;
  transition: background 0.2s ease;
}

.file-list-item:first-child {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.file-list-item:last-child {
  border-bottom: 1px solid var(--border-light);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.file-list-item:hover {
  background: var(--bg-hover);
}

/* File Icon */
.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

/* File Info */
.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* File Status Badge */
.file-status {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-status.valid {
  background: var(--accent-success-light);
  color: var(--accent-success-dark);
}

.file-status.warning {
  background: var(--accent-warning-light);
  color: var(--accent-warning-dark);
}

.file-status.error {
  background: var(--accent-error-light);
  color: var(--accent-error-dark);
}

/* Upload Button */
.upload-button {
  width: 100%;
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.upload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
}

.upload-button:active:not(:disabled) {
  transform: translateY(0px);
}

.upload-button:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

.upload-button-icon {
  font-size: 20px;
}

/* Progress Container */
.upload-progress-container {
  margin-top: 16px;
  padding: 16px;
  background: var(--primary-light);
  border-radius: 12px;
  border: 1px solid var(--primary);
}

.upload-progress-bar-wrapper {
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
}

.upload-progress-bar-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 5px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* Animated shimmer effect */
.upload-progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.upload-progress-text {
  font-size: 14px;
  color: var(--primary);
  font-weight: 600;
  text-align: center;
}

/* Ask Questions Button */
.ask-button {
  width: 100%;
  background: var(--accent-success);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}

.ask-button:hover:not(:disabled) {
  background: var(--accent-success-dark);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
}

.ask-button:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

/* Session ID Display */
.session-id-display {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  font-family: monospace;
}

/* Error Alert */
.upload-error-alert {
  background: var(--accent-error-light);
  color: var(--accent-error-dark);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--accent-error);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.upload-error-icon {
  font-size: 18px;
  flex-shrink: 0;
}
```

### Step 2: Replace `UploadPanel.tsx` Component

Replace the entire content of `web/src/components/UploadPanel.tsx` with this enhanced version:

```tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export function UploadPanel() {
  const router = useRouter();
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [isIndexing, setIsIndexing] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [filesIndexed, setFilesIndexed] = React.useState<number>(0);
  const [totalFiles, setTotalFiles] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isIndexingComplete, setIsIndexingComplete] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);

  async function onUpload() {
    if (!files || files.length === 0) return;
    setIsIndexing(true);
    setError(null);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    const upRes = await fetch('/api/upload', { method: 'POST', body: form });
    if (!upRes.ok) {
      const msg = await upRes.text();
      setIsIndexing(false);
      setError(msg || 'Upload failed');
      return;
    }
    const upJson = await upRes.json();
    setSessionId(upJson.session_id);
    localStorage.setItem('pdf-chat-session-id', upJson.session_id);
    window.dispatchEvent(new CustomEvent('sessionUpdated'));
    setFilesIndexed(0);
    setTotalFiles(upJson.totals?.files ?? (files?.length ?? 0));
    let tries = 0;
    while (tries < 5) {
      tries++;
      const stRes = await fetch(`/api/index/status?session_id=${upJson.session_id}`);
      const st = await stRes.json();
      if (typeof st.files_indexed === 'number') setFilesIndexed(st.files_indexed);
      if (typeof st.total_files === 'number') setTotalFiles(st.total_files);
      if (st.status === 'done') {
        setIsIndexingComplete(true);
        break;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    setIsIndexing(false);
  }

  const handleAskClick = () => {
    if (sessionId) {
      localStorage.setItem('pdf-chat-session-id', sessionId);
      router.push('/chat');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  // Validate file size (50MB max per file)
  const validateFile = (file: File): 'valid' | 'warning' | 'error' => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) return 'error';
    if (file.size > maxSize * 0.8) return 'warning'; // Warn at 80%
    return 'valid';
  };

  const getStatusBadge = (status: 'valid' | 'warning' | 'error') => {
    switch (status) {
      case 'valid':
        return { icon: '✓', text: 'Valid', class: 'valid' };
      case 'warning':
        return { icon: '⚠', text: 'Large', class: 'warning' };
      case 'error':
        return { icon: '✗', text: 'Too large', class: 'error' };
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const progressPercentage = totalFiles > 0 
    ? Math.round((filesIndexed / totalFiles) * 100) 
    : 0;

  return (
    <div className="card">
      {/* Error Alert */}
      {error && (
        <div role="alert" className="upload-error-alert">
          <span className="upload-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`upload-drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`upload-icon ${isIndexing ? 'uploading' : ''}`}>
          {isIndexing ? '⏳' : '☁️⬆️'}
        </div>
        <div className="upload-text-primary">
          {isDragOver ? 'Drop your PDFs here!' : 'Drag & drop PDFs here'}
        </div>
        <div className="upload-text-secondary">
          or click to browse files
        </div>
        <div className="upload-text-hint">
          Max 50MB per file • Up to 10 files • 500 pages max
        </div>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileSelect}
          aria-label="pdf-input"
          className="upload-file-input"
        />
      </div>

      {/* File List */}
      {files && files.length > 0 && (
        <ul className="file-list">
          {Array.from(files).map((file, index) => {
            const status = validateFile(file);
            const badge = getStatusBadge(status);
            return (
              <li key={`${file.name}-${index}`} className="file-list-item">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
                <div className={`file-status ${badge.class}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Upload Button */}
      <button 
        className="upload-button"
        onClick={onUpload} 
        disabled={!files || isIndexing}
        aria-label="upload-btn"
      >
        <span className="upload-button-icon">
          {isIndexing ? '⏳' : '📤'}
        </span>
        <span>{isIndexing ? 'Indexing...' : 'Upload & Index'}</span>
      </button>

      {/* Progress Indicator */}
      {isIndexing && (
        <div className="upload-progress-container" aria-label="progress">
          <div className="upload-progress-bar-wrapper">
            <div 
              className="upload-progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="upload-progress-text">
            Indexing {filesIndexed} of {totalFiles} files • {progressPercentage}%
          </div>
        </div>
      )}

      {/* Ask Questions Button */}
      <button 
        onClick={handleAskClick}
        disabled={!isIndexingComplete || !sessionId} 
        className="ask-button"
        aria-label="chat-btn"
      >
        <span>💬</span>
        <span>{isIndexingComplete ? 'Start Asking Questions' : 'Ask Questions'}</span>
      </button>

      {/* Session ID Display */}
      {sessionId && (
        <div className="session-id-display" aria-label="session-id">
          Session: {sessionId}
        </div>
      )}
    </div>
  );
}
```

## Key Changes Explained

### 1. **Drop Zone Enhancement**
- **Larger size**: Increased padding from 16px to 48px vertically
- **Gradient background**: Subtle purple-blue gradient
- **Hover effects**: Border color changes to primary, background intensifies
- **Drag-over state**: Border becomes solid green when files are dragged over
- **Animated icon**: Floats up and down continuously

### 2. **Animated Upload Icon**
- Uses emoji combination: ☁️⬆️ (cloud + up arrow)
- **Float animation**: Gentle up/down movement (3s infinite)
- **Pulse animation**: When uploading, icon pulses instead of floating
- Switches to ⏳ (hourglass) during upload

### 3. **Enhanced File List**
- **PDF icon**: 📄 emoji for each file
- **Status badges**: Color-coded validation
  - ✓ Valid (green) - file under 40MB
  - ⚠ Large (amber) - file 40-50MB
  - ✗ Too large (red) - file over 50MB
- **Hover effect**: Subtle background color change
- **Better layout**: Icon, name/size, status badge in row

### 4. **Colorful Upload Button**
- **Gradient background**: Purple-blue gradient
- **Icon**: 📤 upload emoji, changes to ⏳ when indexing
- **Full width**: Takes entire card width
- **Larger size**: 16px padding (up from 8px)
- **Hover effect**: Lifts up 2px with colored shadow
- **Press effect**: Returns to normal position on click

### 5. **Gradient Animated Progress Bar**
- **Gradient fill**: Uses purple-blue gradient
- **Shimmer animation**: White shine moves across the bar continuously
- **Thicker bar**: 10px height (up from 6px)
- **Container**: Light purple background with border
- **Text display**: Shows "Indexing X of Y files • Z%"

### 6. **Additional Improvements**
- **Drag state tracking**: Detects when files are dragged over
- **File validation**: Checks size and shows status
- **Better button states**: Disabled states are clearer
- **Session ID**: Shown in a styled box
- **Error alerts**: Better styled with icon

## Testing Checklist

After implementation, verify:

1. **Drop Zone**:
   - [ ] Shows animated floating cloud icon
   - [ ] Border changes on hover
   - [ ] Drag-over state shows green border and "Drop here!" text
   - [ ] Clicking anywhere opens file picker

2. **File Selection**:
   - [ ] Files appear in list with PDF icon
   - [ ] File sizes are formatted correctly (X.XX MB)
   - [ ] Status badges show correct colors
   - [ ] Files over 50MB show red "Too large" badge

3. **Upload Button**:
   - [ ] Shows gradient background
   - [ ] Icon changes from 📤 to ⏳ when uploading
   - [ ] Hover effect lifts button with shadow
   - [ ] Disabled state is grayed out

4. **Progress Bar**:
   - [ ] Shows gradient fill
   - [ ] Shimmer animation runs continuously
   - [ ] Percentage updates correctly
   - [ ] Text shows current progress

5. **Responsive Behavior**:
   - [ ] Works on mobile devices
   - [ ] Touch-friendly on tablets
   - [ ] File names truncate with ellipsis if too long

6. **Accessibility**:
   - [ ] File input is accessible via keyboard
   - [ ] All buttons have aria-labels
   - [ ] Error messages have role="alert"
   - [ ] Progress has aria-label

## Expected Visual Result

After implementation, the upload panel should:
- **Look inviting**: Large, colorful drop zone with animated icon
- **Provide feedback**: Visual states for drag, hover, and validation
- **Be informative**: Clear status badges and progress indicators
- **Feel modern**: Gradients, animations, shadows, and polish
- **Guide users**: Clear calls-to-action and helpful hints

## Important Notes

- **DO NOT** change the upload logic or API calls
- **DO NOT** modify the polling logic for indexing status
- **ONLY** update the UI/UX elements
- **MAINTAIN** all existing functionality
- **TEST** file upload, indexing, and navigation flows
- **ENSURE** accessibility features are preserved

## Success Criteria

The implementation is successful when:
1. All CSS styles are added to `globals.css`
2. `UploadPanel.tsx` is replaced with the new version
3. Drop zone is large and animated
4. File list shows icons and status badges
5. Upload button has gradient and hover effects
6. Progress bar has gradient and shimmer animation
7. All existing functionality works correctly
8. No console errors appear
9. Component is responsive on mobile
10. Accessibility is maintained

## Troubleshooting

If issues occur:

**Problem**: Animations don't work
- **Solution**: Ensure `@keyframes` are in `globals.css`

**Problem**: Gradient doesn't show
- **Solution**: Check that color variables are defined in `:root`

**Problem**: File input doesn't work
- **Solution**: Verify the input has `position: absolute` and covers the drop zone

**Problem**: Status badges wrong colors
- **Solution**: Ensure accent color variables are defined

**Problem**: Progress bar doesn't animate
- **Solution**: Check that shimmer animation keyframes are present

---

**End of Prompt**

