// =========================
// NORMALIZAR TEXTO
// =========================
function normalizar(texto){
  return texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ /g,"_")
}

// =========================
// CONFIG CHECKLIST
// =========================
const secoes = {

  "Condições": {
    opcoes: ["Bom","Médio","Ruim"],
    itens: [
      "Limpeza externa",
      "Limpeza interna",
      "Pneus",
      "Estepe",
      "Caçamba"
    ]
  },

  "Luzes traseiras": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Luz de placa",
      "Luz de ré",
      "Luz de freio",
      "Seta traseira",
      "Lanterna",
      "Pisca-alerta traseiro"
    ]
  },

  "Luzes dianteiras": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Farol alto",
      "Farol baixo",
      "Seta dianteira",
      "Luz de posição",
      "Farol de neblina",
      "Pisca-alerta dianteiro"
    ]
  },

  "Segurança": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Alarme",
      "Buzina",
      "Chave de roda",
      "Cintos",
      "Documentos",
      "Extintor",
      "Limpadores",
      "Macaco",
      "Painel",
      "Retrovisor interno",
      "Retrovisor direito",
      "Retrovisor esquerdo",
      "Travas",
      "Triângulo",
      "Airbag",
      "Freio ABS"
    ]
  },

  "Motor": {
    opcoes: ["Sim","Não","N/A"],
    itens: [
      "Acelerador",
      "Água do limpador",
      "Água do radiador",
      "Embreagem",
      "Freio",
      "Freio de mão",
      "Óleo do freio",
      "Óleo do motor",
      "Tanque de partida",
      "Correia",
      "Bateria",
      "Nível de combustível",
      "Vazamentos"
    ]
  }

}

// =========================
// RENDER CHECKLIST
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
// PEGAR VALOR RADIO
// =========================
function getValor(name){
  const el = document.querySelector(`input[name="${name}"]:checked`)
  return el ? el.value : null
}

// =========================
// ANALISAR PROBLEMAS
// =========================
function analisarChecklist(respostas){

  const problemas = []

  Object.keys(secoes).forEach(secao => {

    secoes[secao].itens.forEach(item => {

      const key = normalizar(item)
      const valor = respostas[key]

      if(secao === "Condições"){
        if(valor === "Ruim"){
          problemas.push(item)
        }
      } else {
        if(valor === "Não"){
          problemas.push(item)
        }
      }

    })

  })

  return problemas
}

// =========================
// COLETAR DADOS
// =========================
function coletarChecklist(){

  const dados = {
    nome: document.getElementById("nome").value,
    veiculo: document.getElementById("veiculo").value,
    empresa: document.getElementById("empresa").value,
    data: document.getElementById("data").value,
    observacoes: document.getElementById("obs").value,
    respostas: {}
  }

  Object.keys(secoes).forEach(secao => {
    secoes[secao].itens.forEach(item => {
      const key = normalizar(item)
      dados.respostas[key] = getValor(key)
    })
  })

  return dados
}

// =========================
// SALVAR CHECKLIST
// =========================
function salvarChecklist(){

  const dados = coletarChecklist()

  // GERAR PROBLEMAS
  dados.problemas = analisarChecklist(dados.respostas)

  const db = getDB()
  db.push(dados)
  saveDB(db)

  alert("Checklist salvo com sucesso!")

  listar()
}

// =========================
// LISTAR CHECKLISTS
// =========================
function listar(){

  const lista = document.getElementById("lista")
  lista.innerHTML = ""

  const db = getDB()

  db.forEach((item, i) => {

    const div = document.createElement("div")
    div.className = "card"

    div.innerHTML = `
      <b>#${i+1}</b><br>
      ${item.nome} - ${item.veiculo}<br>
      ${item.empresa} - ${item.data}<br><br>

      <b>⚠️ Problemas:</b><br>
      ${
      item.problemas && item.problemas.length > 0
        ? item.problemas.map(p => `- ${p}`).join("<br>")
        : "Nenhum problema"
    }

      <br><br>
      <button onclick="gerarOS(${i})">📄 Gerar Ordem de Serviço</button>
    `

    lista.appendChild(div)
  })
}

// =========================
// GERAR ORDEM DE SERVIÇO
// =========================
function gerarOS(index){

  const db = getDB()
  const item = db[index]

  if(!item){
    alert("Erro ao gerar OS")
    return
  }

  const numeroOS = "OS-" + Date.now()

  const problemasHTML = item.problemas && item.problemas.length > 0
    ? item.problemas.map(p => `<li>${p}</li>`).join("")
    : "<li>Nenhum problema identificado</li>"

  const status = item.problemas.length > 0
    ? "PENDENTE"
    : "APROVADO"

  const novaJanela = window.open("", "_blank")

  novaJanela.document.write(`
    <html>
      <head>
        <title>Ordem de Serviço</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #1e40af; }
          .box {
            border: 1px solid #ccc;
            padding: 10px;
            margin-top: 10px;
            border-radius: 8px;
          }
          .status {
            font-weight: bold;
            color: ${status === "PENDENTE" ? "red" : "green"};
          }
        </style>
      </head>
      <body>

        <h1>Ordem de Serviço</h1>

        <div class="box">
          <b>Nº:</b> ${numeroOS}<br>
          <b>Data:</b> ${new Date().toLocaleDateString()}<br>
          <b>Status:</b> <span class="status">${status}</span>
        </div>

        <div class="box">
          <b>Responsável:</b> ${item.nome}<br>
          <b>Veículo:</b> ${item.veiculo}<br>
          <b>Empresa:</b> ${item.empresa}
        </div>

        <div class="box">
          <b>Itens para manutenção:</b>
          <ul>${problemasHTML}</ul>
        </div>

        <div class="box">
          <b>Observações:</b><br>
          ${item.observacoes || "Nenhuma"}
        </div>

        <br><br>
        <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>

      </body>
    </html>
  `)

  novaJanela.document.close()
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  renderChecklist()
  listar()
})