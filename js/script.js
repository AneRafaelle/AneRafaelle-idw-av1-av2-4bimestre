const CATEGORIAS = [
  { nome: "Alimentação", cor: "#b98b4e" },
  { nome: "Transporte", cor: "#3e5c45" },
  { nome: "Moradia", cor: "#6b8057" },
  { nome: "Lazer", cor: "#8c6b4a" },
  { nome: "Saúde", cor: "#a8553f" },
  { nome: "Educação", cor: "#5f7d8a" },
];

let renda = 3500;
let despesas = [
  { id: 1, descricao: "Supermercado", valor: 420.5, categoria: "Alimentação", data: "2026-11-05" },
  { id: 2, descricao: "Aluguel", valor: 1200, categoria: "Moradia", data: "2026-11-10" },
  { id: 3, descricao: "Cinema", valor: 60, categoria: "Lazer", data: "2026-11-15" },
];
let proximoId = 4;
let filtroAtual = "Todas";
let timerMensagem;

const $ = (id) => document.getElementById(id);
const formDespesa = $("form-despesa");
const formRenda = $("form-renda");
const filtros = $("filtros");
const tabela = $("tabela");

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function corDaCategoria(nome) {
  const cat = CATEGORIAS.find((c) => c.nome === nome);
  return cat ? cat.cor : "#6c757d";
}

function totalGastos(lista = despesas) {
  return lista.reduce((soma, d) => soma + d.valor, 0);
}

function totalPorCategoria(nome) {
  return totalGastos(despesas.filter((d) => d.categoria === nome));
}

function mostrarMensagem(texto, tipo = "success") {
  const box = $("mensagem");
  box.className = `alert alert-${tipo}`;
  box.textContent = texto;
  clearTimeout(timerMensagem);
  timerMensagem = setTimeout(() => box.classList.add("d-none"), 3500);
}

function marcarCampo(campo, valido) {
  campo.classList.toggle("is-invalid", !valido);
  campo.classList.toggle("is-valid", valido);
  return valido;
}

function limparValidacao(form) {
  form.querySelectorAll(".is-invalid, .is-valid").forEach((el) => {
    el.classList.remove("is-invalid", "is-valid");
  });
}

function validarDespesa() {
  const descricao = $("descricao");
  const valor = $("valor");
  const categoria = $("categoria");
  const data = $("data");

  const ok = [
    marcarCampo(descricao, descricao.value.trim().length >= 3),
    marcarCampo(valor, parseFloat(valor.value) > 0),
    marcarCampo(categoria, categoria.value !== ""),
    marcarCampo(data, data.value !== ""),
  ];
  return ok.every(Boolean);
}

function adicionarDespesa(evento) {
  evento.preventDefault();
  if (!validarDespesa()) {
    mostrarMensagem("Corrija os campos destacados.", "danger");
    return;
  }

  despesas.push({
    id: proximoId++,
    descricao: $("descricao").value.trim(),
    valor: parseFloat($("valor").value),
    categoria: $("categoria").value,
    data: $("data").value,
  });

  formDespesa.reset();
  limparValidacao(formDespesa);
  $("data").value = hojeISO();
  renderizar();
  mostrarMensagem("Despesa adicionada com sucesso!", "success");
}

function removerDespesa(id) {
  despesas = despesas.filter((d) => d.id !== id);
  renderizar();
  mostrarMensagem("Despesa removida.", "warning");
}

function atualizarRenda(evento) {
  evento.preventDefault();
  const campo = $("renda-input");
  const novaRenda = parseFloat(campo.value);

  if (!marcarCampo(campo, novaRenda > 0)) {
    mostrarMensagem("Informe uma renda válida.", "danger");
    return;
  }
  renda = novaRenda;
  campo.value = "";
  limparValidacao(formRenda);
  renderizar();
  mostrarMensagem("Renda atualizada!", "success");
}

function alternarValores() {
  const ocultos = document.body.classList.toggle("valores-ocultos");
  $("btn-ocultar").textContent = ocultos ? "Mostrar valores" : "Ocultar valores";
}

function selecionarFiltro(evento) {
  const botao = evento.target.closest("button[data-filtro]");
  if (!botao) return;
  filtroAtual = botao.dataset.filtro;
  renderizar();
}

function renderizarResumo() {
  const gastos = totalGastos();
  const saldo = renda - gastos;
  const percentual = renda > 0 ? (gastos / renda) * 100 : 0;

  $("renda-valor").textContent = moeda.format(renda);
  $("gastos-valor").textContent = moeda.format(gastos);
  $("saldo-valor").textContent = moeda.format(saldo);
  $("saldo-valor").classList.toggle("saldo-negativo", saldo < 0);

  const barra = $("uso-barra");
  barra.style.width = `${Math.min(percentual, 100)}%`;
  barra.classList.toggle("alerta", percentual >= 80 && percentual < 100);
  barra.classList.toggle("perigo", percentual >= 100);
  $("uso-percentual").textContent = `${percentual.toFixed(0)}%`;
  $("uso-progress").setAttribute("aria-valuenow", Math.min(percentual, 100).toFixed(0));
}

function renderizarCategorias() {
  const gastos = totalGastos();
  const barra = $("barra-empilhada");
  const cards = $("cards-categorias");
  barra.innerHTML = "";
  cards.innerHTML = "";

  CATEGORIAS.forEach((cat) => {
    const total = totalPorCategoria(cat.nome);
    const pct = gastos > 0 ? (total / gastos) * 100 : 0;

    if (total > 0) {
      const seg = document.createElement("div");
      seg.className = "progress";
      seg.style.width = `${pct}%`;
      seg.title = `${cat.nome}: ${pct.toFixed(0)}%`;
      seg.innerHTML = `<div class="progress-bar" style="background-color:${cat.cor}"></div>`;
      barra.appendChild(seg);
    }

    const col = document.createElement("div");
    col.className = "col-6 col-md-4";
    col.innerHTML = `
      <article class="card card-categoria h-100">
        <div class="card-body">
          <p class="mb-1 fw-medium"><span class="ponto" style="background-color:${cat.cor}"></span>${cat.nome}</p>
          <p class="h5 mb-1 valor">${moeda.format(total)}</p>
          <p class="small text-muted mb-2">${pct.toFixed(0)}% dos gastos</p>
          <div class="progress" role="progressbar" aria-label="${cat.nome}" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" style="width:${pct}%;background-color:${cat.cor}"></div>
          </div>
        </div>
      </article>`;
    cards.appendChild(col);
  });
}

function renderizarFiltros() {
  filtros.innerHTML = "";
  ["Todas", ...CATEGORIAS.map((c) => c.nome)].forEach((nome) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline-success" + (nome === filtroAtual ? " active" : "");
    btn.dataset.filtro = nome;
    btn.textContent = nome;
    filtros.appendChild(btn);
  });
}

function renderizarTabela() {
  const visiveis = despesas
    .filter((d) => filtroAtual === "Todas" || d.categoria === filtroAtual)
    .sort((a, b) => b.data.localeCompare(a.data));

  tabela.innerHTML = "";
  visiveis.forEach((d) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = formatarData(d.data);

    const tdDesc = document.createElement("td");
    tdDesc.textContent = d.descricao; 

    const tdCat = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge-cat";
    badge.style.backgroundColor = corDaCategoria(d.categoria);
    badge.textContent = d.categoria;
    tdCat.appendChild(badge);

    const tdValor = document.createElement("td");
    tdValor.className = "text-end sensivel";
    tdValor.textContent = moeda.format(d.valor);

    const tdAcao = document.createElement("td");
    tdAcao.className = "text-end";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm btn-outline-danger";
    btn.dataset.id = d.id;
    btn.textContent = "Remover";
    btn.setAttribute("aria-label", `Remover ${d.descricao}`);
    tdAcao.appendChild(btn);

    tr.append(tdData, tdDesc, tdCat, tdValor, tdAcao);
    tabela.appendChild(tr);
  });

  $("vazio").classList.toggle("d-none", visiveis.length > 0);
  $("contador").textContent = `Exibindo ${visiveis.length} de ${despesas.length} despesa(s)`;
}

function renderizar() {
  renderizarResumo();
  renderizarCategorias();
  renderizarFiltros();
  renderizarTabela();
}
function aplicarTema(tema) {
  const noturno = tema === "dark";
  document.documentElement.setAttribute("data-bs-theme", tema);
  const btn = $("btn-tema");
  btn.textContent = noturno ? "Modo claro" : "Modo noturno";
  btn.setAttribute("aria-pressed", String(noturno));
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-bs-theme");
  const novo = atual === "dark" ? "light" : "dark";
  aplicarTema(novo);
  try { localStorage.setItem("tema", novo); } catch (e) { /* sem armazenamento */ }
}

function iniciarTema() {
  let tema = null;
  try { tema = localStorage.getItem("tema"); } catch (e) { /* sem armazenamento */ }
  if (!tema) {
    tema = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  aplicarTema(tema);
  $("btn-tema").addEventListener("click", alternarTema);
}

// ---------- Inicialização ----------
function hojeISO() {
  const h = new Date();
  const mes = String(h.getMonth() + 1).padStart(2, "0");
  const dia = String(h.getDate()).padStart(2, "0");
  return `${h.getFullYear()}-${mes}-${dia}`;
}

function iniciar() {
  iniciarTema();
  const select = $("categoria");
  select.innerHTML = '<option value="">Selecione...</option>';
  CATEGORIAS.forEach((c) => {
    const op = document.createElement("option");
    op.value = c.nome;
    op.textContent = c.nome;
    select.appendChild(op);
  });
  $("data").value = hojeISO();

  formDespesa.addEventListener("submit", adicionarDespesa);
  formRenda.addEventListener("submit", atualizarRenda);
  $("btn-ocultar").addEventListener("click", alternarValores);
  filtros.addEventListener("click", selecionarFiltro);
  tabela.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (btn) removerDespesa(Number(btn.dataset.id));
  });

  renderizar();
}

iniciar();
