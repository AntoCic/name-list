// netlify/functions/function.js
import admin from 'firebase-admin';
// import { config } from 'dotenv';

// config(); // Carica le variabili di ambiente dal file .env

const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

// Funzione per leggere i nomi
export async function handler(event, context) {
  switch (event.httpMethod) {
    case 'GET':
      return getNames();
    case 'POST':
      return addName(JSON.parse(event.body));
    case 'PUT':
      return updateName(JSON.parse(event.body));
    case 'DELETE':
      return deleteName(JSON.parse(event.body));
    default:
      return { statusCode: 405, body: 'Method Not Allowed' };
  }
}

async function getNames() {
  try {
    const snapshot = await db.ref('/names').once('value');
    const names = snapshot.val();
    return {
      statusCode: 200,
      body: JSON.stringify(names),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function addName({ id, name }) {
  try {
    await db.ref(`/names/${id}`).set(name);
    return {
      statusCode: 201,
      body: JSON.stringify({ id, name }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function updateName({ id, name }) {
  try {
    await db.ref(`/names/${id}`).update({ name });
    return {
      statusCode: 200,
      body: JSON.stringify({ id, name }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function deleteName({ id }) {
  try {
    await db.ref(`/names/${id}`).remove();
    return {
      statusCode: 200,
      body: JSON.stringify({ id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
