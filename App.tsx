
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, Role, Solicitacao, Status, HistoricoEntry } from './types';

// --- ICONS (HeroIcons) ---
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CheckCircleIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const XCircleIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LocationMarkerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// --- AUTHENTICATION CONTEXT ---
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // FIX: Decoupled login from navigation. Navigation is now handled by the component that calls login.
  const login = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // FIX: Decoupled logout from navigation. Navigation is now handled by the component that calls logout.
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  return useContext(AuthContext);
};


// --- API HELPER FUNCTIONS ---
// Note: In a larger app, these would be in a separate services/api.ts file.
async function apiFetch(url: string, options: RequestInit = {}) {
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || 'Falha na requisição');
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

// --- UTILITY FUNCTIONS ---
const getStatusColor = (status: Status) => {
  switch (status) {
    case Status.EnviadoParaSelim: return 'bg-blue-100 text-blue-800';
    case Status.Recusado: return 'bg-red-100 text-red-800';
    case Status.EnviadoParaMb: return 'bg-indigo-100 text-indigo-800';
    case Status.Pendente: return 'bg-yellow-100 text-yellow-800';
    case Status.AguardandoFotoFinal: return 'bg-purple-100 text-purple-800';
    case Status.Finalizado: return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getAddressFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.display_name || 'Endereço não encontrado';
  } catch (error) {
    console.error("Error fetching address:", error);
    return 'Erro ao obter endereço';
  }
};

// --- SHARED UI COMPONENTS ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-selim-blue"></div>
  </div>
);

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  
  const getDashboardHome = () => {
    switch(user.tipo) {
      case Role.Funcionario: return '/funcionario';
      case Role.Selim: return '/selim';
      case Role.Mb: return '/mb';
      default: return '/';
    }
  };

  return (
    <header className="bg-selim-blue text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate(getDashboardHome())}>
        Ordem de Serviço GPS
      </h1>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="font-semibold">{user.nome}</p>
          <p className="text-sm capitalize opacity-80">{user.tipo}</p>
        </div>
        {/* FIX: Handle navigation after logout action. */}
        <button onClick={() => { logout(); navigate('/login'); }} className="p-2 rounded-full hover:bg-white/20 transition-colors">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-premium-gray-50">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

interface SolicitacaoCardProps {
    solicitacao: Solicitacao;
    userRole: Role;
    onUpdate: () => void;
}

const SolicitacaoCard: React.FC<SolicitacaoCardProps> = ({ solicitacao, userRole, onUpdate }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageToShow, setImageToShow] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateStatus = async (newStatus: Status, additionalData: Record<string, any> = {}) => {
        if (!user) return;
        setIsLoading(true);
        try {
            await apiFetch(`/api/solicitacoes`, {
                method: 'PATCH',
                body: JSON.stringify({
                    id: solicitacao.id,
                    status: newStatus,
                    por: user.nome,
                    ...additionalData
                }),
            });
            onUpdate();
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFinalPhotoSubmit = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const fotoFinal = await fileToBase64(file);
            await handleUpdateStatus(Status.Finalizado, { fotoFinal });
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar foto final.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderActions = () => {
        if (isLoading) return <div className="py-2"><LoadingSpinner /></div>;

        switch (userRole) {
            case Role.Selim:
                if (solicitacao.status === Status.EnviadoParaSelim) {
                    return (
                        <div className="flex space-x-2">
                            <button onClick={() => handleUpdateStatus(Status.EnviadoParaMb)} className="flex-1 bg-selim-green text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                                <CheckCircleIcon /><span>Aprovar e Enviar p/ MB</span>
                            </button>
                            <button onClick={() => handleUpdateStatus(Status.Recusado)} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-red-600 transition-colors">
                                <XCircleIcon /><span>Recusar</span>
                            </button>
                        </div>
                    );
                }
                return null;

            case Role.Mb:
                if (solicitacao.status === Status.EnviadoParaMb || solicitacao.status === Status.Pendente) {
                     return (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button onClick={() => handleUpdateStatus(Status.AguardandoFotoFinal)} className="flex-1 bg-selim-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">Iniciar Serviço</button>
                            <button onClick={() => handleUpdateStatus(Status.Pendente)} className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">Pendente</button>
                            <button onClick={() => handleUpdateStatus(Status.AguardandoFotoFinal)} className="flex-1 bg-selim-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">Solicitar Foto Final</button>
                        </div>
                    );
                }
                return null;
            
            case Role.Funcionario:
                if (solicitacao.status === Status.AguardandoFotoFinal) {
                    return (
                        <>
                            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFinalPhotoSubmit} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-selim-green text-white px-4 py-3 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                                <CameraIcon /> <span>Enviar Foto Final</span>
                            </button>
                        </>
                    );
                }
                return null;

            default:
                return null;
        }
    };
    
    const showImageModal = (img: string) => {
      setImageToShow(img);
      setIsImageModalOpen(true);
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusColor(solicitacao.status)}`}>{solicitacao.status}</span>
                        <p className="text-sm text-premium-gray-500">ID: {solicitacao.id}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                            <h3 className="font-bold text-selim-blue">Foto Inicial</h3>
                            <img src={solicitacao.fotoInicial} alt="Foto inicial" className="w-full h-auto object-cover rounded-lg cursor-pointer" onClick={() => showImageModal(solicitacao.fotoInicial)} />
                        </div>
                        {solicitacao.fotoFinal && (
                             <div className="space-y-4">
                                <h3 className="font-bold text-selim-green">Foto Final</h3>
                                <img src={solicitacao.fotoFinal} alt="Foto final" className="w-full h-auto object-cover rounded-lg cursor-pointer" onClick={() => showImageModal(solicitacao.fotoFinal)} />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 border-t border-premium-gray-200 pt-4 space-y-3 text-premium-gray-700">
                        <div className="flex items-center space-x-2"><DocumentTextIcon /><p><span className="font-semibold">Funcionário:</span> {solicitacao.funcionarioNome}</p></div>
                        <div className="flex items-center space-x-2"><ClockIcon /><p><span className="font-semibold">Data/Hora:</span> {new Date(solicitacao.dataHoraInicial).toLocaleString('pt-BR')}</p></div>
                        <div className="flex items-start space-x-2"><LocationMarkerIcon className="flex-shrink-0 mt-1" /><p><span className="font-semibold">Endereço:</span> {solicitacao.enderecoInicial}</p></div>
                        {solicitacao.observacao && <p><span className="font-semibold">Observação:</span> {solicitacao.observacao}</p>}
                    </div>
                </div>

                <div className="bg-premium-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <button onClick={() => setIsHistoricoOpen(true)} className="text-selim-blue font-semibold hover:underline">Ver Histórico</button>
                    <div className="w-full sm:w-auto">{renderActions()}</div>
                </div>
            </div>

            {isHistoricoOpen && <HistoricoModal solicitacao={solicitacao} onClose={() => setIsHistoricoOpen(false)} />}
            {isImageModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={() => setIsImageModalOpen(false)}>
                <img src={imageToShow} alt="Visualização ampliada" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
              </div>
            )}
        </>
    );
};


interface HistoricoModalProps {
  solicitacao: Solicitacao;
  onClose: () => void;
}
const HistoricoModal: React.FC<HistoricoModalProps> = ({ solicitacao, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-selim-blue">Histórico da Solicitação #{solicitacao.id}</h2>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <ol className="relative border-l border-premium-gray-200">
            {solicitacao.historico.map((entry, index) => (
              <li key={index} className="mb-8 ml-4">
                <div className={`absolute w-3 h-3 ${getStatusColor(entry.status)} rounded-full mt-1.5 -left-1.5 border border-white`}></div>
                <time className="mb-1 text-sm font-normal leading-none text-premium-gray-400">{new Date(entry.dataHora).toLocaleString('pt-BR')}</time>
                <h3 className="text-lg font-semibold text-premium-gray-900">{entry.status}</h3>
                <p className="text-base font-normal text-premium-gray-500">por: {entry.por}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-4 bg-premium-gray-50 text-right">
          <button onClick={onClose} className="bg-selim-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
};


// --- PAGE COMPONENTS ---

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLoginSuccess = (user: User) => {
        login(user);
        switch (user.tipo) {
            case Role.Funcionario:
                navigate('/funcionario');
                break;
            case Role.Selim:
                navigate('/selim');
                break;
            case Role.Mb:
                navigate('/mb');
                break;
            default:
                navigate('/login');
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Hardcoded logins
        if (email === 'selim' && password === 'prefeitura') {
            handleLoginSuccess({ id: 998, nome: 'Fiscal SELIM', email: 'selim@selim.com', tipo: Role.Selim });
            setIsLoading(false);
            return;
        }
        if (email === 'mb' && password === 'ordem') {
            handleLoginSuccess({ id: 999, nome: 'Empresa MB', email: 'mb@mb.com', tipo: Role.Mb });
            setIsLoading(false);
            return;
        }

        try {
            const user = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            handleLoginSuccess(user);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-premium-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-extrabold text-selim-blue">Acesso ao Sistema</h2>
            <p className="mt-2 text-premium-gray-600">Bem-vindo(a) de volta!</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-premium-gray-600 block">Email ou Usuário</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 mt-1 border border-premium-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-selim-blue" required />
          </div>
          <div>
            <label className="text-sm font-bold text-premium-gray-600 block">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mt-1 border border-premium-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-selim-blue" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-selim-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-selim-green transition-colors disabled:bg-premium-gray-400">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-premium-gray-500">
            É funcionário e não tem conta?{' '}
            <a onClick={() => navigate('/cadastro')} className="font-medium text-selim-blue hover:text-blue-800 cursor-pointer">
                Cadastre-se
            </a>
        </p>
      </div>
    </div>
  );
};

const CadastroScreen = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const newUser = await apiFetch('/api/cadastro', {
                method: 'POST',
                body: JSON.stringify({ nome, email, senha: password }),
            });
            // FIX: Handle navigation after login action.
            login(newUser);
            navigate('/funcionario');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-premium-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-selim-blue">Criar Conta de Funcionário</h2>
                <p className="mt-2 text-premium-gray-600">Apenas funcionários podem se cadastrar.</p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-bold text-premium-gray-600 block">Nome Completo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 mt-1 border border-premium-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-selim-blue" required />
              </div>
              <div>
                <label className="text-sm font-bold text-premium-gray-600 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 mt-1 border border-premium-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-selim-blue" required />
              </div>
              <div>
                <label className="text-sm font-bold text-premium-gray-600 block">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mt-1 border border-premium-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-selim-blue" required />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-selim-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-selim-green transition-colors disabled:bg-premium-gray-400">
                  {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
             <p className="text-center text-sm text-premium-gray-500">
                Já tem conta?{' '}
                <a onClick={() => navigate('/login')} className="font-medium text-selim-blue hover:text-blue-800 cursor-pointer">
                    Faça login
                </a>
            </p>
          </div>
        </div>
    );
};


const Dashboard: React.FC<{ role: Role }> = ({ role }) => {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    
    const fetchSolicitacoes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data: Solicitacao[] = await apiFetch('/api/solicitacoes');
            let filteredData = data;

            switch(role) {
                case Role.Funcionario:
                    filteredData = data.filter(s => s.funcionarioId === user?.id);
                    break;
                case Role.Selim:
                    filteredData = data.filter(s => [Status.EnviadoParaSelim, Status.Finalizado].includes(s.status) || s.status.startsWith('AGUARDANDO'));
                    break;
                case Role.Mb:
                     filteredData = data.filter(s => [Status.EnviadoParaMb, Status.Pendente, Status.AguardandoFotoFinal, Status.Finalizado].includes(s.status));
                    break;
            }
            // sort by date descending
            filteredData.sort((a, b) => new Date(b.dataHoraInicial).getTime() - new Date(a.dataHoraInicial).getTime());
            setSolicitacoes(filteredData);
            setError('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [role, user?.id]);

    useEffect(() => {
        fetchSolicitacoes();
    }, [fetchSolicitacoes]);

    const getTitle = () => {
        switch(role) {
            case Role.Funcionario: return "Painel do Funcionário";
            case Role.Selim: return "Painel do Fiscal SELIM";
            case Role.Mb: return "Painel da Empresa MB";
        }
    }

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;
    if (error) return <Layout><p className="text-red-500">Erro: {error}</p></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-selim-blue mb-6">{getTitle()}</h1>
                {role === Role.Funcionario && <FuncionarioHeader onUpdate={fetchSolicitacoes} />}
                
                <div className="space-y-6">
                    {solicitacoes.length > 0 ? (
                        solicitacoes.map(s => <SolicitacaoCard key={s.id} solicitacao={s} userRole={role} onUpdate={fetchSolicitacoes} />)
                    ) : (
                        <div className="bg-white text-center p-12 rounded-lg shadow">
                            <h3 className="text-xl font-medium text-premium-gray-700">Nenhuma solicitação encontrada.</h3>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const FuncionarioHeader = ({ onUpdate }: { onUpdate: () => void }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [observacao, setObservacao] = useState('');
    const [location, setLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    
    const handleTakePhoto = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsCreating(true);
        setIsLoading(true);
        setError('');

        try {
            const base64Photo = await fileToBase64(file);
            setPhoto(base64Photo);

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
            });
            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoordinates(latitude, longitude);
            setLocation({ lat: latitude, lon: longitude, address });

        } catch (err) {
            setError('Não foi possível obter a foto ou a localização. Verifique as permissões do seu dispositivo.');
            setIsCreating(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = async () => {
        if (!photo || !location || !user) return;
        setIsLoading(true);
        setError('');
        try {
            await apiFetch('/api/solicitacoes', {
                method: 'POST',
                body: JSON.stringify({
                    funcionarioId: user.id,
                    funcionarioNome: user.nome,
                    fotoInicial: photo,
                    latitudeInicial: location.lat,
                    longitudeInicial: location.lon,
                    enderecoInicial: location.address,
                    observacao,
                }),
            });
            resetForm();
            onUpdate();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setPhoto(null);
        setLocation(null);
        setObservacao('');
        setError('');
    };

    if (isCreating) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-2xl font-bold text-selim-blue mb-4">Nova Solicitação</h2>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                {!isLoading && photo && location && (
                    <div className="space-y-4">
                        <img src={photo} alt="preview" className="rounded-lg max-h-80 w-auto mx-auto" />
                        <p><span className="font-bold">Endereço:</span> {location.address}</p>
                        <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observação (opcional)" className="w-full p-2 border rounded-lg"></textarea>
                        <div className="flex space-x-2">
                            <button onClick={handleSubmit} className="flex-1 bg-selim-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">Enviar para SELIM</button>
                            <button onClick={resetForm} className="flex-1 bg-premium-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-premium-gray-600">Cancelar</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 text-center">
            <h2 className="text-xl font-bold text-premium-gray-800">Precisa registrar um novo serviço?</h2>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button onClick={handleTakePhoto} className="mt-4 bg-selim-blue text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center space-x-3 hover:bg-blue-800 transition-transform hover:scale-105">
                <CameraIcon />
                <span>Tirar Foto Inicial</span>
            </button>
        </div>
    );
};


// --- ROUTING ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: Role[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.tipo)) {
    // Redirect to their respective dashboard if they try to access a wrong page
    const homePath = `/${user.tipo}`;
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/cadastro" element={<CadastroScreen />} />

          <Route path="/funcionario" element={
            <ProtectedRoute allowedRoles={[Role.Funcionario]}>
              <Dashboard role={Role.Funcionario} />
            </ProtectedRoute>
          }/>
          <Route path="/selim" element={
            <ProtectedRoute allowedRoles={[Role.Selim]}>
              <Dashboard role={Role.Selim} />
            </ProtectedRoute>
          }/>
          <Route path="/mb" element={
            <ProtectedRoute allowedRoles={[Role.Mb]}>
              <Dashboard role={Role.Mb} />
            </ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
