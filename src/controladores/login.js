const jwtSecret = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const { loginSchema } = require('../validacoes/loginSchema');
const { decrypt } = require('../funcoes/criptografia');
const { erros } = require('../erros/login');
const knex = require('../banco_de_dados/conexao');

const loginConsumidor = async (req, res) => {
  const { email, senha } = req.body;

  try {
    await loginSchema.validate(req.body);
    const usuario = await knex('consumidor').select('*').where({ email });

    if (usuario.length === 0) {
      return res.status(400).json(erros.dadoIncorreto);
    }

    const senhaUsuario = decrypt(usuario[0].senha);

    if (senha !== senhaUsuario) {
      return res.status(400).json(erros.dadoIncorreto);
    }

    let endereco = null;
    const enderecoUsuario = await knex('endereco').select('*').where({ consumidor_id: usuario[0].id });

    if (enderecoUsuario.length > 0) {
      endereco = {
        cep: enderecoUsuario[0].cep,
        endereco: enderecoUsuario[0].endereco,
        complemento: enderecoUsuario[0].complemento,
      };
    }

    const tokenUsuario = jwt.sign({
      ID: usuario[0].id,
      NomeUsuario: usuario[0].nome_usuario,
      Email: usuario[0].email,
      Endereco: endereco,
    }, jwtSecret, { expiresIn: '1h' });

    const auth = {
      usuario: {
        ID: usuario[0].id,
        NomeUsuario: usuario[0].nome_usuario,
        Email: usuario[0].email,
      },
      tokenUsuario,
    };

    return res.status(202).json(auth);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = { loginConsumidor };
