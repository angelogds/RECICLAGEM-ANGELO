const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(DB_FILE);

console.log("Inserindo seed...");

db.serialize(() => {
  db.run(`DELETE FROM equipamentos`);
  db.run(`DELETE FROM ordens`);

  const equipamentos = [
    ["Esteira 01","EQ001","Setor A","Esteira principal",null],
    ["Triturador HD","EQ002","Setor B","Triturador industrial",null],
    ["Prensa X-200","EQ003","Setor C","Prensa hidráulica",null]
  ];

  equipamentos.forEach(e => {
    db.run(`INSERT INTO equipamentos (nome,codigo,local,descricao,imagem) VALUES (?,?,?,?,?)`, e);
  });

  const ordens = [
    [1,"Carlos","Manutenção","Correia desalinhada","aberta"],
    [2,"Rafael","Elétrica","Motor não liga","aberta"],
    [3,"Fernanda","Preventiva","Lubrificação OK","fechada"]
  ];

  ordens.forEach(o => {
    db.run(`INSERT INTO ordens (equipamento_id,solicitante,tipo,descricao,status) VALUES (?,?,?,?,?)`, o);
  });
});

db.close(() => console.log("Pronto!"));
