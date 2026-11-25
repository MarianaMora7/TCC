import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { AcessibilidadeService } from '../../services/acessibilidade.service';

@Component({
  selector: 'app-botao-acessibilidade',
  standalone: true,
  templateUrl: './botao-acessibilidade.html',
  styleUrl: './botao-acessibilidade.scss',
})
export class BotaoAcessibilidade {
  readonly acessibilidade = inject(AcessibilidadeService);
  private readonly elementRef = inject(ElementRef);

  readonly menuAberto = signal<boolean>(false);

  alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  fecharMenu(): void {
    this.menuAberto.set(false);
  }

  // Fecha o dropdown se o usuário clicar fora dele
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.fecharMenu();
    }
  }

  // Fecha com a tecla ESC
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fecharMenu();
  }
}
