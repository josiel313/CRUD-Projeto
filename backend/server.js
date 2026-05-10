const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // biblioteca para criptografar senhas

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexão com PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'helpdesk',
  password: 'postgres', // substitua pela senha correta do postgres
  port: 5432,
});

/* ROTA TESTE */
app.get('/', (req, res) => {
  res.send('Servidor CRUD funcionando 🚀');
});

/* CADASTRAR USUÁRIO (com verificação de duplicidade e senha criptografada) */
app.post('/cadastrar', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    // verifica se já existe usuário com esse email
    const existe = await pool.query('SELECT * FROM usuarios WHERE email=$1', [
      email,
    ]);

    if (existe.rows.length > 0) {
      return res.status(400).send('Este e-mail já está cadastrado no sistema.');
    }

    // gera hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)',
      [nome, email, senhaHash]
    );

    res.status(201).send('Usuário cadastrado com sucesso!');
  } catch (err) {
    res.status(500).send('Erro: ' + err.message);
  }
});

/* LISTAR TODOS OS USUÁRIOS */
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, criado_em FROM usuarios'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* BUSCAR USUÁRIO POR ID */
app.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, nome, email, criado_em FROM usuarios WHERE id=$1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Usuário não encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* LOGIN DE USUÁRIO (com verificação de hash) */
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email=$1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).send('Email ou senha inválidos.');
    }

    const usuario = result.rows[0];

    // compara senha digitada com hash salvo
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

/* ATUALIZAR USUÁRIO */
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      'UPDATE usuarios SET nome=$1, email=$2, senha=$3 WHERE id=$4',
      [nome, email, senhaHash, id]
    );
    res.send('Usuário atualizado!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* DELETAR USUÁRIO */
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM usuarios WHERE id=$1', [id]);
    res.send('Usuário deletado!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* SERVIDOR */
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
