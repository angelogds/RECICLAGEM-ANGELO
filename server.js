const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const methodOverride = require("method-override");
const path = require("path");

const app = express();
const PORT = 3000;

// Configurações básicas
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // servir imagens
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Banco de dados SQLite
const db = new sqlite3.Database("./data/database.sqlite");

// Criação das tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    descricao TEXT,
    foto TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipamento_id INTEGER,
    descricao TEXT,
    status TEXT,
    foto_antes TEXT,
    foto_depois TEXT,
    tecnico_nome TEXT,
    data_abertura TEXT,
    data_fechamento TEXT,
    FOREIGN KEY(equipamento_id) REFERENCES equipamentos(id)
  )`);
});

// Configuração de upload para equipamentos
const storageEquipamentos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/equipamentos"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadEquipamentos = multer({ storage: storageEquipamentos });

// Configuração de upload para ordens
const storageOrdens = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ordens"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadOrdens = multer({ storage: storageOrdens });

/* ---------------- ROTAS ---------------- */

// Página inicial (dashboard)
app.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

// Dashboard
app.get("/admin/dashboard", (req, res) => {
  res.render("admin/dashboard");
});

// Listar equipamentos
app.get("/admin/equipamentos", (req, res) => {
  db.all("SELECT * FROM equipamentos", (err, equipamentos) => {
    res.render("admin/equipamentos", { equipamentos });
  });
});

// Formulário novo equipamento
app.get("/admin/equipamentos/novo", (req, res) => {
  res.render("admin/equipamentos_novo");
});

// Cadastrar equipamento
app.post("/admin/equipamentos", uploadEquipamentos.single("foto"), (req, res) => {
  const { nome, descricao } = req.body;
  const foto = req.file ? req.file.path : null;

  db.run(
    "INSERT INTO equipamentos (nome, descricao, foto) VALUES (?,?,?)",
    [nome, descricao, foto],
    () => res.redirect("/admin/equipamentos")
  );
});

// Listar ordens
app.get("/admin/ordens", (req, res) => {
  const sql = `
    SELECT os.*, e.nome AS equipamento_nome
    FROM ordens_servico os
    JOIN equipamentos e ON os.equipamento_id = e.id
  `;
  db.all(sql, (err, ordens) => {
    res.render("admin/ordens", { ordens });
  });
});

// Abrir OS (funcionário)
app.get("/funcionario/abrir_os", (req, res) => {
  const equip_id = req.query.equip_id;
  res.render("funcionario/abrir_os", { equip_id });
});

app.post("/funcionario/abrir_os", uploadOrdens.single("foto_antes"), (req, res) => {
  const { equip_id, descricao } = req.body;
  const fotoAntes = req.file ? req.file.path : null;

  db.run(
    `INSERT INTO ordens_servico 
     (equipamento_id, descricao, status, foto_antes, data_abertura) 
     VALUES (?,?,?,?,datetime('now'))`,
    [equip_id, descricao, "Aberta", fotoAntes],
    () => res.redirect("/admin/ordens")
  );
});

// Fechar OS (admin)
app.get("/admin/ordens/:id/fechar", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM ordens_servico WHERE id = ?", [id], (err, ordem) => {
    res.render("admin/ordens_fechar", { ordem });
  });
});

app.put("/admin/ordens/:id", uploadOrdens.single("foto_depois"), (req, res) => {
  const id = req.params.id;
  const { tecnico_nome, descricao } = req.body;
  const fotoDepois = req.file ? req.file.path : null;

  db.run(
    `UPDATE ordens_servico 
     SET tecnico_nome = ?, descricao = ?, status = ?, foto_depois = ?, data_fechamento = datetime('now') 
     WHERE id = ?`,
    [tecnico_nome, descricao, "Fechada", fotoDepois, id],
    () => res.redirect("/admin/ordens")
  );
});

/* ---------------- SERVIDOR ---------------- */
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
