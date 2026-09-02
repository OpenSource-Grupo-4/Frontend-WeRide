import path from 'path';
import express from 'express';
import compression from 'compression';
import jsonServer from 'json-server';
import cors from 'cors';

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
// Mount json-server under /api/v1 so requests like /api/v1/vehicles resolve against db.json,
// mirroring the live backend layout (https://db-weride-4.onrender.com/api/v1).
app.use('/api/v1', middlewares, router);

app.use((req, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

/**
 * TESTS PARA PRODUCCION
 */
const port = process.env['PORT'] || 8080;
app.listen(port, () => {
});
