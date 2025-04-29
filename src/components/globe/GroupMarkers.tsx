'use client';

import { useMemo } from 'react';
import { Entity } from 'resium';
import * as Cesium from 'cesium';

interface Group {
  id: string;
  name: string;
  description?: string;
  geo_location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  city?: string;
  state?: string;
  // Other properties from your app's Group type
}

interface GroupMarkersProps {
  groups: Group[];
  selectedGroupId?: string;
  onGroupSelect?: (group: Group) => void;
  markerType?: 'pin' | 'dot' | 'pulse';
  clusterMarkers?: boolean;
  colorByCategory?: boolean;
  categorySeed?: string; // Used for consistent coloring
}

/**
 * Displays group markers on the globe with various styling options
 */
const GroupMarkers: React.FC<GroupMarkersProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  markerType = 'pin',
  clusterMarkers = false,
  colorByCategory = false,
  categorySeed = 'default'
}) => {
  // Generate colors based on categories if enabled
  const groupColors = useMemo(() => {
    const colorMap = new Map<string, Cesium.Color>();
    
    // Predefined colors for consistent appearance
    const colors = [
      Cesium.Color.BLUE,
      Cesium.Color.GREEN,
      Cesium.Color.RED,
      Cesium.Color.YELLOW,
      Cesium.Color.CYAN,
      Cesium.Color.MAGENTA,
      Cesium.Color.ORANGE,
      Cesium.Color.PURPLE
    ];
    
    groups.forEach((group) => {
      // Use state as category for coloring (or any other property you prefer)
      const category = group.state || 'default';
      
      if (!colorMap.has(category)) {
        // Deterministically assign color based on category and seed
        const hash = (categorySeed + category).split('').reduce(
          (acc, char) => (acc * 31 + char.charCodeAt(0)) & 0xFFFFFFFF, 0
        );
        const colorIndex = hash % colors.length;
        colorMap.set(category, colors[colorIndex]);
      }
    });
    
    return colorMap;
  }, [groups, categorySeed]);
  
  // Get color for a group
  const getGroupColor = (group: Group): Cesium.Color => {
    if (colorByCategory && group.state) {
      return groupColors.get(group.state) || Cesium.Color.BLUE;
    }
    
    // Default color if no category or category coloring disabled
    return Cesium.Color.fromCssColorString('#3b82f6'); // Tailwind blue-500
  };
  
  // Create entity for pulse effect - simplified version
  const createPulseEntity = (group: Group, position: Cesium.Cartesian3) => {
    const isSelected = selectedGroupId === group.id;
    const color = getGroupColor(group);
    
    // Static version that doesn't use CallbackProperty
    return (
      <Entity
        key={`pulse-${group.id}`}
        position={position}
        ellipse={{
          semiMajorAxis: isSelected ? 50000 : 30000,
          semiMinorAxis: isSelected ? 50000 : 30000,
          material: color.withAlpha(0.3),
          height: 0,
          outline: true,
          outlineColor: color,
          outlineWidth: isSelected ? 2 : 1
        }}
      />
    );
  };
  
  // Create marker entities based on markerType
  const createMarkerEntities = () => {
    return groups.map(group => {
      // Get position from geo_location or generate a random one
      const longitude = group.geo_location?.coordinates?.[0] || 
        (-98.5795 + (Math.random() - 0.5) * 40);
      const latitude = group.geo_location?.coordinates?.[1] || 
        (39.8283 + (Math.random() - 0.5) * 30);
      
      const position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
      const isSelected = selectedGroupId === group.id;
      const color = getGroupColor(group);
      
      // Handle different marker types
      switch (markerType) {
        case 'pin':
          return (
            <Entity
              key={`marker-${group.id}`}
              position={position}
              billboard={{
                image: isSelected 
                  ? '/assets/pin-blue.png' 
                  : '/assets/pin-red.png',
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: isSelected ? 0.5 : 0.4,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              label={{
                text: group.name,
                font: '14px sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -32),
                show: isSelected,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              onClick={() => onGroupSelect && onGroupSelect(group)}
            />
          );
          
        case 'pulse':
          return [
            // Base marker point
            <Entity 
              key={`marker-${group.id}`}
              position={position}
              point={{
                pixelSize: isSelected ? 12 : 8,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              label={{
                text: group.name,
                font: '14px sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                show: isSelected,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              onClick={() => onGroupSelect && onGroupSelect(group)}
            />,
            // Pulsing effect
            createPulseEntity(group, position)
          ];
          
        case 'dot':
        default:
          return (
            <Entity 
              key={`marker-${group.id}`}
              position={position}
              point={{
                pixelSize: isSelected ? 14 : 10,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: isSelected ? 3 : 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              label={{
                text: group.name,
                font: '14px sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10),
                show: isSelected,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              }}
              onClick={() => onGroupSelect && onGroupSelect(group)}
            />
          );
      }
    }).flat(); // Flatten array to handle pulse case returning multiple entities
  };
  
  return <>{createMarkerEntities()}</>;
};

export default GroupMarkers;