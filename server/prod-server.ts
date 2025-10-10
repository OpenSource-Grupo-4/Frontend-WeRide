import * as path from 'path';
import * as express from 'express';
import * as compression from 'compression';
import * as jsonServer from 'json-server';

const app = express();
app.use(compression());

const distFolder = path.join(__dirname, '..', 'dist', 'frontend-we-ride', 'browser');
app.use(express.static(distFolder));

const dbFile = path.join(__dirname, 'db.json');
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults();
app.use('/api', middlewares, router);

app.get('*', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

const port = process.env['PORT'] || 8080;
app.listen(port, () => {
  console.log(`Web: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});