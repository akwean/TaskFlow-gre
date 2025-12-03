# TaskFlow AI Coding Guidelines

## Architecture Overview
TaskFlow is a full-stack Kanban board application similar to Trello, built with:
- **Frontend**: React 19 + Vite, Tailwind CSS, Radix UI components, @dnd-kit for drag-and-drop
- **Backend**: Node.js + Express, MongoDB with Mongoose, JWT authentication
- **Data Model**: User → Board (with members/roles) → List (columns) → Card (tasks with labels, checklists, attachments)

## Key Patterns & Conventions

### API Communication
- Use `axios` instance from `client/src/lib/api.js` with automatic JWT token injection
- Base URL: `http://localhost:5000/api`
- Example: `api.get('/boards/${boardId}/lists')` for fetching board lists

### Authentication & State Management
- Auth via `AuthContext` (`client/src/context/AuthContext.jsx`)
- User state: `{ user, login, register, logout, loading }`
- Protect routes with `<PrivateRoute>` component in `App.jsx`
- Token stored in `localStorage` as 'token'

### Component Structure
- Pages in `client/src/pages/` (Dashboard, BoardView, Login, Register)
- Reusable components in `client/src/components/` (ListColumn, CardItem, CardModal)
- UI primitives in `client/src/components/ui/` (button, input, dialog via Radix)
- Import path aliases: `@/` maps to `src/` (configured in `vite.config.js`)

### Drag & Drop Implementation
- Use `@dnd-kit/core` with `DndContext`, `SortableContext`, `useSortable`, `useDroppable`
- Cards are draggable between lists; implement in `BoardView.jsx` with `handleDragEnd`
- Example: Move card between lists by updating `card.list` via `api.put('/cards/${cardId}', { list: newListId })`

### Data Fetching & State Updates
- Fetch related data in parallel: `Promise.all([api.get('/boards'), api.get('/lists')])`
- Update local state optimistically, then sync with server
- Example in `BoardView.jsx`: After creating card, update `cards` state immediately

### Backend Patterns
- Controllers in `server/controllers/` with JSDoc comments for routes/access
- Models in `server/models/` with Mongoose schemas and pre-save hooks (e.g., password hashing in User.js)
- Middleware: `authMiddleware.js` for JWT verification, populates `req.user`
- Access control: Check `req.user._id` against owner/members with roles

### Database Relationships
- Boards have owner + members array with roles ('admin', 'member')
- Lists belong to boards, ordered by `order` field
- Cards belong to lists, ordered by `order` field
- Use `populate()` for joining: `Board.find().populate('owner', 'username email avatar')`

## Development Workflow
1. **Setup**: Install dependencies in both `client/` and `server/` with `npm install`
2. **Database**: Set `MONGO_URI` in `server/.env` (e.g., `mongodb://localhost:27017/taskflow`)
3. **Run**: `npm run dev` in `server/` (port 5000), then `npm run dev` in `client/` (port 5173)
4. **Build**: `npm run build` in `client/` for production bundle

## Common Tasks
- **Add new card field**: Update `Card.js` model, then `CardModal.jsx` form and display components
- **New API endpoint**: Add route in `server/routes/`, controller in `controllers/`, update client API calls
- **UI component**: Use Tailwind classes + Radix primitives, follow existing patterns in `components/ui/`
- **Drag enhancement**: Extend `handleDragEnd` in `BoardView.jsx` for reordering within lists (update `order` field)

## Environment & Deployment
- Environment variables in `server/.env`: `MONGO_URI`, `JWT_SECRET`, `PORT`
- CORS enabled for client development
- Production: Build client, serve static files from Express

# Custom Instructions: Frontend UI/UX and Consistency Agent

## 1. Core Focus: User Interface and Experience (UI/UX)
* **PRIORITY ONE:** When suggesting code or changes, focus overwhelmingly on the **frontend (UI) code** first.
* **AESTHETICS:** All new components must adhere to the **Atomic Design** pattern and use the project's existing CSS/Tailwind utility classes for styling. Do not introduce new, custom colors or fonts unless explicitly requested.
* **CONSISTENCY:** Reference and reuse existing structural components (e.g., `Button`, `Card`, `InputField`) before attempting to write new ones.
* **RESPONSIVENESS:** All components must be inherently responsive. Assume a mobile-first approach unless the user explicitly specifies a desktop-only design.
* **ACCESSIBILITY:** Ensure all interactive elements include proper ARIA attributes, semantic HTML (e.g., `<button>` instead of `<div>` with click handler), and keyboard navigation support.

## 2. Safety and Non-Destructive Editing (CRITICAL)
* **THE GOLDEN RULE:** **NEVER DELETE or REMOVE** existing code blocks, functions, or imports unless the user specifically and clearly commands, "Delete X" or "Remove Y."
* **DO NOT RE-FACTOR IMPORTS:** If adding a function to a file, add new imports below existing ones. Do not rearrange, combine, or re-factor the import statements of an existing file.
* **USE COMMENTS FOR STUBS:** If a function or logic is outside the current request's scope (e.g., a backend call), use a simple, descriptive comment placeholder (e.g., `// TODO: Implement backend API call here`) instead of attempting to generate complex or unnecessary code.
* **REVIEW BEFORE EDIT:** Before performing an edit that touches an existing function body, you must briefly state in a comment or plan: `// CHECKING: Ensuring existing logic is preserved and extended.`

## 3. Consistency (Frontend/Backend Contract)
* **DATA PARITY:** Use `camelCase` for all API request and response fields. If the backend uses `snake_case` (e.g., `user_id`), the frontend interface must define it as `userId`.
* **TYPE CHECKING:** If the project uses TypeScript, all responses must include the new or updated interfaces/types that match the proposed code change. Do not propose code without the corresponding type definition.

---

### How to Use This Agent Effectively

1.  **Create the File:** Save the content above as **`.github/copilot-instructions.md`** in your repository's root directory.
2.  **Explicitly Reference Consistency:** When you start a chat, remind Copilot of your priority by referencing the file. For example:
    * **Prompt:** "Based on our custom instructions, create a new `UserProfile` component that displays the user's name and bio."
3.  **Monitor the Output:** Since you've added safety rules (Section 2), pay attention to how Copilot implements them—it should now be highly defensive about touching existing code.