// seed.js — Criar usuário admin com senha criptografada

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const DB_FILE = "./database.sqlite";

const db = new sqlite3.Database(DB_FILE, async (err) => {
    if (err) {
        console.error("Erro ao conectar no banco:", err);
        process.exit(1);
    }

    console.log("Banco conectado:", DB_FILE);

    try {
        // senha criptografada
        const senhaHash = await bcrypt.hash("@nloFa1107", 10);

        db.run(
            `DELETE FROM usuarios WHERE usuario = ?`,
            ["angelocampodogado"],
            () => {

                db.run(
                    `INSERT INTO usuarios (usuario, senha, nome, role)
                     VALUES (?, ?, ?, ?)`,
                    ["angelocampodogado", senhaHash, "Administrador", "admin"],
                    (err) => {
                        if (err) {
                            console.error("Erro ao criar admin:", err);
                        } else {
                            console.log("✔ Usuário admin criado com sucesso!");
                            console.log("Login:");
                            console.log("Usuário: angelocampodogado");
                            console.log("Senha: @nloFa1107");
                        }
                        db.close();
                    }
                );
            }
        );

    } catch (e) {
        console.error("Erro ao criar admin:", e);
        db.close();
    }
});
