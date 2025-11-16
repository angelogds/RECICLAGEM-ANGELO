// ------------------------------------------
// RELATÓRIO PDF ESTILIZADO
// ------------------------------------------
app.get("/admin/ordens/report", (req, res) => {
  const id = req.query.id;

  const sql = id
    ? `SELECT o.*, e.nome AS equipamento_nome FROM ordens_servico o
       LEFT JOIN equipamentos e ON e.id = o.equipamento_id
       WHERE o.id=?`
    : `SELECT o.*, e.nome AS equipamento_nome FROM ordens_servico o
       LEFT JOIN equipamentos e ON e.id = o.equipamento_id
       ORDER BY o.data_abertura DESC`;

  const params = id ? [id] : [];

  db.all(sql, params, (err, rows) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    const filename = id
      ? `os_${id}.pdf`
      : `relatorio_${Date.now()}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Cabeçalho com logo
    if (fs.existsSync("public/logo.png")) {
      doc.image("public/logo.png", 40, 40, { width: 80 });
    }
    doc.fontSize(22).fillColor("#222")
       .text("Campo do Gado - Relatório de Ordens de Serviço", 140, 50);
    doc.moveDown(2);

    rows.forEach((r, index) => {
      doc.fontSize(16).fillColor("#333").text(`OS #${r.id}`, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor("#000").text(`Equipamento: ${r.equipamento_nome}`);
      doc.text(`Status: ${r.status}`);
      doc.text(`Técnico: ${r.tecnico_nome || "-"}`);
      doc.text(`Abertura: ${r.data_abertura}`);
      doc.text(`Início: ${r.data_inicio || "-"}`);
      doc.text(`Fechamento: ${r.data_fechamento || "-"}`);

      if (r.tempo_total != null) {
        const s = r.tempo_total;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        doc.text(`Tempo total: ${h}h ${m}m ${sec}s`);
      }

      doc.moveDown();
      doc.font("Helvetica-Bold").text("Descrição:");
      doc.font("Helvetica").text(r.descricao || "-", { indent: 20 });
      doc.moveDown();

      // Fotos
      if (r.foto_antes && fs.existsSync(r.foto_antes)) {
        doc.font("Helvetica-Bold").text("Foto ANTES:");
        doc.image(r.foto_antes, { width: 200 });
        doc.moveDown();
      }

      if (r.foto_depois && fs.existsSync(r.foto_depois)) {
        doc.font("Helvetica-Bold").text("Foto DEPOIS:");
        doc.image(r.foto_depois, { width: 200 });
        doc.moveDown();
      }

      // Linha separadora
      doc.moveDown();
      doc.strokeColor("#aaa").lineWidth(1)
         .moveTo(40, doc.y).lineTo(550, doc.y).stroke();

      // Nova página apenas se não for o último
      if (index < rows.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
  });
});
