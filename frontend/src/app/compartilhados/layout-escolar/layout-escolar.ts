import { Component, Input, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { BotaoAcessibilidade } from '../botao-acessibilidade/botao-acessibilidade';

@Component({
  selector: 'app-layout-escolar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BotaoAcessibilidade],
  templateUrl: './layout-escolar.html',
  styleUrl: './layout-escolar.scss',
})
export class LayoutEscolar {
  @Input() administrativo = false;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  sair(): void {
    this.auth.sair();
    void this.router.navigateByUrl('/admin', { replaceUrl: true });
  }
}
