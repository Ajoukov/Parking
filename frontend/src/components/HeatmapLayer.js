// src/components/HeatmapLayer.js
import React from 'react';
import { HeatmapLayer } from '@react-google-maps/api';

const Heatmap = ({ data }) => {
  return <HeatmapLayer data={data} />;
};

export default Heatmap;
