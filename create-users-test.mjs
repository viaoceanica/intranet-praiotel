import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/trpc';

// Primeiro fazer login como admin
async function login() {
  const response = await fetch(`${API_URL}/auth.login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@praiotel.pt',
      password: 'Admin@2024'
    })
  });
  
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

// Criar utilizador Julia
async function createJulia(cookies) {
  const response = await fetch(`${API_URL}/users.create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      name: 'Julia Duarte',
      email: 'julia.duarte@praiotel.pt',
      role: 'Administrativa',
      password: 'Julia@2026'
    })
  });
  
  const result = await response.json();
  console.log('Julia criada:', result);
}

try {
  console.log('A fazer login...');
  const cookies = await login();
  console.log('Login efetuado, cookies:', cookies ? 'obtidos' : 'não obtidos');
  
  console.log('A criar Julia...');
  await createJulia(cookies);
  
  console.log('Concluído!');
} catch (error) {
  console.error('Erro:', error.message);
}
