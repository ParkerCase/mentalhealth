declare module 'resium' {
    import * as React from 'react';
    import * as Cesium from 'cesium';
    
    export const Viewer: React.FC<any>;
    export const Globe: React.FC<any>;
    export const Entity: React.FC<any>;
    export const EllipseGraphics: React.FC<any>;
    export const ImageryLayer: React.FC<any>;
    
    export function useCesium(): { viewer: Cesium.Viewer | undefined; scene: Cesium.Scene | undefined; };
  }