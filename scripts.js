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
 * Endpoint oficial ativo do CrudCrud para o recurso de clientes.
 * As chaves gratuitas do CrudCrud expiram após 24 horas ou 100 requisições.
 * Quando expirar, você pode gerar uma nova em https://crudcrud.com
 * e atualizar diretamente pelo campo na página ou editando a constante abaixo.
 */
const DEFAULT_API_URL = "https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes";
const STORAGE_KEY = "crudcrud_api_endpoint";

/**
 * Retorna o endpoint ativo (salvo no localStorage ou o valor padrão)
 * Limpa automaticamente se houver algum endpoint antigo ou inválido salvo.
 * @returns {string} URL completa da API
 */
function obterEndpointAtivo() {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo || salvo.trim() === "" || salvo.includes("3b99dbb601e34ffaa9e1c31da647d6d1")) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_API_URL;
    }
    return salvo.trim();
}

/**
 * Salva um novo endpoint no localStorage e atualiza a lista
 * @param {string} novoEndpoint 
 */
function salvarEndpoint(novoEndpoint) {
    if (!novoEndpoint || !novoEndpoint.startsWith("http")) {
        mostrarAlerta("Por favor, insira uma URL válida iniciando com https://", "warning");
        return;
    }
    
    // Assegura que termina com o recurso /clientes
    let endpointFormatado = novoEndpoint.trim();
    if (!endpointFormatado.endsWith("/clientes")) {
        endpointFormatado = endpointFormatado.replace(/\/+$/, "") + "/clientes";
    }

    localStorage.setItem(STORAGE_KEY, endpointFormatado);
    apiEndpointInput.value = endpointFormatado;
    mostrarAlerta("Endpoint atualizado com sucesso!", "success");
    console.log(`[Configuração] Novo endpoint definido: ${endpointFormatado}`);
    listarClientes();
}

/**
 * Restaura o endpoint original padrão
 */
function resetarEndpointPadrao() {
    localStorage.removeItem(STORAGE_KEY);
    apiEndpointInput.value = DEFAULT_API_URL;
    mostrarAlerta("Endpoint restaurado para o padrão original!", "success");
    console.log(`[Configuração] Endpoint restaurado para o padrão: ${DEFAULT_API_URL}`);
    listarClientes();
}

// =============================================================================
// SELETORES DO DOM (COM SUPORTE RESILIENTE A IDs ALTERNATIVOS)
// =============================================================================
const formCliente = document.getElementById("form-cliente") || document.getElementById("cliente-form");
const inputNome = document.getElementById("nome") || document.querySelector("input[name='nome']");
const inputEmail = document.getElementById("email") || document.querySelector("input[name='email']");
const btnCadastrar = document.getElementById("btn-cadastrar") || formCliente.querySelector("button[type='submit']");
const btnTexto = btnCadastrar.querySelector(".btn-text") || btnCadastrar;
const btnSpinner = btnCadastrar.querySelector(".btn-spinner");

const listaClientes = document.getElementById("lista-clientes") || document.getElementById("clientes-lista");
const loadingIndicator = document.getElementById("loading-indicator");
const emptyState = document.getElementById("empty-state");
const clientesCount = document.getElementById("clientes-count");
const btnRecarregar = document.getElementById("btn-recarregar");

const apiEndpointInput = document.getElementById("api-endpoint-input");
const btnSalvarEndpoint = document.getElementById("btn-salvar-endpoint");
const btnResetarEndpoint = document.getElementById("btn-resetar-endpoint");
const alertBox = document.getElementById("mensagem-alerta");

const erroNome = document.getElementById("erro-nome");
const erroEmail = document.getElementById("erro-email");

// =============================================================================
// FUNÇÕES AUXILIARES DE UI & FEEDBACK
// =============================================================================

let timerAlerta = null;
/**
 * Exibe alerta visual no topo da aplicação
 * @param {string} mensagem Texto da mensagem
 * @param {'success'|'danger'|'warning'} tipo Tipo do alerta
 * @param {number} duracaoMs Tempo em milissegundos para sumir automaticamente
 */
function mostrarAlerta(mensagem, tipo = "info", duracaoMs = 5000) {
    if (!alertBox) return;
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
    if (!btnCadastrar) return;
    btnCadastrar.disabled = carregando;
    if (carregando) {
        if (btnTexto && btnTexto !== btnCadastrar) btnTexto.textContent = "Salvando...";
        if (btnSpinner) btnSpinner.classList.remove("d-none");
    } else {
        if (btnTexto && btnTexto !== btnCadastrar) btnTexto.textContent = "Cadastrar Cliente";
        if (btnSpinner) btnSpinner.classList.add("d-none");
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
 * Validação dos campos do formulário
 * @returns {boolean} Se os dados são válidos
 */
function validarFormulario() {
    let valido = true;
    if (erroNome) erroNome.textContent = "";
    if (erroEmail) erroEmail.textContent = "";
    inputNome.classList.remove("input-invalid");
    inputEmail.classList.remove("input-invalid");

    const nomeVal = inputNome.value.trim();
    const emailVal = inputEmail.value.trim();

    if (!nomeVal || nomeVal.length < 3) {
        if (erroNome) erroNome.textContent = "Informe o nome com no mínimo 3 caracteres.";
        inputNome.classList.add("input-invalid");
        valido = false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !regexEmail.test(emailVal)) {
        if (erroEmail) erroEmail.textContent = "Informe um endereço de e-mail válido.";
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
    console.log(`[GET] Consultando clientes na API: ${endpoint}`);

    // Exibe estado de carregamento
    if (loadingIndicator) loadingIndicator.classList.remove("d-none");
    if (emptyState) emptyState.classList.add("d-none");
    if (listaClientes) listaClientes.innerHTML = "";

    try {
        const resposta = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        console.log(`[GET] Resposta HTTP ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado ou inexistente no CrudCrud. Crie um novo em crudcrud.com e atualize a URL.");
            }
            throw new Error(`Erro na API (${resposta.status}): ${resposta.statusText}`);
        }

        const clientes = await resposta.json();
        console.log(`[GET] Clientes carregados com sucesso (${clientes.length}):`, clientes);

        renderizarClientes(clientes);
    } catch (erro) {
        console.error("[GET] Falha na requisição:", erro);
        mostrarAlerta(`Erro ao carregar clientes: ${erro.message}`, "danger", 8000);
        renderizarClientes([]);
    } finally {
        if (loadingIndicator) loadingIndicator.classList.add("d-none");
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

        console.log(`[POST] Resposta HTTP ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado no CrudCrud. Por favor atualize o endpoint.");
            }
            throw new Error(`Falha ao cadastrar (${resposta.status}): ${resposta.statusText}`);
        }

        const clienteCriado = await resposta.json();
        console.log("[POST] Cliente cadastrado com sucesso:", clienteCriado);

        mostrarAlerta(`Cliente "${clienteCriado.nome}" cadastrado com sucesso!`, "success");

        // Limpa o formulário e atualiza a listagem
        formCliente.reset();
        inputNome.focus();
        await listarClientes();
    } catch (erro) {
        console.error("[POST] Falha na requisição:", erro);
        mostrarAlerta(`Erro ao salvar cliente: ${erro.message}`, "danger", 8000);
    } finally {
        setBotaoCarregando(false);
    }
}

/**
 * 3. MÉTODO DELETE - Excluir um cliente na API pelo _id
 * @param {string} id Identificador único do CrudCrud (_id)
 * @param {string} nomeCliente Nome do cliente para exibir no feedback
 * @param {HTMLButtonElement} [btnElement] Referência do botão para feedback visual
 */
async function excluirCliente(id, nomeCliente, btnElement) {
    const endpoint = `${obterEndpointAtivo()}/${id}`;
    console.log(`[DELETE] Excluindo cliente ID ${id} em: ${endpoint}`);

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = "Excluindo...";
    }

    try {
        const resposta = await fetch(endpoint, {
            method: "DELETE"
        });

        console.log(`[DELETE] Resposta HTTP ${resposta.status} (${resposta.statusText})`);

        if (!resposta.ok) {
            throw new Error(`Falha ao excluir registro (${resposta.status}): ${resposta.statusText}`);
        }

        console.log(`[DELETE] Cliente ${id} (${nomeCliente}) excluído com sucesso!`);
        mostrarAlerta(`Cliente "${nomeCliente}" excluído com sucesso!`, "success");

        // Atualiza a listagem no DOM
        await listarClientes();
    } catch (erro) {
        console.error("[DELETE] Falha na requisição:", erro);
        mostrarAlerta(`Erro ao excluir cliente: ${erro.message}`, "danger", 8000);
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.textContent = "Excluir";
        }
    }
}

// =============================================================================
// RENDERIZAÇÃO DINÂMICA NO DOM
// =============================================================================

/**
 * Renderiza os clientes na lista
 * @param {Array<{ _id: string, nome: string, email: string }>} clientes 
 */
function renderizarClientes(clientes) {
    if (!listaClientes) return;

    listaClientes.innerHTML = "";
    const total = Array.isArray(clientes) ? clientes.length : 0;

    if (clientesCount) {
        clientesCount.textContent = `${total} ${total === 1 ? "cliente" : "clientes"}`;
    }

    if (!Array.isArray(clientes) || clientes.length === 0) {
        if (emptyState) emptyState.classList.remove("d-none");
        return;
    }

    if (emptyState) emptyState.classList.add("d-none");

    clientes.forEach(cliente => {
        const li = document.createElement("li");
        li.className = "cliente-item";
        li.dataset.id = cliente._id;

        // Container de informações
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
        idBadge.title = "ID do registro no CrudCrud";
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

        // Event listener para a exclusão
        btnDelete.addEventListener("click", () => {
            excluirCliente(cliente._id, cliente.nome, btnDelete);
        });

        li.appendChild(infoWrapper);
        li.appendChild(btnDelete);
        listaClientes.appendChild(li);
    });
}

/**
 * Escapa caracteres especiais para prevenir XSS
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

// Formulário de Cadastro (POST)
if (formCliente) {
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
}

// Botão de recarregar lista manualmente
if (btnRecarregar) {
    btnRecarregar.addEventListener("click", () => {
        console.log("[Ação] Recarregando lista manualmente...");
        listarClientes();
    });
}

// Botão de salvar endpoint customizado
if (btnSalvarEndpoint) {
    btnSalvarEndpoint.addEventListener("click", () => {
        const valor = apiEndpointInput.value.trim();
        if (valor) {
            salvarEndpoint(valor);
        } else {
            mostrarAlerta("Digite uma URL de endpoint antes de salvar.", "warning");
        }
    });
}

// Botão de restaurar endpoint padrão
if (btnResetarEndpoint) {
    btnResetarEndpoint.addEventListener("click", () => {
        resetarEndpointPadrao();
    });
}

// Inicialização automática ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    console.log("%c=== GERENCIADOR DE CLIENTES INICIADO ===", "color: #2563eb; font-weight: bold; font-size: 14px;");
    
    // Atualiza o input com o endpoint ativo
    const endpointAtivo = obterEndpointAtivo();
    if (apiEndpointInput) {
        apiEndpointInput.value = endpointAtivo;
    }
    console.log(`[Configuração] Endpoint ativo: ${endpointAtivo}`);

    // Carrega clientes da API imediatamente via GET
    listarClientes();
});
