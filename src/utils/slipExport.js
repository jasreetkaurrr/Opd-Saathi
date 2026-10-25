import QRCode from 'qrcode';

/**
 * Generate a 2D boolean matrix for a QR code so we can render crisp inline SVG or draw on Canvas.
 */
export function getQrMatrix(value) {
  try {
    const qr = QRCode.create(value || 'OPD-SAATHI', { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const rows = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(Boolean(data[r * size + c]));
      }
      rows.push(row);
    }
    return { size, rows };
  } catch {
    return { size: 0, rows: [] };
  }
}

/**
 * Export the OPD Slip as a crisp PNG image download (shows strictly token, first name, department,
 * room/floor, doctor, wait info, and QR code — never phone/age/gender/ID).
 */
export function downloadSlipAsPng({
  hospitalName,
  slipHeader,
  token,
  firstName,
  departmentName,
  roomText,
  floorText,
  doctorName,
  opdHours,
  aheadText,
  waitText,
  qrUrl,
  qrCaption,
  labels = {},
}) {
  const canvas = document.createElement('canvas');
  const W = 880;
  const H = 1180;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Warm paper background
  ctx.fillStyle = '#FAF7F0';
  ctx.fillRect(0, 0, W, H);

  // Outer card with warm stone border
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0B5D51';
  ctx.lineWidth = 6;
  ctx.fillRect(36, 36, W - 72, H - 72);
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Header band
  ctx.fillStyle = '#0B5D51';
  ctx.fillRect(36, 36, W - 72, 136);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hospitalName, W / 2, 95);

  ctx.fillStyle = '#CFECE6';
  ctx.font = '600 22px sans-serif';
  ctx.fillText(slipHeader, W / 2, 140);

  // Token Box
  ctx.fillStyle = '#E6F4F1';
  ctx.strokeStyle = '#0B5D51';
  ctx.lineWidth = 3;
  ctx.fillRect(80, 205, W - 160, 165);
  ctx.strokeRect(80, 205, W - 160, 165);

  ctx.fillStyle = '#0B5D51';
  ctx.font = 'bold 84px monospace';
  ctx.fillText(token, W / 2, 315);

  // Details rows (Strictly First Name, Department, Room & Floor, Doctor, Wait)
  ctx.textAlign = 'left';
  const rows = [
    [labels.firstName || 'First Name', firstName],
    [labels.department || 'Department', departmentName],
    [labels.roomFloor || 'Where to Go', `${roomText} • ${floorText}`],
    [labels.doctor || 'Doctor', `${doctorName} (${opdHours})`],
    [labels.queueStatus || 'Queue Status', `${aheadText} • ${waitText}`],
  ];

  let y = 435;
  for (const [label, val] of rows) {
    ctx.fillStyle = '#4B5E58';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(label, 90, y);

    ctx.fillStyle = '#14201D';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(String(val || '').slice(0, 44), 90, y + 36);

    ctx.strokeStyle = '#E4DDD0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, y + 54);
    ctx.lineTo(W - 90, y + 54);
    ctx.stroke();

    y += 88;
  }

  // Draw QR Code centered at bottom
  const { size, rows: qrRows } = getQrMatrix(qrUrl);
  if (size > 0) {
    const qrPixelSize = 200;
    const cell = qrPixelSize / size;
    const startX = (W - qrPixelSize) / 2;
    const startY = 890;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(startX - 12, startY - 12, qrPixelSize + 24, qrPixelSize + 24);
    ctx.strokeStyle = '#D5CCBA';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX - 12, startY - 12, qrPixelSize + 24, qrPixelSize + 24);

    ctx.fillStyle = '#14201D';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qrRows[r][c]) {
          ctx.fillRect(startX + c * cell, startY + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }

    ctx.fillStyle = '#3D4F4A';
    ctx.font = '500 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(qrCaption, W / 2, 1122);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `OPD-Slip-${token}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
