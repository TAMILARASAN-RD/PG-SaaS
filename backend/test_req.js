fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Owner', email: 'test@owner.com', password: 'password123' })
}).then(async res => {
    console.log('Status:', res.status);
    console.log('Body:', await res.json());
}).catch(console.error);
