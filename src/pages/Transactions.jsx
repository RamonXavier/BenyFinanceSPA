import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, X, CreditCard, Wallet, Repeat, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, income, expense
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ description: '', amount: '', category: '' });

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash', // cash, credit_card
        cardId: '',
        status: 'pending' // paid, pending, canceled
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [transData, catsData, cardsData] = await Promise.all([
                apiService.getTransactions(),
                apiService.getCategories(),
                apiService.getCards()
            ]);
            setTransactions(transData);
            setCategories(catsData);
            setCards(cardsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (transaction = null) => {
        if (transaction) {
            setEditingTransaction(transaction);
            setFormData({
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                date: transaction.date.split('T')[0],
                paymentMethod: transaction.paymentMethod || 'cash',
                cardId: transaction.cardId || '',
                status: transaction.status || 'pending'
            });
        } else {
            setEditingTransaction(null);
            setFormData({
                description: '',
                amount: '',
                type: 'expense',
                category: categories[0]?.name || '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'cash',
                cardId: '',
                status: 'pending'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const transactionData = {
                ...formData,
                amount: Number(formData.amount),
                date: new Date(formData.date).toISOString(),
                cardId: formData.paymentMethod === 'credit_card' ? formData.cardId : null
            };

            if (editingTransaction) {
                await apiService.updateTransaction(editingTransaction.id, transactionData);
            } else {
                await apiService.addTransaction(transactionData);
            }
            await loadData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
            setLoading(true);
            try {
                await apiService.deleteTransaction(id);
                await loadData();
            } catch (error) {
                console.error('Error deleting transaction:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOpenRecurringModal = async () => {
        setLoading(true);
        try {
            const templates = await apiService.getRecurringTemplates();
            setRecurringTemplates(templates);
            setIsRecurringModalOpen(true);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTemplate = async (e) => {
        e.preventDefault();
        try {
            const template = await apiService.addRecurringTemplate({
                ...newTemplate,
                amount: Number(newTemplate.amount)
            });
            setRecurringTemplates([...recurringTemplates, template]);
            setNewTemplate({ description: '', amount: '', category: '' });
        } catch (error) {
            console.error('Error adding template:', error);
        }
    };

    const handleDeleteTemplate = async (id) => {
        try {
            await apiService.deleteRecurringTemplate(id);
            setRecurringTemplates(recurringTemplates.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const handleGenerateMonthly = async () => {
        setLoading(true);
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            await apiService.generateMonthlyTransactions(currentMonth, currentYear);
            await loadData();
            setIsRecurringModalOpen(false);
        } catch (error) {
            console.error('Error generating transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={12} /> Pago</span>;
            case 'canceled':
                return <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full"><X size={12} /> Cancelado</span>;
            default:
                return <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full"><Clock size={12} /> Pendente</span>;
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading && !transactions.length) {
        return <div className="flex justify-center p-8">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Lançamentos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleOpenRecurringModal}
                        className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Repeat size={20} />
                        <span className="hidden sm:inline">Contas Recorrentes</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Novo Lançamento</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar lançamentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Todos</option>
                        <option value="income">Receitas</option>
                        <option value="expense">Despesas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {transaction.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.paymentMethod === 'credit_card' ? (
                                            <div className="flex items-center gap-1 text-purple-600">
                                                <CreditCard size={16} />
                                                <span className="text-xs font-medium">Crédito</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Wallet size={16} />
                                                <span className="text-xs font-medium">Dinheiro</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getStatusBadge(transaction.status)}
                                    </td>
                                    <td className={clsx(
                                        "px-6 py-4 whitespace-nowrap text-sm text-right font-medium",
                                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(transaction)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'income' })}
                                        className={clsx(
                                            'py-2 rounded-lg text-sm font-medium transition-colors',
                                            formData.type === 'income'
                                                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                                                : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                                        )}
                                    >
                                        Receita
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                                        className={clsx(
                                            'py-2 rounded-lg text-sm font-medium transition-colors',
                                            formData.type === 'expense'
                                                ? 'bg-red-100 text-red-700 border-2 border-red-200'
                                                : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                                        )}
                                    >
                                        Despesa
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Compras do mês"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.type === 'expense' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cash', cardId: '' })}
                                            className={clsx(
                                                'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
                                                formData.paymentMethod === 'cash'
                                                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                                            )}
                                        >
                                            <Wallet size={16} />
                                            Dinheiro/Conta
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'credit_card' })}
                                            className={clsx(
                                                'flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
                                                formData.paymentMethod === 'credit_card'
                                                    ? 'bg-purple-50 text-purple-700 border-2 border-purple-200'
                                                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                                            )}
                                        >
                                            <CreditCard size={16} />
                                            Cartão de Crédito
                                        </button>
                                    </div>

                                    {formData.paymentMethod === 'credit_card' && (
                                        <select
                                            required
                                            value={formData.cardId}
                                            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="">Selecione o cartão</option>
                                            {cards.map(card => (
                                                <option key={card.id} value={card.id}>{card.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="paid">Pago</option>
                                    <option value="canceled">Cancelado</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Recurring Modal */}
            {isRecurringModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Contas Recorrentes</h2>
                            <button onClick={() => setIsRecurringModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-gray-700 mb-4">Adicionar Novo Modelo</h3>
                                <form onSubmit={handleAddTemplate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTemplate.description}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Ex: Aluguel"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                                        <select
                                            required
                                            value={newTemplate.category}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Selecione</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                    >
                                        Adicionar
                                    </button>
                                </form>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-4">Modelos Cadastrados</h3>
                                <div className="space-y-3">
                                    {recurringTemplates.map(template => (
                                        <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{template.description}</p>
                                                <p className="text-xs text-gray-500">{template.category}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {recurringTemplates.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">Nenhum modelo cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleGenerateMonthly}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle size={20} />
                                Gerar Contas para o Mês Atual
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Isso criará lançamentos pendentes para o dia 10 deste mês com valor R$ 0,00.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
