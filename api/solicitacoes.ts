
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDb, writeDb, getBody } from './utils';
import { Solicitacao, HistoricoEntry, Status } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getSolicitacoes(req, res);
      case 'POST':
        return await createSolicitacao(req, res);
      case 'PATCH':
        return await updateSolicitacao(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

async function getSolicitacoes(req: VercelRequest, res: VercelResponse) {
  const db = await readDb();
  return res.status(200).json(db.solicitacoes);
}

async function createSolicitacao(req: VercelRequest, res: VercelResponse) {
  const db = await readDb();
  const { funcionarioId, funcionarioNome, fotoInicial, latitudeInicial, longitudeInicial, enderecoInicial, observacao } = getBody(req);

  const dataHoraAtual = new Date().toISOString();
  
  const newSolicitacao: Solicitacao = {
    id: db.solicitacoes.length > 0 ? Math.max(...db.solicitacoes.map(s => s.id)) + 1 : 1,
    funcionarioId,
    funcionarioNome,
    fotoInicial,
    latitudeInicial,
    longitudeInicial,
    enderecoInicial,
    observacao,
    dataHoraInicial: dataHoraAtual,
    fotoFinal: null,
    status: Status.EnviadoParaSelim,
    historico: [
      {
        status: Status.EnviadoParaSelim,
        por: funcionarioNome,
        dataHora: dataHoraAtual,
      },
    ],
  };

  db.solicitacoes.push(newSolicitacao);
  await writeDb(db);
  return res.status(201).json(newSolicitacao);
}

async function updateSolicitacao(req: VercelRequest, res: VercelResponse) {
  const db = await readDb();
  const { id, status, por, fotoFinal } = getBody(req);

  const solicitacaoIndex = db.solicitacoes.findIndex(s => s.id === id);
  if (solicitacaoIndex === -1) {
    return res.status(404).json({ message: 'Solicitação não encontrada.' });
  }

  const solicitacao = db.solicitacoes[solicitacaoIndex];

  solicitacao.status = status;
  if (fotoFinal) {
    solicitacao.fotoFinal = fotoFinal;
  }
  
  const newHistoricoEntry: HistoricoEntry = {
    status,
    por,
    dataHora: new Date().toISOString(),
  };
  solicitacao.historico.push(newHistoricoEntry);
  
  db.solicitacoes[solicitacaoIndex] = solicitacao;

  await writeDb(db);
  return res.status(200).json(solicitacao);
}
