import { AfterViewInit, Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Sound } from '../sound';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Point {
  x: number;
  y: number;
}

enum GameState {
  START,
  COUNTDOWN,
  PLAYING,
  GAME_OVER,
}

@Component({
  selector: 'app-snake-game',
  templateUrl: './snake-game.html',
  styleUrls: ['./snake-game.css'],
})
export class SnakeGameComponent implements AfterViewInit {
  @ViewChild('gameCanvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private isBrowser = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sound: Sound,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  highScore = 0;

  private loadHighScore(): void {
    if (!this.isBrowser) return;

    const stored = localStorage.getItem('snake-high-score');
    this.highScore = stored ? Number(stored) : 0;
  }

  ngOnInit(): void {
    this.loadHighScore();
  }

  private gameOver(): void {
    this.sound.play('gameOver');

    if (this.score > this.highScore && this.isBrowser) {
      this.highScore = this.score;
      localStorage.setItem('snake-high-score', this.highScore.toString());
    }

    this.ctx?.clearRect(0, 0, 400, 400);
    this.state = GameState.GAME_OVER;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d')!;
  }

  private readonly gridSize = 20;
  private readonly tileCount = 20;

  snake: Point[] = [];
  direction: Point = { x: 1, y: 0 };
  food: Point = { x: 5, y: 5 };

  private readonly initialSpeed = 140; // velocidad inicial en ms
  private readonly minSpeed = 60; // velocidad mínima en ms
  private readonly speedStep = 5; // incremento de velocidad por comidaen ms

  score = 0;
  // Velocidad actual del juego
  speed = this.initialSpeed;
  private lastTime = 0;

  resetGame(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.spawnFood();
    this.score = 0;
    this.speed = this.initialSpeed;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  gameLoop = (time: number) => {
    if (this.state !== GameState.PLAYING) return;

    if (time - this.lastTime > this.speed) {
      this.update();
      this.draw();
      this.lastTime = time;
    }
    requestAnimationFrame(this.gameLoop);
  };

  update(): void {
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    // Colisiones con paredes
    if (head.x < 0 || head.y < 0 || head.x >= this.tileCount || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Mover serpiente
    this.snake.unshift(head);

    // Comprobar si comió comida
    const ateFood = head.x === this.food.x && head.y === this.food.y;

    // Comer comida
    if (ateFood) {
      this.score++;
      this.spawnFood();
      this.sound.play('eat');

      // Aumentar velocidad
      if (this.speed > this.minSpeed) {
        this.speed -= this.speedStep;
      }
    } else {
      this.snake.pop();
    }

    // Colisiones con sí misma
    for (let i = 1; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        this.gameOver();
        return;
      }
    }
  }

  draw(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, 400, 400);

    // Comida
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillRect(
      this.food.x * this.gridSize,
      this.food.y * this.gridSize,
      this.gridSize,
      this.gridSize
    );

    // Serpiente
    this.ctx.fillStyle = '#22c55e';
    for (const part of this.snake) {
      this.ctx.fillRect(
        part.x * this.gridSize,
        part.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    }
  }

  spawnFood(): void {
    this.food = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount),
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.state === GameState.START || this.state === GameState.GAME_OVER) {
        this.startGame();
      }
      return;
    }

    if (this.state !== GameState.PLAYING) return;

    switch (event.key) {
      case 'ArrowUp':
        if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
        break;
    }
  }

  state = GameState.START;
  GameState = GameState;

  countdown = 3;
  private countdownInterval?: number;

  startGame(): void {
    this.sound.play('start');

    this.resetGame();
    this.state = GameState.COUNTDOWN;
    this.countdown = 3;

    setTimeout(() => {
      this.initCanvas();
      this.startCountdown();
    });
  }

  private startCountdown(): void {
    this.countdownInterval = window.setInterval(() => {
      this.countdown--;

      this.cdr.detectChanges();

      if (this.countdown === 0) {
        clearInterval(this.countdownInterval);
        this.state = GameState.PLAYING;
        this.lastTime = 0;
        this.cdr.detectChanges();
        requestAnimationFrame(this.gameLoop);
      }
    }, 1000);
  }
}
