# How to Start the Backend Server

## Error You're Seeing
```
GET http://localhost:5000/api/docs net::ERR_CONNECTION_REFUSED
```

This means your frontend is trying to connect to the backend at `localhost:5000`, but the backend server is not running.

## Solution 1: Start Backend Locally (Recommended for Development)

### Step 1: Open a New Terminal
Open a separate terminal window/tab

### Step 2: Navigate to Backend Directory
```bash
cd backend
```

### Step 3: Install Dependencies (if not already done)
```bash
npm install
```

### Step 4: Start the Development Server
```bash
npm run dev
```

You should see:
```
📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'mda***', passConfigured: true }
✅ Email server is ready to send messages
Server running on port 5000
```

### Step 5: Keep This Terminal Running
Leave this terminal open while you develop. The backend will auto-reload when you make changes.

## Solution 2: Use Production Backend (Quick Test)

If you just want to test the frontend without running the backend locally:

### Update frontend/.env.local
Change:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

To:
```env
NEXT_PUBLIC_BACKEND_URL=https://doc-signer-1qwd.onrender.com
```

### Restart Frontend
Stop your frontend (Ctrl+C) and restart:
```bash
npm run dev
```

**Note**: Remember to change it back to `http://localhost:5000` when you want to develop backend features.

## Solution 3: Run Both Servers (Full Development Setup)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Now you have:
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000

## Troubleshooting

### "nodemon: command not found"
Install dependencies:
```bash
cd backend
npm install
```

### "Port 5000 already in use"
Kill the process using port 5000:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

Or use a different port in `backend/.env`:
```env
PORT=5001
```

And update `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

### Backend starts but crashes immediately
Check the error message. Common issues:
- Missing environment variables in `backend/.env`
- Database connection issues
- Port already in use

### Frontend still shows connection refused
1. Make sure backend is running (check terminal)
2. Verify backend is on port 5000
3. Check `frontend/.env.local` has correct URL
4. Restart frontend after changing .env

## Recommended Development Workflow

1. **Start backend first**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Then start frontend** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Keep both running** while you develop

4. **Backend auto-reloads** when you change TypeScript files

5. **Frontend auto-reloads** when you change React components

## Quick Commands Reference

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
```

## Environment Files

Make sure you have:

### backend/.env
```env
SUPABASE_URL=https://epxgyaslkiqyozvdnaec.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_ANON_KEY=sb_publishable_...
JWT_SECRET=your-jwt-secret
PORT=5000
FRONTEND_URL=http://localhost:3000
EMAIL_USER=mdahmadrazakhan751@gmail.com
EMAIL_PASS=pqotmftlgdejgkgd
```

### frontend/.env.local
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://epxgyaslkiqyozvdnaec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_p6bKHuxNfNX3PMnebR-dKw_keKc3D2X
```

## VS Code Tips

### Run Both Servers in VS Code
1. Open integrated terminal (Ctrl+`)
2. Split terminal (click split icon)
3. In left terminal: `cd backend && npm run dev`
4. In right terminal: `cd frontend && npm run dev`

### Or Use VS Code Tasks
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "isBackground": true
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true
    },
    {
      "label": "Start All",
      "dependsOn": ["Start Backend", "Start Frontend"]
    }
  ]
}
```

Then: Terminal → Run Task → Start All
