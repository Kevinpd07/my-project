import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class Sound {
  private isBrowser = false;
  private sounds: Record<string, HTMLAudioElement> = {
    // eat: new Audio('assets/sounds/eat.wav'),
    // gameOver: new Audio('assets/sounds/game-over.wav'),
    // start: new Audio('assets/sounds/start.wav'),
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initSounds();
    }
  }

  private initSounds(): void {
    this.sounds = {
      eat: new Audio('assets/sounds/eat.wav'),
      gameOver: new Audio('assets/sounds/game-over.wav'),
      start: new Audio('assets/sounds/start.wav'),
    };

    Object.values(this.sounds).forEach((sound) => {
      sound.load();
      sound.volume = 0.5;
    });
  }

  play(name: keyof typeof this.sounds): void {
    if (!this.isBrowser) return;

    const sound = this.sounds[name];
    if (!sound) return;

    sound.currentTime = 0;
    sound.play().catch(() => {
      // Manejar el error si la reproducción falla (por ejemplo, debido a restricciones del navegador)
      console.warn(`No se pudo reproducir el sonido: ${name}`);
    });
  }
}
