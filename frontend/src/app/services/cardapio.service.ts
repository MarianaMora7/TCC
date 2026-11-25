import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// =====================================================
// INTERFACES DOS DADOS DO CARDÁPIO
// =====================================================

export interface ItemCardapio {
  id_cardapio?: number;
  comida: string;
  fk_id_horario?: number;
  id_horario?: number;
  hora?: number;
  dia?: string;
}

export interface RespostaCardapio {
  mensagem: string;
  id_cardapio?: number;
  sucesso?: boolean;
}

export interface RefeicaoCardapio {
  id: string;
  horaIndex: number;
  titulo: string;
  horario: string;
  mensagem: string;
  opcoes: string[];
}

export interface DiaSemana {
  nome: string;
  data: string;
  titulo: string;
  dataApi: string;
}

export type SelecaoDia = Record<string, string[]>;
export type SelecaoSemana = SelecaoDia[];

function copiar(semana: SelecaoSemana): SelecaoSemana {
  return semana.map(dia =>
    Object.fromEntries(
      Object.entries(dia).map(([id, alimentos]) => [id, [...alimentos]]),
    ),
  );
}

@Injectable({
  providedIn: 'root',
})
export class CardapioService {
  private readonly http = inject(HttpClient);
  private get apiUrl(): string {
    return `${environment.apiUrl}/cardapio`;
  }

  // Configuração dos 5 dias letivos da semana (Segunda a Sexta)
  readonly dias: DiaSemana[] = this.calcularDiasSemana();

  // Definição das refeições servidas
  readonly refeicoes: RefeicaoCardapio[] = [
    {
      id: 'manha',
      horaIndex: 0,
      titulo: 'Café da Manhã',
      horario: '09h10 - 09h40',
      mensagem: 'Energia para começar o dia com disposição!',
      opcoes: [
        'Leite com achocolatado',
        'Pão com manteiga',
        'Fruta da estação',
        'Biscoito cream cracker',
        'Iogurte natural',
        'Suco de fruta',
      ],
    },
    {
      id: 'almoco',
      horaIndex: 1,
      titulo: 'Almoço',
      horario: '11h20 - 12h40',
      mensagem: 'Refeição equilibrada para mais saúde e aprendizado!',
      opcoes: [
        'Arroz branco',
        'Feijão carioca',
        'Frango assado',
        'Salada verde',
        'Carne moída',
        'Legumes refogados',
        'Farofa',
      ],
    },
    {
      id: 'tarde',
      horaIndex: 2,
      titulo: 'Café da Tarde',
      horario: '14h20 - 14h50',
      mensagem: 'Sabor e energia para finalizar o dia com alegria!',
      opcoes: [
        'Suco de frutas',
        'Bolo caseiro',
        'Biscoito maizena',
        'Fruta',
        'Pão com queijo',
        'Vitamina de banana',
      ],
    },
  ];

  private readonly inicial: SelecaoSemana = this.dias.map(() =>
    Object.fromEntries(
      this.refeicoes.map(refeicao => [
        refeicao.id,
        refeicao.opcoes.slice(0, 3),
      ]),
    ),
  );

  // Rascunho com o que o admin está selecionando em tela
  private readonly rascunho = signal(copiar(this.inicial));
  // Salvo temporariamente em edição no painel administrativo
  private readonly salvo = signal(copiar(this.inicial));
  // Efetivamente publicado para visualização na página pública de Cardápio
  private readonly publicado = signal(copiar(this.inicial));

  readonly semanaPublicada = this.publicado.asReadonly();

  constructor() {
    this.carregarCardapioDoBackend();
    this.carregarOpcoesDoBackend();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private salvarNoLocalStorage(chave: string, valor: any): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch { }
  }

  private lerDoLocalStorage<T>(chave: string): T | null {
    if (!this.isBrowser()) return null;
    try {
      const item = localStorage.getItem(chave);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private calcularDiasSemana(): DiaSemana[] {
    const hoje = new Date();
    const diaSemanaAtual = hoje.getDay(); // 0 = Domingo, 1 = Segunda
    const inicio = new Date(hoje);
    // Ajusta para a segunda-feira da semana
    const diff = hoje.getDate() - diaSemanaAtual + (diaSemanaAtual === 0 ? -6 : 1);
    inicio.setDate(diff);

    const nomes = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return Array.from({ length: 5 }, (_, i) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);

      const diaStr = String(data.getDate()).padStart(2, '0');
      const mesStr = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();

      return {
        nome: nomes[i],
        data: `${diaStr}/${mesStr}`,
        titulo: `${nomes[i]}-feira, ${diaStr} de ${nomesMeses[data.getMonth()]} de ${ano}`,
        dataApi: `${ano}-${mesStr}-${diaStr}`,
      };
    });
  }

  // Sincroniza os itens publicados do backend ou localStorage para o estado local
  private carregarCardapioDoBackend(): void {
    // 1. Tenta carregar do cache local publicado previamente
    const cachePublicado = this.lerDoLocalStorage<SelecaoSemana>('cardapio_publicado');
    if (cachePublicado && Array.isArray(cachePublicado) && cachePublicado.length === 5) {
      this.publicado.set(copiar(cachePublicado));
      this.salvo.set(copiar(cachePublicado));
      this.rascunho.set(copiar(cachePublicado));
    }

    // 2. Consulta o backend para carregar os dados persistidos no banco
    this.buscarTodos().subscribe({
      next: (itens) => {
        if (!itens || itens.length === 0) return;

        const novaSemana = copiar(this.publicado());
        let encontrouItens = false;

        this.dias.forEach((dia, diaIdx) => {
          this.refeicoes.forEach((refeicao) => {
            const itensDoDia = itens
              .filter(
                (item) =>
                  item.dia === dia.dataApi && item.hora === refeicao.horaIndex,
              )
              .map((item) => item.comida);

            if (itensDoDia.length > 0) {
              encontrouItens = true;
              novaSemana[diaIdx][refeicao.id] = itensDoDia;

              // Adiciona as opções se não existirem na lista de opções
              itensDoDia.forEach((comida) => {
                if (!refeicao.opcoes.includes(comida)) {
                  refeicao.opcoes.push(comida);
                }
              });
            }
          });
        });

        if (encontrouItens) {
          this.publicado.set(copiar(novaSemana));
          this.salvo.set(copiar(novaSemana));
          this.rascunho.set(copiar(novaSemana));
          this.salvarNoLocalStorage('cardapio_publicado', novaSemana);
        }
      },
      error: (err) => {
        console.warn('Backend indisponível no momento para cardápio. Usando dados locais.', err);
      },
    });
  }

  private carregarOpcoesDoBackend(): void {
    const opcoesLocais = this.lerDoLocalStorage<{ refeicao_id: string; nome: string }[]>('cardapio_opcoes_extras');
    if (opcoesLocais && Array.isArray(opcoesLocais)) {
      opcoesLocais.forEach((op) => {
        const refeicao = this.refeicoes.find((r) => r.id === op.refeicao_id);
        if (refeicao && !refeicao.opcoes.includes(op.nome)) {
          refeicao.opcoes.push(op.nome);
        }
      });
    }

    this.buscarOpcoes().subscribe({
      next: (opcoes) => {
        if (!opcoes || opcoes.length === 0) return;
        opcoes.forEach((op) => {
          const refeicao = this.refeicoes.find((r) => r.id === op.refeicao_id);
          if (refeicao && !refeicao.opcoes.includes(op.nome)) {
            refeicao.opcoes.push(op.nome);
          }
        });
      },
      error: () => { },
    });
  }

  // ===================================================
  // MÉTODOS CONSUMIDOS PELO COMPONENTE CARDAPIO-ADMIN
  // ===================================================

  selecionado(dia: number, refeicao: string, alimento: string): boolean {
    const semana = this.rascunho();
    if (!semana[dia] || !semana[dia][refeicao]) return false;
    return semana[dia][refeicao].includes(alimento);
  }

  alterar(
    dia: number,
    refeicao: string,
    alimento: string,
    marcado: boolean,
  ): void {
    this.rascunho.update((semana) => {
      const nova = copiar(semana);
      const itens = nova[dia][refeicao] || [];

      nova[dia][refeicao] = marcado
        ? [...new Set([...itens, alimento])]
        : itens.filter((item) => item !== alimento);

      return nova;
    });
  }

  temAlteracoes(dia: number, refeicao: string): boolean {
    const atual = [...(this.rascunho()[dia]?.[refeicao] || [])].sort();
    const salvo = [...(this.salvo()[dia]?.[refeicao] || [])].sort();

    return JSON.stringify(atual) !== JSON.stringify(salvo);
  }

  /**
   * Salva a seleção de uma refeição específica no rascunho administrativo.
   * Não altera o cardápio público até que o botão "Publicar cardápio da semana" seja acionado.
   */
  salvar(dia: number, refeicao: string): boolean {
    const itens = this.rascunho()[dia]?.[refeicao] || [];

    if (!itens.length) {
      return false;
    }

    this.salvo.update((semana) => {
      const nova = copiar(semana);
      nova[dia][refeicao] = [...itens];
      return nova;
    });

    return true;
  }

  /**
   * Publica efetivamente a semana inteira no cardápio público.
   * Pega todos os alimentos selecionados (rascunho atual),
   * atualiza a página pública e persiste no backend e localStorage.
   */
  publicar(): boolean {
    const semanaAtual = copiar(this.rascunho());

    // Valida se alguma refeição ficou sem nenhum item selecionado
    const temRefeicaoVazia = this.dias.some((_, diaIdx) =>
      this.refeicoes.some((ref) => {
        const itens = semanaAtual[diaIdx]?.[ref.id] || [];
        return itens.length === 0;
      })
    );

    if (temRefeicaoVazia) {
      return false;
    }

    // Atualiza o estado salvo e o estado publicado com todos os alimentos selecionados
    this.salvo.set(copiar(semanaAtual));
    this.publicado.set(copiar(semanaAtual));
    this.salvarNoLocalStorage('cardapio_publicado', semanaAtual);

    // Envia a semana completa para o backend salvar de forma ordenada no banco de dados
    const semanaCompleta = this.dias.map((dia, diaIdx) => ({
      dia: dia.dataApi,
      refeicoes: this.refeicoes.map((ref) => ({
        hora: ref.horaIndex,
        comidas: semanaAtual[diaIdx][ref.id] || [],
      })),
    }));

    this.salvarSemanaCompleta(semanaCompleta).subscribe({
      next: () => {
        console.log('✅ Semana completa do cardápio publicada no backend com sucesso.');
      },
      error: (err) => {
        console.warn('Backend indisponível no momento para salvar semana. Mantendo estado publicado local.', err);
      },
    });

    return true;
  }

  /**
   * Retorna os alimentos publicados para um dia e refeição específicos.
   * Utilizado pelo componente público Cardápio.
   */
  obterAlimentosPublicados(diaIndex: number, refeicaoIdOuHora: string | number): string[] {
    const semana = this.publicado();
    if (!semana || !semana[diaIndex]) return [];

    let chave = '';
    if (typeof refeicaoIdOuHora === 'number') {
      chave = refeicaoIdOuHora === 0 ? 'manha' : refeicaoIdOuHora === 1 ? 'almoco' : 'tarde';
    } else {
      chave = refeicaoIdOuHora;
    }

    return semana[diaIndex][chave] || [];
  }

  /**
   * Retorna a lista plana de ItemCardapio correspondente aos alimentos publicados.
   */
  obterItensCardapioPublicados(): ItemCardapio[] {
    const semana = this.publicado();
    const itens: ItemCardapio[] = [];

    this.dias.forEach((dia, diaIdx) => {
      this.refeicoes.forEach((ref) => {
        const comidas = semana[diaIdx]?.[ref.id] || [];
        comidas.forEach((comida) => {
          itens.push({
            dia: dia.dataApi,
            hora: ref.horaIndex,
            comida,
          });
        });
      });
    });

    return itens;
  }

  adicionarAlimento(refeicaoId: string, nome: string): string | null {
    const refeicao = this.refeicoes.find((item) => item.id === refeicaoId);
    const alimento = nome.trim().replace(/\s+/g, ' ');

    if (!refeicao) {
      return 'Refeição não encontrada.';
    }

    if (!alimento) {
      return 'Digite o nome do alimento.';
    }

    if (alimento.length > 80) {
      return 'Use até 80 caracteres.';
    }

    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const existe = refeicao.opcoes.some(
      (item) => normalizar(item) === normalizar(alimento),
    );

    if (existe) {
      return 'Esse alimento já está na lista.';
    }

    refeicao.opcoes = [...refeicao.opcoes, alimento];

    // Persiste no cache local de opções extras
    const extras = this.lerDoLocalStorage<{ refeicao_id: string; nome: string }[]>('cardapio_opcoes_extras') || [];
    extras.push({ refeicao_id: refeicaoId, nome: alimento });
    this.salvarNoLocalStorage('cardapio_opcoes_extras', extras);

    // Registra no backend
    this.adicionarOpcao(refeicaoId, alimento).pipe(
      catchError(() => of(null))
    ).subscribe();

    return null;
  }

  // ===================================================
  // MÉTODOS HTTP DE INTEGRAÇÃO COM O BACKEND
  // ===================================================

  buscarTodos(): Observable<ItemCardapio[]> {
    return this.http.get<ItemCardapio[]>(this.apiUrl);
  }

  buscarPorDia(dia: string): Observable<ItemCardapio[]> {
    return this.http.get<ItemCardapio[]>(`${this.apiUrl}/${dia}`);
  }

  buscarPorId(id: number): Observable<ItemCardapio> {
    return this.http.get<ItemCardapio>(`${this.apiUrl}/id/${id}`);
  }

  salvarRefeicao(dia: string, hora: number, comidas: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/refeicao`, {
      dia,
      hora,
      comidas,
    });
  }

  salvarSemanaCompleta(dias: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/semana-completa`, { dias });
  }

  buscarDiasCadastrados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dias-cadastrados`);
  }

  buscarOpcoes(): Observable<{ id_opcao: number; refeicao_id: string; nome: string }[]> {
    return this.http.get<{ id_opcao: number; refeicao_id: string; nome: string }[]>(
      `${this.apiUrl}/opcoes`,
    );
  }

  adicionarOpcao(refeicao_id: string, nome: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/opcoes`, {
      refeicao_id,
      nome,
    });
  }

  cadastrar(cardapio: ItemCardapio): Observable<RespostaCardapio> {
    return this.http.post<RespostaCardapio>(this.apiUrl, cardapio);
  }

  atualizar(id: number, cardapio: ItemCardapio): Observable<RespostaCardapio> {
    return this.http.put<RespostaCardapio>(`${this.apiUrl}/${id}`, cardapio);
  }

  excluir(id: number): Observable<RespostaCardapio> {
    return this.http.delete<RespostaCardapio>(`${this.apiUrl}/${id}`);
  }
}
