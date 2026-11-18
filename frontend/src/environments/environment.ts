/**
 * Configuração de ambiente da aplicação Monsenhor Informa.
 * Define a URL base da API dinamicamente:
 * - Em desenvolvimento local (localhost / 127.0.0.1): conecta em http://localhost:3000
 * - Em produção na Vercel (ou outro domínio): utiliza a rota relativa '/api' servida pela mesma origem.
 * - Permite sobrescrita manual via window.__API_URL__ se necessário.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = (window as unknown as { __API_URL__?: string }).__API_URL__;
    if (customUrl) {
      return customUrl.replace(/\/$/, '');
    }

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // Em produção na Vercel, o backend Serverless atende sob /api
    return '/api';
  }

  // Fallback para renderização no servidor (SSR / Prerendering)
  return process.env['API_URL'] || 'http://localhost:3000';
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return getApiBaseUrl();
  },
};
