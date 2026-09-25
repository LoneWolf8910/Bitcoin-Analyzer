import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.AUTH_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'txguard-demo-secret-key-change-in-production'
const JWT_EXPIRES_IN = '8h'

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}))
app.use(express.json())

const dbPath = path.join(__dirname, 'txguard_auth.db')
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'analyst',
    created_at INTEGER NOT NULL,
    last_login INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`)

const seedDemoUsers = () => {
  const demoUsers = [
    {
      id: 'admin',
      email: 'admin@txguard.demo',
      password: 'txguard2024',
      name: 'Admin Investigator',
      role: 'administrator'
    },
    {
      id: 'analyst',
      email: 'analyst@txguard.demo',
      password: 'analyst2024',
      name: 'Senior Analyst',
      role: 'analyst'
    },
    {
      id: 'viewer',
      email: 'viewer@txguard.demo',
      password: 'viewer2024',
      name: 'Read-Only Viewer',
      role: 'viewer'
    },
    {
      id: 'demo',
      email: 'demo@txguard.local',
      password: 'demo1234',
      name: 'Demo User',
      role: 'analyst'
    }
  ]

  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  for (const user of demoUsers) {
    const hash = bcrypt.hashSync(user.password, 10)
    insert.run(user.id, user.email, hash, user.name, user.role, Date.now())
  }
}

seedDemoUsers()

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'analyst' } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const userId = uuidv4()
    const passwordHash = bcrypt.hashSync(password, 10)
    const now = Date.now()

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name, role, now)

    const token = jwt.sign(
      { id: userId, email, name, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.status(201).json({
      user: { id: userId, email, name, role },
      token,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), user.id)

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      expiresIn: JWT_EXPIRES_IN
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json({ user })
})

app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
  res.json({ token, expiresIn: JWT_EXPIRES_IN })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-server', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`🔐 TxGuard Auth Server running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health`)
  console.log(`   Login:  POST http://localhost:${PORT}/api/auth/login`)
  console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`)
})