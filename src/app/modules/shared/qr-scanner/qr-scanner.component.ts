// cspell:disable
import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  signal,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';

@Component({
  selector: 'app-qr-scanner',
  imports: [],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css',
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerOverlay', { static: false }) scannerOverlay!: ElementRef;
  @Output() qrDetected = new EventEmitter<string>();

  isScanning = signal(true);
  videoDevices = signal<MediaDeviceInfo[]>([]);
  selectedDeviceId = signal<string | null>(null);

  private hints = new Map<DecodeHintType, any>([
    [DecodeHintType.TRY_HARDER, true],
  ]);

  private codeReader = new BrowserQRCodeReader(this.hints, {
    delayBetweenScanAttempts: 50,
    delayBetweenScanSuccess: 500,
  });

  private controls: IScannerControls | null = null;
  scannedCode: string | null = null;

  async ngAfterViewInit() {
    await this.initScanner();
  }

  async initScanner() {
    try {
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const videoDevs = devices.filter(
        (device) => device.kind === 'videoinput' && device.deviceId && device.deviceId !== ''
      );
      this.videoDevices.set(videoDevs);

      if (videoDevs.length > 0) {
        // Preferir cámara trasera / posterior
        const backCam = videoDevs.find(
          (d) =>
            d.label &&
            (d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('trasera') ||
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('posterior'))
        );
        if (backCam && backCam.deviceId) {
          this.selectedDeviceId.set(backCam.deviceId);
        } else if (videoDevs[0].deviceId) {
          this.selectedDeviceId.set(videoDevs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('No se pudieron listar dispositivos iniciales:', e);
    }
    await this.startCamera();
  }

  async startCamera() {
    try {
      if (this.controls) {
        this.controls.stop();
        this.controls = null;
      }

      this.isScanning.set(true);

      if (this.scannerOverlay && this.scannerOverlay.nativeElement) {
        this.scannerOverlay.nativeElement.classList.remove('success');
      }

      if (!this.videoElement || !this.videoElement.nativeElement) {
        return;
      }

      const videoElem = this.videoElement.nativeElement;
      const deviceId =
        this.selectedDeviceId() && this.selectedDeviceId()!.trim() !== ''
          ? this.selectedDeviceId()!
          : undefined;

      try {
        this.controls = await this.codeReader.decodeFromVideoDevice(
          deviceId,
          videoElem,
          (result, err) => {
            if (result && this.isScanning()) {
              this.onQrDetected(result.getText());
            }
          }
        );
      } catch (errDevice) {
        console.warn('Fallo al iniciar con deviceId específico, usando cámara por defecto:', errDevice);
        // Fallback a cualquier cámara disponible
        this.controls = await this.codeReader.decodeFromVideoDevice(
          undefined,
          videoElem,
          (result, err) => {
            if (result && this.isScanning()) {
              this.onQrDetected(result.getText());
            }
          }
        );
      }

      // Una vez activa la cámara con permisos, refrescamos los dispositivos si faltaban labels
      try {
        const refreshedDevices = await BrowserQRCodeReader.listVideoInputDevices();
        const videoDevs = refreshedDevices.filter(
          (device) => device.kind === 'videoinput' && device.deviceId && device.deviceId !== ''
        );
        if (videoDevs.length > 0) {
          this.videoDevices.set(videoDevs);
        }
      } catch (e) {
        // Ignorar
      }
    } catch (error) {
      console.error('Error al acceder a la cámara o iniciar escáner:', error);
    }
  }

  onQrDetected = (codeText: string) => {
    if (!this.isScanning()) return;
    this.isScanning.set(false);

    if (this.scannerOverlay && this.scannerOverlay.nativeElement) {
      this.scannerOverlay.nativeElement.classList.add('success');
    }

    this.playBeep();

    if (this.controls) {
      this.controls.stop();
      this.controls = null;
    }

    setTimeout(() => {
      this.scannedCode = codeText;
      if (this.scannedCode) {
        this.qrDetected.emit(this.scannedCode);
      }
    }, 150);
  };

  playBeep() {
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
  }

  async onCameraChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement.value) {
      this.selectedDeviceId.set(selectElement.value);
      await this.startCamera();
    }
  }

  ngOnDestroy() {
    this.isScanning.set(false);
    if (this.controls) {
      this.controls.stop();
      this.controls = null;
    }
  }
}
