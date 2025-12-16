---

# 📑 Group Project Info
**Render Link**  
🔗 [TaskFlow GRE Project](https://taskflow-gre-1.onrender.com)  
**Project Title:** TaskFlow Project  

## Group Members
- **Section:** BSIS-3A  

### Members:
1. Amistoso, Claries Ann B.
2. Bata, Mariz S.
3. Fetil, Jaennie Cyrell N.
4. Non, Christian Jeric
5. Resentes, Shanley R.
6. Sablayan, Penelope R.


### TaskFlow

A full-stack Kanban board application similar to Trello, built with React, Node.js, Express, and MongoDB.

### Features

- Create and manage boards
- Organize tasks into lists and cards
- Drag-and-drop functionality for cards and lists
- User authentication with JWT
- Real-time updates (planned)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akwean/TaskFlow-gre.git
   cd TaskFlow-gre
   ```

2. **Set up the server:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server/` directory with the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017/taskflow(change this)
   JWT_SECRET=your_jwt_secret_here(change this)
   PORT=5000
   NODE_ENV=production
   CLIENT_ORIGIN=http://localhost:5173
   ```

3. **Set up the client:**
   ```bash
   cd ../client
   npm install
   ```
      Create a `.env` file in the `client/` directory with the following variables:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Run the application:**
   - Start the server:
     ```bash
     cd server
     npm run dev
     ```
   - In a new terminal, start the client:
     ```bash
     cd client
     npm run dev
     ```
   - Open your browser to `http://localhost:5173`


### Technologies Used

- **Frontend:** React 19, Vite, Tailwind CSS, Radix UI, @dnd-kit
- **Backend:** Node.js, Express, MongoDB with Mongoose
- **Authentication:** JWT</content>
<parameter name="filePath">/home/akwean/TaskFlow-gre/README.md
