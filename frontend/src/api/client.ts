import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
  withCredentials: true, // Important for cookies/sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
