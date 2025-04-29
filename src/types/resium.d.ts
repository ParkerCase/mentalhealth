declare module 'resium' {
    import * as React from 'react';
    import * as Cesium from 'cesium';
    
    export interface ViewerProps {
      full?: boolean;
      animation?: boolean;
      baseLayerPicker?: boolean;
      fullscreenButton?: boolean;
      vrButton?: boolean;
      geocoder?: boolean;
      homeButton?: boolean;
      infoBox?: boolean;
      sceneModePicker?: boolean;
      selectionIndicator?: boolean;
      timeline?: boolean;
      navigationHelpButton?: boolean;
      navigationInstructionsInitiallyVisible?: boolean;
      scene3DOnly?: boolean;
      shouldAnimate?: boolean;
      terrainProvider?: Cesium.TerrainProvider;
      terrainShadows?: Cesium.ShadowMode;
      clockViewModel?: Cesium.ClockViewModel;
      selectedImageryProviderViewModel?: Cesium.ProviderViewModel;
      imageryProviderViewModels?: Cesium.ProviderViewModel[];
      selectedTerrainProviderViewModel?: Cesium.ProviderViewModel;
      terrainProviderViewModels?: Cesium.ProviderViewModel[];
      imageryProvider?: Cesium.ImageryProvider | false;
      skyBox?: Cesium.SkyBox | false;
      skyAtmosphere?: Cesium.SkyAtmosphere | false;
      fullscreenElement?: Element | string;
      useDefaultRenderLoop?: boolean;
      targetFrameRate?: number;
      showRenderLoopErrors?: boolean;
      automaticallyTrackDataSourceClocks?: boolean;
      contextOptions?: WebGLContextAttributes;
      sceneMode?: Cesium.SceneMode;
      mapProjection?: Cesium.MapProjection;
      globe?: Cesium.Globe | false;
      orderIndependentTranslucency?: boolean;
      creditContainer?: Element | string;
      creditViewport?: Element | string;
      dataSources?: Cesium.DataSourceCollection;
      terrainExaggeration?: number;
      shadows?: boolean;
      mapMode2D?: Cesium.MapMode2D;
      projectionPicker?: boolean;
      requestRenderMode?: boolean;
      maximumRenderTimeChange?: number;
      style?: React.CSSProperties;
      className?: string;
      ref?: React.Ref<any>;
      children?: React.ReactNode;
    }
    
    export interface GlobeProps {
      enableLighting?: boolean;
      showGroundAtmosphere?: boolean;
      depthTestAgainstTerrain?: boolean;
      maximumScreenSpaceError?: number;
      tileCacheSize?: number;
    }
    
    export interface EntityProps {
      id?: string;
      name?: string;
      availability?: Cesium.TimeIntervalCollection;
      show?: boolean;
      description?: Cesium.CallbackProperty | string;
      position?: Cesium.Cartesian3 | Cesium.CallbackProperty;
      orientation?: Cesium.Quaternion | Cesium.CallbackProperty;
      viewFrom?: Cesium.Cartesian3 | Cesium.CallbackProperty;
      parent?: Cesium.Entity;
      billboard?: Cesium.BillboardGraphics | Cesium.BillboardGraphicsOptions;
      box?: Cesium.BoxGraphics | Cesium.BoxGraphicsOptions;
      corridor?: Cesium.CorridorGraphics | Cesium.CorridorGraphicsOptions;
      cylinder?: Cesium.CylinderGraphics | Cesium.CylinderGraphicsOptions;
      ellipse?: Cesium.EllipseGraphics | Cesium.EllipseGraphicsOptions;
      ellipsoid?: Cesium.EllipsoidGraphics | Cesium.EllipsoidGraphicsOptions;
      label?: Cesium.LabelGraphics | Cesium.LabelGraphicsOptions;
      model?: Cesium.ModelGraphics | Cesium.ModelGraphicsOptions;
      path?: Cesium.PathGraphics | Cesium.PathGraphicsOptions;
      plane?: Cesium.PlaneGraphics | Cesium.PlaneGraphicsOptions;
      point?: Cesium.PointGraphics | Cesium.PointGraphicsOptions;
      polygon?: Cesium.PolygonGraphics | Cesium.PolygonGraphicsOptions;
      polyline?: Cesium.PolylineGraphics | Cesium.PolylineGraphicsOptions;
      polylineVolume?: Cesium.PolylineVolumeGraphics | Cesium.PolylineVolumeGraphicsOptions;
      rectangle?: Cesium.RectangleGraphics | Cesium.RectangleGraphicsOptions;
      wall?: Cesium.WallGraphics | Cesium.WallGraphicsOptions;
      onClick?: (event: {
        id: string;
        position: Cesium.Cartesian3;
        entityId?: string;
        pickEntity?: Cesium.Entity;
      }) => void;
      tracked?: boolean;
      children?: React.ReactNode;
    }
    
    export interface EllipseGraphicsProps {
      semiMajorAxis: number;
      semiMinorAxis: number;
      height?: number;
      heightReference?: Cesium.HeightReference;
      extrudedHeight?: number;
      extrudedHeightReference?: Cesium.HeightReference;
      rotation?: number;
      stRotation?: number;
      granularity?: number;
      fill?: boolean;
      material?: Cesium.MaterialProperty | Cesium.Color | Cesium.ColorConstructorOptions | Cesium.ImageMaterialProperty | Cesium.MaterialPropertyOptions;
      outline?: boolean;
      outlineColor?: Cesium.Color;
      outlineWidth?: number;
      numberOfVerticalLines?: number;
      shadows?: Cesium.ShadowMode;
      distanceDisplayCondition?: Cesium.DistanceDisplayCondition;
      classificationType?: Cesium.ClassificationType;
      zIndex?: number;
    }
    
    export interface ImageryLayerProps {
      imageryProvider: Cesium.ImageryProvider;
      show?: boolean;
      alpha?: number;
      nightAlpha?: number;
      dayAlpha?: number;
      brightness?: number;
      contrast?: number;
      hue?: number;
      saturation?: number;
      gamma?: number;
      splitDirection?: Cesium.SplitDirection;
      minificationFilter?: Cesium.TextureMinificationFilter;
      magnificationFilter?: Cesium.TextureMagnificationFilter;
      cutoutRectangle?: Cesium.Rectangle;
      colorToAlpha?: Cesium.Color;
      colorToAlphaThreshold?: number;
    }
    
    export interface CesiumComponentRef<T> {
      cesiumElement: T;
    }
  
    export type Viewer = React.ForwardRefExoticComponent<ViewerProps & React.RefAttributes<CesiumComponentRef<Cesium.Viewer>>>;
    export const Viewer: Viewer;
    
    export const Globe: React.FC<GlobeProps>;
    export const Entity: React.FC<EntityProps>;
    export const EllipseGraphics: React.FC<EllipseGraphicsProps>;
    export const ImageryLayer: React.FC<ImageryLayerProps>;
    export const CameraFlyTo: React.FC<any>;
    export const PolylineGraphics: React.FC<any>;
    export const BillboardGraphics: React.FC<any>;
    export const LabelGraphics: React.FC<any>;
    
    export function useCesium(): { 
      viewer: Cesium.Viewer | undefined; 
      scene: Cesium.Scene | undefined; 
      camera: Cesium.Camera | undefined;
      globe: Cesium.Globe | undefined;
    };
  }