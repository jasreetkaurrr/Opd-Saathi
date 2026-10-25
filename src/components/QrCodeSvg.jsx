import React, { useMemo } from 'react';
import { getQrMatrix } from '../utils/slipExport.js';

export function QrCodeSvg({ value, size = 168, label = 'QR Code' }) {
  const { size: matrixSize, rows } = useMemo(() => getQrMatrix(value), [value]);

  if (!matrixSize) return null;
  const quietZone = 2;
  const total = matrixSize + quietZone * 2;

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className="bg-white rounded-xl border-2 border-paper-border p-1 shadow-sm"
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#FFFFFF" />
      {rows.map((row, rIdx) =>
        row.map((dark, cIdx) =>
          dark ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + quietZone}
              y={rIdx + quietZone}
              width="1"
              height="1"
              fill="#14201D"
            />
          ) : null
        )
      )}
    </svg>
  );
}
