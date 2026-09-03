import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Mock authentication middleware for the local json-server dev backend.
 *
 * The dev data backend (json-server over server/db.json) exposes a `users`
 * collection (plaintext `email`/`password`) but has NO `/authentication`
 * route, so the app's email login (`POST /api/v1/authentication/sign-in`,
 * see src/app/auth/infrastructure/auth-repository.impl.ts) 404s in dev.
 *
 * This middleware handles the auth endpoints locally so login/register work
 * end-to-end against the mock. It is wired into the express prod-server
 * (server/prod-server.ts) via the exported `createAuthMiddleware(dbPath)`
 * factory, mounted with `app.use('/api/v1', authMiddleware)`.
 *
 * It is also usable from the json-server CLI `--middlewares` option: json-server
 * 0.17 loads each middleware file with `require(path.resolve(m))` and mounts it
 * with `app.use(middlewares)` BEFORE the router (lib/cli/run.js:58-66). It does
 * NOT provide the db on `req.app.locals` (that is only set on the top-level
 * `app.db` — see the same file line 65 — after the router is created), so for
 * CLI use the file's default export resolves `server/db.json` relative to this
 * file and reads it from disk with `fs` at request time (json-server's router
 * uses lowdb FileSync over the same file, so reads always see the latest
 * persisted state).
 */

/**
 * ⚠️ SEGURIDAD — MOCK SOLO PARA DESARROLLO LOCAL.
 *
 * - Los JWTs se firman con una firma FIJA (MOCK_SIGNATURE) que cualquiera
 *   puede replicar: NO son tokens válidos ante un backend real.
 * - `db.json` guarda las contraseñas en TEXTO PLANO.
 * - Este middleware solo debe montarse en entornos de desarrollo local
 *   (npm run dev / start:local contra server/db.json).
 *
 * ANTES DE desplegar prod-server.ts como backend (Render inyecta
 * NODE_ENV=production por defecto), confirmar que el mock NO queda montado:
 * envolver la creación del middleware en server/prod-server.ts con
 * `if (process.env.NODE_ENV !== 'production') { ... }`. Si el despliegue de
 * producción depende de este mock para el sign-in, el equipo debe migrar a un
 * backend con auth real ANTES de aplicar esa guarda.
 */

const SIGN_IN_SUFFIX = '/authentication/sign-in';
const SIGN_UP_SUFFIX = '/authentication/sign-up';

const HEADER = { alg: 'HS256', typ: 'JWT' };
const MOCK_SIGNATURE = Buffer.from('mock-signature', 'utf8').toString('base64url');

const b64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

/** Build a real-looking 3-part JWT whose payload carries `exp` (now + 24h). */
function buildMockToken(userId: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(userId),
    exp: nowSeconds + 24 * 60 * 60,
    iat: nowSeconds
  };
  return `${b64url(HEADER)}.${b64url(payload)}.${MOCK_SIGNATURE}`;
}

/** Minimal shape json-server stores in db.json's `users` collection. */
interface DbUser {
  id: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  membershipPlanId?: string;
  isActive?: boolean;
  statistics?: {
    totalTrips: number;
    totalDistance: number;
    totalSpent: number;
    averageRating: number;
  };
  [key: string]: unknown;
}

function matchesAuthPath(req: Request, suffix: string): boolean {
  // Handles both the mounted form (`/authentication/sign-in` when json-server
  // is mounted under /api/v1) and the full path (`/api/v1/authentication/sign-in`).
  return req.path.endsWith(suffix) && req.method === 'POST';
}

/**
 * Create the mock-auth express handler for a given db.json path.
 *
 * @param dbPath absolute path to the json-server db file (server/db.json)
 */
export function createAuthMiddleware(dbPath: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (matchesAuthPath(req, SIGN_IN_SUFFIX)) {
      handleSignIn(req, res, dbPath);
      return;
    }
    if (matchesAuthPath(req, SIGN_UP_SUFFIX)) {
      handleSignUp(req, res, dbPath);
      return;
    }
    next();
  };
}

function handleSignIn(req: Request, res: Response, dbPath: string): void {
  const { username, password } = (req.body ?? {}) as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).send('Missing username or password');
    return;
  }

  const users = readUsers(dbPath);
  const user = users.find((u) => u.email === username);

  if (!user) {
    // Unknown username -> 404 'User not found'
    // (auth-repository.impl.ts mapAuthError surfaces the raw body for non-401).
    res.status(404).send('User not found');
    return;
  }
  if (user.password !== password) {
    // Wrong password -> 401 so the UI shows 'Usuario o contraseña incorrectos'
    // (auth-repository.impl.ts mapAuthError: 401 -> 'Usuario o contraseña incorrectos').
    res.status(401).send('Invalid credentials');
    return;
  }

  res.status(200).json({ id: Number(user.id), token: buildMockToken(user.id) });
}

function handleSignUp(req: Request, res: Response, dbPath: string): void {
  const { username, password } = (req.body ?? {}) as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).send('Missing username or password');
    return;
  }

  let db: { users: DbUser[] };
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    res.status(500).send('Could not read db.json');
    return;
  }
  if (!Array.isArray(db.users)) {
    res.status(500).send('db.json has no users collection');
    return;
  }

  if (db.users.some((u) => u.email === username)) {
    // auth-repository.impl.ts register(): 409 -> raw body or 'La cuenta ya existe'.
    res.status(409).send('La cuenta ya existe');
    return;
  }

  const nextId = String(
    db.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1
  );

  db.users.push({
    id: nextId,
    email: username,
    // Fields kept minimal on purpose: this is the local MOCK user created by
    // register; the frontend immediately follows register with sign-in (see
    // email-login.component.ts) and builds the session from a minimal User
    // (toMinimalUser), so name/phone/membership/statistics are not required
    // for the flow to work. The shape stays compatible with db.json's users
    // so nothing downstream breaks (e.g. json-server exposes users over
    // GET /api/v1/users).
    name: username.split('@')[0] || username,
    password,
    phone: '',
    membershipPlanId: 'basic-plan-001',
    isActive: true,
    statistics: { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
  });

  try {
    // Persist with fs so the auto sign-in that follows register succeeds
    // against the same db.json (json-server's lowdb FileSync re-reads the file).
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
  } catch {
    res.status(500).send('Could not persist user');
    return;
  }

  // SignUpResponse contract in auth-repository.impl.ts: { id: number, username: string }.
  res.status(201).json({ id: Number(nextId), username });
}

function readUsers(dbPath: string): DbUser[] {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8')) as { users?: DbUser[] };
    return Array.isArray(db.users) ? db.users : [];
  } catch {
    return [];
  }
}

/**
 * json-server CLI `--middlewares` entry point (plain `(req, res, next)`),
 * resolving db.json relative to this file. json-server 0.17 mounts these
 * middlewares with `app.use(middlewares)` before its router (lib/cli/run.js),
 * and its lowdb FileSync adapter reads server/db.json from disk, so the two
 * always agree.
 */
const dbPath = path.join(__dirname, 'db.json');
export default createAuthMiddleware(dbPath);
