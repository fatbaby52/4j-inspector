// PDF Helper Functions for 4J Inspection Reports
// Uses pdf-lib for server-side PDF generation

import {
  PDFDocument,
  PDFPage,
  PDFFont,
  rgb,
  RGB,
} from 'https://esm.sh/pdf-lib@1.17.1';

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const PAGE = {
  WIDTH: 612,    // Letter size width in points
  HEIGHT: 792,   // Letter size height in points
  MARGIN_LEFT: 50,
  MARGIN_RIGHT: 50,
  MARGIN_TOP: 60,
  MARGIN_BOTTOM: 50,
  get CONTENT_WIDTH() { return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT; },
  get CONTENT_HEIGHT() { return this.HEIGHT - this.MARGIN_TOP - this.MARGIN_BOTTOM; },
};

export const FONTS = {
  TITLE: 24,
  SECTION_HEADER: 14,
  BODY: 11,
  SMALL: 9,
  LABEL: 9,
};

export const COLORS = {
  PRIMARY_BLUE: rgb(0.12, 0.23, 0.37),      // #1e3a5f
  ACCENT_BLUE: rgb(0.15, 0.39, 0.92),       // #2563eb
  COVER_GREY: rgb(0.3, 0.3, 0.3),           // #4d4d4d - Cover page background
  GOOD_GREEN: rgb(0.13, 0.77, 0.37),        // #22c55e
  FAIR_YELLOW: rgb(0.92, 0.70, 0.03),       // #eab308
  POOR_RED: rgb(0.94, 0.27, 0.27),          // #ef4444
  TEXT_DARK: rgb(0.2, 0.2, 0.2),            // #333
  TEXT_LIGHT: rgb(0.5, 0.5, 0.5),           // #808080
  BG_LIGHT: rgb(0.96, 0.96, 0.96),          // #f5f5f5
  BG_BLUE_LIGHT: rgb(0.91, 0.96, 0.99),     // #e8f4fc
  WHITE: rgb(1, 1, 1),
  BLACK: rgb(0, 0, 0),
};

export const LINE_HEIGHT = 1.4;

// ============================================
// TEXT UTILITIES
// ============================================

/**
 * Sanitize text for PDF rendering (remove problematic characters)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Replace newlines with spaces, remove other control characters
  return text.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Wrap text to fit within a maximum width
 */
export function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text) return [];

  // Sanitize text first
  const cleanText = sanitizeText(text);
  const words = cleanText.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculate height needed for wrapped text
 */
export function calculateTextHeight(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  return lines.length * fontSize * LINE_HEIGHT;
}

/**
 * Draw wrapped text and return the Y position after drawing
 */
export function drawWrappedText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  fontSize: number,
  x: number,
  y: number,
  maxWidth: number,
  color: RGB = COLORS.TEXT_DARK
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color,
    });
    currentY -= fontSize * LINE_HEIGHT;
  }

  return currentY;
}

// ============================================
// PAGE MANAGEMENT
// ============================================

export interface PageContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
  };
}

/**
 * Check if we need a new page, and create one if so
 * Returns the updated Y position
 */
export function ensureSpace(
  ctx: PageContext,
  neededHeight: number
): PageContext {
  if (ctx.y - neededHeight < PAGE.MARGIN_BOTTOM) {
    const newPage = ctx.doc.addPage([PAGE.WIDTH, PAGE.HEIGHT]);
    return {
      ...ctx,
      page: newPage,
      y: PAGE.HEIGHT - PAGE.MARGIN_TOP,
    };
  }
  return ctx;
}

/**
 * Add a new page and reset Y position
 */
export function addNewPage(ctx: PageContext): PageContext {
  const newPage = ctx.doc.addPage([PAGE.WIDTH, PAGE.HEIGHT]);

  // Draw 4J logo in top-right corner of every page
  drawLogo(newPage, ctx.fonts.bold, PAGE.WIDTH - PAGE.MARGIN_RIGHT - 40, PAGE.HEIGHT - 35, 40);

  return {
    ...ctx,
    page: newPage,
    y: PAGE.HEIGHT - PAGE.MARGIN_TOP,
  };
}

/**
 * Draw the 4J logo (blue rounded rectangle with white "4J" text)
 */
export function drawLogo(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  size: number = 40
): void {
  // Draw blue rounded rectangle background
  const cornerRadius = size * 0.125; // ~12.5% of size for rounded corners

  // Since pdf-lib doesn't have built-in rounded rect, draw a regular rect
  // (the visual difference is minimal at small sizes)
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: COLORS.ACCENT_BLUE,
  });

  // Draw "4J" text centered in the box
  const text = '4J';
  const fontSize = size * 0.45;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  page.drawText(text, {
    x: x + (size - textWidth) / 2,
    y: y + size * 0.28,
    size: fontSize,
    font,
    color: COLORS.WHITE,
  });
}

// ============================================
// DRAWING COMPONENTS
// ============================================

/**
 * Draw a section header with blue underline
 */
export function drawSectionHeader(
  ctx: PageContext,
  title: string
): PageContext {
  // Ensure we have space for the header
  ctx = ensureSpace(ctx, 40);

  // Add some top margin before section
  ctx.y -= 20;

  // Draw the title
  ctx.page.drawText(title, {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y,
    size: FONTS.SECTION_HEADER,
    font: ctx.fonts.bold,
    color: COLORS.PRIMARY_BLUE,
  });

  // Draw the underline
  ctx.y -= 8;
  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE.MARGIN_LEFT + PAGE.CONTENT_WIDTH, y: ctx.y },
    thickness: 2,
    color: COLORS.ACCENT_BLUE,
  });

  ctx.y -= 15;
  return ctx;
}

/**
 * Draw an info box (label + value) with background
 */
export function drawInfoBox(
  ctx: PageContext,
  label: string,
  value: string,
  x: number,
  width: number,
  height: number = 60
): void {
  const padding = 10;
  const labelHeight = FONTS.LABEL + 5; // Label + gap

  // Draw background
  ctx.page.drawRectangle({
    x,
    y: ctx.y - height,
    width,
    height,
    color: COLORS.BG_LIGHT,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  // Draw label at top
  ctx.page.drawText(label.toUpperCase(), {
    x: x + padding,
    y: ctx.y - padding - FONTS.LABEL,
    size: FONTS.LABEL,
    font: ctx.fonts.bold,
    color: COLORS.TEXT_LIGHT,
  });

  // Draw value - vertically centered in remaining space
  const cleanValue = sanitizeText(value || 'N/A');
  const valueLines = wrapText(cleanValue, ctx.fonts.regular, FONTS.BODY, width - padding * 2).slice(0, 2);
  const valueTextHeight = valueLines.length * FONTS.BODY * LINE_HEIGHT;

  // Calculate vertical center of the area below the label
  const topOfValueArea = ctx.y - padding - labelHeight - 5;
  const bottomOfBox = ctx.y - height + padding;
  const availableHeight = topOfValueArea - bottomOfBox;
  const valueStartY = topOfValueArea - (availableHeight - valueTextHeight) / 2;

  let valueY = valueStartY;
  for (const line of valueLines) {
    ctx.page.drawText(line, {
      x: x + padding,
      y: valueY,
      size: FONTS.BODY,
      font: ctx.fonts.regular,
      color: COLORS.TEXT_DARK,
    });
    valueY -= FONTS.BODY * LINE_HEIGHT;
  }
}

/**
 * Draw a row of two info boxes
 */
export function drawInfoRow(
  ctx: PageContext,
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
  height: number = 60
): PageContext {
  ctx = ensureSpace(ctx, height + 10);

  const boxWidth = (PAGE.CONTENT_WIDTH - 10) / 2;

  drawInfoBox(ctx, leftLabel, leftValue, PAGE.MARGIN_LEFT, boxWidth, height);
  drawInfoBox(ctx, rightLabel, rightValue, PAGE.MARGIN_LEFT + boxWidth + 10, boxWidth, height);

  ctx.y -= height + 10;
  return ctx;
}

/**
 * Draw an observation card with grade coloring
 */
export function drawObservation(
  ctx: PageContext,
  itemName: string,
  grade: string,
  notes: string[]
): PageContext {
  // Calculate height needed
  const notesText = notes.join(' ');
  const notesHeight = notesText
    ? calculateTextHeight(notesText, ctx.fonts.regular, FONTS.BODY, PAGE.CONTENT_WIDTH - 30)
    : 0;
  const cardHeight = Math.max(45, 35 + notesHeight);

  ctx = ensureSpace(ctx, cardHeight + 15);

  // Determine colors based on grade
  let borderColor: RGB;
  let bgColor: RGB;
  let badgeBg: RGB;
  let badgeText: RGB;

  switch (grade.toLowerCase()) {
    case 'good':
      borderColor = COLORS.GOOD_GREEN;
      bgColor = rgb(0.94, 0.99, 0.96);
      badgeBg = rgb(0.73, 0.97, 0.82);
      badgeText = rgb(0.09, 0.40, 0.21);
      break;
    case 'fair':
      borderColor = COLORS.FAIR_YELLOW;
      bgColor = rgb(1, 0.99, 0.91);
      badgeBg = rgb(1, 0.94, 0.54);
      badgeText = rgb(0.52, 0.30, 0.05);
      break;
    case 'poor':
      borderColor = COLORS.POOR_RED;
      bgColor = rgb(1, 0.95, 0.95);
      badgeBg = rgb(0.99, 0.79, 0.79);
      badgeText = rgb(0.60, 0.11, 0.11);
      break;
    default: // N/A
      borderColor = rgb(0.8, 0.8, 0.8);
      bgColor = COLORS.BG_LIGHT;
      badgeBg = rgb(0.87, 0.87, 0.87);
      badgeText = COLORS.TEXT_LIGHT;
  }

  // Draw card background
  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - cardHeight,
    width: PAGE.CONTENT_WIDTH,
    height: cardHeight,
    color: bgColor,
  });

  // Draw left border
  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - cardHeight,
    width: 4,
    height: cardHeight,
    color: borderColor,
  });

  // Draw item name
  ctx.page.drawText(itemName, {
    x: PAGE.MARGIN_LEFT + 15,
    y: ctx.y - 18,
    size: FONTS.BODY,
    font: ctx.fonts.bold,
    color: COLORS.TEXT_DARK,
  });

  // Draw grade badge
  const gradeText = grade.toUpperCase();
  const badgeWidth = ctx.fonts.bold.widthOfTextAtSize(gradeText, FONTS.SMALL) + 16;
  const badgeX = PAGE.MARGIN_LEFT + 15 + ctx.fonts.bold.widthOfTextAtSize(itemName, FONTS.BODY) + 10;

  ctx.page.drawRectangle({
    x: badgeX,
    y: ctx.y - 22,
    width: badgeWidth,
    height: 16,
    color: badgeBg,
    borderRadius: 3,
  });

  ctx.page.drawText(gradeText, {
    x: badgeX + 8,
    y: ctx.y - 18,
    size: FONTS.SMALL,
    font: ctx.fonts.bold,
    color: badgeText,
  });

  // Draw notes if present
  if (notesText) {
    drawWrappedText(
      ctx.page,
      notesText,
      ctx.fonts.regular,
      FONTS.BODY,
      PAGE.MARGIN_LEFT + 15,
      ctx.y - 35,
      PAGE.CONTENT_WIDTH - 30,
      COLORS.TEXT_DARK
    );
  }

  ctx.y -= cardHeight + 10;
  return ctx;
}

/**
 * Draw a recommendation card with priority badge
 */
export function drawRecommendation(
  ctx: PageContext,
  priority: string,
  title: string,
  description: string,
  timeline: string
): PageContext {
  // Calculate height needed
  const descHeight = description
    ? calculateTextHeight(description, ctx.fonts.regular, FONTS.BODY, PAGE.CONTENT_WIDTH - 30)
    : 0;
  const cardHeight = Math.max(70, 55 + descHeight + (timeline ? 20 : 0));

  ctx = ensureSpace(ctx, cardHeight + 15);

  // Determine colors based on priority
  let borderColor: RGB;
  let bgColor: RGB;
  let badgeBg: RGB;

  switch (priority.toLowerCase()) {
    case 'high':
      borderColor = rgb(0.99, 0.65, 0.65);
      bgColor = rgb(1, 0.95, 0.95);
      badgeBg = COLORS.POOR_RED;
      break;
    case 'medium':
      borderColor = rgb(0.99, 0.83, 0.30);
      bgColor = rgb(1, 0.98, 0.92);
      badgeBg = rgb(0.96, 0.62, 0.04);
      break;
    default: // low
      borderColor = rgb(0.53, 0.94, 0.68);
      bgColor = rgb(0.94, 0.99, 0.96);
      badgeBg = COLORS.GOOD_GREEN;
  }

  // Draw card background with border
  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - cardHeight,
    width: PAGE.CONTENT_WIDTH,
    height: cardHeight,
    color: bgColor,
    borderColor: borderColor,
    borderWidth: 1,
  });

  // Draw priority badge
  const badgeText = `${priority.toUpperCase()} PRIORITY`;
  const badgeWidth = ctx.fonts.bold.widthOfTextAtSize(badgeText, FONTS.SMALL) + 20;

  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT + 12,
    y: ctx.y - 22,
    width: badgeWidth,
    height: 18,
    color: badgeBg,
  });

  ctx.page.drawText(badgeText, {
    x: PAGE.MARGIN_LEFT + 22,
    y: ctx.y - 17,
    size: FONTS.SMALL,
    font: ctx.fonts.bold,
    color: priority.toLowerCase() === 'medium' ? COLORS.TEXT_DARK : COLORS.WHITE,
  });

  // Draw title
  ctx.page.drawText(title || 'Recommendation', {
    x: PAGE.MARGIN_LEFT + 12,
    y: ctx.y - 40,
    size: FONTS.BODY,
    font: ctx.fonts.bold,
    color: COLORS.TEXT_DARK,
  });

  // Draw description
  let descEndY = ctx.y - 55;
  if (description) {
    descEndY = drawWrappedText(
      ctx.page,
      description,
      ctx.fonts.regular,
      FONTS.BODY,
      PAGE.MARGIN_LEFT + 12,
      ctx.y - 55,
      PAGE.CONTENT_WIDTH - 30,
      COLORS.TEXT_DARK
    );
  }

  // Draw timeline
  if (timeline) {
    ctx.page.drawText(`Recommended timeline: ${timeline}`, {
      x: PAGE.MARGIN_LEFT + 12,
      y: descEndY - 5,
      size: FONTS.SMALL,
      font: ctx.fonts.regular,
      color: COLORS.TEXT_LIGHT,
    });
  }

  ctx.y -= cardHeight + 10;
  return ctx;
}

/**
 * Draw a summary box with blue left border
 */
export function drawSummaryBox(
  ctx: PageContext,
  text: string
): PageContext {
  if (!text) {
    text = 'No executive summary has been generated for this inspection.';
  }

  // Strip markdown headers like "**Executive Summary**" or "## Executive Summary"
  let cleanedText = text
    .replace(/^\*\*Executive Summary\*\*:?\s*/i, '')
    .replace(/^##?\s*Executive Summary:?\s*/i, '')
    .replace(/^Executive Summary:?\s*/i, '')
    .trim();

  if (!cleanedText) {
    cleanedText = 'No executive summary has been generated for this inspection.';
  }

  const textHeight = calculateTextHeight(cleanedText, ctx.fonts.regular, FONTS.BODY, PAGE.CONTENT_WIDTH - 40);
  const boxHeight = Math.max(50, textHeight + 30);

  ctx = ensureSpace(ctx, boxHeight + 10);

  // Draw background
  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - boxHeight,
    width: PAGE.CONTENT_WIDTH,
    height: boxHeight,
    color: COLORS.BG_BLUE_LIGHT,
  });

  // Draw left border
  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - boxHeight,
    width: 4,
    height: boxHeight,
    color: COLORS.ACCENT_BLUE,
  });

  // Draw text
  drawWrappedText(
    ctx.page,
    cleanedText,
    ctx.fonts.regular,
    FONTS.BODY,
    PAGE.MARGIN_LEFT + 20,
    ctx.y - 15,
    PAGE.CONTENT_WIDTH - 40,
    COLORS.TEXT_DARK
  );

  ctx.y -= boxHeight + 15;
  return ctx;
}

/**
 * Draw a "no data" message
 */
export function drawNoData(
  ctx: PageContext,
  message: string
): PageContext {
  ctx = ensureSpace(ctx, 50);

  ctx.page.drawRectangle({
    x: PAGE.MARGIN_LEFT,
    y: ctx.y - 40,
    width: PAGE.CONTENT_WIDTH,
    height: 40,
    color: COLORS.BG_LIGHT,
  });

  const textWidth = ctx.fonts.regular.widthOfTextAtSize(message, FONTS.BODY);
  ctx.page.drawText(message, {
    x: PAGE.MARGIN_LEFT + (PAGE.CONTENT_WIDTH - textWidth) / 2,
    y: ctx.y - 25,
    size: FONTS.BODY,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });

  ctx.y -= 50;
  return ctx;
}

/**
 * Embed and draw an image from URL
 */
export async function drawImage(
  ctx: PageContext,
  imageUrl: string,
  x: number,
  maxWidth: number,
  maxHeight: number,
  caption?: string
): Promise<{ ctx: PageContext; height: number }> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return { ctx, height: 0 };
    }

    const imageBytes = await response.arrayBuffer();

    // Try to embed as JPEG first, then PNG
    let image;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('png')) {
        image = await ctx.doc.embedPng(imageBytes);
      } else {
        image = await ctx.doc.embedJpg(imageBytes);
      }
    } catch {
      // Try the other format
      try {
        image = contentType.includes('png')
          ? await ctx.doc.embedJpg(imageBytes)
          : await ctx.doc.embedPng(imageBytes);
      } catch (e) {
        console.error(`Failed to embed image: ${e}`);
        return { ctx, height: 0 };
      }
    }

    // Calculate scaled dimensions
    const aspectRatio = image.width / image.height;
    let drawWidth = Math.min(maxWidth, image.width);
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * aspectRatio;
    }

    // Calculate total height needed (image + caption)
    const captionHeight = caption ? 20 : 0;
    const totalHeight = drawHeight + captionHeight + 10;

    // Ensure space
    ctx = ensureSpace(ctx, totalHeight);

    // Draw image
    ctx.page.drawImage(image, {
      x,
      y: ctx.y - drawHeight,
      width: drawWidth,
      height: drawHeight,
    });

    // Draw caption if present
    if (caption) {
      ctx.page.drawText(caption, {
        x,
        y: ctx.y - drawHeight - 15,
        size: FONTS.SMALL,
        font: ctx.fonts.regular,
        color: COLORS.TEXT_LIGHT,
      });
    }

    return { ctx, height: totalHeight };
  } catch (error) {
    console.error(`Error drawing image: ${error}`);
    return { ctx, height: 0 };
  }
}

/**
 * Format a date string nicely
 */
export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format item ID to display name (e.g., "ext-foundation" -> "Foundation")
 */
export function formatItemName(itemId: string): string {
  // Remove category prefix (ext-, int-, roof-, etc.)
  const parts = itemId.split('-');
  const nameParts = parts.length > 1 ? parts.slice(1) : parts;

  return nameParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
