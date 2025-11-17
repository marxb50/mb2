
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDb, writeDb, getBody } from './utils';
import { Role } from '../types';
// FIX: Imported DbUser type to correctly handle user objects with passwords.
import type { DbUser } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { nome, email, senha } = getBody(req);
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const db = await readDb();

    if (db.usuarios.some(u => u.email === email)) {
      return res.status(409).json({ message: 'Este email já está em uso.' });
    }

    // FIX: Used DbUser type for the new user object to include the 'senha' property, resolving TypeScript errors.
    const newUser: DbUser = {
      id: db.usuarios.length > 0 ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1,
      nome,
      email,
      senha, // In a real app, hash the password!
      tipo: Role.Funcionario,
    };

    db.usuarios.push(newUser);
    await writeDb(db);

    const { senha: _, ...userToReturn } = newUser;
    return res.status(201).json(userToReturn);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}
