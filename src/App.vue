<template>
  <!-- Se l'utente è autenticato, mostra UID, email e il pulsante di logout -->
  <template v-if="user">
    <p>Email: {{ user.email }}</p>
    <p v-if="user.userName">Name: {{ user.userName }}</p>
    <button @click="logout">Logout</button>
    <br>
    <input type="text" v-model="newName">
    <button @click="db_add">ADD</button>

    <p v-for="(name, key) in names" :key="key">{{ name.name }} <button @click="db_update(key)">modifica</button> <button
        @click="db_delete(key)">elimina</button></p>

  </template>
  <!-- Altrimenti, mostra il form di login -->
  <template v-else>
    <template v-if="!isRegistering">
      <h1>Login</h1>
      <input v-model="email" type="email" placeholder="Email" />
      <br>
      <input v-model="password" type="password" placeholder="Password" />
      <br>
      <button @click="login()">Login</button>
      <button @click="googleLogin">Google Login</button>
      <p>Don't have an account? <a @click="isRegistering = !isRegistering">Register here</a></p>
    </template>
    <template v-else>
      <h1>Register</h1>
      <input v-model="registerUserName" type="text" placeholder="Mario Rossi" />
      <br>
      <input v-model="registerEmail" type="email" placeholder="Email" />
      <br>
      <input v-model="registerPassword" type="password" placeholder="Password" />
      <br>
      <button @click="register()">Register</button>
      <p>Already have an account? <a @click="isRegistering = !isRegistering">Login here</a></p>
    </template>
  </template>
</template>

<script>

import axios from 'axios';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
const provider = new GoogleAuthProvider();
export default {
  data() {
    return {
      isRegistering: false,
      email: '',
      password: '',
      registerUserName: '',
      registerEmail: '',
      registerPassword: '',
      user: null, // Stato per memorizzare l'utente autenticato
      newName: '',
      names: {},
    };
  },
  methods: {
    // Metodo per eseguire il login
    async login() {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const idToken = await userCredential.user.getIdToken();
        this.user = {
          idToken,
          email: userCredential.user.email
        };
      } catch (error) {
        console.error('Login failed', error);
      }
    },
    async googleLogin() {
      try {
        const userCredential = await signInWithPopup(auth, provider);
        const idToken = await userCredential.user.getIdToken();
        this.user = {
          idToken,
          email: userCredential.user.email
        };
      } catch (error) {
        console.error('Login failed', error);
      }
    },
    // Metodo per eseguire il register
    async register() {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.registerEmail, this.registerPassword);
        const idToken = await userCredential.user.getIdToken();
        this.user = {
          idToken,
          email: userCredential.user.email
        };

        await this.addUserName(this.registerUserName)

        this.registerEmail = '';
        this.registerPassword = '';
        this.isRegistering = !this.isRegistering; // Switch to login form after registration

      } catch (error) {
        console.error('Error registering:', error);
        alert('Registration failed. Please try again.');
      }
    },
    // Metodo per eseguire il logout
    async addUserName(userName) {
      return await axios.post('/api/a/userdata', { userName }, {
        headers: {
          "Authorization": this.user.idToken
        }
      })
        .then((res) => {
          if (res.data) {
            this.user.userName = res.data.userName
          }
        })
        .catch((error) => {
          console.log(error)
        })

    },
    // Metodo per eseguire il logout
    async logout() {
      try {
        await signOut(auth);
        this.user = null;
      } catch (error) {
        console.error('Logout failed', error);
      }
    },
    // 
    async getData() {
      this.names = {}
      axios.post('/api/getData', {}, {
        headers: {
          "Authorization": this.user.idToken
        }
      })
        .then((res) => {
          console.log(res);
          if (res.data.userdata) {
            this.user = { ...this.user, ...res.data.userdata }
          } else {
            const userName = prompt("Inserisci il Nome utenete").trim();
            if (userName != null && userName != '') {
              this.addUserName(userName)
            } else {
              alert("Nome non settato correttamente");
            }
          }
          if (res.data.names) {
            this.names = res.data.names
          }

        })
        .catch((error) => {
          console.log(error)
        })
    },
    // 
    async db_add() {
      const name = this.newName;
      this.newName = ''
      axios.post('/api/a/names', { name, id: true }, {
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
      let newName = prompt("Inserisci il nuovo nome", this.names[id].name).trim();
      console.log(newName);

      if (newName != null) {
        if (newName === '') {
          this.db_delete(id)
        } else {
          axios.put('/api/u/names', { id, name: newName }, {
            headers: {
              "Authorization": this.user.idToken
            }
          })
            .then((res) => {
              console.log(res);

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
      axios.delete('/api/d/names', { data: { id }, headers: { "Authorization": this.user.idToken } })
        .then((res) => {
          if (res.data.deleted) {
            delete this.names[res.data.deleted]
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },

  },
  // Hook per monitorare lo stato di autenticazione dell'utente
  mounted() {
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
