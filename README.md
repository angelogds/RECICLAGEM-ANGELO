# 🛠️ Sistema de Manutenção e Reciclagem - Campo do Gado

Este projeto é um sistema web para **gerenciamento de equipamentos e ordens de serviço**, com suporte a **QR Code**, **relatórios em PDF** e **upload de imagens**.

---

## 🚀 Funcionalidades
- Cadastro e gerenciamento de **equipamentos**.
- Geração automática de **QR Code** para cada equipamento.
- Abertura de **ordens de serviço** via QR Code (funcionário).
- Controle de status da OS: **Aberta → Em Andamento → Finalizada**.
- Upload de fotos **antes/depois** da manutenção.
- Relatórios em **PDF** com fotos embutidas.
- Sistema de **login** para administradores.

---

## 📂 Estrutura do Projeto
manutencao-reciclagem/ │── server.js │── package.json │── README.md │── Dockerfile │ ├── /data # Banco SQLite │ └── database.sqlite │ ├── /uploads # Arquivos enviados │ ├── /tmp │ ├── /equipamentos │ └── /ordens │ ├── /public # CSS, JS, imagens públicas │ ├── style.css │ └── logo.png │ ├── /views │ ├── /admin │ │ ├── login.ejs │ │ ├── dashboard.ejs │ │ ├── equipamentos.ejs │ │ ├── equipamentos_novo.ejs │ │ ├── ordens.ejs │ │ │ ├── /funcionario │ │ └── abrir_os.ejs │ │ │ └── /partials │ ├── cabecalho.ejs │ └── rodape.ejs │ └── belts_seed.json # Lista inicial de correias
---
 ⚙️ Instalação

### 1. Clonar o repositório
```bash
git clone https://github.com/seuusuario/manutencao-reciclagem.git
cd manutencao-reciclagem
2. Instalar dependências
bash
npm install
3. Criar banco de dados
O banco será criado automaticamente na pasta /data ao rodar o servidor.

4. Criar usuário administrador
Abra um terminal Node e rode:

js
const bcrypt = require("bcryptjs");
console.log(bcrypt.hashSync("123456", 10));
Copie o hash gerado e insira no banco:

sql
INSERT INTO usuarios (nome, email, senha, tipo)
VALUES ('Administrador', 'admin@campodogado.com', '<hash>', 'admin');
▶️ Executar
Ambiente de desenvolvimento
bash
npm run dev
Ambiente de produção
bash
npm start
O servidor rodará em: 👉 http://localhost:3000 (ou porta definida em process.env.PORT)

📑 Rotas principais
/admin/login → Login do administrador

/admin/dashboard → Painel principal

/admin/equipamentos → Lista de equipamentos

/admin/equipamentos/novo → Cadastro de novo equipamento

/admin/ordens → Lista de ordens de serviço

/admin/ordens/report → Relatório PDF

/funcionario/abrir_os?equip_id=ID → Abertura de OS via QR Code

📦 Deploy com Docker
Se quiser usar Docker:

bash
docker build -t manutencao-reciclagem .
docker run -p 3000:3000 manutencao-reciclagem
👨‍💻 Tecnologias
Node.js + Express

EJS (templates)

SQLite3

Multer (upload de arquivos)

QRCode

PDFKit

bcryptjs (hash de senhas)

express-session (autenticação)

📌 Autor
Projeto desenvolvido por Campo do Gado com apoio de Angelogomes da silva 🚀.
