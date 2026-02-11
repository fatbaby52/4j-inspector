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

// 4J Logo as base64 PNG
export const LOGO_BASE64 = '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';

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
  logoImage?: any; // Pre-embedded logo image
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
  if (ctx.logoImage) {
    // Use actual logo image (right-aligned)
    drawLogoImage(newPage, ctx.logoImage, PAGE.WIDTH - PAGE.MARGIN_RIGHT, PAGE.HEIGHT - 25, 30, 120);
  } else {
    // Fallback to drawn logo
    drawLogo(newPage, ctx.fonts.bold, PAGE.WIDTH - PAGE.MARGIN_RIGHT - 40, PAGE.HEIGHT - 35, 40);
  }

  return {
    ...ctx,
    page: newPage,
    y: PAGE.HEIGHT - PAGE.MARGIN_TOP,
  };
}

/**
 * Embed the 4J logo into the PDF document (call once, reuse the image)
 */
export async function embedLogo(doc: PDFDocument): Promise<any> {
  try {
    const logoBytes = Uint8Array.from(atob(LOGO_BASE64), c => c.charCodeAt(0));
    return await doc.embedPng(logoBytes);
  } catch (error) {
    console.error('Failed to embed logo:', error);
    return null;
  }
}

/**
 * Draw the 4J logo on a page using an already-embedded image
 * Logo is scaled to fit within a bounding box (maxWidth x maxHeight)
 */
export function drawLogoImage(
  page: PDFPage,
  logoImage: any,
  x: number,
  y: number,
  maxHeight: number = 40,
  maxWidth: number = 150
): void {
  if (!logoImage) return;

  // Calculate scale to fit within bounding box (preserving aspect ratio)
  const scaleByHeight = maxHeight / logoImage.height;
  const scaleByWidth = maxWidth / logoImage.width;
  const scale = Math.min(scaleByHeight, scaleByWidth);

  const width = logoImage.width * scale;
  const height = logoImage.height * scale;

  page.drawImage(logoImage, {
    x: x - width, // x is right edge, so subtract width
    y,
    width,
    height,
  });
}

/**
 * Draw the 4J logo (fallback: blue rounded rectangle with white "4J" text)
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
