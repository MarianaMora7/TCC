import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BotaoAcessibilidade } from '../compartilhados/botao-acessibilidade/botao-acessibilidade';

@Component({
  imports: [RouterLink, RouterLinkActive, BotaoAcessibilidade],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
}
