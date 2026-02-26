import bcrypt from 'bcrypt';

const password = 'Admin@2024';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
