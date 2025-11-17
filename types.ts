
export enum Role {
  Funcionario = 'funcionario',
  Selim = 'selim',
  Mb = 'mb',
}

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: Role;
}

export enum Status {
  EnviadoParaSelim = 'ENVIADO PARA SELIM',
  Recusado = 'RECUSADO',
  EnviadoParaMb = 'ENVIADO PARA MB',
  Pendente = 'PENDENTE',
  AguardandoFotoFinal = 'AGUARDANDO FOTO FINAL DO FUNCIONÁRIO',
  Finalizado = 'FINALIZADO PELO FUNCIONÁRIO',
}

export interface HistoricoEntry {
  status: Status;
  por: string;
  dataHora: string;
}

export interface Solicitacao {
  id: number;
  funcionarioId: number;
  funcionarioNome: string;
  fotoInicial: string;
  fotoFinal: string | null;
  latitudeInicial: number;
  longitudeInicial: number;
  enderecoInicial: string;
  dataHoraInicial: string;
  observacao?: string;
  status: Status;
  historico: HistoricoEntry[];
}
