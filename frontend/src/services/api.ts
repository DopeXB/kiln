import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const aiService = {
  chat: (message: string) => client.post('/ai/chat', { message }),
  generateCode: (description: string, language: string) =>
    client.post('/ai/generate-code', { description, language }),
};

export const projectService = {
  getAll: () => client.get('/projects'),
  create: (name: string, description: string, template: string) =>
    client.post('/projects', { name, description, template }),
};

export default client;
