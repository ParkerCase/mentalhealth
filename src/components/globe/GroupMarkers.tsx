'use client';

import React from 'react';
import { Entity } from 'resium';
import * as Cesium from 'cesium';

interface Group {
  id: string;
  name: string;
  geo_location: {
    type?: string;
    coordinates: number[] | [number, number]; // More flexible: accepts both array and tuple
  };
  city?: string;
  state?: string;
  description?: string;
}

interface GroupMarkersProps {
  groups: Group[];
  selectedGroupId?: string;
  onGroupSelect?: (group: Group) => void;
  markerType?: 'pin' | 'dot' | 'pulse';
  defaultMarkerColor?: Cesium.Color;
  selectedMarkerColor?: Cesium.Color;
  labelScale?: number;
  alwaysShowLabels?: boolean;
}

/**
 * GroupMarkers - Renders a collection of markers representing group locations
 */
const GroupMarkers: React.FC<GroupMarkersProps> = ({
  groups = [],
  selectedGroupId,
  onGroupSelect,
  markerType = 'pulse',
  defaultMarkerColor = Cesium.Color.CYAN,
  selectedMarkerColor = Cesium.Color.YELLOW,
  labelScale = 1.0,
  alwaysShowLabels = false
}) => {
  // Skip if no groups provided
  if (!groups.length) return null;
  
  return (
    <>
      {groups.map(group => {
        // Skip groups without valid coordinates
        if (!group.geo_location?.coordinates || group.geo_location.coordinates.length < 2) return null;
        
        // Safely extract longitude and latitude regardless of array type
        const lng = group.geo_location.coordinates[0];
        const lat = group.geo_location.coordinates[1];
        const isSelected = selectedGroupId === group.id;
        const location = Cesium.Cartesian3.fromDegrees(lng, lat);
        
        // Configure marker appearance based on type and selection state
        let pointOptions: Cesium.PointGraphics.ConstructorOptions;
        
        switch (markerType) {
          case 'pin':
            // Larger, more prominent pin style
            pointOptions = {
              pixelSize: isSelected ? 16 : 12,
              color: isSelected ? selectedMarkerColor : defaultMarkerColor,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.5, 1.5e8, 0.5),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            };
            break;
            
          case 'pulse':
            // Pulsing effect with translucent color
            pointOptions = {
              pixelSize: isSelected ? 15 : 10,
              color: isSelected 
                ? selectedMarkerColor.withAlpha(0.8) 
                : defaultMarkerColor.withAlpha(0.8),
              outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
              outlineWidth: 3,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            };
            break;
            
          case 'dot':
          default:
            // Simple dot style
            pointOptions = {
              pixelSize: isSelected ? 10 : 6,
              color: isSelected ? selectedMarkerColor : defaultMarkerColor,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            };
            break;
        }
        
        // Configure label options
        const labelOptions: Cesium.LabelGraphics.ConstructorOptions = {
          text: group.name,
          font: `${14 * labelScale}px sans-serif`,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK,
          fillColor: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          show: isSelected || alwaysShowLabels,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scale: labelScale,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          // Show label farther away if selected
          scaleByDistance: isSelected 
            ? new Cesium.NearFarScalar(1.5e6, 1.0, 1.5e8, 0.5) 
            : new Cesium.NearFarScalar(1.5e6, 1.0, 1.5e7, 0.3)
        };

        return (
          <Entity
            key={group.id}
            name={group.name}
            position={location}
            description={group.description || `${group.city}, ${group.state}`}
            point={pointOptions}
            label={labelOptions}
            onClick={() => onGroupSelect?.(group)}
          />
        );
      })}
    </>
  );
};

export default GroupMarkers;