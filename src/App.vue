<template>
  <div id="app">
    <h1 class="title">Name List</h1>
    <ul>
      <li v-for="(name, id) in names" :key="id">
        <span>{{ name }}</span>
        <button @click="editName(id, name)">Edit</button>
        <button @click="deleteName(id)">Delete</button>
      </li>
    </ul>
    <div>
      <input v-model="newName" placeholder="Add a name" />
      <button @click="addName">Add</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      names: {},
      newName: '',
      editingId: null,
    };
  },
  mounted() {
    this.fetchNames();
  },
  methods: {
    async fetchNames() {
      try {
        const response = await axios.get('/api/names');
        this.names = response.data;
      } catch (error) {
        console.error('Error fetching names:', error);
      }
    },
    async addName() {
      if (this.newName.trim()) {
        try {
          const id = Math.random().toString(36).substr(2, 9);
          await axios.post('/api/names', { id, name: this.newName });
          this.names[id] = this.newName;
          this.newName = '';
        } catch (error) {
          console.error('Error adding name:', error);
        }
      }
    },
    async editName(id, currentName) {
      const newName = prompt('Enter new name', currentName);
      if (newName && newName !== currentName) {
        try {
          await axios.put('/api/names', { id, name: newName });
          this.$set(this.names, id, newName);
        } catch (error) {
          console.error('Error updating name:', error);
        }
      }
    },
    async deleteName(id) {
      try {
        await axios.delete('/api/names', { data: { id } });
        this.$delete(this.names, id);
      } catch (error) {
        console.error('Error deleting name:', error);
      }
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.title {
  color: #3498db; /* Azzurro */
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #ddd;
}

li span {
  color: #3498db; /* Azzurro */
}

button {
  margin-left: 5px;
  background-color: #3498db; /* Azzurro */
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9; /* Colore più scuro per l'hover */
}

input {
  margin: 10px 0;
  padding: 5px;
  font-size: 16px;
}

div {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
</style>