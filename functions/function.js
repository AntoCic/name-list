import admin from 'firebase-admin';

// Inizializza Firebase Admin
const serviceAccount = {
  
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://name-list-8296b-default-rtdb.europe-west1.firebasedatabase.app',
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
