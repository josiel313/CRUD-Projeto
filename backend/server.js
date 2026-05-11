const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==============================================
// 📌 CONEXÃO PARA O RENDER (NUVEM)
// ==============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/* ROTAS */
app.get('/', (req, res) => {
  res.send('Servidor CRUD funcionando 🚀');
});

app.get('/teste-banco', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW() AS hora');
    res.json({
      mensagem: '✅ Conexão com o banco funcionou!',
      hora_servidor: resultado.rows[0].hora,
    });
  } catch (err) {
    res.status(500).json({
      mensagem: '❌ Erro ao conectar no banco',
      erro: err.message,
    });
  }
});

app.post('/cadastrar', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const existe = await pool.query('SELECT * FROM usuarios WHERE email = $1', [
      email,
    ]);
    if (existe.rows.length > 0) {
      return res.status(400).send('Este email já está cadastrado.');
    }
    const senhaCripto = await bcrypt.hash(senha, 10);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)',
      [nome, email, senhaCripto]
    );
    res.send('Cadastro realizado com sucesso!');
  } catch (err) {
    res.status(500).send('Erro no cadastro: ' + err.message);
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).send('Email ou senha inválidos.');
    }
    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (senhaValida) {
      res.send('Login realizado com sucesso!');
    } else {
      res.status(401).send('Email ou senha inválidos.');
    }
  } catch (err) {
    res.status(500).send('Erro: ' + err.message);
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email FROM usuarios ORDER BY nome'
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE id = $1',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;
  try {
    await pool.query(
      'UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3',
      [nome, email, id]
    );
    res.send('Usuário atualizado com sucesso!');
  } catch (err) {
    res.status(500).send('Erro: ' + err.message);
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.send('Usuário excluído com sucesso!');
  } catch (err) {
    res.status(500).send('Erro: ' + err.message);
  }
});

/* Servidor */
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
