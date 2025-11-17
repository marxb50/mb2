
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDb, getBody } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = getBody(req);
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const db = await readDb();
    const user = db.usuarios.find(u => u.email === email && u.senha === password);

    if (user) {
      // In a real app, never send the password back
      const { senha, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } else {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}
