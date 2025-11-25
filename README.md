# BenyFinance 💰

Uma aplicação web moderna de controle financeiro pessoal, desenvolvida com React e Tailwind CSS. Substitui planilhas complexas por uma interface intuitiva e responsiva para gerenciar suas finanças.

## ✨ Funcionalidades

### 📊 Dashboard
- **Visão Geral Financeira**: Cards com resumo de saldo em conta, receitas, despesas totais e fatura de cartões
- **Gráficos Interativos**: 
  - Receitas vs Despesas (últimos 6 meses)
  - Gastos por Categoria (mês atual)
- **Lançamentos Recentes**: Tabela com as últimas transações

### 💳 Lançamentos
- **CRUD Completo**: Criar, visualizar, editar e excluir transações
- **Formas de Pagamento**: 
  - Dinheiro/Conta
  - Cartão de Crédito (com seleção de cartão)
- **Filtros e Busca**: Pesquisa por descrição e filtro por tipo (Receita/Despesa)
- **Categorização**: Associe cada lançamento a uma categoria

### 🏷️ Categorias
- **Gerenciamento de Categorias**: Crie, edite e exclua categorias personalizadas
- **Cores Personalizadas**: Identifique visualmente cada categoria
- **Grid View**: Visualização organizada de todas as categorias

### ⚙️ Configurações
- **Gerenciamento de Cartões**: 
  - Adicione cartões de crédito com nome, banco, limite
  - Configure dia de fechamento e vencimento
  - Exclua cartões não utilizados

### 🔐 Autenticação
- Sistema de login com autenticação mock
- Rotas protegidas
- Persistência de sessão

## 🚀 Tecnologias

- **React** - Biblioteca para construção de interfaces
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router DOM** - Roteamento
- **Recharts** - Biblioteca de gráficos
- **Lucide React** - Ícones
- **UUID** - Geração de IDs únicos

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd BenyFinance
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse a aplicação em `http://localhost:5173`

## 🎯 Como Usar

### Login
Use qualquer e-mail e senha para fazer login (autenticação mock).

### Adicionar Transação
1. Navegue para **Lançamentos**
2. Clique em **Novo Lançamento**
3. Preencha os dados:
   - Tipo (Receita/Despesa)
   - Descrição
   - Valor
   - Data
   - Categoria
   - Forma de Pagamento (apenas para despesas)
   - Cartão (se pagamento for crédito)
4. Clique em **Salvar**

### Gerenciar Categorias
1. Navegue para **Categorias**
2. Clique em **Nova Categoria**
3. Defina nome e cor
4. Use os ícones de editar/excluir para gerenciar

### Adicionar Cartão
1. Navegue para **Configurações**
2. Na seção "Meus Cartões", clique em **Adicionar Cartão**
3. Preencha:
   - Nome do cartão
   - Banco
   - Limite
   - Dia de fechamento
   - Dia de vencimento
4. Clique em **Salvar**

## 📁 Estrutura do Projeto

```
BenyFinance/
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── MainLayout.jsx      # Layout principal com sidebar
│   ├── context/
│   │   └── AuthContext.jsx         # Contexto de autenticação
│   ├── pages/
│   │   ├── Dashboard.jsx           # Página inicial
│   │   ├── Transactions.jsx        # Gerenciamento de lançamentos
│   │   ├── Categories.jsx          # Gerenciamento de categorias
│   │   ├── Settings.jsx            # Configurações e cartões
│   │   └── Login.jsx               # Tela de login
│   ├── services/
│   │   └── mockData.js             # Serviço mock de dados
│   ├── App.jsx                     # Componente raiz
│   ├── main.tsx                    # Ponto de entrada
│   └── index.css                   # Estilos globais
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Características de Design

- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Moderno**: Interface limpa com Tailwind CSS
- **Intuitivo**: Navegação clara e fluxos de trabalho simples
- **Visual**: Gráficos e indicadores visuais para melhor compreensão

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👨‍💻 Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

### Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Desenvolvido com ❤️ para facilitar o controle financeiro pessoal.
