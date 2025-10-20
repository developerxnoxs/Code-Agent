# Design Guidelines: Autonomous AI Agent Workspace

## Design Approach
**Reference-Based: Replit + VS Code + Linear Hybrid**
- Primary inspiration: Replit's workspace layout and panel system
- Secondary references: VS Code's editor aesthetics, Linear's clean information hierarchy
- Rationale: Developer-focused application requiring high information density, multi-panel management, and professional workflow optimization

## Core Design Principles
1. **Information Hierarchy**: Clear separation between AI agent status, code editor, terminal, and file explorer
2. **Workspace Efficiency**: Maximize usable space while maintaining breathability
3. **Professional Aesthetics**: Dark-first design optimized for extended coding sessions
4. **Status Visibility**: Always-visible AI agent activity indicators and logs

## Color Palette

### Dark Mode (Primary)
- **Background Layers**:
  - Base: 220 15% 8% (deep navy-black)
  - Panel: 220 15% 11% (elevated panels)
  - Elevated: 220 15% 14% (dropdowns, modals)
  
- **Primary Brand**: 210 100% 60% (bright blue - AI active state)
- **Success/Active**: 142 70% 55% (green - operations complete)
- **Warning**: 38 95% 65% (amber - AI processing)
- **Error**: 0 85% 65% (red - failures)

- **Text Colors**:
  - Primary: 0 0% 95%
  - Secondary: 0 0% 65%
  - Muted: 0 0% 45%
  - Code syntax: Follow VS Code Dark+ theme

### Accent Colors
- **AI Agent**: 280 65% 65% (purple - autonomous actions)
- **Terminal**: 142 70% 55% (green - command success)
- **File Changes**: 38 95% 65% (amber - unsaved/modified)

## Typography

### Font Families
- **UI Text**: 'Inter', system-ui, sans-serif
- **Code/Terminal**: 'JetBrains Mono', 'Fira Code', monospace
- **Agent Messages**: 'Inter', sans-serif with distinct styling

### Type Scale
- **Hero/Agent Status**: text-2xl (24px) font-semibold
- **Panel Headers**: text-sm (14px) font-medium uppercase tracking-wide
- **Body/Code**: text-sm (14px) font-normal
- **Metadata**: text-xs (12px) text-muted

## Layout System

### Spacing Primitives
**Consistent spacing using tailwind units: 2, 3, 4, 6, 8**
- Tight spacing (p-2): Within buttons, small gaps
- Standard spacing (p-4, gap-4): Between panel sections
- Large spacing (p-6, p-8): Panel padding, major section separation

### Workspace Structure
```
┌─────────────────────────────────────────────────┐
│ Top Navigation (AI Status Bar) - h-12          │
├──────────┬──────────────────────────┬───────────┤
│ Sidebar  │  Main Editor/Canvas      │  Right    │
│ w-64     │  flex-1                  │  Panel    │
│          │                          │  w-80     │
│ - Files  │  - Code Editor           │  - Agent  │
│ - DB     │  - Terminal              │    Console│
│ - Secrets│  - Preview               │  - Logs   │
│          │                          │  - Tasks  │
└──────────┴──────────────────────────┴───────────┘
```

### Panel System
- **Resizable Panels**: All panels support drag-to-resize
- **Collapsible Sidebars**: Icons-only collapsed state (w-12)
- **Tab Navigation**: Editor and terminal use tab system
- **Split Views**: Main canvas supports horizontal/vertical splits

## Component Library

### Navigation
- **Top Bar**: Fixed header with AI agent status indicator (pulsing when active), breadcrumb navigation, global actions
- **Sidebar**: Icon + label navigation with active state highlighting (border-l-2 accent color)
- **Tabs**: Closeable file/terminal tabs with unsaved indicators (dot or colored bar)

### AI Agent Components
- **Status Card**: Floating card showing current autonomous task with animated progress
- **Action Stream**: Real-time log of AI decisions and actions taken
- **Task Queue**: Vertical list showing pending autonomous operations
- **Intervention Toggle**: Prominent switch to enable/disable autonomous mode

### File Manager
- **Tree View**: Nested file/folder structure with indent guides
- **File Icons**: Type-specific icons (JS, CSS, JSON, etc.)
- **Context Menu**: Right-click actions (rename, delete, new file)
- **Drag & Drop**: Visual feedback for file movement

### Terminal/Console
- **Multi-Terminal Tabs**: Create/switch between terminal instances
- **Command History**: Accessible via up/down arrows
- **Output Formatting**: Syntax highlighting for errors/warnings
- **Integrated AI Commands**: Special prompt for AI agent commands

### Database Panel
- **Schema Viewer**: Tree structure of tables/collections
- **Query Builder**: Visual interface + raw SQL/query mode
- **Data Grid**: Editable table view with pagination
- **AI Assistant**: Suggest queries based on context

### Secrets Manager
- **Key-Value List**: Masked values with reveal toggle
- **Environment Selector**: Switch between dev/staging/prod
- **Add/Edit Modal**: Secure input with validation
- **Access Logs**: Track which services accessed secrets

### Workflow Engine
- **Visual Canvas**: Node-based workflow builder
- **Step Cards**: Each autonomous step as draggable card
- **Connection Lines**: Flow visualization between steps
- **Execution Indicators**: Highlight active/completed/failed steps

### Code Editor
- **Syntax Highlighting**: Language-specific coloring
- **Line Numbers**: With git diff indicators
- **Minimap**: Scrollable overview (right gutter)
- **AI Suggestions**: Inline code suggestions with accept/reject

## Interactive States

### Buttons
- **Primary**: bg-primary hover:brightness-110 transition-all
- **Secondary**: bg-panel hover:bg-elevated border border-border
- **Ghost**: hover:bg-elevated text-secondary
- **Danger**: bg-error hover:brightness-110

### Panels
- **Focus State**: Subtle border-2 border-primary/30
- **Hover**: Slight elevation shadow-lg
- **Dragging**: opacity-50 cursor-move

### AI Activity Indicators
- **Processing**: Animated gradient border or pulsing glow
- **Success**: Green checkmark with brief flash
- **Error**: Red shake animation with error message

## Animations

**Minimal and Purposeful**
- Panel transitions: 200ms ease-in-out
- AI status changes: 300ms with smooth fade
- File tree expand/collapse: 150ms
- Loading states: Subtle skeleton screens or progress bars
- **Avoid**: Excessive scroll animations, flashy transitions

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all panels
- **Focus Indicators**: Clear visible focus rings (ring-2 ring-primary)
- **Screen Reader**: Proper ARIA labels for all interactive elements
- **Contrast**: All text meets WCAG AA standards on dark backgrounds
- **Resizable Text**: Layout adapts to browser zoom levels

## Special Considerations

### Real-time Updates
- **WebSocket Indicators**: Live connection status in top bar
- **File Sync**: Visual feedback when files auto-save or sync
- **Agent Activity**: Non-intrusive notifications for completed tasks

### Performance
- **Virtual Scrolling**: For long file lists and terminal output
- **Code Splitting**: Lazy load panels on demand
- **Optimistic UI**: Immediate feedback before server confirmation

### Trust & Safety
- **Autonomous Mode Warning**: Clear indicator when AI has full control
- **Action Confirmation**: Critical operations show preview before execution
- **Undo/Rollback**: Quick access to revert AI actions
- **Activity Audit**: Comprehensive log of all autonomous operations