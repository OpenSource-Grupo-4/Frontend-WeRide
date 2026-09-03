import path from 'path';
import express from 'express';
import compression from 'compression';
import jsonServer from 'json-server';
import cors from 'cors';
import { createAuthMiddleware } from './auth-middleware';

const app = express();

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:8080', 'https://db-weride-4.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());

const distFolder = path.join(__dirname, '..', 'dist', 'Frontend-WeRide', 'browser');
app.use(express.static(distFolder));

const dbFile = path.join(__dirname, 'db.json');
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults({
  noCors: true
});
// Mock-auth middleware handles POST /api/v1/authentication/sign-in and
// /sign-up against db.json before the json-server router sees them (the db
// has a `users` collection but no `/authentication` route — see
// server/auth-middleware.ts).
const authMiddleware = createAuthMiddleware(dbFile);
// Mount json-server under /api/v1 so requests like /api/v1/vehicles resolve against db.json,
// mirroring the live backend layout (https://backend-weride-2uvw.onrender.com/api/v1).
// jsonServer.bodyParser must run before the auth middleware so req.body is
// populated for the mock sign-in/sign-up handlers (json-server's own defaults
// bodyParser only runs after this point; body-parser skips already-parsed bodies).
app.use('/api/v1', jsonServer.bodyParser, authMiddleware, middlewares, router);

app.use((req, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

/**
 * TESTS PARA PRODUCCION
 */
const port = process.env['PORT'] || 8080;
app.listen(port, () => {
});
