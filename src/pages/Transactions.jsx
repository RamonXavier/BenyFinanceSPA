import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, X, CreditCard, Wallet, Repeat, CheckCircle, AlertCircle, Clock, ArrowUp, ArrowDown, ChevronsUpDown, DollarSign, BarChart2, PieChart, ChevronDown, Download, Upload, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LabelList, AreaChart, Area, LineChart, Line } from 'recharts';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, income, expense
    const [categoryFilter, setCategoryFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [collapsedFilters, setCollapsedFilters] = useState(false);
    const [collapsedSummary, setCollapsedSummary] = useState(false);
    const [collapsedTopCategories, setCollapsedTopCategories] = useState(false);
    const [collapsedCategoryMiniCards, setCollapsedCategoryMiniCards] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({ description: '', amount: '', category: '' });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7));
    const [dashboardData, setDashboardData] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [collapsedMonthlyCharts, setCollapsedMonthlyCharts] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importSource, setImportSource] = useState('nubank'); // nubank, mercadopago
    const [importFile, setImportFile] = useState(null);
    const [importPreview, setImportPreview] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash', // cash, credit_card
        cardId: '',
        status: 'pending' // paid, pending, canceled
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoadingDashboard(true);
            try {
                const [year, month] = selectedDate.split('-').map(Number);
                const d = await apiService.getDashboardData(month, year);
                setDashboardData(d);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setLoadingDashboard(false);
            }
        };
        loadDashboard();
    }, [selectedDate]);

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
            // Se nÃ£o tem categoryId, procura pelo nome da categoria
            let categoryIdValue = transaction.categoryId ? String(transaction.categoryId) : '';
            if (!categoryIdValue && transaction.category) {
                const foundCat = categories.find(c => c.name === transaction.category);
                categoryIdValue = foundCat ? String(foundCat.id) : '';
            }
            setFormData(prevFormData => ({
                ...prevFormData,
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                categoryId: categoryIdValue,
                date: transaction.date.split('T')[0],
                paymentMethod: transaction.paymentMethod || 'cash',
                cardId: transaction.cardId ? String(transaction.cardId) : '',
                status: transaction.status || 'pending'
            }));
        } else {
            setEditingTransaction(null);
                setFormData({
                description: '',
                amount: '',
                type: 'expense',
                category: categories[0]?.name || '',
                categoryId: categories[0]?.id ? String(categories[0].id) : '',
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
            // Extrai categoryId e constrÃ³i transactionData sem o categoryId antigo
            const { categoryId: _, ...formDataWithoutCategoryId } = formData;
            
            // Determina o categoryId apropriado (mantendo como string para suportar GUIDs)
            let categoryIdValue = null;

            // 1. Se o usuÃ¡rio selecionou uma categoria vÃ¡lida no form, usa essa (string)
            if (formData.categoryId && formData.categoryId !== '') {
                categoryIdValue = formData.categoryId;
            }
            // 2. Se nÃ£o tem categoryId no form mas tem o nome, procura o ID (preserva como string)
            else if (formData.category) {
                const foundCat = categories.find(c => c.name === formData.category);
                if (foundCat?.id) {
                    categoryIdValue = String(foundCat.id);
                } else if (editingTransaction?.categoryId) {
                    // Se nÃ£o encontra a categoria pelo nome, mantÃ©m a original
                    categoryIdValue = String(editingTransaction.categoryId);
                }
            }
            // 3. Se nÃ£o tem nada, tenta manter a original se estÃ¡ editando
            else if (editingTransaction?.categoryId) {
                categoryIdValue = String(editingTransaction.categoryId);
            }
            // 4. Ãšltimo recurso: usa a primeira categoria
            else if (categories.length > 0 && categories[0]?.id) {
                categoryIdValue = String(categories[0].id);
            }

            const transactionData = {
                ...formDataWithoutCategoryId,
                amount: Number(formData.amount),
                date: new Date(formData.date).toISOString(),
                categoryId: categoryIdValue,
                cardId: formData.paymentMethod === 'credit_card' && formData.cardId ? formData.cardId : null
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
        if (window.confirm('Tem certeza que deseja excluir este lanÃ§amento?')) {
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

    const handleExportExcel = () => {
        if (sortedTransactions.length === 0) {
            alert('NÃ£o hÃ¡ dados para exportar com os filtros atuais.');
            return;
        }

        // Prepare data for XLSX
        const data = sortedTransactions.map(t => ({
            'Data': new Date(t.date).toLocaleDateString('pt-BR'),
            'DescriÃ§Ã£o': t.description,
            'Categoria': t.category || 'Sem categoria',
            'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
            'Pagamento': t.paymentMethod === 'credit_card' ? 'CartÃ£o de CrÃ©dito' : 'Dinheiro/Conta',
            'Status': t.status === 'paid' ? 'Pago' : (t.status === 'canceled' ? 'Cancelado' : 'Pendente'),
            'Valor': t.amount
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'LanÃ§amentos');

        // Download file
        XLSX.writeFile(workbook, `lancamentos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };
    // Import handlers
    const handleImportFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const name = file.name.toLowerCase();
        const isCsv = name.endsWith('.csv');
        const isPdf = name.endsWith('.pdf');
        if (!isCsv && !isPdf) {
            setImportFile(null);
            setImportError('Formato não suportado. Use .csv (Nubank) ou .pdf (Mercado Pago).');
            e.target.value = '';
            return;
        }
        if (importSource === 'nubank' && !isCsv) {
            setImportFile(null);
            setImportError('Nubank exporta em CSV. Selecione um arquivo .csv.');
            e.target.value = '';
            return;
        }
        if (importSource === 'mercadopago' && !isPdf) {
            setImportFile(null);
            setImportError('Mercado Pago: selecione o extrato em PDF (Extratos → Baixar PDF).');
            e.target.value = '';
            return;
        }
        setImportFile(file);
        setImportPreview(null);
        setImportError('');
    };
    const handleImportPreview = async () => {
        if (!importFile) { setImportError('Selecione um arquivo (CSV do Nubank ou PDF do Mercado Pago)'); return; }
        setImportLoading(true); setImportError('');
        try { const preview = await apiService.previewImport(importFile, importSource); setImportPreview(preview); }
        catch (err) { setImportError(err?.message || 'Erro ao analisar arquivo'); }
        finally { setImportLoading(false); }
    };
    const handleUpdateImportItem = (index, field, value) => {
        if (!importPreview) return;
        const items = [...importPreview.items];
        items[index] = { ...items[index], [field]: value };
        setImportPreview({ ...importPreview, items });
    };
    const handleToggleCreateCategory = (index) => {
        if (!importPreview) return;
        const items = [...importPreview.items];
        items[index] = { ...items[index], createCategoryIfMissing: !items[index].createCategoryIfMissing, newCategoryName: items[index].newCategoryName || items[index].suggestedCategoryName };
        setImportPreview({ ...importPreview, items });
    };
    const handleAddCategoryInline = async (index, name, color = '#6366f1') => {
        if (!importPreview || !name) return;
        try { const cat = await apiService.addCategory({ name, color }); setCategories(prev => [...prev, cat]); const items = [...importPreview.items]; items[index] = { ...items[index], suggestedCategoryId: cat.id, suggestedCategoryName: cat.name, createCategoryIfMissing: false }; setImportPreview({ ...importPreview, items }); }
        catch (err) { console.error(err); }
    };
    const handleConfirmImport = async () => {
        if (!importPreview) return;
        const validItems = importPreview.items.filter(i => i.isValid);
        const itemsToConfirm = validItems.map(item => {
            let categoryId = item.suggestedCategoryId; let createCategory = false; let newCategoryName = null;
            if (item.createCategoryIfMissing) { createCategory = true; newCategoryName = item.newCategoryName || item.suggestedCategoryName; categoryId = null; }
            return { date: item.date, description: item.description, amount: Number(item.amount), type: item.type, categoryId, paymentMethod: item.paymentMethod, cardId: item.cardId, status: item.status, createCategory, newCategoryName, newCategoryColor: '#6366f1' };
        });
        setImportLoading(true);
        try { await apiService.confirmImport({ source: importSource, items: itemsToConfirm }); setIsImportModalOpen(false); setImportPreview(null); setImportFile(null); await loadData(); }
        catch (err) { setImportError(err?.message || 'Erro ao importar'); }
        finally { setImportLoading(false); }
    };
    const handleCloseImport = () => { setIsImportModalOpen(false); setImportPreview(null); setImportFile(null); setImportError(''); };

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

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setCategoryFilter('');
        setPaymentMethodFilter('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        setCurrentPage(1);
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = !categoryFilter || (t.category || '').toString() === categoryFilter;
        const matchesPayment = !paymentMethodFilter || (t.paymentMethod || '') === paymentMethodFilter;
        const matchesStatus = !statusFilter || (t.status || '') === statusFilter;
        const matchesDateFrom = !dateFrom || new Date(t.date) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(t.date) <= new Date(dateTo);
        const matchesAmountMin = amountMin === '' || (Number(t.amount) >= Number(amountMin));
        const matchesAmountMax = amountMax === '' || (Number(t.amount) <= Number(amountMax));

        return (
            matchesSearch &&
            matchesType &&
            matchesCategory &&
            matchesPayment &&
            matchesStatus &&
            matchesDateFrom &&
            matchesDateTo &&
            matchesAmountMin &&
            matchesAmountMax
        );
    });

    // Reset page when filters or data change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, pageSize, transactions, categoryFilter, paymentMethodFilter, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const compareValues = (a, b, key) => {
        if (key === 'date') return new Date(a.date) - new Date(b.date);
        if (key === 'amount') return (a.amount || 0) - (b.amount || 0);
        if (key === 'status') {
            const order = { paid: 1, pending: 2, canceled: 3 };
            return (order[a.status] || 99) - (order[b.status] || 99);
        }
        if (key === 'paymentMethod') return (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
        return (a[key] || '').toString().localeCompare((b[key] || '').toString(), 'pt-BR', { numeric: true });
    };

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const res = compareValues(a, b, sortConfig.key);
        return sortConfig.direction === 'asc' ? res : -res;
    });

    const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
    const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Metrics for filtered dataset (react to filters)
    const totalCount = filteredTransactions.length;
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const netTotal = totalIncome - totalExpense;

    const countsByCategory = filteredTransactions.reduce((acc, t) => {
        const k = t.category || 'Sem categoria';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});
    const topCategories = Object.entries(countsByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Expense sums per category (for desktop mini-cards)
    const expenseByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const k = t.category || 'Sem categoria';
            acc[k] = (acc[k] || 0) + (Number(t.amount) || 0);
            return acc;
        }, {});

    // Ensure all known categories appear (even with zero)
    const categoriesExpenseList = categories
        .map(c => [c.name, expenseByCategory[c.name] || 0])
        .sort((a, b) => b[1] - a[1]);

    const statusCounts = filteredTransactions.reduce((acc, t) => {
        const s = t.status || 'pending';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    if (loading && !transactions.length) {
        return <div className="flex justify-center p-8">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">LanÃ§amentos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        title="Exportar para Excel"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors" title="Importar CSV">
                        <Upload size={20} />
                        <span className="hidden sm:inline">Importar</span>
                    </button>
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
                        <span className="hidden sm:inline">Novo LanÃ§amento</span>
                    </button>
                </div>
            </div>

            {/* Filters (collapsible) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                        <Filter className="text-gray-400" size={18} />
                        <div className="text-sm font-medium text-gray-700">Filtros</div>
                    </div>
                    <div>
                        <button type="button" onClick={() => setCollapsedFilters(!collapsedFilters)} className="p-2 rounded hover:bg-gray-100">
                            <ChevronDown className={`transform transition ${collapsedFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {!collapsedFilters && (
                    <div className="p-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar lanÃ§amentos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                            >
                                <option value="all">Todos</option>
                                <option value="income">Receitas</option>
                                <option value="expense">Despesas</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            >
                                <option value="">Todas as categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            >
                                <option value="">Qualquer pagamento</option>
                                <option value="cash">Dinheiro/Conta</option>
                                <option value="credit_card">CartÃ£o de CrÃ©dito</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            >
                                <option value="">Qualquer status</option>
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="canceled">Cancelado</option>
                            </select>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                title="Data inicial"
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                title="Data final"
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            />

                            <input
                                type="number"
                                placeholder="Min"
                                min="0"
                                step="0.01"
                                value={amountMin}
                                onChange={(e) => setAmountMin(e.target.value)}
                                className="w-20 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                min="0"
                                step="0.01"
                                value={amountMax}
                                onChange={(e) => setAmountMax(e.target.value)}
                                className="w-20 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                            />

                            <button
                                onClick={clearFilters}
                                className="ml-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Monthly view: Summary cards (collapsible) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-700">VisÃ£o Mensal</div>
                        <input
                            type="month"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="ml-2 px-3 py-1 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                        />
                    </div>
                    <div>
                        <button type="button" onClick={() => setCollapsedSummary(!collapsedSummary)} className="p-2 rounded hover:bg-gray-100">
                            <ChevronDown className={`transform transition ${collapsedSummary ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {!collapsedSummary && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">Saldo em Conta</div>
                                <DollarSign size={20} className="text-gray-400" />
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-gray-900">{dashboardData ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.balance) : 'â€”'}</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">Receitas (MÃªs)</div>
                                <ArrowUp size={20} className="text-green-400" />
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-green-600">{dashboardData ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.income) : 'â€”'}</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">Despesas Totais</div>
                                <ArrowDown size={20} className="text-red-400" />
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-red-600">{dashboardData ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.expense) : 'â€”'}</div>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">Fatura CartÃµes</div>
                                <CreditCard size={20} className="text-purple-400" />
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-purple-600">{dashboardData ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.cardExpenses) : 'â€”'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Monthly Charts (collapsible) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-gray-800">GrÃ¡ficos Mensais</div>
                    <div>
                        <button type="button" onClick={() => setCollapsedMonthlyCharts(!collapsedMonthlyCharts)} className="p-2 rounded hover:bg-gray-100">
                            <ChevronDown className={`transform transition ${collapsedMonthlyCharts ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {!collapsedMonthlyCharts && (
                    <div className="space-y-8">
                        {/* NormalizaÃ§Ã£o dos dados para os grÃ¡ficos de barras e Ã¡rea */}
                        {(() => {
                            const normalizedBarData = dashboardData?.barChartData?.map(d => ({
                                name: d.name,
                                receitas: Number(d.Receitas || d.receitas || 0),
                                despesas: Number(d.Despesas || d.despesas || 0),
                                saldo: Number(d.Receitas || d.receitas || 0) - Number(d.Despesas || d.despesas || 0)
                            })) || [];

                            return (
                                <>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="h-[450px]">
                                            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">Comparativo de Despesas Mensais (6 Meses)</h3>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={normalizedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Legend verticalAlign="top" height={36}/>
                                                    <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Total Gasto">
                                                        <LabelList dataKey="despesas" position="top" formatter={(v) => v > 0 ? formatCurrency(v) : ''} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="h-[450px]">
                                            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">Gastos por Categoria (MÃªs Atual)</h3>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={dashboardData?.pieChartData || []}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={80}
                                                        outerRadius={140}
                                                        fill="#8884d8"
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    >
                                                        {(dashboardData?.pieChartData || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"][index % 8]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Legend />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                                        <div className="h-[450px]">
                                            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">EvoluÃ§Ã£o do Saldo (6 Meses)</h3>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={normalizedBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Area type="monotone" dataKey="saldo" name="Saldo LÃ­quido" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={3}>
                                                        <LabelList dataKey="saldo" position="top" formatter={(v) => formatCurrency(v)} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                    </Area>
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="h-[450px]">
                                            <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">DistribuiÃ§Ã£o de Pagamentos</h3>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Dinheiro/Conta', value: Number(dashboardData?.expense || 0) - Number(dashboardData?.cardExpenses || 0) },
                                                            { name: 'CartÃ£o de CrÃ©dito', value: Number(dashboardData?.cardExpenses || 0) }
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={80}
                                                        outerRadius={140}
                                                        fill="#8884d8"
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    >
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#8b5cf6" />
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Legend />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Top categories & status (collapsible) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                <div className="flex items-center justify-between p-3">
                    <div className="text-sm font-medium text-gray-700">Insights</div>
                    <div>
                        <button type="button" onClick={() => setCollapsedTopCategories(!collapsedTopCategories)} className="p-2 rounded hover:bg-gray-100">
                            <ChevronDown className={`transform transition ${collapsedTopCategories ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {!collapsedTopCategories && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 mt-0">
                        <div className="sm:col-span-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-700">Top Categorias</div>
                                <PieChart size={18} className="text-gray-400" />
                            </div>
                            <div className="mt-3 space-y-2">
                                {topCategories.length === 0 && <div className="text-sm text-gray-500">Nenhuma categoria encontrada.</div>}
                                {topCategories.map(([name, count]) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">{name}</div>
                                        <div className="text-sm text-gray-500">{count} lanÃ§amentos</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-700">Status</div>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between"><div className="text-sm">Pendente</div><div className="text-sm text-gray-500">{statusCounts.pending || 0}</div></div>
                                <div className="flex items-center justify-between"><div className="text-sm">Pago</div><div className="text-sm text-gray-500">{statusCounts.paid || 0}</div></div>
                                <div className="flex items-center justify-between"><div className="text-sm">Cancelado</div><div className="text-sm text-gray-500">{statusCounts.canceled || 0}</div></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: mini-cards por categoria (linha full-width, collapsible) */}
            <div className="hidden md:block w-full mt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                        <div className="text-sm font-medium text-gray-700">Gastos por Categoria</div>
                        <div>
                            <button type="button" onClick={() => setCollapsedCategoryMiniCards(!collapsedCategoryMiniCards)} className="p-2 rounded hover:bg-gray-100">
                                <ChevronDown className={`transform transition ${collapsedCategoryMiniCards ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                    {!collapsedCategoryMiniCards && (
                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {categoriesExpenseList.map(([name, amount]) => (
                                    <div key={name} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-sm text-gray-600 truncate">{name}</div>
                                        <div className="mt-2 text-lg font-semibold text-red-600">{formatCurrency(amount)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por Data. Clique para alternar asc/desc." onClick={() => handleSort('date')} className="flex items-center gap-2">
                                        Data
                                        {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por DescriÃ§Ã£o. Clique para alternar asc/desc." onClick={() => handleSort('description')} className="flex items-center gap-2">
                                        DescriÃ§Ã£o
                                        {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por Categoria. Clique para alternar asc/desc." onClick={() => handleSort('category')} className="flex items-center gap-2">
                                        Categoria
                                        {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por Pagamento. Clique para alternar asc/desc." onClick={() => handleSort('paymentMethod')} className="flex items-center gap-2">
                                        Pagamento
                                        {sortConfig.key === 'paymentMethod' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por Status. Clique para alternar asc/desc." onClick={() => handleSort('status')} className="flex items-center gap-2">
                                        Status
                                        {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button type="button" title="Ordenar por Valor. Clique para alternar asc/desc." onClick={() => handleSort('amount')} className="flex items-center gap-2 justify-end">
                                        Valor
                                        {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ChevronsUpDown size={14} className="text-gray-300" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">AÃ§Ãµes</th>
                            </tr>
                        </thead> 
                        <tbody className="divide-y divide-gray-200">
                            {paginatedTransactions.map((transaction) => (
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
                                                <span className="text-xs font-medium">CrÃ©dito</span>
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

                {/* Pagination */}
                <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Mostrando {sortedTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedTransactions.length)} de {sortedTransactions.length} lanÃ§amentos
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border border-gray-200 rounded px-2 py-1 text-sm">
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50">Â«</button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded disabled:opacity-50">Anterior</button>
                        <span className="px-3 text-sm">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">PrÃ³xima</button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">Â»</button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingTransaction ? 'Editar LanÃ§amento' : 'Novo LanÃ§amento'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">DescriÃ§Ã£o</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Compras do mÃªs"
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
                                    value={formData.categoryId}
                                    onChange={(e) => {
                                        const cat = categories.find(c => String(c.id) === e.target.value);
                                        setFormData({ ...formData, categoryId: e.target.value, category: cat?.name || '' });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.type === 'expense' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
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
                                            CartÃ£o de CrÃ©dito
                                        </button>
                                    </div>

                                    {formData.paymentMethod === 'credit_card' && (
                                        <select
                                            required
                                            value={formData.cardId}
                                            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="">Selecione o cartÃ£o</option>
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
                                        <label className="block text-xs text-gray-500 mb-1">DescriÃ§Ã£o</label>
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
                                Gerar Contas para o MÃªs Atual
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Isso criarÃ¡ lanÃ§amentos pendentes para o dia 10 deste mÃªs com valor R$ 0,00.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto m-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Importar Extrato CSV</h2>
                            <button onClick={handleCloseImport} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                                    <select
                                        value={importSource}
                                        onChange={(e) => {
                                            setImportSource(e.target.value);
                                            setImportFile(null);
                                            setImportPreview(null);
                                            setImportError('');
                                        }}
                                        className="border rounded-lg px-3 py-2"
                                    >
                                        <option value="nubank">Nubank (CSV)</option>
                                        <option value="mercadopago">Mercado Pago (PDF)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Arquivo {importSource === 'nubank' ? 'CSV (Nubank)' : 'PDF (Mercado Pago)'}
                                    </label>
                                    <input type="file" accept=".csv,.pdf" onChange={handleImportFileChange} className="border rounded-lg px-3 py-2" />
                                </div>
                                <button onClick={handleImportPreview} disabled={importLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Analisar</button>
                            </div>
                            {importError && <div className="bg-red-100 text-red-700 p-3 rounded">{importError}</div>}
                            {importPreview && (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-600">Validos: {importPreview.validRows} / {importPreview.totalRows}</div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Valor</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Categoria</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Criar cat.</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {importPreview.items.map((item, idx) => (
                                                    <tr key={idx} className={item.isValid ? '' : 'bg-red-50'}>
                                                        <td className="px-2 py-2 text-xs">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="px-2 py-2 text-xs max-w-xs truncate" title={item.description}>{item.description}</td>
                                                        <td className="px-2 py-2 text-xs">R$ {Number(item.amount).toFixed(2)}</td>
                                                        <td className="px-2 py-2 text-xs">
                                                            <select value={item.type} onChange={(e) => handleUpdateImportItem(idx, 'type', e.target.value)} className="border rounded px-1 py-1 text-xs">
                                                                <option value="expense">Despesa</option>
                                                                <option value="income">Receita</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-2 py-2 text-xs">
                                                            {!item.createCategoryIfMissing ? (
                                                                <select value={item.suggestedCategoryId || ''} onChange={(e) => {
                                                                    const cat = categories.find(c => c.id === e.target.value);
                                                                    handleUpdateImportItem(idx, 'suggestedCategoryId', e.target.value);
                                                                    handleUpdateImportItem(idx, 'suggestedCategoryName', cat?.name || '');
                                                                }} className="border rounded px-1 py-1 text-xs">
                                                                    <option value="">Selecionar</option>
                                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input type="text" value={item.newCategoryName || ''} onChange={(e) => handleUpdateImportItem(idx, 'newCategoryName', e.target.value)} className="border rounded px-1 py-1 text-xs w-24" />
                                                            )}
                                                            <button type="button" onClick={() => handleToggleCreateCategory(idx)} className="ml-1 text-xs text-blue-600">Nova</button>
                                                        </td>
                                                        <td className="px-2 py-2 text-xs">
                                                            <select value={item.status} onChange={(e) => handleUpdateImportItem(idx, 'status', e.target.value)} className="border rounded px-1 py-1 text-xs">
                                                                <option value="paid">Pago</option>
                                                                <option value="pending">Pendente</option>
                                                                <option value="canceled">Cancelado</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleConfirmImport} disabled={importLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">Confirmar Importação</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Transactions;
