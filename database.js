function getDB(){
  return JSON.parse(localStorage.getItem("checklists")) || []
}

function saveDB(data){
  localStorage.setItem("checklists", JSON.stringify(data))
}