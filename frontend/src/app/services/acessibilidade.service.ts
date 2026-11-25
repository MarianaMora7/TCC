import { Injectable, signal } from '@angular/core';

export interface PreferenciasAcessibilidade {
  altoContraste: boolean;
  modoDaltonismo: boolean;
  tamanhoFonte: number; // Porcentagem: 90, 100, 115, 130
  fonteLegivel: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AcessibilidadeService {
  private readonly CHAVE_STORAGE = 'ee_bicudo_acessibilidade';

  readonly altoContraste = signal<boolean>(false);
  readonly modoDaltonismo = signal<boolean>(false);
  readonly tamanhoFonte = signal<number>(100);
  readonly fonteLegivel = signal<boolean>(false);

  constructor() {
    this.carregarPreferencias();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private carregarPreferencias(): void {
    if (!this.isBrowser()) return;

    try {
      const salvo = localStorage.getItem(this.CHAVE_STORAGE);
      if (salvo) {
        const prefs: PreferenciasAcessibilidade = JSON.parse(salvo);
        this.altoContraste.set(!!prefs.altoContraste);
        this.modoDaltonismo.set(!!prefs.modoDaltonismo);
        this.tamanhoFonte.set(prefs.tamanhoFonte || 100);
        this.fonteLegivel.set(!!prefs.fonteLegivel);
      } else {
        // Detecta preferência do sistema operacional para alto contraste se disponível
        if (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) {
          this.altoContraste.set(true);
        }
      }
    } catch { }

    this.aplicarNoDocumento();
  }

  private salvarPreferencias(): void {
    if (!this.isBrowser()) return;

    const prefs: PreferenciasAcessibilidade = {
      altoContraste: this.altoContraste(),
      modoDaltonismo: this.modoDaltonismo(),
      tamanhoFonte: this.tamanhoFonte(),
      fonteLegivel: this.fonteLegivel(),
    };

    try {
      localStorage.setItem(this.CHAVE_STORAGE, JSON.stringify(prefs));
    } catch { }

    this.aplicarNoDocumento();
  }

  private aplicarNoDocumento(): void {
    if (!this.isBrowser()) return;

    const html = document.documentElement;
    const body = document.body;

    // 1. Alto Contraste
    if (this.altoContraste()) {
      html.classList.add('alto-contraste');
      body.classList.add('alto-contraste');
    } else {
      html.classList.remove('alto-contraste');
      body.classList.remove('alto-contraste');
    }

    // 2. Modo Daltonismo (Universal / Alto contraste cromático com símbolos)
    if (this.modoDaltonismo()) {
      html.classList.add('modo-daltonismo');
      body.classList.add('modo-daltonismo');
    } else {
      html.classList.remove('modo-daltonismo');
      body.classList.remove('modo-daltonismo');
    }

    // 3. Fonte Legível (Família tipográfica e espaçamento aumentados para dislexia e baixa visão)
    if (this.fonteLegivel()) {
      html.classList.add('fonte-legivel');
      body.classList.add('fonte-legivel');
    } else {
      html.classList.remove('fonte-legivel');
      body.classList.remove('fonte-legivel');
    }

    // 4. Tamanho da fonte
    const porcentagem = this.tamanhoFonte();
    html.style.fontSize = `${porcentagem}%`;
  }

  alternarAltoContraste(): void {
    this.altoContraste.update((val) => !val);
    this.salvarPreferencias();
  }

  alternarModoDaltonismo(): void {
    this.modoDaltonismo.update((val) => !val);
    this.salvarPreferencias();
  }

  alternarFonteLegivel(): void {
    this.fonteLegivel.update((val) => !val);
    this.salvarPreferencias();
  }

  aumentarFonte(): void {
    const atual = this.tamanhoFonte();
    if (atual < 130) {
      this.tamanhoFonte.set(atual + 15);
      this.salvarPreferencias();
    }
  }

  diminuirFonte(): void {
    const atual = this.tamanhoFonte();
    if (atual > 90) {
      this.tamanhoFonte.set(atual - 15);
      this.salvarPreferencias();
    }
  }

  redefinirFonte(): void {
    this.tamanhoFonte.set(100);
    this.salvarPreferencias();
  }
}
