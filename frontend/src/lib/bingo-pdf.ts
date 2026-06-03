/**
 * Client-side PDF generation for printing a player's bingo card.
 *
 * Produces an 8.5" x 11" (US Letter) GRAYSCALE PDF suitable for home printing.
 * The PDF is drawn with native jsPDF primitives (no html2canvas), which keeps
 * text crisp, the file small, and the output reliably grayscale.
 */
import { jsPDF } from 'jspdf';
import type { CardData } from './game-utils';

const HEADER_LETTERS = ['GR', '8', 'D', 'A', 'Y'];

/**
 * Generate and download a grayscale, printer-friendly PDF of the given card.
 *
 * @param card - The player's current CardData (5x5 grid).
 * @param opts - Optional display hints (player name, win condition label).
 */
export function downloadBingoCardPdf(
  card: CardData,
  opts: { playerName?: string; winConditionLabel?: string } = {},
): void {
  // US Letter in inches.
  const doc = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
  const pageW = 8.5;
  const pageH = 11;

  // Force grayscale rendering throughout. We use only black/white/gray values
  // for strokes and fills so the output is naturally grayscale.
  const BLACK = 0;
  const DARK_GRAY = 70; // 0-255
  const MID_GRAY = 140;
  const LIGHT_GRAY = 220;
  const NEAR_WHITE = 245;

  // ---------- Title / header band ----------
  doc.setFillColor(BLACK);
  doc.rect(0, 0, pageW, 0.9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Gr8Day Bingo', pageW / 2, 0.55, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Gr8Day Deeds Bingo — Print & Play', pageW / 2, 0.78, { align: 'center' });

  // ---------- Player info row ----------
  doc.setTextColor(BLACK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const playerLabel = opts.playerName ? `Player: ${opts.playerName}` : 'Player: _______________________';
  doc.text(playerLabel, 0.6, 1.2);
  doc.text(`Date: ${today}`, pageW - 0.6, 1.2, { align: 'right' });

  if (opts.winConditionLabel) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Win Condition: ${opts.winConditionLabel}`, pageW / 2, 1.45, { align: 'center' });
  }

  // ---------- Grid layout (5x5, square cells) ----------
  const gridLeft = 0.5;
  const gridTop = 1.8;
  const gridSize = 7.5; // 7.5" wide => leaves 0.5" margin on each side
  const cellSize = gridSize / 5;
  const headerH = 0.55;

  // Header row (GR / 8 / D / A / Y)
  for (let i = 0; i < 5; i += 1) {
    const x = gridLeft + i * cellSize;
    doc.setFillColor(BLACK);
    doc.rect(x, gridTop, cellSize, headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(HEADER_LETTERS[i], x + cellSize / 2, gridTop + headerH / 2 + 0.12, {
      align: 'center',
    });
  }

  // Body cells (25 total)
  doc.setDrawColor(BLACK);
  doc.setLineWidth(0.02);
  const bodyTop = gridTop + headerH;

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const idx = row * 5 + col;
      const x = gridLeft + col * cellSize;
      const y = bodyTop + row * cellSize;

      // Find the cell data (cells come from backend keyed by `index`).
      const cell = card.cells.find((c) => c.index === idx);
      const isPurchased = card.purchased_cells?.includes(idx);
      const isReferral = card.referral_cells?.includes(idx);
      const isFree = !!cell?.is_free;
      // A square counts as achieved (shaded + X) if it is marked complete,
      // purchased, or earned via referral — matching how the live board shows it.
      const isCompleted =
        card.completed_cells?.includes(idx) || isPurchased || isReferral;

      // Background shading — all grayscale.
      if (isCompleted) {
        doc.setFillColor(MID_GRAY);
        doc.rect(x, y, cellSize, cellSize, 'F');
      } else if (isFree) {
        doc.setFillColor(LIGHT_GRAY);
        doc.rect(x, y, cellSize, cellSize, 'F');
      } else {
        doc.setFillColor(NEAR_WHITE);
        doc.rect(x, y, cellSize, cellSize, 'F');
      }

      // Cell border.
      doc.setDrawColor(BLACK);
      doc.rect(x, y, cellSize, cellSize, 'S');

      // Cell text.
      const padding = 0.08;
      const textX = x + cellSize / 2;
      const textY = y + padding + 0.16;
      const maxTextW = cellSize - padding * 2;

      doc.setTextColor(isCompleted ? 255 : BLACK);
      if (isFree && !cell?.deed_text) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('FREE', x + cellSize / 2, y + cellSize / 2 + 0.05, { align: 'center' });
      } else if (cell?.deed_text) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        // Wrap long text to fit the cell.
        const lines = doc.splitTextToSize(cell.deed_text, maxTextW);
        // Limit to ~6 lines to avoid overflow in small cells.
        const visible = lines.slice(0, 6);
        // Vertically center-ish the block.
        const lineH = 0.12;
        const blockH = visible.length * lineH;
        const startY = y + (cellSize - blockH) / 2 + 0.1;
        visible.forEach((ln: string, i: number) => {
          doc.text(ln, textX, startY + i * lineH, { align: 'center' });
        });
      }

      // Small corner indicator (price / referral marker).
      if (!isFree && !isCompleted) {
        if (isPurchased) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(DARK_GRAY);
          doc.text('PAID', x + padding, textY, { align: 'left' });
        } else if (isReferral) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(DARK_GRAY);
          doc.text('REF', x + padding, textY, { align: 'left' });
        } else if (typeof cell?.purchase_price === 'number' && cell.purchase_price > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(DARK_GRAY);
          doc.text(`$${cell.purchase_price}`, x + cellSize - padding, textY, {
            align: 'right',
          });
        }
      }

      if (isCompleted) {
        // Draw a big X over completed cells so it reads clearly on paper too.
        doc.setDrawColor(BLACK);
        doc.setLineWidth(0.04);
        doc.line(x + 0.15, y + 0.15, x + cellSize - 0.15, y + cellSize - 0.15);
        doc.line(x + cellSize - 0.15, y + 0.15, x + 0.15, y + cellSize - 0.15);
        doc.setLineWidth(0.02);
      }
    }
  }

  // ---------- Footer / legend ----------
  const footerY = bodyTop + 5 * cellSize + 0.4;
  doc.setTextColor(BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('How to Play', 0.6, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const legendLines = [
    '1. Complete Gr8Day Deeds to mark off squares on your card.',
    '2. Squares marked with a price ($) can be unlocked by purchase.',
    '3. Squares marked "REF" are unlocked by referring a friend.',
    '4. Shaded squares with an X are already completed.',
    '5. Match the win condition above to win the game!',
  ];
  legendLines.forEach((ln, i) => {
    doc.text(ln, 0.6, footerY + 0.22 + i * 0.18);
  });

  doc.setFontSize(8);
  doc.setTextColor(MID_GRAY);
  doc.text(
    'Printed from havagr8day.com — this card is a snapshot and does not update automatically.',
    pageW / 2,
    pageH - 0.4,
    { align: 'center' },
  );

  // ---------- Save ----------
  const safeName = (opts.playerName || 'player').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40);
  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`gr8day-bingo-${safeName}-${dateTag}.pdf`);
}