<template>
  <div class="app">
    <header v-if="user">
      <h1>{{ user.name }}</h1>
      <button @click="logout">Logout</button>
    </header>

    <div v-if="!user" class="auth-container">
      <div v-if="!isRegistering">
        <h2>Login</h2>
        <form @submit.prevent="login">
          <input v-model="loginEmail" type="email" placeholder="Email" required />
          <input v-model="loginPassword" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
          <p>Don't have an account? <a @click="toggleRegistering">Register here</a></p>
        </form>
      </div>
      
      <div v-else>
        <h2>Register</h2>
        <form @submit.prevent="register">
          <input v-model="registerEmail" type="email" placeholder="Email" required />
          <input v-model="registerPassword" type="password" placeholder="Password" required />
          <button type="submit">Register</button>
          <p>Already have an account? <a @click="toggleRegistering">Login here</a></p>
        </form>
      </div>
    </div>

    <main v-if="user">
      <div v-if="Object.keys(names).length">
        <ul>
          <li v-for="(name, id) in names" :key="id">
            <span>{{ name }}</span>
            <button @click="editName(id)">Edit</button>
            <button @click="deleteName(id)">Delete</button>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>No names available.</p>
      </div>

      <input v-model="newName" placeholder="Enter name" />
      <button @click="addName">Add Name</button>
    </main>
  </div>
</template>

<script>
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import axios from 'axios';

export default {
  data() {
    return {
      user: null,
      names: {},
      newName: '',
      loginEmail: '',
      loginPassword: '',
      registerEmail: '',
      registerPassword: '',
      isRegistering: false,
    };
  },
  async mounted() {
    this.checkUser();
    auth.onAuthStateChanged(user => {
      if (user) {
        this.user = {
          name: user.email || 'User',
          id: user.uid,
        };
        this.fetchNames();
      } else {
        this.user = null;
        this.names = {};
      }
    });
  },
  methods: {
    async checkUser() {
      const user = auth.currentUser;
      if (user) {
        this.user = {
          name: user.email || 'User',
          id: user.uid,
        };
        this.fetchNames();
      }
    },
    async fetchNames() {
      if (this.user) {
        try {
          const response = await axios.get('/api', {
            params: { userId: this.user.id },
          });
          this.names = response.data;
        } catch (error) {
          console.error('Error fetching names:', error);
        }
      }
    },
    async addName() {
      if (!this.newName.trim()) {
        alert('Name cannot be empty');
        return;
      }

      try {
        const newId = Date.now().toString();
        await axios.post('/api', {
          id: newId,
          name: this.newName,
        }, {
          params: { userId: this.user.id },
        });
        this.names = { ...this.names, [newId]: this.newName };
        this.newName = '';
      } catch (error) {
        console.error('Error adding name:', error);
      }
    },
    async editName(id) {
      const newName = prompt('Enter new name:');
      if (!newName || !newName.trim()) {
        alert('Name cannot be empty');
        return;
      }

      try {
        await axios.put('/api', {
          id,
          name: newName,
        }, {
          params: { userId: this.user.id },
        });
        this.names = { ...this.names, [id]: newName };
      } catch (error) {
        console.error('Error updating name:', error);
      }
    },
    async deleteName(id) {
      try {
        await axios.delete('/api', {
          data: { id },
          params: { userId: this.user.id },
        });
        const { [id]: _, ...remainingNames } = this.names;
        this.names = remainingNames;
      } catch (error) {
        console.error('Error deleting name:', error);
      }
    },
    async login() {
      try {
        await signInWithEmailAndPassword(auth, this.loginEmail, this.loginPassword);
        this.loginEmail = '';
        this.loginPassword = '';
      } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed. Please check your credentials.');
      }
    },
    async register() {
      try {
        await createUserWithEmailAndPassword(auth, this.registerEmail, this.registerPassword);
        this.registerEmail = '';
        this.registerPassword = '';
        this.toggleRegistering(); // Switch to login form after registration
      } catch (error) {
        console.error('Error registering:', error);
        alert('Registration failed. Please try again.');
      }
    },
    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.names = {};
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    toggleRegistering() {
      this.isRegistering = !this.isRegistering;
    }
  }
};
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  color: #007bff;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 2em;
  margin: 0;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

input {
  margin: 10px;
  padding: 5px;
}

button {
  margin: 5px;
  padding: 5px 10px;
}

.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
