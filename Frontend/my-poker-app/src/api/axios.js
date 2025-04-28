import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api', // Your backend base URL
  withCredentials: true, // if you use cookies/session (optional)
});

export default API;
