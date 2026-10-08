/**
 * =============================================================================
 * DESAFIO FRONT-END: CRUD DE CLIENTES COM FETCH API E CRUDCRUD
 * =============================================================================
 * Arquivo: scripts.js
 * Descrição: Integração completa com a API REST do CrudCrud utilizando Fetch API
 * Métodos implementados:
 *   - GET: Buscar e listar todos os clientes cadastrados
 *   - POST: Enviar novo cliente (nome e e-mail)
 *   - DELETE: Excluir um cliente específico pelo seu _id
 * =============================================================================
 */

// =============================================================================
// CONFIGURAÇÃO DO ENDPOINT CRUDCRUD
// =============================================================================
/**
 * IMPORTANTE: Os endpoints gratuitos do CrudCrud expiram após 24 horas ou 100 requisições.
 * Para gerar o seu próprio endpoint:
 * 1. Acesse https://crudcrud.com
 * 2. Copie a URL única gerada (ex: https://crudcrud.com/api/SEU_HASH)
 * 3. Adicione o recurso /clientes no final da URL
 * Você pode alterar a constante abaixo ou atualizar diretamente pelo campo na página!
 */
const DEFAULT_API_URL = "https://crudcrud.com/api/3b99dbb601e34ffaa9e1c31da647d6d1/clientes";
const STORAGE_KEY = "crudcrud_api_endpoint";

/**
 * Retorna o endpoint ativo (salvo no localStorage ou o valor padrão definido acima)
 * @returns {string} URL completa do recurso na API
 */
function obterEndpointAtivo() {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return (salvo && salvo.trim() !== "") ? salvo.trim() : DEFAULT_API_URL;
}

/**
 * Salva um novo endpoint no localStorage
 * @param {string} novoEndpoint 
 */
function salvarEndpoint(novoEndpoint) {
    if (!novoEndpoint || !novoEndpoint.startsWith("http")) {
        mostrarAlerta("Por favor, insira uma URL válida iniciando com https://", "warning");
        return;
    }
    localStorage.setItem(STORAGE_KEY, novoEndpoint.trim());
    mostrarAlerta("Endpoint atualizado com sucesso!", "success");
    console.log(`[Configuração] Novo endpoint definido: ${novoEndpoint.trim()}`);
    listarClientes();
}

// =============================================================================
// SELETORES DO DOM
// =============================================================================
const formCliente = document.getElementById("form-cliente");
const inputNome = document.getElementById("nome");
const inputEmail = document.getElementById("email");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnTexto = btnCadastrar.querySelector(".btn-text");
const btnSpinner = btnCadastrar.querySelector(".btn-spinner");

const listaClientes = document.getElementById("lista-clientes");
const loadingIndicator = document.getElementById("loading-indicator");
const emptyState = document.getElementById("empty-state");
const clientesCount = document.getElementById("clientes-count");
const btnRecarregar = document.getElementById("btn-recarregar");

const apiEndpointInput = document.getElementById("api-endpoint-input");
const btnSalvarEndpoint = document.getElementById("btn-salvar-endpoint");
const alertBox = document.getElementById("mensagem-alerta");

const erroNome = document.getElementById("erro-nome");
const erroEmail = document.getElementById("erro-email");

// =============================================================================
// FUNÇÕES AUXILIARES DE UI & FEEDBACK
// =============================================================================

/**
 * Exibe alerta visual no topo da aplicação
 * @param {string} mensagem Texto da mensagem
 * @param {'success'|'danger'|'warning'} tipo Tipo do alerta
 * @param {number} duracaoMs Tempo em milissegundos para sumir automaticamente
 */
let timerAlerta = null;
function mostrarAlerta(mensagem, tipo = "info", duracaoMs = 5000) {
    if (timerAlerta) clearTimeout(timerAlerta);

    alertBox.className = `alert-box alert-${tipo}`;
    alertBox.textContent = mensagem;
    alertBox.classList.remove("d-none");

    timerAlerta = setTimeout(() => {
        alertBox.classList.add("d-none");
    }, duracaoMs);
}

/**
 * Controla o estado de carregamento do botão de cadastro
 * @param {boolean} carregando 
 */
function setBotaoCarregando(carregando) {
    btnCadastrar.disabled = carregando;
    if (carregando) {
        btnTexto.textContent = "Salvando...";
        btnSpinner.classList.remove("d-none");
    } else {
        btnTexto.textContent = "Cadastrar Cliente";
        btnSpinner.classList.add("d-none");
    }
}

/**
 * Gera as iniciais do nome para o avatar visual
 * @param {string} nome 
 * @returns {string} 2 letras maiúsculas
 */
function extrairIniciais(nome) {
    if (!nome) return "??";
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Validação simples do formulário
 * @returns {boolean} Se os dados são válidos
 */
function validarFormulario() {
    let valido = true;
    erroNome.textContent = "";
    erroEmail.textContent = "";
    inputNome.classList.remove("input-invalid");
    inputEmail.classList.remove("input-invalid");

    const nomeVal = inputNome.value.trim();
    const emailVal = inputEmail.value.trim();

    if (!nomeVal || nomeVal.length < 3) {
        erroNome.textContent = "Informe o nome com no mínimo 3 caracteres.";
        inputNome.classList.add("input-invalid");
        valido = false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !regexEmail.test(emailVal)) {
        erroEmail.textContent = "Informe um endereço de e-mail válido.";
        inputEmail.classList.add("input-invalid");
        valido = false;
    }

    return valido;
}

// =============================================================================
// REQUISIÇÕES HTTP (FETCH API: GET, POST, DELETE)
// =============================================================================

/**
 * 1. MÉTODO GET - Buscar e listar todos os clientes cadastrados na API
 */
async function listarClientes() {
    const endpoint = obterEndpointAtivo();
    console.log(`[GET] Iniciando requisição para: ${endpoint}`);

    // Estado visual de carregamento
    loadingIndicator.classList.remove("d-none");
    emptyState.classList.add("d-none");
    listaClientes.innerHTML = "";

    try {
        const resposta = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        console.log(`[GET] Resposta recebida da API. Status: ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            // No CrudCrud, 404 geralmente significa que as 24h do endpoint expiraram
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado ou não encontrado. Acesse crudcrud.com e gere um novo endpoint de 24h.");
            }
            throw new Error(`Falha ao buscar clientes: Erro HTTP ${resposta.status}`);
        }

        const clientes = await resposta.json();
        console.log(`[GET] Sucesso! ${clientes.length} registro(s) encontrado(s):`, clientes);

        renderizarClientes(clientes);
    } catch (erro) {
        console.error("[GET] Erro ao buscar lista de clientes:", erro);
        mostrarAlerta(`Erro ao carregar clientes: ${erro.message}`, "danger", 8000);
        renderizarClientes([]);
    } finally {
        loadingIndicator.classList.add("d-none");
    }
}

/**
 * 2. MÉTODO POST - Cadastrar um novo cliente na API
 * @param {{ nome: string, email: string }} dadosCliente
 */
async function cadastrarCliente(dadosCliente) {
    const endpoint = obterEndpointAtivo();
    console.log(`[POST] Enviando novo cliente para: ${endpoint}`, dadosCliente);

    setBotaoCarregando(true);

    try {
        const resposta = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(dadosCliente)
        });

        console.log(`[POST] Resposta recebida da API. Status: ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado ou inválido. Atualize a URL do CrudCrud.");
            }
            throw new Error(`Falha ao cadastrar: Erro HTTP ${resposta.status}`);
        }

        const clienteCriado = await resposta.json();
        console.log("[POST] Cliente cadastrado com sucesso! Retorno da API:", clienteCriado);

        mostrarAlerta(`Cliente "${clienteCriado.nome}" cadastrado com sucesso!`, "success");

        // Limpa o formulário e recarrega a lista
        formCliente.reset();
        inputNome.focus();
        await listarClientes();
    } catch (erro) {
        console.error("[POST] Erro ao cadastrar cliente:", erro);
        mostrarAlerta(`Erro ao salvar cliente: ${erro.message}`, "danger", 8000);
    } finally {
        setBotaoCarregando(false);
    }
}

/**
 * 3. MÉTODO DELETE - Excluir um cliente na API pelo _id
 * @param {string} id Identificador único gerado pelo CrudCrud (_id)
 * @param {string} nomeCliente Nome do cliente para exibir no alerta
 */
async function excluirCliente(id, nomeCliente) {
    const confirmacao = window.confirm(`Deseja realmente excluir o cliente "${nomeCliente}"?`);
    if (!confirmacao) {
        console.log(`[DELETE] Operação cancelada pelo usuário para o ID: ${id}`);
        return;
    }

    const endpoint = `${obterEndpointAtivo()}/${id}`;
    console.log(`[DELETE] Enviando requisição de exclusão para: ${endpoint}`);

    try {
        const resposta = await fetch(endpoint, {
            method: "DELETE"
        });

        console.log(`[DELETE] Resposta recebida da API. Status: ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            throw new Error(`Falha ao excluir registro: Erro HTTP ${resposta.status}`);
        }

        console.log(`[DELETE] Cliente com ID "${id}" excluído com sucesso!`);
        mostrarAlerta(`Cliente "${nomeCliente}" excluído com sucesso!`, "success");

        // Recarrega a lista para sincronizar com a API
        await listarClientes();
    } catch (erro) {
        console.error("[DELETE] Erro ao excluir cliente:", erro);
        mostrarAlerta(`Erro ao excluir cliente: ${erro.message}`, "danger", 8000);
    }
}

// =============================================================================
// RENDERIZAÇÃO DINÂMICA NO DOM
// =============================================================================

/**
 * Renderiza a lista de clientes no DOM
 * @param {Array<{ _id: string, nome: string, email: string }>} clientes 
 */
function renderizarClientes(clientes) {
    listaClientes.innerHTML = "";
    clientesCount.textContent = `${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`;

    if (!clientes || clientes.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    clientes.forEach(cliente => {
        const li = document.createElement("li");
        li.className = "cliente-item";
        li.dataset.id = cliente._id;

        // Bloco de informações e avatar
        const infoWrapper = document.createElement("div");
        infoWrapper.className = "cliente-info-wrapper";

        const avatar = document.createElement("div");
        avatar.className = "cliente-avatar";
        avatar.textContent = extrairIniciais(cliente.nome);

        const detalhes = document.createElement("div");
        detalhes.className = "cliente-detalhes";

        const nomeEl = document.createElement("span");
        nomeEl.className = "cliente-nome";
        nomeEl.textContent = cliente.nome;

        const emailEl = document.createElement("span");
        emailEl.className = "cliente-email";
        emailEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            ${escapeHtml(cliente.email)}
        `;

        const idBadge = document.createElement("span");
        idBadge.className = "cliente-id-badge";
        idBadge.title = "Identificador único gerado pelo CrudCrud";
        idBadge.textContent = `ID: ${cliente._id}`;

        detalhes.appendChild(nomeEl);
        detalhes.appendChild(emailEl);
        detalhes.appendChild(idBadge);

        infoWrapper.appendChild(avatar);
        infoWrapper.appendChild(detalhes);

        // Botão de Excluir (DELETE)
        const btnDelete = document.createElement("button");
        btnDelete.type = "button";
        btnDelete.className = "btn btn-delete";
        btnDelete.title = `Excluir ${cliente.nome}`;
        btnDelete.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Excluir
        `;

        // Event listener para disparar a exclusão
        btnDelete.addEventListener("click", () => {
            excluirCliente(cliente._id, cliente.nome);
        });

        li.appendChild(infoWrapper);
        li.appendChild(btnDelete);
        listaClientes.appendChild(li);
    });
}

/**
 * Escapar caracteres HTML para prevenção básica de XSS
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#032;");
}

// =============================================================================
// EVENT LISTENERS & INICIALIZAÇÃO
// =============================================================================

// Envio do formulário de cadastro (POST)
formCliente.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const novoCliente = {
        nome: inputNome.value.trim(),
        email: inputEmail.value.trim()
    };

    cadastrarCliente(novoCliente);
});

// Botão de atualizar lista manualmente
btnRecarregar.addEventListener("click", () => {
    console.log("[Ação] Botão de recarregar acionado");
    listarClientes();
});

// Salvar novo endpoint configurado na UI
btnSalvarEndpoint.addEventListener("click", () => {
    const valor = apiEndpointInput.value.trim();
    if (valor) {
        salvarEndpoint(valor);
    } else {
        mostrarAlerta("Digite uma URL de endpoint antes de salvar.", "warning");
    }
});

// Inicialização ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    console.log("%c=== GERENCIADOR DE CLIENTES CARREGADO ===", "color: #2563eb; font-weight: bold; font-size: 14px;");
    
    // Preenche o campo de endpoint com o valor ativo atual
    const endpointAtivo = obterEndpointAtivo();
    apiEndpointInput.value = endpointAtivo;
    console.log(`[Inicialização] Endpoint ativo da API: ${endpointAtivo}`);

    // Executa a primeira busca na API (GET)
    listarClientes();
});
