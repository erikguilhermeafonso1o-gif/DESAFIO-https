# ClientFlow &bull; Dashboard de Gestão de Clientes (CRUD REST API) 🚀

Aplicação web profissional desenvolvida com arquitetura reativa em JavaScript puro (Vanilla JS), HTML5 e CSS3, consumindo a API REST do [CrudCrud](https://crudcrud.com) através da **Fetch API** nativa (`GET`, `POST` e `DELETE`).

---

## 📌 Funcionalidades do Dashboard

### 1. Métodos REST do Desafio
- **`POST /clientes` (Cadastrar Cliente):** Envia os dados (`nome` e `email`) no corpo da requisição em formato JSON com cabeçalho `Content-Type: application/json`.
- **`GET /clientes` (Listar Clientes):** Consulta todos os registros da API, calcula o tempo de resposta (latência) e renderiza dinamicamente na tela.
- **`DELETE /clientes/{_id}` (Excluir Cliente):** Remove o registro específico pelo `_id` único fornecido pelo CrudCrud com feedback visual imediato.

### 2. Recursos Avançados de Dashboard
- **Painel de Indicadores (KPIs em Tempo Real):**
  - Total de clientes cadastrados.
  - Contador de requisições realizadas na sessão (`GET`, `POST`, `DELETE`).
  - Total de domínios únicos de e-mail e provedor mais frequente.
  - Último status HTTP retornado e latência da chamada em milissegundos.
- **Console da API (Simulador DevTools / Postman Integrado):**
  - Exibe na própria tela o histórico ao vivo de todas as requisições HTTP disparadas com horário, método, código de status e tempo de resposta.
- **Live Avatar Preview:**
  - Gera as iniciais e prévia visual do cliente em tempo real conforme o usuário digita no formulário.
- **Busca e Filtragem Instantânea:**
  - Campo de busca em tempo real por nome, e-mail ou ID.
- **Ordenação Dinâmica:**
  - Ordenar por Mais Recentes, Nome (A - Z) ou Nome (Z - A).
- **Alternador de Visualização:**
  - Alterne entre o modo **Grade (Cards)** e o modo **Tabela**.
- **Exportação de Dados:**
  - Baixe os dados de clientes diretamente em formato **JSON** ou **CSV**.
- **Gerenciador de Endpoint Dinâmico:**
  - Como os endpoints gratuitos do CrudCrud expiram a cada 24 horas, o painel superior permite atualizar a URL ou restaurar o padrão original a qualquer momento.

---

## 📁 Estrutura de Arquivos

```plaintext
DESAFIO https/
├── index.html     # Estrutura do dashboard (KPIs, formulário, console e listagem)
├── scripts.js     # Gestão de estado, Fetch API (GET, POST, DELETE) e lógica reativa
├── styles.css     # Estilos modernos de Dashboard SaaS (Plus Jakarta Sans, JetBrains Mono)
└── README.md      # Documentação e guia de testes
```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Semântica moderna, componentes acessíveis e validações nativas.
- **CSS3:** Flexbox, CSS Grid, variáveis customizadas, design responsivo e animações.
- **JavaScript (ES6+):** Programação assíncrona com `async/await`, `Fetch API` e manipulação do DOM.
- **CrudCrud REST API:** Persistência dos dados em nuvem.

---

## 🚀 Como Executar o Projeto

1. Abra o arquivo [index.html](file:///c:/Users/erikg/OneDrive/Desktop/DESAFIO%20https/index.html) em qualquer navegador web (ou com a extensão Live Server).
2. O dashboard já se conecta automaticamente ao endpoint oficial ativo:
   `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`

---

## 🧪 Guia de Testes

### 1. Testando no Postman
- **POST:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`
  - Body (raw > JSON): `{"nome": "Marina Souza", "email": "marina@exemplo.com"}`
  - Retorno: `201 Created`
- **GET:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`
  - Retorno: `200 OK`
- **DELETE:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes/{_id}`
  - Retorno: `200 OK`

### 2. Testando no Navegador & DevTools
- Pressione `F12` e abra a aba **Network** (filtre por `Fetch/XHR`) e **Console** para inspecionar as requisições em paralelo com o **Console da API** visual embutido no próprio dashboard.

---

## 📦 Como Publicar no GitHub

```bash
git add .
git commit -m "feat: dashboard completo com KPIs, console de rede e modos de visualizacao"
git push -u origin main
```
