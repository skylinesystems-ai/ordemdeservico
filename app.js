// =========================
// NORMALIZAR
// =========================
function normalizar(texto){
  return texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ /g,"_")
}

// =========================
// CONFIG
// =========================
const secoes = {

  "Condições": {
    opcoes: ["Bom","Médio","Ruim"],
    itens: ["Limpeza externa","Limpeza interna","Pneus","Estepe","Caçamba"]
  },

  "Luzes traseiras": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Luz de placa",
      "Luz de ré esquerda","Luz de ré direita",
      "Luz de freio esquerda","Luz de freio direita",
      "Seta traseira esquerda","Seta traseira direita"
    ]
  },

  "Luzes dianteiras": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Farol alto esquerdo","Farol alto direito",
      "Farol baixo esquerdo","Farol baixo direito",
      "Seta dianteira esquerda","Seta dianteira direita",
      "Neblina esquerda","Neblina direita"
    ]
  },

  "Segurança": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Alarme","Buzina","Chave de roda","Cintos","Documentos",
      "Extintor","Limpadores","Macaco","Painel",
      "Retrovisor interno","Retrovisor direito","Retrovisor esquerdo",
      "Travas","Triângulo"
    ]
  },

  "Motor": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Acelerador","Água do limpador","Água do radiador",
      "Embreagem","Freio","Freio de mão",
      "Óleo do freio","Óleo do motor","Tanque de partida"
    ]
  }

}

// =========================
// IA DE URGÊNCIA
// =========================
function calcularUrgencia(item){
  const itemLower = item.toLowerCase()

  if(itemLower.includes("freio") || itemLower.includes("farol") || itemLower.includes("seta")){
    return "urgente"
  }

  if(itemLower.includes("óleo") || itemLower.includes("pneu")){
    return "media"
  }

  return "baixa"
}

// =========================
// RENDER CHECKLIST
// =========================
function renderChecklist(){

  const container = document.getElementById("checklist")
  if(!container) return

  container.innerHTML = ""

  Object.keys(secoes).forEach(secao => {

    const titulo = document.createElement("h3")
    titulo.innerText = secao
    container.appendChild(titulo)

    secoes[secao].itens.forEach(item => {

      const key = normalizar(item)

      const div = document.createElement("div")
      div.className = "linha"

      div.innerHTML = `
        <span>${item}</span>
        <div class="opcoes">
          ${secoes[secao].opcoes.map(op => `
            <label>
              <input type="radio" name="${key}" value="${op}">
              ${op}
            </label>
          `).join("")}
        </div>
      `

      container.appendChild(div)
    })

  })
}

// =========================
// PEGAR VALOR
// =========================
function getValor(name){
  const el = document.querySelector(`input[name="${name}"]:checked`)
  return el ? el.value : null
}

// =========================
// ANALISAR CHECKLIST
// =========================
function analisarChecklist(respostas){

  const problemas = []

  Object.keys(secoes).forEach(secao => {

    secoes[secao].itens.forEach(item => {

      const key = normalizar(item)
      const valor = respostas[key]

      if(secao === "Condições"){
        if(valor === "Ruim"){
          problemas.push({nome: item, resolvido: false})
        }
      } else {
        if(valor === "Não"){
          problemas.push({nome: item, resolvido: false})
        }
      }

    })

  })

  return problemas
}

// =========================
// COLETAR
// =========================
function coletarChecklist(){

  return {
    nome: nome.value,
    veiculo: veiculo.value,
    empresa: empresa.value,
    data: data.value,
    observacoes: obs.value,
    respostas: Object.fromEntries(
      Object.values(secoes)
        .flatMap(sec => sec.itens)
        .map(item => [normalizar(item), getValor(normalizar(item))])
    )
  }
}

// =========================
// SALVAR
// =========================
function salvarChecklist(){

  const dados = coletarChecklist()
  dados.problemas = analisarChecklist(dados.respostas)

  const db = getDB()
  db.push(dados)
  saveDB(db)

  listar()
  atualizarDashboard()
}

// =========================
// RESOLVER
// =========================
function resolver(i, j){

  const db = getDB()
  db[i].problemas[j].resolvido = true

  saveDB(db)
  listar()
  atualizarDashboard()
}

// =========================
// NUMERO OS
// =========================
function gerarNumeroOS(){
  let numero = localStorage.getItem("numeroOS") || 0
  numero++
  localStorage.setItem("numeroOS", numero)
  return "OS-" + String(numero).padStart(4, "0")
}

// =========================
// DATA BR
// =========================
function formatarDataBR(dataISO){
  if(!dataISO) return ""
  const [ano, mes, dia] = dataISO.split("-")
  return `${dia}/${mes}/${ano}`
}

// =========================
// GERAR OS
// =========================
function gerarOS(index){

  const db = getDB()
  const item = db[index]

  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  const numeroOS = gerarNumeroOS()
  const dataBR = formatarDataBR(item.data)
  const hora = new Date().toLocaleTimeString()

  const problemas = item.problemas.filter(p => !p.resolvido)

  let y = 20

  doc.setFontSize(14)
  doc.text("ORDEM DE SERVIÇO", 70, y)

  y += 10
  doc.setFontSize(10)

  doc.text(`Nº: ${numeroOS}`, 20, y)
  doc.text(`DATA: ${dataBR}`, 100, y)

  y += 8
  doc.text(`PLACA: ${item.veiculo}`, 20, y)
  doc.text(`HORA: ${hora}`, 100, y)

  y += 8
  doc.text(`MOTORISTA: ${item.nome}`, 20, y)

  y += 12
  doc.text("SERVIÇO A SER FEITO:", 20, y)

  y += 6

  problemas.forEach(p => {
    doc.text(`• ${p.nome}`, 22, y)
    y += 6
  })

  const url = URL.createObjectURL(doc.output("blob"))
  window.open(url)
}

// =========================
// LISTAR
// =========================
function listar(){

  const lista = document.getElementById("lista")
  if(!lista) return

  lista.innerHTML = ""

  const db = getDB()

  db.forEach((item, i) => {

    const div = document.createElement("div")
    div.className = "card"

    const problemasHTML = item.problemas.map((p, j) => {
      const urgencia = calcularUrgencia(p.nome)

      return `
        <div>
          ${p.nome}
          <span class="tag ${urgencia}">${urgencia}</span>
          ${p.resolvido ? "✅" : `<button onclick="resolver(${i}, ${j})">✔</button>`}
        </div>
      `
    }).join("")

    const status = item.problemas.some(p => !p.resolvido) ? "PENDENTE" : "LIBERADO"

    div.innerHTML = `
      <b>${item.veiculo}</b><br>
      Status: ${status}
      <br><br>
      ${problemasHTML}
      <br><br>
      <button onclick="gerarOS(${i})">📄 Gerar OS</button>
    `

    lista.appendChild(div)
  })
}

// =========================
// DASHBOARD (CORRIGIDO)
// =========================
function atualizarDashboard(){

  const db = getDB()
  const dashboard = document.getElementById("dashboard")

  if(!dashboard) return

  if(!db || db.length === 0){
    dashboard.innerHTML = "Sem dados ainda"
    return
  }

  let pendentes = 0
  let liberados = 0
  let listaPendentes = []
  let listaLiberados = []
  let ranking = []

  db.forEach(c => {

    if(!c.problemas) return

    const problemasPendentes = c.problemas.filter(p => !p.resolvido)

    let score = 0

    if(problemasPendentes.length > 0){

      pendentes++
      listaPendentes.push(c.veiculo || "Sem nome")

      problemasPendentes.forEach(p => {
        const urgencia = calcularUrgencia(p.nome)

        if(urgencia === "urgente") score += 3
        else if(urgencia === "media") score += 2
        else score += 1
      })

      ranking.push({
        veiculo: c.veiculo || "Sem nome",
        score,
        qtd: problemasPendentes.length
      })

    } else {
      liberados++
      listaLiberados.push(c.veiculo || "Sem nome")
    }

  })

  ranking.sort((a, b) => b.score - a.score)

  dashboard.innerHTML = `
    <h3>📊 Resumo</h3>
    🚛 Pendentes: ${pendentes} <br>
    ✅ Liberados: ${liberados}

    <hr>

    <h3>🚛 Precisando de manutenção</h3>
    ${listaPendentes.map(v => `- ${v}`).join("<br>") || "Nenhum"}

    <hr>

    <h3>✅ Liberados</h3>
    ${listaLiberados.map(v => `- ${v}`).join("<br>") || "Nenhum"}

    <hr>

    <h3>🔥 Mais críticos</h3>
    ${
      ranking.slice(0,5).map(r => `
        <div>🚛 ${r.veiculo} - Score ${r.score} (${r.qtd})</div>
      `).join("") || "Sem dados"
    }
  `
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  renderChecklist()
  listar()
  atualizarDashboard()
})
