import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CardapioService } from '../../services/cardapio.service';
import { BotaoAcessibilidade } from '../../compartilhados/botao-acessibilidade/botao-acessibilidade';

@Component({
  selector: 'app-cardapio-admin',
  standalone: true,
  imports: [RouterLink, BotaoAcessibilidade],
  templateUrl: './cardapio-admin.html',
  styleUrl: './cardapio-admin.scss',
})
export class CardapioAdmin {
  readonly cardapio = inject(CardapioService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  diaSelecionado = 0;
  mensagem = '';
  tituloInformacao = '';
  erro = false;

  adicionandoRefeicao: string | null = null;
  erroAlimento = '';

  get diaAtual() {
    return this.cardapio.dias[this.diaSelecionado];
  }

  selecionarDia(indice: number): void {
    if (indice < 0 || indice >= this.cardapio.dias.length) {
      return;
    }

    this.diaSelecionado = indice;
    this.mensagem = '';
  }

  alterar(refeicao: string, alimento: string, marcado: boolean): void {
    this.cardapio.alterar(
      this.diaSelecionado,
      refeicao,
      alimento,
      marcado,
    );

    this.mensagem = '';
  }

  salvar(refeicao: string, titulo: string): void {
    const sucesso = this.cardapio.salvar(this.diaSelecionado, refeicao);

    this.erro = !sucesso;
    this.mensagem = sucesso
      ? `${titulo} de ${this.diaAtual.nome.toLowerCase()} salvo no rascunho. Para que as alterações apareçam no cardápio público, clique em "Publicar Cardápio da Semana" abaixo.`
      : 'Selecione pelo menos um alimento antes de salvar.';
  }

  publicar(): void {
    const sucesso = this.cardapio.publicar();

    this.erro = !sucesso;
    this.mensagem = sucesso
      ? 'Cardápio da semana publicado com sucesso! Todos os alimentos selecionados agora estão disponíveis na página pública.'
      : 'Selecione pelo menos um alimento para cada refeição antes de publicar o cardápio.';
  }

  abrirAdicionar(refeicaoId: string): void {
    this.adicionandoRefeicao = refeicaoId;
    this.erroAlimento = '';
  }

  cancelarAdicionar(): void {
    this.adicionandoRefeicao = null;
    this.erroAlimento = '';
  }

  adicionarAlimento(
    refeicaoId: string,
    campo: HTMLInputElement,
  ): void {
    const nome = campo.value;
    const erro = this.cardapio.adicionarAlimento(
      refeicaoId,
      nome,
    );

    if (erro) {
      this.erroAlimento = erro;
      campo.focus();
      return;
    }

    const alimentoLimpo = nome.trim().replace(/\s+/g, ' ');

    // Seleciona automaticamente o novo alimento para a refeição do dia que está sendo editado
    this.cardapio.alterar(
      this.diaSelecionado,
      refeicaoId,
      alimentoLimpo,
      true,
    );

    this.cancelarAdicionar();
    this.erro = false;
    this.mensagem =
      `"${alimentoLimpo}" foi adicionado e selecionado! Clique em "Publicar Cardápio da Semana" para disponibilizá-lo na página pública.`;
  }

  sair(): void {
    this.auth.sair();
    void this.router.navigateByUrl('/admin', { replaceUrl: true });
  }
}
