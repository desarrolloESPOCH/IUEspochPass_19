// cspell:disable
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  signal,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { BrowserMultiFormatReader } from '@zxing/browser';

@Component({
    selector: 'app-qr-scanner',
    imports: [],
    templateUrl: './qr-scanner.component.html',
    styleUrl: './qr-scanner.component.css'
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerOverlay', { static: false }) scannerOverlay!: ElementRef;
  @Output() qrDetected = new EventEmitter<string>();

  isScanning = signal(true);
  videoDevices = signal<MediaDeviceInfo[]>([]);
  selectedDeviceId = signal<string | null>(null);
  
  private codeReader = new BrowserMultiFormatReader();
  private stream: MediaStream | null = null;
  scannedCode: string | null = null;

  async ngOnInit() {
    await this.initScanner();
  }

  async initScanner() {
    try {
      // Intentamos listar las cámaras disponibles.
      // Primero solicitamos permiso básico para que aparezcan las etiquetas/labels.
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(async (tempStream) => {
          // Paramos el stream temporal de inmediato para no dejar la cámara encendida
          tempStream.getTracks().forEach(track => track.stop());
          
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter(device => device.kind === 'videoinput');
          this.videoDevices.set(videoDevs);

          if (videoDevs.length > 0) {
            // Preferir cámara trasera por defecto
            const backCam = videoDevs.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('trasera') ||
              d.label.toLowerCase().includes('environment')
            );
            this.selectedDeviceId.set(backCam ? backCam.deviceId : videoDevs[0].deviceId);
          }
        })
        .catch(err => {
          console.warn('Permiso denegado inicialmente o error al listar:', err);
        });

      await this.startCamera();
    } catch (error) {
      console.error('Error durante la inicialización del escáner:', error);
    }
  }

  async startCamera() {
    try {
      // Si ya hay un stream activo, lo detenemos antes de iniciar uno nuevo
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: this.selectedDeviceId()
          ? { deviceId: { exact: this.selectedDeviceId()! } }
          : { facingMode: 'environment' },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement && this.videoElement.nativeElement) {
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
        if (result && this.isScanning()) {
          this.onQrDetected(result);
        }
      }
    );
  }

  onQrDetected = (result: any) => {
    this.isScanning.set(false);
    if (this.scannerOverlay && this.scannerOverlay.nativeElement) {
      this.scannerOverlay.nativeElement.classList.add('success');
    }
    
    // Generar un beep sin archivos
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.warn('No se pudo reproducir el beep:', e);
    }

    setTimeout(() => {
      this.scannedCode = result.getText();
      if (this.scannedCode) {
        this.qrDetected.emit(this.scannedCode);
      }
    }, 500);
  };

  async onCameraChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement.value) {
      this.selectedDeviceId.set(selectElement.value);
      await this.startCamera();
    }
  }

  ngOnDestroy() {
    this.isScanning.set(false);
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }
}
