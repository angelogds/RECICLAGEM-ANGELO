
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use("/public", express.static(path.join(__dirname,"public")));
app.use("/uploads", express.static(path.join(__dirname,"uploads")));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

["uploads","uploads/equipamentos","uploads/ordens","uploads/logos","data"].forEach(f=>{
 if(!fs.existsSync(f)) fs.mkdirSync(f,{recursive:true});
});

const db=new sqlite3.Database("./data/database.sqlite");

db.serialize(()=>{
 db.run(`CREATE TABLE IF NOT EXISTS equipamentos(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   nome TEXT, setor TEXT, foto_path TEXT, qr_code TEXT
 )`);
 db.run(`CREATE TABLE IF NOT EXISTS ordens(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   equipamento_id INTEGER,
   descricao TEXT,
   foto_antes TEXT,
   foto_depois TEXT,
   status TEXT DEFAULT 'Aberta',
   data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP
 )`);
});

const upload=multer({dest:"uploads/tmp/"});

app.get("/",(req,res)=>res.redirect("/admin/login"));
app.get("/admin/login",(req,res)=>res.render("admin/login"));
app.get("/admin/dashboard",(req,res)=>{
 db.all("SELECT * FROM equipamentos",[],(e,rows)=>{
   res.render("admin/dashboard",{equipamentos:rows||[]});
 });
});
app.get("/funcionario/abrir_os",(req,res)=>{
 const id=req.query.equip_id;
 db.get("SELECT * FROM equipamentos WHERE id=?",[id],(e,row)=>{
   res.render("funcionario/abrir_os",{equip:row});
 });
});
const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log("Rodando na porta",PORT));
