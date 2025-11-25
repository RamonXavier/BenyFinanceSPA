import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { CreditCard, Plus, Trash2, X } from 'lucide-react';

const Settings = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bank: '',
        limit: '',
        closingDay: '',
        dueDay: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getCards();
            setCards(data);
        } catch (error) {
            console.error('Error loading cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            name: '',
            bank: '',
            limit: '',
            closingDay: '',
            dueDay: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const cardData = {
                ...formData,
                limit: Number(formData.limit),
                closingDay: Number(formData.closingDay),
                dueDay: Number(formData.dueDay)
            };
            await apiService.addCard(cardData);
            await loadData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error adding card:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
            setLoading(true);
            try {
                await apiService.deleteCard(id);
                await loadData();
            } catch (error) {
                console.error('Error deleting card:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Meus Cartões</h2>
                            <p className="text-sm text-gray-500">Gerencie seus cartões de crédito</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={20} />
                        Adicionar Cartão
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {cards.map((card) => (
                        <div key={card.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gray-800 rounded-md flex items-center justify-center text-white text-xs font-bold">
                                    {card.bank}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{card.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-gray-500">Fechamento dia {card.closingDay}</p>
                                    <p className="text-xs text-gray-500">Vencimento dia {card.dueDay}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(card.id)}
                                    className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cards.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum cartão cadastrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Card Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Adicionar Cartão</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Nubank Platinum"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banco/Emissor</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bank}
                                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Nubank"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.limit}
                                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0,00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={formData.closingDay}
                                        onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Dia"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={formData.dueDay}
                                        onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Dia"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Cartão'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
