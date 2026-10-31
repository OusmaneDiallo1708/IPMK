const bcrypt = require('bcrypt');

const password = '123456789';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Erreur:', err);
    return;
  }
  console.log('🔑 Hash pour "123456789" :');
  console.log(hash);
});