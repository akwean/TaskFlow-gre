# Copilot Instructions — TaskFlow (concise)

TaskFlow is a full-stack real-time Kanban app: React (Vite) frontend + Node/Express backend + MongoDB + Socket.IO for realtime. This file captures the minimal, actionable knowledge an AI coding agent needs to be productive here.

Quick run
- Backend dev: `cd server && npm install && npm run dev` (nodemon, port 5000)
- Frontend dev: `cd client && npm install && npm run dev` (Vite, port 5173)
- Env: `server/.env` must include `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`. Frontend uses `VITE_API_BASE_URL`.

Architecture & data flow (short)
- REST API for CRUD: frontend calls `client/src/lib/api.js` (axios + token interceptor). Example: `api.post('/api/lists/:listId/cards', data)`.
- Realtime: `server/realtime/socket.js` (server) and `client/src/lib/realtime.js` (client) use Socket.IO. Controllers emit via `emitToBoard(boardId, event, payload)` after DB changes.
- Auth: JWT stored in `localStorage` and added to requests by `api.js`. Socket auth uses `socket.handshake.auth.token` and is verified server-side in `socket.js`.

Project-specific conventions
- Dual-channel sync: controllers always emit socket events after successful DB writes. Search for `emitToBoard` in `server/controllers/*` when adding mutations.
- Rooms: `board:${boardId}` for board-scoped events, `user:${userId}` for user-targeted messages. Presence is in `socket.js` (see `emitPresence`).
- Offline/robust updates: `client/src/lib/api.js` implements `queuedPut(url, data)` for drag-and-drop position updates — use it for position mutations when resiliency matters.
- Auth checks: controllers expect owner or member access; follow pattern used in `server/realtime/socket.js` when validating board joins.
- Path aliases: `@/` → `client/src/` (configured in `jsconfig.json` / `vite.config.js`) — prefer `@/components/...` and `@/lib/...` imports.

Testing & mocks
- Frontend: Vitest (`cd client && npm test`). Tests mock `@/lib/api` and `@/context/AuthContext` (see `client/src/__tests__/dashboard.test.jsx`).

Files to inspect for common changes
- Add a realtime feature: update `server/models/*`, `server/controllers/*`, `server/routes/*`, then call `emitToBoard` in the controller. Update client listeners in `BoardView.jsx` or the relevant page.
- API surface: `server/index.js` (routes registration) and controllers under `server/controllers/`.
- Socket behaviour: `server/realtime/socket.js` — editing this requires manual multi-tab testing for presence/cursor behaviors.

Safety & editing safeguards (do not change without verification)
- Do not rename Mongoose ref strings (e.g., `ref: 'Model'`) — breaks `.populate()` calls.
- Do not remove `protect`/auth middleware on private routes.
- Avoid removing socket event emission patterns — missing emits break cross-client sync.
- Changes to socket handlers need manual browser tests (multiple tabs) to verify presence, cursor, and typing indicators.

Examples (copy when needed)
- Emit after DB save (controller):
  const { emitToBoard } = require('../realtime/socket');
  emitToBoard(boardId, 'card:created', { card });
- Client socket initialization (use `getSocket()`): see `client/src/lib/realtime.js`.

When uncertain
- Propose changes in a short comment and request manual acceptance before large refactors (especially to `socket.js`, auth middleware, or Mongoose refs).

If you want, I can expand this into a longer guide preserving old content or add short snippets for common edits (controllers, new model, or client listeners). Please tell me which sections need more detail.
# Copilot Instructions for TaskFlow

TaskFlow is a full-stack real-time Kanban board with React 19, Vite, Node.js/Express, MongoDB, and Socket.IO. This guide helps AI agents understand non-obvious patterns and architectural decisions.

## Architecture Overview

**Dual-Channel Communication:** HTTP REST API + WebSocket (Socket.IO)
- REST API (`client/src/lib/api.js`) for CRUD operations with JWT auth via `Authorization: Bearer <token>`
- Socket.IO (`client/src/lib/realtime.js`, `server/realtime/socket.js`) for live collaboration features:
  - Presence tracking (who's viewing each board)
  - Cursor positions and typing indicators
  - Broadcast mutations (e.g., `board:created`, `list:updated`)
  - Per-list focus counts

**State Management Pattern:**
- Local component state for UI (no Redux/Zustand)
- `AuthContext` for global user state with JWT in `localStorage`
- Real-time listeners synchronize state: e.g., `BoardView.jsx` subscribes to `list:created`, `card:updated` events to keep UI in sync

**Data Flow Example (Creating a Card):**
1. User action → `api.post('/api/lists/:listId/cards', data)` in component
2. Backend controller creates card in MongoDB
3. Controller calls `emitToBoard(boardId, 'card:created', { card })` to broadcast
4. All connected clients in that board's Socket.IO room receive event and update local state

## Critical Developer Workflows

**Running the app (2 terminals required):**
```bash
# Terminal 1: Backend (must start first)
cd server && npm run dev  # nodemon on port 5000

# Terminal 2: Frontend
cd client && npm run dev  # Vite on port 5173
```

**Environment Setup:**
`server/.env` must include:
```
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=<secret>
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

**Testing:**
- Frontend: `cd client && npm test` (Vitest with jsdom, setup in `vitest.setup.js`)
- Mock pattern in `client/src/__tests__/dashboard.test.jsx`:
  - Mock `@/lib/api` and `@/context/AuthContext` to avoid async loading states
  - Use `MemoryRouter` for route-aware components

## Project-Specific Patterns

**1. Socket.IO Room Structure:**
- `board:${boardId}` - All viewers of a board join this room for board-scoped events
- `user:${userId}` - Personal room for user-specific notifications (e.g., board invites)
- Authentication: JWT sent via `socket.handshake.auth.token` and verified in `server/realtime/socket.js`

**2. API Interceptors & Offline Queue:**
`client/src/lib/api.js` has an offline mutation queue:
- `queuedPut(url, data)` queues requests when offline, auto-retries on reconnect
- Used for resilient drag-and-drop position updates

**3. Controller → Socket.IO Broadcast Pattern:**
All mutation controllers (`boardController.js`, `listController.js`, `cardController.js`) follow:
```javascript
// After DB update:
const { emitToBoard } = require('../realtime/socket');
emitToBoard(boardId, 'resource:action', { resource });
```
When adding new features, emit corresponding events after successful DB operations.

**4. Drag-and-Drop with @dnd-kit:**
`BoardView.jsx` uses `DndContext` for cards/lists:
- `SortableContext` with `horizontalListSortingStrategy` for lists
- Optimistic updates (UI changes before API call) with rollback on error
- Position updates use `queuedPut` for offline resilience

**5. Component Composition with Radix UI:**
Low-level UI in `components/ui/` wraps Radix primitives:
- `Dialog`, `Button`, `Input` expose Radix's accessible API
- Styled with Tailwind using `cn()` utility from `lib/utils.js` (clsx + tailwind-merge)
- Always import from `@/components/ui/*`, not Radix directly

**6. Access Control Pattern:**
Every protected route/controller checks:
```javascript
const hasAccess = board.owner.equals(req.user._id) || 
  board.members.some(m => m.user.equals(req.user._id));
if (!hasAccess) return res.status(403).json({ message: 'Access denied' });
```
Socket.IO validates board access in `join-board` event handler before allowing room join.

**7. Frontend Testing Mocks:**
Always mock these in Vitest tests:
```javascript
vi.mock('@/lib/api', () => ({ default: { get: vi.fn(() => ({ data: [] })) } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: {}, loading: false }) }));
```

## Integration Points

**Routes Registration (`server/index.js`):**
```javascript
app.use('/api/boards/:boardId/lists', require('./routes/lists')); // Nested resource
app.use('/api/lists', require('./routes/lists')); // Top-level for direct access
```
Both patterns coexist. Use nested routes when context matters (e.g., creating lists for a board).

**Mongoose Population:**
Controllers always populate user references:
```javascript
.populate('owner', 'username email avatar')
.populate('members.user', 'username email avatar')
```
Prevents exposing password hashes, keeps payloads small.

**Path Aliases:**
- `@/` resolves to `client/src/` (configured in `vite.config.js` and `jsconfig.json`)
- Always use `@/components/...`, `@/lib/...`, never relative paths across directories

## Common Pitfalls

- **Forgetting Socket.IO broadcasts:** New mutations won't sync across clients. Always call `emitToBoard` in controllers.
- **Breaking Mongoose refs:** Models use `mongoose.Schema.Types.ObjectId, ref: 'Model'`. Don't change ref strings or populate will break.
- **HMR issues:** Inline arrow functions in `useEffect` dependencies can break Vite HMR. Extract to named functions when possible.
- **Auth token sync:** `AuthContext` and `api.js` both read from `localStorage.getItem('token')`. Keep them consistent.

## Adding New Features

**New Real-Time Feature (e.g., comments):**
1. Add model in `server/models/Comment.js`
2. Create controller/routes in `server/controllers/commentController.js`, `server/routes/comments.js`
3. Emit events: `emitToBoard(boardId, 'comment:created', { comment })`
4. Frontend: Subscribe in `BoardView.jsx` or relevant component:
   ```javascript
   onSocket('comment:created', ({ comment }) => setComments(prev => [...prev, comment]));
   ```
5. Clean up listener on unmount: `offSocket('comment:created', handler)`

**New UI Component:**
1. Place in `components/` (shared) or inline if page-specific
2. Use Tailwind classes directly, no CSS modules
3. For primitives, wrap Radix in `components/ui/` following existing pattern

## AI Editing Safeguards

- **Never delete Socket.IO event handlers** without checking all listeners across client/server
- **Preserve middleware chains:** `protect` middleware must remain on all private routes
- **Don't rename Mongoose model refs** (breaks population throughout codebase)
- **Avoid inline styles:** Use Tailwind utilities or extend `tailwind.config.js`
- **Test real-time features:** Changes to socket handlers require manual browser testing with multiple tabs

When uncertain about a change's scope, propose it in a comment rather than implementing directly.
