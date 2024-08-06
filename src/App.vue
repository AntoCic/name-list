<template>
  <div>
    <!-- Se l'utente è autenticato, mostra UID, email e il pulsante di logout -->
    <div v-if="user">
      <p>Email: {{ user.email }}</p>
      <button @click="logout">Logout</button>
      <br>
      <input type="text" v-model="newName">
      <button @click="db_add">ADD</button>

      <p v-for="(name, key) in names" :key="key">{{ name }} <button @click="db_update(key)">modifica</button> <button
          @click="db_delete(key)">elimina</button></p>

    </div>
    <!-- Altrimenti, mostra il form di login -->
    <div v-else>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="login()">Login</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export default {
  data() {
    return {
      email: '',
      password: '',
      user: null, // Stato per memorizzare l'utente autenticato
      newName: '',
      names: {},
    };
  },
  methods: {
    // Metodo per eseguire il login
    async login() {
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const idToken = await userCredential.user.getIdToken();
        this.user = {
          idToken,
          email: userCredential.user.email
        };
        // await this.getData();
      } catch (error) {
        console.error('Login failed', error);
      }
    },
    // Metodo per eseguire il logout
    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        this.user = null;
      } catch (error) {
        console.error('Logout failed', error);
      }
    },
    // 
    async getData() {
      axios.post('/api/getData', {}, {
        headers: {
          "Authorization": this.user.idToken
        }
      })
        .then((res) => {
          this.names = res.data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    // 
    async db_add() {
      const name = this.newName;
      this.newName = ''
      axios.post('/api/add', { name }, {
        headers: {
          "Authorization": this.user.idToken
        }
      })
        .then((res) => {
          if (res.data) {
            const [[key, value]] = Object.entries(res.data);
            this.names[key] = value
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    // 
    async db_update(id) {
      let newName = prompt("Inserisci il nuovo nome", this.names[id]).trim();
      if (newName != null) {
        if (newName === '') {
          this.db_delete(id)
        } else {
          axios.put('/api', { id, newName }, {
            headers: {
              "Authorization": this.user.idToken
            }
          })
            .then((res) => {
              if (res.data) {
                const [[key, value]] = Object.entries(res.data);
                this.names[key] = value
              }
            })
            .catch((error) => {
              console.log(error)
            })
        }
      }
    },
    // 
    async db_delete(id) {
      axios.delete('/api', { data: { id }, headers: { "Authorization": this.user.idToken } })
        .then((res) => {
          if (res.data.deleted) {
            delete this.names[res.data.deleted]
          }
          // this.names = res.data
        })
        .catch((error) => {
          console.log(error)
        })
    },

  },
  // Hook per monitorare lo stato di autenticazione dell'utente
  mounted() {
    const auth = getAuth();
    console.log(auth);

    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        this.user = {
          idToken: currentUser.accessToken,
          email: currentUser.email
        };
        await this.getData();
      } else {
        this.user = null;
      }
    });
  },
};
</script>
