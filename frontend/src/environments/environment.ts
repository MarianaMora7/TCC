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
    const port = window.location.port;

    // Quando rodando desenvolvimento isolado localmente (Angular CLI na 4200 e backend na 3000)
    if ((host === 'localhost' || host === '127.0.0.1') && port === '4200') {
      return 'http://localhost:3000';
    }

    // Em produção na Vercel ou via 'vercel dev' (mesma origem compartilhada):
    // o tráfego é roteado pelo Vercel Services sob o prefixo /api
    return '/api';
  }

  // Fallback para renderização no servidor (SSR / Prerendering) via binding do Vercel Services
  const boundBackendUrl =
    process.env['BACKEND_URL'] ||
    process.env['API_URL'] ||
    'http://localhost:3000';

  return boundBackendUrl.replace(/\/$/, '');
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return getApiBaseUrl();
  },
};
