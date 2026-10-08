# Gerenciador de Clientes (CRUD CrudCrud) 🚀

Aplicação web desenvolvida para cadastro, listagem e exclusão de clientes consumindo a API REST do [CrudCrud](https://crudcrud.com) através da **Fetch API** nativa do JavaScript (`GET`, `POST` e `DELETE`).

---

## 📌 Funcionalidades

- **`POST` (Cadastrar Cliente):** Envia os dados do formulário (`nome` e `email`) no corpo da requisição em formato JSON para a API.
- **`GET` (Listar Clientes):** Consulta e renderiza dinamicamente todos os registros salvos na API ao carregar a página ou após ações de cadastro/exclusão.
- **`DELETE` (Excluir Cliente):** Remove um registro específico pelo seu identificador único (`_id`) gerado pelo CrudCrud.
- **Tratamento de Erros e Logs:** Mensagens com feedback visual para o usuário e registros detalhados via `console.log()` e `console.error()` no DevTools.
- **Gerenciador de Endpoint Dinâmico:** Como as chaves gratuitas do CrudCrud expiram após 24h, a interface permite atualizar a URL diretamente pela tela ou pelo código, persistindo a escolha no `localStorage`.

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

1. Clone ou baixe os arquivos deste repositório.
2. Abra o arquivo `index.html` diretamente em seu navegador (ou utilizando uma extensão como o *Live Server* do VS Code).
3. **Endpoint CrudCrud:**
   - Acesse [crudcrud.com](https://crudcrud.com).
   - Copie o seu endpoint único gerado na página inicial.
   - Acrescente `/clientes` ao final da URL (exemplo: `https://crudcrud.com/api/SEU_HASH_AQUI/clientes`).
   - Cole o link no campo de configuração no topo da aplicação e clique em **Atualizar Endpoint** (ou altere a constante `DEFAULT_API_URL` no arquivo [scripts.js](file:///c:/Users/erikg/OneDrive/Desktop/DESAFIO%20https/scripts.js)).

---

## 🧪 Guia de Testes

### 1. Testando no Postman

O Postman é a ferramenta ideal para validar o comportamento da API antes e durante o desenvolvimento do front-end.

#### A. Requisição `POST` (Criar cliente)
- **Método:** `POST`
- **URL:** `https://crudcrud.com/api/{SEU_ENDPOINT}/clientes`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body:** Escolha a opção **raw** e selecione **JSON**:
  ```json
  {
    "nome": "Maria Silva",
    "email": "maria.silva@exemplo.com"
  }
  ```
- **Resposta Esperada:** Código `201 Created` retornando o objeto com o `_id`:
  ```json
  {
    "_id": "673f1a2b...",
    "nome": "Maria Silva",
    "email": "maria.silva@exemplo.com"
  }
  ```

#### B. Requisição `GET` (Listar clientes)
- **Método:** `GET`
- **URL:** `https://crudcrud.com/api/{SEU_ENDPOINT}/clientes`
- **Resposta Esperada:** Código `200 OK` retornando um array de objetos JSON com todos os registros cadastrados.

#### C. Requisição `DELETE` (Excluir cliente)
- **Método:** `DELETE`
- **URL:** `https://crudcrud.com/api/{SEU_ENDPOINT}/clientes/{_id}` *(substitua `{_id}` pelo ID retornado no GET/POST)*
- **Resposta Esperada:** Código `200 OK`.

---

### 2. Testando no DevTools do Navegador

1. Abra a aplicação no navegador (Chrome, Edge ou Firefox).
2. Pressione `F12` (ou clique com botão direito e selecione **Inspecionar**).
3. **Aba Console:**
   - Observe os logs estruturados (`[GET]`, `[POST]`, `[DELETE]`) documentando cada ação e dados retornados da API.
4. **Aba Network (Rede):**
   - Filtre por `Fetch/XHR`.
   - Ao carregar a página, veja a requisição `GET clientes` com status `200`.
   - Ao cadastrar um cliente, veja a requisição `POST clientes` com status `201` e inspecione as abas **Payload** e **Response**.
   - Ao clicar no botão de excluir, veja a requisição `DELETE clientes/{id}` com status `200`.

---

## 📦 Como Publicar no GitHub

Para disponibilizar o link público do repositório conforme solicitado na entrega:

1. Abra o terminal na pasta do projeto e inicialize o Git:
   ```bash
   git init
   git add .
   git commit -m "feat: implementacao completa do CRUD de clientes com CrudCrud API"
   ```

2. Crie um novo repositório **Público** na sua conta do [GitHub](https://github.com/new).

3. Conecte o repositório local ao GitHub e envie os arquivos:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
   git push -u origin main
   ```

4. Copie a URL pública do seu repositório no GitHub para a entrega da atividade!
