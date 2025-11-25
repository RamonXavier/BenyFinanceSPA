import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Wallet } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Credenciais inválidas. Tente qualquer email e senha.');
            }
        } else {
            // Mock Register
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
            // Simulate API call
            try {
                await apiService.register(name, email, password);
                alert('Conta criada com sucesso! Faça login para continuar.');
                setIsLogin(true);
            } catch (err) {
                setError(err.message || 'Erro ao criar conta.');
            }
        }
    };

    const handleRecoverPassword = () => {
        window.open('https://wa.me/5532991375797', '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
                        <Wallet size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isLogin ? 'Bem-vindo ao BenyFinance' : 'Crie sua conta'}
                    </h1>
                    <p className="text-gray-500 text-center mt-2">
                        {isLogin ? 'Controle suas finanças de forma simples e eficiente.' : 'Comece a controlar suas finanças hoje mesmo.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Seu nome"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="********"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="********"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    {isLogin && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleRecoverPassword}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-200"
                    >
                        {isLogin ? 'Entrar' : 'Criar Conta'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>
                        {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {isLogin ? 'Criar conta' : 'Fazer login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
