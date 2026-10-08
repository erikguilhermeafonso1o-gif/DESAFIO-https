/**
 * =============================================================================
 * CLIENTFLOW DASHBOARD: CRUD DE CLIENTES COM FETCH API E CRUDCRUD
 * =============================================================================
 * Arquivo: scripts.js
 * Descrição: Sistema programado com arquitetura reativa, gestão de estado,
 * métricas em tempo real (KPIs), console de rede (DevTools/Postman integrado),
 * filtros, ordenação e visualização em grade ou tabela.
 *
 * Métodos REST consumidos via Fetch API:
 *   - GET: Buscar todos os clientes da API
 *   - POST: Salvar novo cliente
 *   - DELETE: Excluir cliente pelo identificador _id
 * =============================================================================
 */

// =============================================================================
// 1. CONFIGURAÇÕES & ESTADO GLOBAL DA APLICAÇÃO
// =============================================================================

// Endpoint ativo oficial no CrudCrud (recurso /clientes)
const DEFAULT_API_URL = "https://crudcrud.com/api/54a19d79ac6d4b9bb46d6f26b464d86b/clientes";
const STORAGE_ENDPOINT_KEY = "crudcrud_api_endpoint";
const STORAGE_VIEW_KEY = "clientflow_view_mode";

// Estado da aplicação em memória
const state = {
    clientes: [],          // Dados originais sincronizados com a API
    clientesFiltrados: [], // Dados exibidos após busca e ordenação
    filtroTexto: "",       // Texto de busca ativo
    ordem: "recentes",     // recentes | nome-asc | nome-desc
    modoVisualizacao: localStorage.getItem(STORAGE_VIEW_KEY) || "cards", // cards | table
    metricas: {
        totalReqs: 0,
        countGet: 0,
        countPost: 0,
        countDel: 0,
        ultimoStatus: "--",
        ultimaLatenciaMs: 0
    }
};

// =============================================================================
// 2. SELETORES DO DOM
// =============================================================================

// Formulário de Cadastro (POST)
const formCliente = document.getElementById("form-cliente") || document.getElementById("cliente-form");
const inputNome = document.getElementById("nome") || document.querySelector("input[name='nome']");
const inputEmail = document.getElementById("email") || document.querySelector("input[name='email']");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnTexto = btnCadastrar ? btnCadastrar.querySelector(".btn-text") : null;
const btnSpinner = btnCadastrar ? btnCadastrar.querySelector(".btn-spinner") : null;
const erroNome = document.getElementById("erro-nome");
const erroEmail = document.getElementById("erro-email");

// Avatar Live Preview
const avatarPreview = document.getElementById("avatar-preview");
const previewName = document.getElementById("preview-name");
const previewEmail = document.getElementById("preview-email");

// Listagem e Visualizações
const listaClientes = document.getElementById("lista-clientes") || document.getElementById("clientes-lista");
const tabelaContainer = document.getElementById("tabela-container");
const tabelaBody = document.getElementById("tabela-clientes-body");
const loadingIndicator = document.getElementById("loading-indicator");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-state-title");
const emptyDesc = document.getElementById("empty-state-desc");
const clientesCount = document.getElementById("clientes-count");
const filtroInfo = document.getElementById("filtro-info");

// Filtros & Ferramentas
const inputBusca = document.getElementById("input-busca");
const btnLimparBusca = document.getElementById("btn-limpar-busca");
const selectOrdem = document.getElementById("select-ordem");
const btnViewCards = document.getElementById("view-btn") || document.getElementById("btn-view-cards");
const btnViewTable = document.getElementById("btn-view-table");
const btnExportar = document.getElementById("btn-exportar");
const btnRecarregar = document.getElementById("btn-recarregar");

// Topbar & Configuração de Endpoint
const apiStatusBadge = document.getElementById("api-status-badge");
const apiStatusText = document.getElementById("api-status-text");
const apiLatency = document.getElementById("api-latency");
const btnToggleConfig = document.getElementById("btn-toggle-config");
const configDrawer = document.getElementById("config-drawer");
const apiEndpointInput = document.getElementById("api-endpoint-input");
const btnSalvarEndpoint = document.getElementById("btn-salvar-endpoint");
const btnResetarEndpoint = document.getElementById("btn-resetar-endpoint");
const alertBox = document.getElementById("mensagem-alerta");

// Console de Logs
const logStream = document.getElementById("log-stream");
const btnLimparLogs = document.getElementById("btn-limpar-logs");

// KPIs
const kpiTotalClientes = document.getElementById("kpi-total-clientes");
const kpiTotalReqs = document.getElementById("kpi-total-reqs");
const countGet = document.getElementById("count-get");
const countPost = document.getElementById("count-post");
const countDel = document.getElementById("count-del");
const kpiDominiosCount = document.getElementById("kpi-dominios-count");
const kpiDominioTop = document.getElementById("kpi-dominio-top");
const kpiUltimoStatus = document.getElementById("kpi-ultimo-status");
const kpiUltimoTempo = document.getElementById("kpi-ultimo-tempo");

// =============================================================================
// 3. GERENCIAMENTO DO ENDPOINT DA API
// =============================================================================

function obterEndpointAtivo() {
    const salvo = localStorage.getItem(STORAGE_ENDPOINT_KEY);
    // Limpa se houver valor antigo ou quebrado
    if (!salvo || salvo.trim() === "" || salvo.includes("3b99dbb601e34ffaa9e1c31da647d6d1")) {
        localStorage.removeItem(STORAGE_ENDPOINT_KEY);
        return DEFAULT_API_URL;
    }
    return salvo.trim();
}

function salvarEndpoint(novoEndpoint) {
    if (!novoEndpoint || !novoEndpoint.startsWith("http")) {
        mostrarAlerta("Insira uma URL válida iniciando com https://", "warning");
        return;
    }
    let endpointFormatado = novoEndpoint.trim();
    if (!endpointFormatado.endsWith("/clientes")) {
        endpointFormatado = endpointFormatado.replace(/\/+$/, "") + "/clientes";
    }

    localStorage.setItem(STORAGE_ENDPOINT_KEY, endpointFormatado);
    if (apiEndpointInput) apiEndpointInput.value = endpointFormatado;
    mostrarAlerta("Endpoint atualizado com sucesso!", "success");
    adicionarLogConsole("CONFIG", 200, 0, `Novo endpoint: ${endpointFormatado}`);
    listarClientes();
}

function resetarEndpointPadrao() {
    localStorage.removeItem(STORAGE_ENDPOINT_KEY);
    if (apiEndpointInput) apiEndpointInput.value = DEFAULT_API_URL;
    mostrarAlerta("Endpoint restaurado para o padrão original!", "success");
    adicionarLogConsole("CONFIG", 200, 0, `Restaurado para padrão: ${DEFAULT_API_URL}`);
    listarClientes();
}

// =============================================================================
// 4. FEEDBACK VISUAL & CONSOLE DE LOGS (SIMULADOR DEVTOOLS / POSTMAN)
// =============================================================================

let timerAlerta = null;
function mostrarAlerta(mensagem, tipo = "info", duracaoMs = 4500) {
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
 * Adiciona uma entrada no Console da API (mini Postman integrado)
 */
function adicionarLogConsole(metodo, status, latenciaMs, detalhes) {
    if (!logStream) return;

    const agora = new Date();
    const timeStr = agora.toTimeString().split(" ")[0];

    const entry = document.createElement("div");
    entry.className = "log-entry";

    let tagClass = `log-tag-${metodo}`;
    if (status >= 400 || status === "ERR") tagClass = "log-tag-ERR";

    entry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-tag ${tagClass}">${metodo} ${status}</span>
        <span class="log-msg">${escapeHtml(detalhes)} <small style="color:#64748b">(${latenciaMs}ms)</small></span>
    `;

    logStream.prepend(entry);

    // Limita o histórico a 50 itens
    while (logStream.children.length > 50) {
        logStream.removeChild(logStream.lastChild);
    }
}

function atualizarStatusConexao(online, latenciaMs = 0) {
    if (!apiStatusBadge) return;
    const dot = apiStatusBadge.querySelector(".status-dot");
    if (dot) {
        dot.className = online ? "status-dot" : "status-dot offline";
    }
    if (apiStatusText) {
        apiStatusText.textContent = online ? "API Online" : "Desconectado";
    }
    if (apiLatency) {
        apiLatency.textContent = `${latenciaMs}ms`;
    }
}

// =============================================================================
// 5. ATUALIZAÇÃO DE KPIs & MÉTRICAS
// =============================================================================

function atualizarMetricasUI() {
    const total = state.clientes.length;
    if (kpiTotalClientes) kpiTotalClientes.textContent = total;
    if (kpiTotalReqs) kpiTotalReqs.textContent = state.metricas.totalReqs;
    if (countGet) countGet.textContent = `${state.metricas.countGet} GET`;
    if (countPost) countPost.textContent = `${state.metricas.countPost} POST`;
    if (countDel) countDel.textContent = `${state.metricas.countDel} DEL`;

    // Estatísticas de domínios de e-mail
    const dominios = {};
    state.clientes.forEach(c => {
        if (c.email && c.email.includes("@")) {
            const dom = c.email.split("@")[1].toLowerCase();
            dominios[dom] = (dominios[dom] || 0) + 1;
        }
    });

    const dominiosLista = Object.keys(dominios);
    if (kpiDominiosCount) kpiDominiosCount.textContent = dominiosLista.length;

    if (dominiosLista.length > 0) {
        const topDominio = dominiosLista.reduce((a, b) => dominios[a] > dominios[b] ? a : b);
        if (kpiDominioTop) kpiDominioTop.textContent = `Mais comum: @${topDominio} (${dominios[topDominio]})`;
    } else {
        if (kpiDominioTop) kpiDominioTop.textContent = "Nenhum domínio";
    }

    if (kpiUltimoStatus) kpiUltimoStatus.textContent = state.metricas.ultimoStatus;
    if (kpiUltimoTempo) {
        kpiUltimoTempo.textContent = state.metricas.ultimaLatenciaMs > 0 
            ? `Latência: ${state.metricas.ultimaLatenciaMs}ms` 
            : "Sem dados";
    }
}

// =============================================================================
// 6. REQUISIÇÕES HTTP COM FETCH API (GET, POST, DELETE)
// =============================================================================

/**
 * 1. MÉTODO GET - Buscar e carregar lista de clientes da API
 */
async function listarClientes() {
    const endpoint = obterEndpointAtivo();
    console.log(`[GET] Consultando API CrudCrud: ${endpoint}`);

    const inicio = performance.now();
    state.metricas.totalReqs++;
    state.metricas.countGet++;

    if (loadingIndicator) loadingIndicator.classList.remove("d-none");
    if (emptyState) emptyState.classList.add("d-none");

    try {
        const resposta = await fetch(endpoint, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = `${resposta.status} OK`;

        console.log(`[GET] Status ${resposta.status} (${duracao}ms)`);

        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado ou inexistente (as chaves gratuitas do CrudCrud duram 24h). Atualize o endpoint.");
            }
            throw new Error(`Erro HTTP ${resposta.status}: ${resposta.statusText}`);
        }

        const dados = await resposta.json();
        state.clientes = Array.isArray(dados) ? dados : [];
        console.log(`[GET] ${state.clientes.length} registro(s) obtido(s):`, state.clientes);

        atualizarStatusConexao(true, duracao);
        adicionarLogConsole("GET", resposta.status, duracao, `${state.clientes.length} registro(s) carregado(s)`);
        
        processarEFiltarClientes();
    } catch (erro) {
        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = "ERRO";

        console.error("[GET] Falha na requisição:", erro);
        atualizarStatusConexao(false, duracao);
        adicionarLogConsole("GET", "ERR", duracao, erro.message);
        mostrarAlerta(`Falha ao sincronizar: ${erro.message}`, "danger", 8000);

        state.clientes = [];
        processarEFiltarClientes();
    } finally {
        if (loadingIndicator) loadingIndicator.classList.add("d-none");
        atualizarMetricasUI();
    }
}

/**
 * 2. MÉTODO POST - Cadastrar novo cliente na API
 */
async function cadastrarCliente(dadosCliente) {
    const endpoint = obterEndpointAtivo();
    console.log(`[POST] Enviando novo registro para ${endpoint}:`, dadosCliente);

    const inicio = performance.now();
    state.metricas.totalReqs++;
    state.metricas.countPost++;

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

        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = `${resposta.status} Created`;

        console.log(`[POST] Status ${resposta.status} (${duracao}ms)`);

        if (!resposta.ok) {
            if (resposta.status === 404) {
                throw new Error("Endpoint expirado no CrudCrud. Atualize o endpoint na barra superior.");
            }
            throw new Error(`Falha no cadastro (HTTP ${resposta.status})`);
        }

        const clienteCriado = await resposta.json();
        console.log("[POST] Cliente criado com sucesso:", clienteCriado);

        atualizarStatusConexao(true, duracao);
        adicionarLogConsole("POST", resposta.status, duracao, `Criado: "${clienteCriado.nome}"`);
        mostrarAlerta(`Cliente "${clienteCriado.nome}" cadastrado com sucesso!`, "success");

        // Reseta o formulário e a prévia do avatar
        formCliente.reset();
        atualizarPreviewAvatar("", "");
        inputNome.focus();

        // Atualiza a listagem
        await listarClientes();
    } catch (erro) {
        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = "ERRO";

        console.error("[POST] Falha na requisição:", erro);
        atualizarStatusConexao(false, duracao);
        adicionarLogConsole("POST", "ERR", duracao, erro.message);
        mostrarAlerta(`Erro ao salvar cliente: ${erro.message}`, "danger", 8000);
    } finally {
        setBotaoCarregando(false);
        atualizarMetricasUI();
    }
}

/**
 * 3. MÉTODO DELETE - Excluir cliente pelo seu identificador _id
 */
async function excluirCliente(id, nomeCliente, btnElement) {
    const endpoint = `${obterEndpointAtivo()}/${id}`;
    console.log(`[DELETE] Enviando exclusão do ID ${id}: ${endpoint}`);

    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = `<span>Excluindo...</span>`;
    }

    const inicio = performance.now();
    state.metricas.totalReqs++;
    state.metricas.countDel++;

    try {
        const resposta = await fetch(endpoint, {
            method: "DELETE"
        });

        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = `${resposta.status} OK`;

        console.log(`[DELETE] Status ${resposta.status} (${duracao}ms)`);

        if (!resposta.ok) {
            throw new Error(`Falha ao excluir registro (HTTP ${resposta.status})`);
        }

        atualizarStatusConexao(true, duracao);
        adicionarLogConsole("DELETE", resposta.status, duracao, `Excluído: "${nomeCliente}"`);
        mostrarAlerta(`Cliente "${nomeCliente}" removido com sucesso!`, "success");

        // Recarrega a listagem
        await listarClientes();
    } catch (erro) {
        const duracao = Math.round(performance.now() - inicio);
        state.metricas.ultimaLatenciaMs = duracao;
        state.metricas.ultimoStatus = "ERRO";

        console.error("[DELETE] Falha na requisição:", erro);
        atualizarStatusConexao(false, duracao);
        adicionarLogConsole("DELETE", "ERR", duracao, erro.message);
        mostrarAlerta(`Erro ao excluir: ${erro.message}`, "danger", 8000);

        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Excluir`;
        }
    } finally {
        atualizarMetricasUI();
    }
}

// =============================================================================
// 7. FILTROS, ORDENAÇÃO E GESTÃO DO DOM
// =============================================================================

function processarEFiltarClientes() {
    let lista = [...state.clientes];

    // 1. Filtragem por busca (nome ou email)
    const termo = state.filtroTexto.trim().toLowerCase();
    if (termo) {
        lista = lista.filter(c => 
            (c.nome && c.nome.toLowerCase().includes(termo)) ||
            (c.email && c.email.toLowerCase().includes(termo)) ||
            (c._id && c._id.toLowerCase().includes(termo))
        );
        if (filtroInfo) {
            filtroInfo.textContent = `${lista.length} de ${state.clientes.length} encontrados`;
            filtroInfo.classList.remove("d-none");
        }
    } else {
        if (filtroInfo) filtroInfo.classList.add("d-none");
    }

    // 2. Ordenação
    if (state.ordem === "nome-asc") {
        lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    } else if (state.ordem === "nome-desc") {
        lista.sort((a, b) => (b.nome || "").localeCompare(a.nome || ""));
    } else {
        // "recentes" (reverso por padrão se os últimos vêm no final)
        lista.reverse();
    }

    state.clientesFiltrados = lista;
    renderizarDados();
}

function renderizarDados() {
    const total = state.clientesFiltrados.length;
    if (clientesCount) {
        clientesCount.textContent = `${total} ${total === 1 ? "cliente" : "clientes"}`;
    }

    if (total === 0) {
        if (emptyState) {
            emptyState.classList.remove("d-none");
            if (state.filtroTexto.trim()) {
                emptyTitle.textContent = "Nenhum resultado encontrado";
                emptyDesc.textContent = `Nenhum cliente corresponde ao termo "${state.filtroTexto}".`;
            } else {
                emptyTitle.textContent = "Nenhum cliente cadastrado";
                emptyDesc.textContent = "Utilize o formulário ao lado para cadastrar seu primeiro registro via POST.";
            }
        }
        if (listaClientes) listaClientes.innerHTML = "";
        if (tabelaBody) tabelaBody.innerHTML = "";
        return;
    }

    if (emptyState) emptyState.classList.add("d-none");

    if (state.modoVisualizacao === "cards") {
        if (listaClientes) listaClientes.classList.remove("d-none");
        if (tabelaContainer) tabelaContainer.classList.add("d-none");
        renderizarCards(state.clientesFiltrados);
    } else {
        if (listaClientes) listaClientes.classList.add("d-none");
        if (tabelaContainer) tabelaContainer.classList.remove("d-none");
        renderizarTabela(state.clientesFiltrados);
    }
}

/**
 * Renderiza em formato de Cards
 */
function renderizarCards(clientes) {
    if (!listaClientes) return;
    listaClientes.innerHTML = "";

    clientes.forEach(cliente => {
        const li = document.createElement("li");
        li.className = "cliente-card-item";
        li.dataset.id = cliente._id;

        li.innerHTML = `
            <div class="card-item-top">
                <div class="card-avatar">${extrairIniciais(cliente.nome)}</div>
                <div class="card-details">
                    <span class="card-name" title="${escapeHtml(cliente.nome)}">${escapeHtml(cliente.nome)}</span>
                    <span class="card-email" title="${escapeHtml(cliente.email)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        ${escapeHtml(cliente.email)}
                    </span>
                </div>
            </div>
            <div class="card-item-bottom">
                <span class="card-id-tag">ID: ${cliente._id ? cliente._id.slice(-6) : "---"}</span>
                <button type="button" class="btn-delete" title="Excluir ${escapeHtml(cliente.nome)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                </button>
            </div>
        `;

        const btnDel = li.querySelector(".btn-delete");
        btnDel.addEventListener("click", () => {
            excluirCliente(cliente._id, cliente.nome, btnDel);
        });

        listaClientes.appendChild(li);
    });
}

/**
 * Renderiza em formato de Tabela
 */
function renderizarTabela(clientes) {
    if (!tabelaBody) return;
    tabelaBody.innerHTML = "";

    clientes.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.dataset.id = cliente._id;

        tr.innerHTML = `
            <td>
                <div class="td-avatar-name">
                    <div class="table-avatar">${extrairIniciais(cliente.nome)}</div>
                    <span>${escapeHtml(cliente.nome)}</span>
                </div>
            </td>
            <td>${escapeHtml(cliente.email)}</td>
            <td><code>${cliente._id}</code></td>
            <td class="td-actions">
                <button type="button" class="btn-delete" title="Excluir ${escapeHtml(cliente.nome)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                </button>
            </td>
        `;

        const btnDel = tr.querySelector(".btn-delete");
        btnDel.addEventListener("click", () => {
            excluirCliente(cliente._id, cliente.nome, btnDel);
        });

        tabelaBody.appendChild(tr);
    });
}

// =============================================================================
// 8. EXPORTAÇÃO DE DADOS (JSON & CSV)
// =============================================================================

function exportarClientes() {
    if (state.clientes.length === 0) {
        mostrarAlerta("Não há registros para exportar.", "warning");
        return;
    }

    const formato = window.prompt("Escolha o formato de exportação digitando 'json' ou 'csv':", "json");
    if (!formato) return;

    if (formato.toLowerCase() === "csv") {
        const cabecalho = "ID,Nome,Email\n";
        const linhas = state.clientes.map(c => `"${c._id}","${c.nome}","${c.email}"`).join("\n");
        const blob = new Blob([cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
        baixarArquivoBlob(blob, `clientes_${Date.now()}.csv`);
        mostrarAlerta("Arquivo CSV exportado!", "success");
    } else {
        const jsonStr = JSON.stringify(state.clientes, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        baixarArquivoBlob(blob, `clientes_${Date.now()}.json`);
        mostrarAlerta("Arquivo JSON exportado!", "success");
    }
}

function baixarArquivoBlob(blob, nomeArquivo) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================================================================
// 9. UTILITÁRIOS & PREVIEW EM TEMPO REAL
// =============================================================================

function extrairIniciais(nome) {
    if (!nome) return "??";
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function atualizarPreviewAvatar(nome, email) {
    if (avatarPreview) avatarPreview.textContent = extrairIniciais(nome);
    if (previewName) previewName.textContent = nome.trim() || "Novo Cliente";
    if (previewEmail) previewEmail.textContent = email.trim() || "email@exemplo.com";
}

function setBotaoCarregando(carregando) {
    if (!btnCadastrar) return;
    btnCadastrar.disabled = carregando;
    if (btnTexto) btnTexto.textContent = carregando ? "Enviando (POST)..." : "Salvar Registro (POST)";
    if (btnSpinner) {
        if (carregando) btnSpinner.classList.remove("d-none");
        else btnSpinner.classList.add("d-none");
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#032;");
}

function validarFormulario() {
    let valido = true;
    if (erroNome) erroNome.textContent = "";
    if (erroEmail) erroEmail.textContent = "";
    inputNome.classList.remove("input-invalid");
    inputEmail.classList.remove("input-invalid");

    const nomeVal = inputNome.value.trim();
    const emailVal = inputEmail.value.trim();

    if (!nomeVal || nomeVal.length < 3) {
        if (erroNome) erroNome.textContent = "Nome completo deve ter pelo menos 3 caracteres.";
        inputNome.classList.add("input-invalid");
        valido = false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !regexEmail.test(emailVal)) {
        if (erroEmail) erroEmail.textContent = "Insira um endereço de e-mail válido.";
        inputEmail.classList.add("input-invalid");
        valido = false;
    }

    return valido;
}

// =============================================================================
// 10. EVENT LISTENERS & INICIALIZAÇÃO
// =============================================================================

// Live preview nos inputs de cadastro
if (inputNome && inputEmail) {
    inputNome.addEventListener("input", () => {
        atualizarPreviewAvatar(inputNome.value, inputEmail.value);
    });
    inputEmail.addEventListener("input", () => {
        atualizarPreviewAvatar(inputNome.value, inputEmail.value);
    });
}

// Submissão do formulário (POST)
if (formCliente) {
    formCliente.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        cadastrarCliente({
            nome: inputNome.value.trim(),
            email: inputEmail.value.trim()
        });
    });
}

// Busca em tempo real
if (inputBusca) {
    inputBusca.addEventListener("input", () => {
        state.filtroTexto = inputBusca.value;
        if (btnLimparBusca) {
            if (inputBusca.value.trim()) btnLimparBusca.classList.remove("d-none");
            else btnLimparBusca.classList.add("d-none");
        }
        processarEFiltarClientes();
    });
}

if (btnLimparBusca) {
    btnLimparBusca.addEventListener("click", () => {
        inputBusca.value = "";
        state.filtroTexto = "";
        btnLimparBusca.classList.add("d-none");
        processarEFiltarClientes();
        inputBusca.focus();
    });
}

// Ordenação
if (selectOrdem) {
    selectOrdem.addEventListener("change", () => {
        state.ordem = selectOrdem.value;
        processarEFiltarClientes();
    });
}

// Alternância entre Cards e Tabela
function setModoVisualizacao(modo) {
    state.modoVisualizacao = modo;
    localStorage.setItem(STORAGE_VIEW_KEY, modo);

    if (btnViewCards) btnViewCards.classList.toggle("active", modo === "cards");
    if (btnViewTable) btnViewTable.classList.toggle("active", modo === "table");

    renderizarDados();
}

if (btnViewCards) btnViewCards.addEventListener("click", () => setModoVisualizacao("cards"));
if (btnViewTable) btnViewTable.addEventListener("click", () => setModoVisualizacao("table"));

// Exportação
if (btnExportar) btnExportar.addEventListener("click", exportarClientes);

// Recarregar
if (btnRecarregar) btnRecarregar.addEventListener("click", () => {
    adicionarLogConsole("USER", 200, 0, "Sincronização manual acionada");
    listarClientes();
});

// Limpar Console
if (btnLimparLogs) {
    btnLimparLogs.addEventListener("click", () => {
        if (logStream) logStream.innerHTML = "";
    });
}

// Gaveta de Configuração do Endpoint
if (btnToggleConfig && configDrawer) {
    btnToggleConfig.addEventListener("click", () => {
        configDrawer.classList.toggle("d-none");
    });
}

if (btnSalvarEndpoint) {
    btnSalvarEndpoint.addEventListener("click", () => {
        const valor = apiEndpointInput.value.trim();
        if (valor) salvarEndpoint(valor);
        else mostrarAlerta("Digite a URL do endpoint.", "warning");
    });
}

if (btnResetarEndpoint) {
    btnResetarEndpoint.addEventListener("click", resetarEndpointPadrao);
}

// Inicialização da Aplicação
document.addEventListener("DOMContentLoaded", () => {
    console.log("%c=== CLIENTFLOW DASHBOARD INICIALIZADO ===", "color: #4f46e5; font-weight: bold; font-size: 14px;");

    // Endpoint ativo
    const endpoint = obterEndpointAtivo();
    if (apiEndpointInput) apiEndpointInput.value = endpoint;

    // Modo de visualização salvo
    setModoVisualizacao(state.modoVisualizacao);

    // Carregamento inicial via GET
    listarClientes();
});
