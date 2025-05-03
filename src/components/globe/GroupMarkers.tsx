'use client';

import { Entity } from 'resium';
import * as Cesium from 'cesium';

interface Group {
  id: string;
  name: string;
  geo_location: {
    coordinates: [number, number];
  };
  city?: string;
  state?: string;
}

interface GroupMarkersProps {
  groups: Group[];
  selectedGroupId?: string;
  onGroupSelect?: (group: Group) => void;
}

const GroupMarkers: React.FC<GroupMarkersProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
}) => {
  return (
    <>
      {groups.map((group) => {
        const [lng, lat] = group.geo_location.coordinates;
        const position = Cesium.Cartesian3.fromDegrees(lng, lat);
        const isSelected = selectedGroupId === group.id;

        return (
          <Entity
            key={group.id}
            position={position}
            point={{
              pixelSize: isSelected ? 12 : 8,
              color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            label={{
              text: group.name,
              font: '14px sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              show: true,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            onClick={() => onGroupSelect?.(group)}
          />
        );
      })}
    </>
  );
};

export default GroupMarkers;
