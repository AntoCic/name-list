import admin from 'firebase-admin';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_AUTH_URI,
  FIREBASE_TOKEN_URI,
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  FIREBASE_CLIENT_X509_CERT_URL,
  FIREBASE_UNIVERSE_DOMAIN,
  FIREBASE_DATABASE_URL,
} = process.env

// Inizializza Firebase Admin
// const serviceAccount = {
//   "type": "service_account",
//   "project_id": FIREBASE_PROJECT_ID,
//   "private_key_id": FIREBASE_PRIVATE_KEY_ID,
//   "private_key": FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   "client_email": FIREBASE_CLIENT_EMAIL,
//   "client_id": FIREBASE_CLIENT_ID,
//   "auth_uri": FIREBASE_AUTH_URI,
//   "token_uri": FIREBASE_TOKEN_URI,
//   "auth_provider_x509_cert_url": FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
//   "client_x509_cert_url": FIREBASE_CLIENT_X509_CERT_URL,
//   "universe_domain": FIREBASE_UNIVERSE_DOMAIN
// };


const serviceAccount = {
  "type": "service_account",
  "project_id": FIREBASE_PROJECT_ID,
  "private_key_id": FIREBASE_PRIVATE_KEY_ID,
  "private_key": FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": FIREBASE_CLIENT_EMAIL,
  "client_id": FIREBASE_CLIENT_ID,
  "auth_uri": FIREBASE_AUTH_URI,
  "token_uri": FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": FIREBASE_CLIENT_X509_CERT_URL,
  "universe_domain": FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_DATABASE_URL,
});

const db = admin.database();

export async function handler(event, context) {
  const method = event.httpMethod;
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
    };
  }

  try {
    switch (method) {
      case 'GET':
        const snapshot = await db.ref(`names/${userId}`).once('value');
        const names = snapshot.val() || {};
        return {
          statusCode: 200,
          body: JSON.stringify(names),
        };

      case 'POST':

        console.log('post: ', event.body);
        const postData = JSON.parse(event.body);
        const { id, name } = postData;

        if (!id || !name) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID and name are required' }),
          };
        }

        await db.ref(`names/${userId}/${id}`).set(name);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        };

      case 'PUT':
        const { id: updateId, name: updateName } = JSON.parse(event.body);
        console.log(updateName);
        if (!updateId || !updateName) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID and name are required' }),
          };
        }

        await db.ref(`names/${userId}`).update({ [updateId]: updateName });
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        };

      case 'DELETE':
        const { id: deleteId } = JSON.parse(event.body);

        if (!deleteId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID is required' }),
          };
        }

        await db.ref(`names/${userId}/${deleteId}`).remove();
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Server error: ${error.message}` }),
    };
  }
}
