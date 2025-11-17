
import { VercelRequest } from '@vercel/node';
import path from 'path';
import fs from 'fs/promises';
import { Solicitacao, User } from '../types';

// IMPORTANT: Vercel has a read-only filesystem, except for the /tmp directory.
// We must copy our database file to /tmp on the first run and use that for all subsequent reads and writes.
const DB_PATH = path.join('/tmp', 'db.json');
let dbInitialized = false;

// FIX: Defined and exported a DbUser interface that includes the password.
export interface DbUser extends User {
  senha: string;
}

interface Database {
  // FIX: Used DbUser to correctly type the users array from the database.
  usuarios: DbUser[];
  solicitacoes: Solicitacao[];
}

async function initializeDb(): Promise<void> {
  if (dbInitialized) return;
  try {
    await fs.access(DB_PATH);
    dbInitialized = true;
  } catch {
    // File doesn't exist in /tmp, so copy it from the project root
    // FIX: Used __dirname for reliable path resolution in a serverless environment, resolving a TypeScript error with `process.cwd()`.
    const initialDbPath = path.join(__dirname, 'db.json');
    await fs.copyFile(initialDbPath, DB_PATH);
    dbInitialized = true;
  }
}

export async function readDb(): Promise<Database> {
  await initializeDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

export async function writeDb(data: Database): Promise<void> {
  await initializeDb();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export function getBody(req: VercelRequest): any {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
}
