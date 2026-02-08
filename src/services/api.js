//const API_URL = 'https://localhost:7133';
const API_URL = 'https://benyfinance-api2.tryasp.net';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Something went wrong');
    }
    // Check if response has content before trying to parse JSON
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const apiService = {
    // Auth
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },

    register: async (name, email, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, email, password })
        });
        return handleResponse(response);
    },

    // Dashboard
    getDashboardData: async (month, year) => {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month);
        if (year !== undefined) params.append('year', year);

        const response = await fetch(`${API_URL}/dashboard?${params.toString()}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Transactions
    getTransactions: async (month, year, type) => {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month);
        if (year !== undefined) params.append('year', year);
        if (type) params.append('type', type);

        const response = await fetch(`${API_URL}/transactions?${params.toString()}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    addTransaction: async (transaction) => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(transaction)
        });
        return handleResponse(response);
    },

    updateTransaction: async (id, transaction) => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(transaction)
        });
        return handleResponse(response);
    },

    deleteTransaction: async (id) => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Categories
    getCategories: async () => {
        const response = await fetch(`${API_URL}/categories`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    addCategory: async (category) => {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(category)
        });
        return handleResponse(response);
    },

    deleteCategory: async (id) => {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Cards
    getCards: async () => {
        const response = await fetch(`${API_URL}/cards`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    addCard: async (card) => {
        const response = await fetch(`${API_URL}/cards`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(card)
        });
        return handleResponse(response);
    },

    deleteCard: async (id) => {
        const response = await fetch(`${API_URL}/cards/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Recurring Templates
    getRecurringTemplates: async () => {
        const response = await fetch(`${API_URL}/recurring-templates`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    addRecurringTemplate: async (template) => {
        const response = await fetch(`${API_URL}/recurring-templates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(template)
        });
        return handleResponse(response);
    },

    deleteRecurringTemplate: async (id) => {
        const response = await fetch(`${API_URL}/recurring-templates/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    generateMonthlyTransactions: async (month, year) => {
        const response = await fetch(`${API_URL}/transactions/generate-monthly`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ month, year })
        });
        return handleResponse(response);
    }
};
