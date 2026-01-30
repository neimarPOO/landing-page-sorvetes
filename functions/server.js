require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Endpoint to handle form submission
router.post('/subscribe', async (req, res) => {
    const { nome, email, whatsapp, idade, bairro, motivacao } = req.body;

    if (!nome || !email || !whatsapp || !idade || !bairro || !motivacao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .insert([
                { nome, email, whatsapp, idade: parseInt(idade), bairro, motivacao }
            ]);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Erro ao salvar os dados no banco.' });
        }

        res.status(200).json({ message: 'Inscrição realizada com sucesso!' });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Admin API Fetch submissions (Separated from CRUD to avoid method/path conflict)
router.post('/admin/fetch', async (req, res) => {
    const { password } = req.body;
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    if (!password || password.trim() !== adminPassword) {
        console.log('Login attempt failed: password mismatch or missing.');
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados.' });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Admin API: Create submission
router.post('/admin/submissions', async (req, res) => {
    const { password, submission } = req.body;
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    if (!password || password.trim() !== adminPassword) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .insert([submission])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Erro ao criar inscrição.' });
        }

        res.status(200).json(data[0]);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Admin API: Update submission
router.put('/admin/submissions/:id', async (req, res) => {
    const { password, submission } = req.body;
    const { id } = req.params;
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    if (!password || password.trim() !== adminPassword) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    try {
        const { data, error } = await supabase
            .from('submissions')
            .update(submission)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Erro ao atualizar inscrição.' });
        }

        res.status(200).json(data[0]);
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Admin API: Delete submission
router.delete('/admin/submissions/:id', async (req, res) => {
    const { password } = req.body;
    const { id } = req.params;
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    if (!password || password.trim() !== adminPassword) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    try {
        const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Erro ao excluir inscrição.' });
        }

        res.status(200).json({ message: 'Inscrição excluída com sucesso!' });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Primary route handler for Netlify
app.use('/api', router);
app.use('/.netlify/functions/server', router);

module.exports = app;
module.exports.handler = serverless(app);
