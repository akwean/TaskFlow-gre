# Copilot Instructions for TaskFlow

Welcome to the TaskFlow codebase! This document provides essential guidance for AI coding agents to be productive in this project. TaskFlow is a full-stack Kanban board application built with React, Node.js, Express, and MongoDB.

## Project Overview

### Architecture
- **Frontend (Client):**
  - Built with React 19, Vite, and Tailwind CSS.
  - Located in the `client/` directory.
  - Key components:
    - `src/components/`: Reusable UI components (e.g., `CardItem`, `CardModal`).
    - `src/pages/`: Page-level components (e.g., `Dashboard`, `BoardView`).
    - `src/context/AuthContext.jsx`: Manages user authentication state.
  - Styling:
    - Tailwind CSS for utility-first styling.
    - `src/index.css` and `src/App.css` for global styles.

- **Backend (Server):**
  - Built with Node.js, Express, and MongoDB.
  - Located in the `server/` directory.
  - Key modules:
    - `routes/`: API endpoints (e.g., `auth.js`, `boards.js`).
    - `controllers/`: Business logic for routes (e.g., `authController.js`).
    - `models/`: Mongoose models for MongoDB (e.g., `User.js`, `Board.js`).
    - `middleware/`: Middleware functions (e.g., `authMiddleware.js`).

### Data Flow
- **Frontend:**
  - State management is handled locally using React Context (e.g., `AuthContext`).
  - API calls are made via `lib/api.js`.
- **Backend:**
  - RESTful API design.
  - MongoDB is used for persistent storage, with Mongoose for schema definitions.

## Developer Workflows

### Setting Up the Project
1. Clone the repository:
   ```bash
   git clone https://github.com/akwean/TaskFlow-gre.git
   cd TaskFlow-gre
   ```
2. Set up the server:
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file with:
   ```
   MONGO_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```
3. Set up the client:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application
- Start the server:
  ```bash
  cd server
  npm run dev
  ```
- Start the client:
  ```bash
  cd client
  npm run dev
  ```
- Open the app at `http://localhost:5173`.

### Testing
- **Backend:** Add tests in `server/tests/` (not yet implemented).
- **Frontend:** Add tests in `client/src/__tests__/` (not yet implemented).

### Debugging
- Use `console.log` for quick debugging.
- For the backend, use `nodemon` for live reloads.
- For the frontend, use Vite's hot module replacement (HMR).

## Project-Specific Conventions

### Frontend
- **Component Structure:**
  - Use functional components with hooks.
  - Place reusable components in `src/components/`.
  - Group related components in subdirectories (e.g., `ui/` for low-level UI components).
- **Styling:**
  - Use Tailwind CSS classes directly in JSX.
  - Avoid inline styles unless necessary.

### Backend
- **Routing:**
  - Define routes in `routes/`.
  - Use controllers in `controllers/` to separate business logic.
- **Error Handling:**
  - Use `next(err)` to pass errors to Express's error handler.

## Integration Points
- **Frontend to Backend Communication:**
  - API calls are centralized in `client/src/lib/api.js`.
- **Authentication:**
  - JWT-based authentication.
  - `AuthContext` manages the auth state on the frontend.
  - `authMiddleware.js` protects routes on the backend.

## External Dependencies
- **Frontend:**
  - `@dnd-kit`: Drag-and-drop functionality.
  - `Radix UI`: Accessible UI components.
- **Backend:**
  - `mongoose`: MongoDB object modeling.
  - `jsonwebtoken`: JWT handling.

## Examples

### Adding a New API Endpoint
1. Create a new route in `server/routes/` (e.g., `tasks.js`).
2. Add the corresponding controller in `server/controllers/`.
3. Update the frontend API calls in `client/src/lib/api.js`.

### Creating a New Component
1. Add the component in `client/src/components/`.
2. Import and use it in the relevant page (e.g., `Dashboard.jsx`).
3. Style it using Tailwind CSS.

---

## AI Editing Safeguards

To preserve code integrity and prevent destructive edits, all AI agents must follow these rules when modifying the TaskFlow codebase:

- Do not overwrite existing logic unless explicitly instructed. Always wrap new logic in conditionals or modular functions to avoid breaking current behavior.
- Preserve component signatures and props. Avoid renaming or restructuring unless the change is scoped and justified.
- Avoid mass refactors. Large-scale changes (e.g., file renames, directory restructuring) must be proposed first via comments or PR notes.
- Respect Tailwind and Radix UI conventions. Do not replace utility classes or component structures with custom styles unless requested.
- Never delete files, routes, or models. Use comments to suggest deprecation or alternatives.
- Frontend edits must preserve HMR compatibility. Avoid changes that break Vite’s hot reload unless necessary.
- Backend edits must preserve Express middleware chains and Mongoose schema integrity.

If unsure, prefer commenting suggestions over direct edits. When in doubt, ask for clarification before proceeding.

For questions or contributions, refer to the `README.md` or open an issue in the repository.