const bcrypt = require('bcryptjs');

const contraseña = 'admin25'; // puedes cambiarla si quieres

bcrypt.hash(contraseña, 10).then(hash => {
  console.log('Hash generado para la contraseña:', contraseña);
  console.log(hash);
});
