// cspell:disable
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { BrowserMultiFormatReader } from '@zxing/browser';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css',
})
export class QrScannerComponent {
  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerOverlay', { static: false }) scannerOverlay!: ElementRef;
  @Output() qrDetected = new EventEmitter<string>();

  isScanning = signal(true);
  private codeReader = new BrowserMultiFormatReader();
  private stream: MediaStream | null = null;
  scannedCode: string | null = null;

  ngOnInit() {
    this.startCamera();
  }
  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.decodeQR();
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  }

  decodeQR() {
    this.codeReader.decodeFromVideoElement(
      this.videoElement.nativeElement,
      (result, err) => {
        if (result) {
          this.onQrDetected(result);
        }
      }
    );
  }

  onQrDetected = (result: any) => {
    this.scannerOverlay.nativeElement.classList.add('success');
    // Generar un beep sin archivos
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square'; // Tipo de sonido (puedes probar con 'square', 'sawtooth', etc.)
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Frecuencia en Hz (1000 = beep típico)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volumen

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // Duración de 100ms
    setTimeout(() => {
      this.scannedCode = result.getText();
      if (this.scannedCode) this.qrDetected.emit(this.scannedCode);
    }, 500);
    if (!this.isScanning()) return;
  };

  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }
}
