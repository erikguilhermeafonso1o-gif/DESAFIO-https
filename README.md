# Gerenciador de Clientes (CRUD CrudCrud) 🚀

Aplicação web desenvolvida para cadastro, listagem e exclusão de clientes consumindo a API REST do [CrudCrud](https://crudcrud.com) através da **Fetch API** nativa do JavaScript (`GET`, `POST` e `DELETE`).

---

## 📌 Funcionalidades

- **`POST` (Cadastrar Cliente):** Envia os dados do formulário (`nome` e `email`) no corpo da requisição em formato JSON para a API.
- **`GET` (Listar Clientes):** Consulta e renderiza dinamicamente todos os registros salvos na API ao carregar a página ou após ações de cadastro/exclusão.
- **`DELETE` (Excluir Cliente):** Remove um registro específico pelo seu identificador único (`_id`) gerado pelo CrudCrud.
- **Tratamento de Erros e Logs:** Mensagens com feedback visual para o usuário e registros detalhados via `console.log()` e `console.error()` no DevTools.
- **Gerenciador de Endpoint:** Como as chaves gratuitas do CrudCrud expiram após 24h, a interface permite atualizar ou restaurar a URL diretamente pela tela ou pelo código, persistindo a escolha no `localStorage`.

---

## 📁 Estrutura de Arquivos

```plaintext
DESAFIO https/
├── index.html     # Interface da aplicação (formulário e área de listagem)
├── scripts.js     # Lógica assíncrona com Fetch API (GET, POST, DELETE)
├── styles.css     # Estilização moderna, responsiva e componentes de UI
└── README.md      # Documentação do projeto e guia de testes
```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Semântica, acessibilidade e validação de formulários.
- **CSS3:** Flexbox, CSS Grid, variáveis customizadas e design responsivo.
- **JavaScript (ES6+):** Programação assíncrona com `async/await`, `Fetch API` e manipulação dinâmica do DOM.
- **CrudCrud:** Serviço mock de API REST para persistência dos dados.

---

## 🚀 Como Executar o Projeto

1. Abra o arquivo `index.html` diretamente em seu navegador (ou utilizando a extensão Live Server).
2. O endpoint oficial ativo já vem configurado e povoado com registros de exemplo:
   `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`
3. Caso a chave expire após as 24h:
   - Acesse [crudcrud.com](https://crudcrud.com) e copie o novo identificador.
   - Cole no campo de configuração no topo da aplicação e clique em **Atualizar Endpoint**.

---

## 🧪 Guia de Testes

### 1. Testando no Postman

#### A. Requisição `POST` (Criar cliente)
- **Método:** `POST`
- **URL:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`
- **Headers:** `Content-Type: application/json`
- **Body (raw > JSON):**
  ```json
  {
    "nome": "Maria Silva",
    "email": "maria.silva@exemplo.com"
  }
  ```
- **Resposta Esperada:** Código `201 Created` com o ID gerado.

#### B. Requisição `GET` (Listar clientes)
- **Método:** `GET`
- **URL:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes`
- **Resposta Esperada:** Código `200 OK` com o array de clientes.

#### C. Requisição `DELETE` (Excluir cliente)
- **Método:** `DELETE`
- **URL:** `https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes/{_id}`
- **Resposta Esperada:** Código `200 OK`.

---

### 2. Testando no DevTools

1. Pressione `F12` no navegador.
2. Na aba **Console**, veja os logs de cada requisição (`[GET]`, `[POST]`, `[DELETE]`).
3. Na aba **Network**, filtre por `Fetch/XHR` para verificar as requisições HTTP e os códigos de status retornados.

---

## 📦 Como Publicar no GitHub

```bash
git add .
git commit -m "fix: atualizacao do endpoint ativo e correcoes gerais"
git push -u origin main
```
