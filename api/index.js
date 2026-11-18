/**
 * Ponto de entrada para Vercel Serverless Functions.
 * Repassa todas as requisições /api/* para a aplicação Express do backend.
 */
const app = require('../backend/server');

module.exports = app;
