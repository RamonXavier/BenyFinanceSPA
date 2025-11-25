import { v4 as uuidv4 } from 'uuid';

// Mock Data
const CATEGORIES = [
    { id: '1', name: 'Casa', color: '#3b82f6' },
    { id: '2', name: 'Saúde', color: '#ef4444' },
    { id: '3', name: 'Estudos', color: '#8b5cf6' },
    { id: '4', name: 'Impostos', color: '#f59e0b' },
    { id: '5', name: 'Taxas Fixas', color: '#6b7280' },
    { id: '6', name: 'Cartão', color: '#ec4899' },
    { id: '7', name: 'Carro', color: '#10b981' },
    { id: '8', name: 'Moto', color: '#14b8a6' },
    { id: '9', name: 'Gasolina Carro', color: '#f97316' },
    { id: '10', name: 'Gasolina Moto', color: '#f43f5e' },
];

// Mock Cards Data
let CARDS = [
    { id: '1', name: 'Nubank', limit: 5000, bank: 'Nubank', closingDay: 10, dueDay: 17 },
    { id: '2', name: 'Inter', limit: 3500, bank: 'Inter', closingDay: 5, dueDay: 12 },
];

// Mock Recurring Templates
let RECURRING_TEMPLATES = [
    { id: '1', description: 'Aluguel', amount: 1500, category: 'Casa' },
    { id: '2', description: 'Internet', amount: 120, category: 'Casa' },
    { id: '3', description: 'Academia', amount: 90, category: 'Saúde' },
];

const generateTransactions = () => {
    const transactions = [];
    const types = ['income', 'expense'];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 3 months

        const type = Math.random() > 0.3 ? 'expense' : 'income';
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

        // Randomly assign card payment to some expenses
        const isCard = type === 'expense' && Math.random() > 0.5;
        const cardId = isCard ? CARDS[Math.floor(Math.random() * CARDS.length)].id : null;

        transactions.push({
            id: uuidv4(),
            date: date.toISOString(),
            description: `Transaction ${i + 1}`,
            amount: Math.floor(Math.random() * 500) + 50,
            type,
            category: type === 'expense' ? category.name : 'Salário/Extra',
            categoryId: type === 'expense' ? category.id : null,
            paymentMethod: isCard ? 'credit_card' : 'cash',
            category: type === 'expense' ? category.name : 'Salário/Extra',
            categoryId: type === 'expense' ? category.id : null,
            paymentMethod: isCard ? 'credit_card' : 'cash',
            cardId: cardId,
            status: Math.random() > 0.3 ? 'paid' : 'pending' // paid, pending, canceled
        });
    }
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

let TRANSACTIONS = generateTransactions();

// Service Functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockService = {
    login: async (email, password) => {
        await delay(500);
        if (email && password) {
            return { token: 'mock-token-123', user: { name: 'User', email } };
        }
        throw new Error('Invalid credentials');
    },

    getDashboardData: async (month, year) => {
        await delay(500);
        const currentMonth = month !== undefined ? month : new Date().getMonth();
        const currentYear = year !== undefined ? year : new Date().getFullYear();

        // Filter transactions for the selected month
        const currentMonthTransactions = TRANSACTIONS.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const income = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const expense = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const cardExpenses = currentMonthTransactions
            .filter(t => t.type === 'expense' && t.paymentMethod === 'credit_card')
            .reduce((acc, t) => acc + t.amount, 0);

        const cashExpenses = expense - cardExpenses;

        // Generate Bar Chart Data (Last 6 months ending in selected month)
        const barChartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });

            const monthTrans = TRANSACTIONS.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === m && td.getFullYear() === y;
            });

            const monthIncome = monthTrans
                .filter(t => t.type === 'income')
                .reduce((acc, t) => acc + t.amount, 0);

            const monthExpense = monthTrans
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0);

            barChartData.push({
                name: monthName,
                Receitas: monthIncome,
                Despesas: monthExpense
            });
        }

        // Generate Pie Chart Data (Expenses by Category for selected month)
        const expensesByCategory = {};
        currentMonthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expensesByCategory[t.category]) {
                    expensesByCategory[t.category] = 0;
                }
                expensesByCategory[t.category] += t.amount;
            });

        const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
            name,
            value
        }));

        return {
            balance: income - cashExpenses, // Real money available (Income - Cash Expenses)
            income,
            expense, // Total expenses (Cash + Card)
            cardExpenses, // Total card expenses
            transactions: currentMonthTransactions.slice(0, 5), // Recent transactions
            barChartData,
            pieChartData
        };
    },

    getTransactions: async () => {
        await delay(500);
        return [...TRANSACTIONS];
    },

    getCategories: async () => {
        await delay(300);
        return [...CATEGORIES];
    },

    addTransaction: async (transaction) => {
        await delay(500);
        const newTransaction = {
            ...transaction,
            id: uuidv4(),
            date: transaction.date || new Date().toISOString()
        };
        TRANSACTIONS = [newTransaction, ...TRANSACTIONS];
        return newTransaction;
    },

    updateTransaction: async (id, updatedTransaction) => {
        await delay(500);
        TRANSACTIONS = TRANSACTIONS.map(t => t.id === id ? { ...t, ...updatedTransaction } : t);
        return { id, ...updatedTransaction };
    },

    deleteTransaction: async (id) => {
        await delay(500);
        TRANSACTIONS = TRANSACTIONS.filter(t => t.id !== id);
        return true;
    },

    addCategory: async (category) => {
        await delay(300);
        const newCategory = { ...category, id: uuidv4() };
        CATEGORIES.push(newCategory);
        return newCategory;
    },

    updateCategory: async (id, updatedCategory) => {
        await delay(300);
        const index = CATEGORIES.findIndex(c => c.id === id);
        if (index !== -1) {
            CATEGORIES[index] = { ...CATEGORIES[index], ...updatedCategory };
            return CATEGORIES[index];
        }
        throw new Error('Category not found');
    },

    deleteCategory: async (id) => {
        await delay(300);
        const index = CATEGORIES.findIndex(c => c.id === id);
        if (index !== -1) {
            CATEGORIES.splice(index, 1);
            return true;
        }
        throw new Error('Category not found');
    },

    getCards: async () => {
        await delay(300);
        return [...CARDS];
    },

    addCard: async (card) => {
        await delay(300);
        const newCard = { ...card, id: uuidv4() };
        CARDS.push(newCard);
        return newCard;
    },

    deleteCard: async (id) => {
        await delay(300);
        CARDS = CARDS.filter(c => c.id !== id);
        return true;
    },

    // Recurring Templates
    getRecurringTemplates: async () => {
        await delay(300);
        return [...RECURRING_TEMPLATES];
    },

    addRecurringTemplate: async (template) => {
        await delay(300);
        const newTemplate = { ...template, id: uuidv4() };
        RECURRING_TEMPLATES.push(newTemplate);
        return newTemplate;
    },

    deleteRecurringTemplate: async (id) => {
        await delay(300);
        RECURRING_TEMPLATES = RECURRING_TEMPLATES.filter(t => t.id !== id);
        return true;
    },

    generateMonthlyTransactions: async (month, year) => {
        await delay(500);
        const newTransactions = RECURRING_TEMPLATES.map(template => {
            // Date is 10th of the specified month
            const date = new Date(year, month - 1, 10);

            return {
                id: uuidv4(),
                date: date.toISOString(),
                description: template.description,
                amount: 0, // User requested 0.00
                type: 'expense',
                category: template.category,
                paymentMethod: 'cash',
                status: 'pending'
            };
        });

        TRANSACTIONS = [...newTransactions, ...TRANSACTIONS];
        return newTransactions;
    }
};
