const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'collaborative_publishing',
  user: 'postgres',
  password: 'password'
});

async function checkUser() {
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT email, password, "isActive" FROM users WHERE email = $1',
      ['debugtest@example.com']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Password hash:', user.password);
      console.log('Is Active:', user.isactive);
      console.log('Password hash length:', user.password.length);
      console.log('Password hash starts with:', user.password.substring(0, 4));
    } else {
      console.log('User not found');
    }
    
    // Also check the working user
    const workingUser = await client.query(
      'SELECT email, password, "isActive" FROM users WHERE email = $1',
      ['logintest@example.com']
    );
    
    if (workingUser.rows.length > 0) {
      const user = workingUser.rows[0];
      console.log('\nWorking user:');
      console.log('Email:', user.email);
      console.log('Password hash:', user.password);
      console.log('Is Active:', user.isactive);
      console.log('Password hash length:', user.password.length);
      console.log('Password hash starts with:', user.password.substring(0, 4));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkUser(); 