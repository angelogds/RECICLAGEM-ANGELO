const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const methodOverride = require("method-override");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = 3000;

/* ---------------- CONFIG BÁSICA ---------------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads")); // servir imagens da pasta uploads
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

/* ---------------- BANCO DE DADOS ---------------- */
const db = new sqlite3.Database("./data/database.sqlite");

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

/* ---------------- MULTER (UPLOADS) ---------------- */
// Equipamentos
const storageEquipamentos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/equipamentos"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadEquipamentos = multer({ storage: storageEquipamentos });

// Ordens
const storageOrdens = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/ordens"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadOrdens = multer({ storage: storageOrdens });

/* ---------------- ROTAS ---------------- */
// Página inicial
app.get("/", (req, res) => res.redirect("/admin/dashboard"));

// Dashboard
app.get("/admin/dashboard", (req, res) => res.render("admin/dashboard"));

/* --- Equipamentos --- */
// Lista
app.get("/admin/equipamentos", (req, res) => {
  db.all("SELECT * FROM equipamentos", (err, equipamentos) => {
    if (err) return res.send("Erro ao listar equipamentos.");
    res.render("admin/equipamentos", { equipamentos });
  });
});

// Form novo
app.get("/admin/equipamentos/novo", (req, res) => {
  res.render("admin/equipamentos_novo");
});

// Cadastrar
app.post("/admin/equipamentos", uploadEquipamentos.single("foto"), (req, res) => {
  const { nome, descricao } = req.body;
  const foto = req.file ? req.file.path : null;

  db.run(
    "INSERT INTO equipamentos (nome, descricao, foto) VALUES (?,?,?)",
    [nome, descricao, foto],
    (err) => {
      if (err) return res.send("Erro ao cadastrar equipamento.");
      res.redirect("/admin/equipamentos");
    }
  );
});

/* --- Ordens de serviço --- */
// Lista
app.get("/admin/ordens", (req, res) => {
  const sql = `
    SELECT os.*, e.nome AS equipamento_nome
    FROM ordens_servico os
    JOIN equipamentos e ON os.equipamento_id = e.id
    ORDER BY os.id DESC
  `;
  db.all(sql, (err, ordens) => {
    if (err) return res.send("Erro ao listar ordens.");
    res.render("admin/ordens", { ordens });
  });
});

// Abrir OS (form funcionário)
app.get("/funcionario/abrir_os", (req, res) => {
  const equip_id = req.query.equip_id;
  res.render("funcionario/abrir_os", { equip_id });
});

// Abrir OS (salvar)
app.post("/funcionario/abrir_os", uploadOrdens.single("foto_antes"), (req, res) => {
  const { equip_id, descricao } = req.body;
  const fotoAntes = req.file ? req.file.path : null;

  db.run(
    `INSERT INTO ordens_servico 
     (equipamento_id, descricao, status, foto_antes, data_abertura) 
     VALUES (?,?,?,?,datetime('now'))`,
    [equip_id, descricao, "Aberta", fotoAntes],
    (err) => {
      if (err) return res.send("Erro ao abrir OS.");
      res.redirect("/admin/ordens");
    }
  );
});

// Fechar OS (form admin)
app.get("/admin/ordens/:id/fechar", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM ordens_servico WHERE id = ?", [id], (err, ordem) => {
    if (err || !ordem) return res.send("OS não encontrada.");
    res.render("admin/ordens_fechar", { ordem });
  });
});

// Fechar OS (PUT)
app.put("/admin/ordens/:id", uploadOrdens.single("foto_depois"), (req, res) => {
  const id = req.params.id;
  const { tecnico_nome, descricao } = req.body;
  const fotoDepois = req.file ? req.file.path : null;

  db.run(
    `UPDATE ordens_servico 
     SET tecnico_nome = ?, descricao = ?, status = ?, foto_depois = ?, data_fechamento = datetime('now') 
     WHERE id = ?`,
    [tecnico_nome, descricao, "Fechada", fotoDepois, id],
    (err) => {
      if (err) return res.send("Erro ao fechar OS.");
      res.redirect("/admin/ordens");
    }
  );
});

/* --- Relatório PDF --- */
app.get("/admin/ordens/:id/relatorio", (req, res) => {
  const id = req.params.id;

  db.get(
    `SELECT os.*, e.nome AS equipamento_nome 
     FROM ordens_servico os 
     JOIN equipamentos e ON os.equipamento_id = e.id 
     WHERE os.id = ?`,
    [id],
    (err, ordem) => {
      if (err || !ordem) return res.send("Ordem não encontrada.");

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=ordem_${id}.pdf`);
      doc.pipe(res);

      // Cabeçalho
      doc.fontSize(18).text("Relatório de Ordem de Serviço", { align: "center" });
      doc.moveDown();

      // Dados principais
      doc.fontSize(12);
      doc.text(`ID da OS: ${ordem.id}`);
      doc.text(`Equipamento: ${ordem.equipamento_nome}`);
      doc.text(`Descrição: ${ordem.descricao}`);
      doc.text(`Status: ${ordem.status}`);
      doc.text(`Técnico: ${ordem.tecnico_nome || "-"}`);
      doc.text(`Data Abertura: ${ordem.data_abertura || "-"}`);
      doc.text(`Data Fechamento: ${ordem.data_fechamento || "-"}`);
      doc.moveDown();

      // Fotos lado a lado
      const fotoAntesPath = ordem.foto_antes ? path.join(__dirname, ordem.foto_antes) : null;
      const fotoDepoisPath = ordem.foto_depois ? path.join(__dirname, ordem.foto_depois) : null;

      const startX = doc.x;
      const startY = doc.y;

      if (fotoAntesPath) {
        doc.fontSize(12).text("Antes", startX, startY);
        try {
          doc.image(fotoAntesPath, startX, startY + 18, { fit: [250, 250] });
        } catch (e) {
          doc.text("Erro ao carregar foto antes.", startX, startY + 18);
        }
      }

      if (fotoDepoisPath) {
        const rightX = startX + 300;
        doc.fontSize(12).text("Depois", rightX, startY);
        try {
          doc.image(fotoDepoisPath, rightX, startY + 18, { fit: [250, 250] });
        } catch (e) {
          doc.text("Erro ao carregar foto depois.", rightX, startY + 18);
        }
      }

      doc.moveDown
