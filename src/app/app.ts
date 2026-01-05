import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnakeGameComponent } from './game/snake-game/snake-game';

@Component({
  selector: 'app-root',
  imports: [SnakeGameComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('my-project');
}
