import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  CardapioService,
  ItemCardapio,
} from '../services/cardapio.service';
import { BotaoAcessibilidade } from '../compartilhados/botao-acessibilidade/botao-acessibilidade';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BotaoAcessibilidade],
  templateUrl: './cardapio.html',
  styleUrl: './cardapio.scss',
})
export class Cardapio implements OnInit {
  private readonly servico = inject(CardapioService);

  // Usa os cinco dias letivos calculados pelo serviço.
  readonly dias = this.servico.dias;

  // Começa na segunda-feira.
  diaSelecionado = 0;

  cardapio: ItemCardapio[] = [];

  carregando = true;
  erro = '';

  readonly refeicoes = [
    {
      id: 0,
      chave: 'manha',
      titulo: 'Café da manhã',
      horario: '09h10 - 09h40',
      mensagem:
        'Uma boa alimentação ajuda você a começar bem o dia.',
    },
    {
      id: 1,
      chave: 'almoco',
      titulo: 'Almoço',
      horario: '11h20 - 12h40',
      mensagem:
        'Uma refeição equilibrada ajuda no aprendizado e no desenvolvimento.',
    },
    {
      id: 2,
      chave: 'tarde',
      titulo: 'Café da tarde',
      horario: '14h20 - 14h50',
      mensagem:
        'Um lanche saudável para continuar o dia com energia.',
    },
  ];

  ngOnInit(): void {
    this.buscarCardapio();
  }

  buscarCardapio(): void {
    this.carregando = true;
    this.erro = '';

    this.servico.buscarTodos().subscribe({
      next: (dados: ItemCardapio[]) => {
        this.cardapio = dados;
        this.carregando = false;
      },
      error: (erro) => {
        console.warn('Backend indisponível no momento. Exibindo cardápio publicado sincronizado.', erro);
        this.carregando = false;
      },
    });
  }

  get diaAtual() {
    return this.dias[this.diaSelecionado];
  }

  get refeicoesDoDia() {
    const dia = this.diaAtual;

    if (!dia) {
      return [];
    }

    return this.refeicoes.map((refeicao) => {
      // 1. Obtém os alimentos publicados pelo serviço (atualizado imediatamente quando o admin clica em Publicar)
      const alimentosPublicados = this.servico.obterAlimentosPublicados(
        this.diaSelecionado,
        refeicao.chave,
      );

      // 2. Se houver alimentos no estado publicado do serviço, eles são a fonte da verdade publicada
      let alimentos = alimentosPublicados;

      // 3. Como contingência, caso os publicados estejam vazios e o backend tenha retornado dados
      if (alimentos.length === 0 && this.cardapio.length > 0) {
        alimentos = this.cardapio
          .filter(
            (item) =>
              item.dia === dia.dataApi &&
              item.hora === refeicao.id,
          )
          .map((item) => item.comida);
      }

      return {
        ...refeicao,
        alimentos,
      };
    });
  }

  selecionarDia(indice: number): void {
    if (indice >= 0 && indice < this.dias.length) {
      this.diaSelecionado = indice;
    }
  }

  mudarDia(direcao: number): void {
    this.selecionarDia(this.diaSelecionado + direcao);
  }

  temAlimentos(alimentos: string[]): boolean {
    return alimentos.length > 0;
  }
}
