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
} = process.env;

const serviceAccount = {
  type: 'service_account',
  project_id: FIREBASE_PROJECT_ID,
  private_key_id: FIREBASE_PRIVATE_KEY_ID,
  private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: FIREBASE_CLIENT_EMAIL,
  client_id: FIREBASE_CLIENT_ID,
  auth_uri: FIREBASE_AUTH_URI,
  token_uri: FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_DATABASE_URL,
});

const db = admin.database();

exports.handler = async function (event, context) {

  router.start(event);

  // AUTH route
  const user = await dbFirebase.auth(router.authToken);
  if (user) {

    await router.POST('getData', async () => {
      const names = await dbFirebase.getAll();
      router.setRes(names);
    })

    await router.POST('add', async () => {
      const data = router.bodyParams.name
      if (data) {
        const name = await dbFirebase.add(data);
        router.setRes(name);
      } else {
        router.error();
      }
    })

    await router.PUT('', async () => {
      const { id, newName: newData } = router.bodyParams
      if (id && newData) {
        const name = await dbFirebase.update(id, newData);
        router.setRes(name);
      } else {
        router.error();
      }
    })

    await router.DELETE('', async () => {
      const id = router.bodyParams.id
      if (id) {
        const res = await dbFirebase.delete(id);
        router.setRes(res);
      }
    })
  }

  return router.sendRes()
};

const dbFirebase = {
  idIndex: 0,
  dbName: 'users',
  user: null,
  async auth(idToken) {
    this.user = null;
    if (!this.idIndex) {
      this.idIndex = Math.floor(Math.random() * 100);
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      this.user = await admin.auth().getUser(decodedToken.uid);
      return this.user
    } catch (error) {
      router.error(401, error = 'Unauthorized')
      return null
    }
  },
  async getAll() {
    const snapshot = await db.ref(`${this.dbName}/${this.user.uid}`).once('value');
    return snapshot.val() || {};
  },
  async add(data) {
    const id = this.newId();
    await db.ref(`${this.dbName}/${this.user.uid}/${id}`).set(data);
    return { [id]: data };
  },
  async update(id, newData) {
    await db.ref(`${this.dbName}/${this.user.uid}`).update({ [id]: newData });
    return { [id]: newData };
  },
  async delete(id) {
    await db.ref(`${this.dbName}/${this.user.uid}/${id}`).remove();
    return { deleted: id };
  },
  newId() {
    let newId = this.idIndex.toString(36)
    this.idIndex++;
    newId += Math.random().toString(36).substring(2, 7) // stringa casuale
    newId += "-" + Date.now().toString(36) // converte in base 36
    return newId;
  }
}

// Oggetto che ho creato per gestire e semplificare le chiamate al server
const router = {
  // VAR UTILITY
  // contiene tuttu l'evento della chiamata
  event: null,
  // contiene un la risposta nel caso sono stete settate piú risposte é un array
  response: null,
  // status code che viene inviato con la risposta
  statusCode: 200,

  // var boolean di controllo si attiva se trova un errore
  stateError: false,
  // var boolean di controllo si attiva nel momento in cui viene settata la prima risposta
  // per fornire un riferimento per trasformare in caso di un secondo set la risposta in un array
  isSecondSet: false,

  // contiene tutti i path parems 
  pathParams: [],
  // contiene tutti i body parems 
  bodyParams: null,

  authToken: null,

  // metodo OBLIGATORIO per inizializzare le variabili ricavate dallévento della chiamata
  start(event) {
    this.event = event
    this.stateError = false;
    this.statusCode = 200;
    this.bodyParams = null;
    this.authToken = event.headers.authorization || null;

    this.clearRes();

    this.setBodyParams();

    this.pathParams = this.getPathParams();
  },

  // metodo per debugging ti ricorda che devi inizializzare la chiamata
  isStarted() {
    if (this.event && !this.stateError) {
      return true
    } else {
      console.error('ERROR 500: non hai inizializzato il router, SCRIVI: router.start(event);');
      this.error(500, 'ERROR 500: non hai inizializzato il router, SCRIVI: router.start(event);')
      return false
    }
  },

  // metodo per settare una o piú risposte se eseguito piú volte
  setRes(response) {
    if (this.isStarted()) {
      if (this.response) {
        if (this.isSecondSet) {
          this.response = [this.response]
          this.isSecondSet = false
        }
        this.response.push(response)

      } else {
        this.response = response
        this.isSecondSet = true
      }
    }
  },

  // metodo che ripulisce la risposta
  clearRes() {
    if (this.isStarted()) {
      this.isSecondSet = false;
      this.response = null
    }
  },

  // metodo che setta delle variabili per inviare un errore
  error(statusCode = 400, error = 'Errore: 400 Bad Request') {
    this.stateError = true
    this.response = error;
    this.statusCode = statusCode
  },

  // metodo OBBLIGATORIO per inviare la risposta
  sendRes() {
    if (this.response === null) {
      this.error();
    }
    return {
      statusCode: this.statusCode,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.response),
    }
  },

  // metodo per settare su pathParams i path params utili
  getPathParams() {
    if (this.isStarted()) {
      const params = this.event.path.split("/")
      if (params.length > 2) {
        for (let index = 0; index < 2; index++) {
          params.shift();
        }

        return params
      } else {
        return [""]
      }
    }
  },

  // metodo per ottenere i parametri 
  // di defaul viene utilizzata per ottenere il primo parametro che viene indicato nelle richeste
  params(index = 0) {
    if (this.pathParams.length >= index + 1) {
      return this.pathParams[index]
    } else {
      return false
    }

  },

  // metodo per settare la mia var bodyParams con un oggetto contenete tutti i parametri del body
  setBodyParams() {
    if (this.event.body) {
      this.bodyParams = JSON.parse(this.event.body)
    }

  },

  // controllo dell'evento della chiamata e esegue la funzione richesta
  async checkCall(pathParam, ArrowFunction, method) {
    if (this.event.httpMethod === method) {
      if (pathParam === this.params()) {
        return await ArrowFunction();
      } else {
        return false
      }
    } else {
      return false
    }
  },

  // caso chiamata tipo GET
  async GET(pathParam, ArrowFunction) {
    return await this.checkCall(pathParam, ArrowFunction, "GET")
  },
  // caso chiamata tipo POST
  async POST(pathParam, ArrowFunction) {
    return await this.checkCall(pathParam, ArrowFunction, "POST")
  },
  // caso chiamata tipo PUT
  async PUT(pathParam, ArrowFunction) {
    return await this.checkCall(pathParam, ArrowFunction, "PUT")
  },
  // caso chiamata tipo PATCH
  async PATCH(pathParam, ArrowFunction) {
    return await this.checkCall(pathParam, ArrowFunction, "PATCH")
  },
  // caso chiamata tipo DELETE
  async DELETE(pathParam, ArrowFunction) {
    return await this.checkCall(pathParam, ArrowFunction, "DELETE")
  },


}
