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

  // CRÍTICO (corretiva)
  if(itemLower.includes("freio") || itemLower.includes("farol") || itemLower.includes("seta")){
    return "urgente"
  }

  // MÉDIO (preventiva)
  if(itemLower.includes("óleo") || itemLower.includes("pneu")){
    return "media"
  }

  // BAIXO (preditiva)
  return "baixa"
}

// =========================
// RENDER
// =========================
function renderChecklist(){

  const container = document.getElementById("checklist")
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
// ANALISAR
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

  const dados = {
    nome: nome.value,
    veiculo: veiculo.value,
    empresa: empresa.value,
    data: data.value,
    observacoes: obs.value,
    respostas: {}
  }

  Object.keys(secoes).forEach(secao => {
    secoes[secao].itens.forEach(item => {
      dados.respostas[normalizar(item)] = getValor(normalizar(item))
    })
  })

  return dados
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
// MARCAR COMO RESOLVIDO
// =========================
function resolver(indexChecklist, indexProblema){

  const db = getDB()
  db[indexChecklist].problemas[indexProblema].resolvido = true
  saveDB(db)

  listar()
  atualizarDashboard()
}

// =========================
// LISTAR
// =========================
function listar(){

  const lista = document.getElementById("lista")
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
          ${
            p.resolvido
            ? "✅"
            : `<button onclick="resolver(${i}, ${j})">✔</button>`
          }
        </div>
      `
    }).join("")

    const status = item.problemas.some(p => !p.resolvido)
      ? "PENDENTE"
      : "LIBERADO"

    div.innerHTML = `
      <b>${item.veiculo}</b><br>
      Status: <span class="${status === "LIBERADO" ? "status-ok" : "status-pendente"}">${status}</span>
      <br><br>
      ${problemasHTML || "Sem problemas"}
    `

    lista.appendChild(div)
  })
}

// =========================
// DASHBOARD
// =========================
function atualizarDashboard(){

  const db = getDB()

  let pendentes = 0
  let liberados = 0

  db.forEach(c => {
    const temProblema = c.problemas.some(p => !p.resolvido)
    if(temProblema) pendentes++
    else liberados++
  })

  document.getElementById("dashboard").innerHTML = `
    🚛 Veículos Pendentes: ${pendentes} <br>
    ✅ Veículos Liberados: ${liberados}
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
// =========================
// GERAR OS + PDF + ENVIO
// =========================
function gerarOS(index){

  const db = getDB()
  const item = db[index]

  if(!item){
    alert("Erro ao gerar OS")
    return
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  const numeroOS = "OS-" + Date.now()

  const problemas = item.problemas.filter(p => !p.resolvido)

  let y = 20

  doc.setFontSize(16)
  doc.text("ORDEM DE SERVIÇO", 20, y)

  y += 10
  doc.setFontSize(10)

  doc.text(`Número: ${numeroOS}`, 20, y)
  y += 6
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, y)
  y += 10

  doc.text(`Responsável: ${item.nome}`, 20, y)
  y += 6
  doc.text(`Veículo: ${item.veiculo}`, 20, y)
  y += 6
  doc.text(`Empresa: ${item.empresa}`, 20, y)

  y += 10
  doc.text("Itens para compra/manutenção:", 20, y)

  y += 6

  if(problemas.length === 0){
    doc.text("Nenhum problema identificado", 20, y)
  } else {
    problemas.forEach((p, i) => {
      doc.text(`- ${p.nome}`, 20, y)
      y += 6
    })
  }

  y += 10
  doc.text(`Observações: ${item.observacoes || "Nenhuma"}`, 20, y)

  // GERAR PDF
  const pdfBlob = doc.output("blob")
  const url = URL.createObjectURL(pdfBlob)

  // ABRIR PDF
  window.open(url)

  // MENSAGEM PARA WHATSAPP
  const texto = encodeURIComponent(
    `📄 ORDEM DE SERVIÇO\n\nVeículo: ${item.veiculo}\nProblemas: ${
      problemas.length > 0
        ? problemas.map(p => p.nome).join(", ")
        : "Nenhum"
    }`
  )

  // ALTERE PARA O NÚMERO DO COMPRAS
  const numero = "5592986275697"

  window.open(`https://wa.me/${numero}?text=${texto}`, "_blank")
}
