const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to handle form submission
app.post('/api/subscribe', (req, res) => {
    const { nome, email, whatsapp, idade, bairro, motivacao } = req.body;

    if (!nome || !email || !whatsapp || !idade || !bairro || !motivacao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = `INSERT INTO submissions (nome, email, whatsapp, idade, bairro, motivacao) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [nome, email, whatsapp, idade, bairro, motivacao];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.status(500).json({ error: 'Erro ao salvar os dados.' });
        }
        res.status(200).json({ message: 'Inscrição realizada com sucesso!', id: this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
