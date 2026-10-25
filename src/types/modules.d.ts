declare module 'three';
declare module '@mkkellogg/gaussian-splats-3d' {
  export class Viewer {
    [key: string]: any;
    constructor(options?: any);
    addSplatScene(url: string, options?: any): Promise<any>;
    dispose(): void;
  }
}

interface Window {
  HumanAPI?: any;
}
