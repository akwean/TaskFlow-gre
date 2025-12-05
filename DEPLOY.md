# Deploy to Render

This guide deploys TaskFlow to Render with:
- A Node.js Web Service for the API + Socket.IO
- A Static Site for the React frontend

## Prereqs
- MongoDB Atlas connection string (recommended)
- Render account

## 1) Push to GitHub
Ensure your repository is on GitHub.

## 2) Create the API service
1. In Render, create a **Web Service**.
2. Select your repo and set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Set **Environment**: `Node`
6. Add **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=<your mongodb atlas uri>`
   - `JWT_SECRET=<random string>`
   - `CLIENT_ORIGIN=https://<your-static-site>.onrender.com`
7. Save. Healthcheck path is `/healthz`.

## 3) Create the Static Site
1. In Render, create a **Static Site**.
2. Set **Root Directory** to `client`.
3. Set **Build Command**: `npm install && npm run build`
4. Set **Publish Directory**: `dist`
5. After the site is created, note its URL (e.g., `https://taskflow-web.onrender.com`).

## 4) Configure the client API base URL
Create `client/.env.production` with:
```
VITE_API_BASE_URL=https://<your-api-service>.onrender.com/api
```
Then re-deploy the static site (Render will rebuild on pushes).

## Notes
- CORS is restricted to `CLIENT_ORIGIN`. For multiple origins, set as comma-separated: `https://site1,https://site2`.
- Socket.IO uses the same `CLIENT_ORIGIN` list.
- In production, the server can also serve the built frontend if `client/dist` is present within the server. With separate Static hosting, you don't need this, but it’s supported.

## Troubleshooting
- If the frontend can't reach the API, verify `VITE_API_BASE_URL` and CORS `CLIENT_ORIGIN`.
- If websockets fail, ensure both services use HTTPS and the API allows the static site origin.
- Check logs in Render for the API service.
