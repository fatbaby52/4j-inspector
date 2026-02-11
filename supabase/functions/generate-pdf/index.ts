// Edge Function: generate-pdf
// Generates PDF report from inspection data using pdf-lib

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import {
  PAGE,
  FONTS,
  COLORS,
  PageContext,
  addNewPage,
  ensureSpace,
  drawSectionHeader,
  drawInfoRow,
  drawObservation,
  drawRecommendation,
  drawSummaryBox,
  drawNoData,
  drawImage,
  drawWrappedText,
  drawLogo,
  drawLogoImage,
  embedLogo,
  formatDate,
  formatItemName,
} from '../_shared/pdfHelpers.ts';

interface GeneratePdfRequest {
  inspectionId: string;
  options?: {
    includePhotos?: boolean;
    includeSignature?: boolean;
    format?: 'standard' | 'detailed';
  };
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { inspectionId, options = {} }: GeneratePdfRequest = await req.json();

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch inspection data
    const { data: inspection, error: fetchError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch inspection: ${fetchError.message}. Make sure the inspection is synced to the cloud.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!inspection) {
      return new Response(
        JSON.stringify({ error: 'Inspection not found. Please sync your inspection data first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('inspection_id', inspectionId);

    // Debug logging
    console.log('=== PDF GENERATION DEBUG ===');
    console.log('Inspection ID:', inspectionId);
    console.log('Photos query error:', photosError);
    console.log('Photos found:', photos?.length || 0);
    if (photos && photos.length > 0) {
      console.log('First photo:', JSON.stringify(photos[0], null, 2));
    }
    console.log('Executive summary:', JSON.stringify(inspection.executive_summary, null, 2));
    console.log('=== END DEBUG ===');

    // Create signed URLs for photos (bucket is private)
    const photosWithSignedUrls = [];
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        if (photo.storage_key) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('inspection-photos')
            .createSignedUrl(photo.storage_key, 3600); // 1 hour expiry

          if (signedUrlError) {
            console.error('Failed to create signed URL for photo:', photo.id, signedUrlError);
            continue;
          }

          photosWithSignedUrls.push({
            ...photo,
            storage_url: signedUrlData.signedUrl, // Override with signed URL
          });
          console.log('Created signed URL for photo:', photo.id);
        }
      }
    }
    console.log('Photos with signed URLs:', photosWithSignedUrls.length);

    // Generate the PDF (use photos with signed URLs)
    const pdfBytes = await generateInspectionPDF(inspection, photosWithSignedUrls, options);

    // Upload to Supabase Storage
    const fileName = `reports/${inspectionId}/report-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('inspection-reports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    // Get signed URL (valid for 1 hour)
    const { data: urlData } = await supabase.storage
      .from('inspection-reports')
      .createSignedUrl(fileName, 3600);

    // Update inspection with report info
    await supabase
      .from('inspections')
      .update({
        report_storage_key: fileName,
        report_url: urlData?.signedUrl,
        report_generated_at: new Date().toISOString(),
        status: 'report-generated',
      })
      .eq('id', inspectionId);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData?.signedUrl,
        storageKey: fileName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// MAIN PDF GENERATION FUNCTION
// ============================================

async function generateInspectionPDF(
  inspection: any,
  photos: any[],
  options: GeneratePdfRequest['options'] = {}
): Promise<Uint8Array> {
  const includePhotos = options.includePhotos ?? true;

  // Create a new PDF document
  const doc = await PDFDocument.create();

  // Embed fonts
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Embed 4J logo
  const logoImage = await embedLogo(doc);

  // Extract data
  const address = inspection.property_address || {};
  const client = inspection.client_info || {};
  const building = inspection.building_data || {};
  const inspectionType = inspection.type === 'home' ? 'Home Inspection' : 'Facility Inspection';

  // Initialize context with logo image
  let ctx: PageContext = {
    doc,
    page: doc.addPage([PAGE.WIDTH, PAGE.HEIGHT]),
    y: PAGE.HEIGHT - PAGE.MARGIN_TOP,
    logoImage,
    fonts: { regular: regularFont, bold: boldFont },
  };

  // Find facade photo URL if available
  let facadePhotoUrl: string | undefined;
  console.log('=== FACADE PHOTO DEBUG ===');
  console.log('inspection.facade_photo_id:', inspection.facade_photo_id);
  console.log('Number of photos:', photos.length);
  if (photos.length > 0) {
    console.log('Photo IDs in array:', photos.map((p: any) => p.id));
  }

  if (inspection.facade_photo_id) {
    const facadePhoto = photos.find((p: any) => p.id === inspection.facade_photo_id);
    console.log('Found facade photo?', !!facadePhoto);
    if (facadePhoto) {
      console.log('Facade photo storage_url:', facadePhoto.storage_url);
      if (facadePhoto.storage_url) {
        facadePhotoUrl = facadePhoto.storage_url;
      }
    }
  }
  console.log('Final facadePhotoUrl:', facadePhotoUrl);
  console.log('=== END FACADE DEBUG ===')

  // ==========================================
  // COVER PAGE
  // ==========================================
  ctx = await drawCoverPage(ctx, inspection, inspectionType, address, client, facadePhotoUrl, logoImage);

  // ==========================================
  // PROPERTY INFORMATION
  // ==========================================
  ctx = addNewPage(ctx);
  ctx = drawSectionHeader(ctx, 'Property Information');

  ctx = drawInfoRow(ctx,
    'Property Address',
    `${address.street || 'N/A'}, ${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.zip || ''}`,
    'Client',
    `${client.name || 'N/A'} - ${client.email || ''} ${client.phone || ''}`,
    70
  );

  ctx = drawInfoRow(ctx,
    'Inspection Date',
    formatDate(inspection.inspection_date),
    'Inspector',
    inspection.inspector_name || 'N/A'
  );

  // ==========================================
  // BUILDING DATA
  // ==========================================
  ctx = drawSectionHeader(ctx, 'Building Data');

  ctx = drawInfoRow(ctx,
    'Property Type',
    building.propertyType || 'N/A',
    'Year Built',
    building.yearBuilt || 'N/A'
  );

  ctx = drawInfoRow(ctx,
    'Building Size',
    building.buildingSize ? `${building.buildingSize} sq ft` : 'N/A',
    'Lot Size',
    building.lotSize || 'N/A'
  );

  ctx = drawInfoRow(ctx,
    'Foundation Type',
    building.foundationType || 'N/A',
    'Roof Type',
    building.roofType || 'N/A'
  );

  // Additional building info if available
  if (building.exteriorMaterials?.length) {
    ctx = drawInfoRow(ctx,
      'Exterior Materials',
      Array.isArray(building.exteriorMaterials) ? building.exteriorMaterials.join(', ') : building.exteriorMaterials,
      'Window Type',
      building.windowType || 'N/A'
    );
  }

  // ==========================================
  // EXECUTIVE SUMMARY (new page)
  // ==========================================
  ctx = addNewPage(ctx);
  ctx = drawSectionHeader(ctx, 'Executive Summary');
  ctx = drawSummaryBox(ctx, inspection.executive_summary?.text);

  // ==========================================
  // INSPECTION FINDINGS
  // ==========================================
  ctx = drawSectionHeader(ctx, 'Inspection Findings');

  const observations = inspection.observations || {};
  const observationEntries = Object.entries(observations);

  if (observationEntries.length === 0) {
    ctx = drawNoData(ctx, 'No observations were recorded during this inspection.');
  } else {
    // Group observations by category
    const categoryOrder = [
      'exterior', 'interior', 'roofing', 'plumbing',
      'electrical', 'hvac', 'insulation', 'fireplace', 'safety'
    ];

    const groupedObs: Record<string, Array<{ itemId: string; obs: any }>> = {};

    for (const [itemId, obsList] of observationEntries) {
      if (!Array.isArray(obsList)) continue;

      // Determine category from itemId prefix
      const prefix = itemId.split('-')[0];
      const category = getCategoryFromPrefix(prefix);

      if (!groupedObs[category]) {
        groupedObs[category] = [];
      }

      for (const obs of obsList) {
        groupedObs[category].push({ itemId, obs });
      }
    }

    // Draw observations by category
    for (const category of categoryOrder) {
      const categoryObs = groupedObs[category];
      if (!categoryObs || categoryObs.length === 0) continue;

      // Category sub-header
      ctx = ensureSpace(ctx, 30);
      ctx.page.drawText(getCategoryDisplayName(category), {
        x: PAGE.MARGIN_LEFT,
        y: ctx.y,
        size: FONTS.BODY + 1,
        font: ctx.fonts.bold,
        color: COLORS.PRIMARY_BLUE,
      });
      ctx.y -= 20;

      for (const { itemId, obs } of categoryObs) {
        // Skip N/A items unless they have notes
        if (obs.grade === 'na' && (!obs.notes || obs.notes.length === 0)) {
          continue;
        }

        const notes = (obs.notes || [])
          .map((n: any) => n.cleanedText || n.rawText || '')
          .filter((text: string) => text.trim());

        ctx = drawObservation(ctx, formatItemName(itemId), obs.grade || 'na', notes);
      }
    }
  }

  // ==========================================
  // PHOTO GALLERY (if photos and enabled)
  // ==========================================
  if (includePhotos && photos && photos.length > 0) {
    ctx = addNewPage(ctx);
    ctx = drawSectionHeader(ctx, 'Photo Documentation');

    // Build a map from observation_id to item name
    const observationToItemName: Record<string, string> = {};
    const observations = inspection.observations || {};
    for (const [itemId, obsList] of Object.entries(observations)) {
      if (!Array.isArray(obsList)) continue;
      for (const obs of obsList) {
        if (obs.id) {
          observationToItemName[obs.id] = formatItemName(itemId);
        }
      }
    }

    // Group photos by item name and assign numbers
    const photoCountByItem: Record<string, number> = {};

    // Create captions for each photo
    const photosWithCaptions = photos.map(photo => {
      const itemName = observationToItemName[photo.observation_id] || 'Photo';
      photoCountByItem[itemName] = (photoCountByItem[itemName] || 0) + 1;
      const caption = `${itemName} Image ${photoCountByItem[itemName]}`;
      return { ...photo, generatedCaption: caption };
    });

    // Draw photos in a 2-column grid
    const photoWidth = (PAGE.CONTENT_WIDTH - 20) / 2;
    const photoHeight = 150;
    let col = 0;

    for (const photo of photosWithCaptions) {
      if (!photo.storage_url) continue;

      const x = PAGE.MARGIN_LEFT + col * (photoWidth + 20);

      ctx = ensureSpace(ctx, photoHeight + 30);

      const result = await drawImage(
        ctx,
        photo.storage_url,
        x,
        photoWidth,
        photoHeight,
        photo.generatedCaption
      );

      if (result.height > 0) {
        col++;
        if (col >= 2) {
          col = 0;
          ctx.y -= photoHeight + 30;
        }
      }
    }

    // If we ended on an odd column, move down
    if (col === 1) {
      ctx.y -= photoHeight + 30;
    }
  }

  // ==========================================
  // RECOMMENDATIONS
  // ==========================================
  ctx = addNewPage(ctx);
  ctx = drawSectionHeader(ctx, 'Recommendations');

  const recommendations = (inspection.recommendations || [])
    .filter((r: any) => r.reviewStatus !== 'declined');

  if (recommendations.length === 0) {
    ctx = drawNoData(ctx, 'No specific recommendations at this time. All inspected areas are in satisfactory condition.');
  } else {
    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sortedRecs = [...recommendations].sort((a: any, b: any) =>
      (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
    );

    for (const rec of sortedRecs) {
      ctx = drawRecommendation(
        ctx,
        rec.priority || 'medium',
        rec.title || 'Recommendation',
        rec.description || '',
        rec.estimatedUrgency || ''
      );
    }
  }

  // ==========================================
  // SIGNATURE SECTION
  // ==========================================
  ctx = ensureSpace(ctx, 200);
  ctx.y -= 30;

  // Divider line
  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE.MARGIN_LEFT + PAGE.CONTENT_WIDTH, y: ctx.y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  ctx.y -= 20;

  // Certification title
  ctx.page.drawText('Inspector Certification', {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y,
    size: FONTS.SECTION_HEADER - 2,
    font: ctx.fonts.bold,
    color: COLORS.TEXT_DARK,
  });
  ctx.y -= 25;

  // Certification text
  const certText = 'I certify that I have personally inspected the property at the address listed above and that this report accurately reflects my findings as of the inspection date.';
  ctx.y = drawWrappedText(
    ctx.page,
    certText,
    ctx.fonts.regular,
    FONTS.BODY,
    PAGE.MARGIN_LEFT,
    ctx.y,
    PAGE.CONTENT_WIDTH,
    COLORS.TEXT_DARK
  );
  ctx.y -= 20;

  // Embed signature image if available
  console.log('=== SIGNATURE DEBUG ===');
  console.log('inspector_signature exists:', !!inspection.inspector_signature);
  console.log('inspector_signature type:', typeof inspection.inspector_signature);
  if (inspection.inspector_signature) {
    console.log('inspector_signature length:', inspection.inspector_signature.length);
    console.log('inspector_signature prefix:', inspection.inspector_signature.substring(0, 50));
  }
  console.log('=== END SIGNATURE DEBUG ===');

  if (inspection.inspector_signature) {
    try {
      const signatureData = inspection.inspector_signature;

      // Parse base64 data URL - support both PNG and JPEG
      const pngMatch = signatureData.match(/^data:image\/png;base64,(.+)$/);
      const jpegMatch = signatureData.match(/^data:image\/jpe?g;base64,(.+)$/);

      let signatureImage;
      if (pngMatch) {
        const signatureBytes = Uint8Array.from(atob(pngMatch[1]), c => c.charCodeAt(0));
        signatureImage = await ctx.doc.embedPng(signatureBytes);
      } else if (jpegMatch) {
        const signatureBytes = Uint8Array.from(atob(jpegMatch[1]), c => c.charCodeAt(0));
        signatureImage = await ctx.doc.embedJpg(signatureBytes);
      }

      if (signatureImage) {
        // Scale signature to fit (max 200 width, proportional height)
        const maxWidth = 200;
        const maxHeight = 60;
        const scale = Math.min(maxWidth / signatureImage.width, maxHeight / signatureImage.height);
        const sigWidth = signatureImage.width * scale;
        const sigHeight = signatureImage.height * scale;

        ctx.page.drawImage(signatureImage, {
          x: PAGE.MARGIN_LEFT,
          y: ctx.y - sigHeight,
          width: sigWidth,
          height: sigHeight,
        });
        ctx.y -= sigHeight + 5;
      } else {
        console.log('Signature format not recognized:', signatureData.substring(0, 50));
        ctx.y -= 40;
      }
    } catch (sigError) {
      console.error('Failed to embed signature:', sigError);
      // Fall back to blank line
      ctx.y -= 40;
    }
  } else {
    // No signature - leave space for handwritten signature
    ctx.y -= 40;
  }

  // Signature line
  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE.MARGIN_LEFT + 250, y: ctx.y },
    thickness: 1,
    color: COLORS.TEXT_DARK,
  });
  ctx.y -= 15;

  ctx.page.drawText('Inspector Signature', {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });
  ctx.y -= 25;

  // Print inspector name (or line if not available)
  const inspectorName = inspection.inspector_name || '';
  if (inspectorName) {
    ctx.page.drawText(inspectorName, {
      x: PAGE.MARGIN_LEFT,
      y: ctx.y + 5,
      size: FONTS.BODY,
      font: ctx.fonts.regular,
      color: COLORS.TEXT_DARK,
    });
  }

  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE.MARGIN_LEFT + 250, y: ctx.y },
    thickness: 1,
    color: COLORS.TEXT_DARK,
  });
  ctx.y -= 15;

  ctx.page.drawText('Print Name', {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });
  ctx.y -= 25;

  // Print inspection date
  const inspectionDateStr = formatDate(inspection.inspection_date);
  ctx.page.drawText(inspectionDateStr, {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y + 5,
    size: FONTS.BODY,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_DARK,
  });

  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y },
    end: { x: PAGE.MARGIN_LEFT + 250, y: ctx.y },
    thickness: 1,
    color: COLORS.TEXT_DARK,
  });
  ctx.y -= 15;

  ctx.page.drawText('Date', {
    x: PAGE.MARGIN_LEFT,
    y: ctx.y,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });

  // ==========================================
  // FOOTER ON LAST PAGE
  // ==========================================
  ctx.y = PAGE.MARGIN_BOTTOM + 30;

  ctx.page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: ctx.y + 15 },
    end: { x: PAGE.MARGIN_LEFT + PAGE.CONTENT_WIDTH, y: ctx.y + 15 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });

  const footerText1 = 'This report was generated by 4J Property Inspector';
  const footerText2 = `Report ID: ${inspection.id}`;
  const footerText3 = `Generated on: ${formatDate(new Date().toISOString())}`;

  const centerX = PAGE.WIDTH / 2;

  ctx.page.drawText(footerText1, {
    x: centerX - ctx.fonts.regular.widthOfTextAtSize(footerText1, FONTS.SMALL) / 2,
    y: ctx.y,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });

  ctx.page.drawText(footerText2, {
    x: centerX - ctx.fonts.regular.widthOfTextAtSize(footerText2, FONTS.SMALL) / 2,
    y: ctx.y - 12,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });

  ctx.page.drawText(footerText3, {
    x: centerX - ctx.fonts.regular.widthOfTextAtSize(footerText3, FONTS.SMALL) / 2,
    y: ctx.y - 24,
    size: FONTS.SMALL,
    font: ctx.fonts.regular,
    color: COLORS.TEXT_LIGHT,
  });

  // Serialize the PDF
  return await doc.save();
}

// ============================================
// COVER PAGE
// ============================================

async function drawCoverPage(
  ctx: PageContext,
  inspection: any,
  inspectionType: string,
  address: any,
  client: any,
  facadePhotoUrl?: string,
  logoImage?: any
): Promise<PageContext> {
  const { page, fonts, doc } = ctx;
  const centerX = PAGE.WIDTH / 2;

  // Grey background rectangle (full page)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
    color: COLORS.COVER_GREY,
  });

  // Draw 4J logo in top-right corner
  if (logoImage) {
    // Use actual logo image (right-aligned)
    drawLogoImage(page, logoImage, PAGE.WIDTH - PAGE.MARGIN_RIGHT, PAGE.HEIGHT - 50, 40);
  } else {
    // Fallback to drawn logo
    drawLogo(page, fonts.bold, PAGE.WIDTH - PAGE.MARGIN_RIGHT - 50, PAGE.HEIGHT - 60, 50);
  }

  // Title
  let y = PAGE.HEIGHT - 100;
  const title = 'PROPERTY INSPECTION REPORT';
  const titleWidth = fonts.bold.widthOfTextAtSize(title, FONTS.TITLE);

  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y,
    size: FONTS.TITLE,
    font: fonts.bold,
    color: COLORS.WHITE,
  });

  // Subtitle (inspection type)
  y -= 35;
  const subtitleWidth = fonts.regular.widthOfTextAtSize(inspectionType, FONTS.SECTION_HEADER);

  page.drawText(inspectionType, {
    x: centerX - subtitleWidth / 2,
    y,
    size: FONTS.SECTION_HEADER,
    font: fonts.regular,
    color: COLORS.WHITE,
  });

  // Facade photo (if available)
  y -= 30;
  if (facadePhotoUrl) {
    try {
      const response = await fetch(facadePhotoUrl);
      if (response.ok) {
        const imageBytes = await response.arrayBuffer();
        let image;
        const contentType = response.headers.get('content-type') || '';

        try {
          if (contentType.includes('png')) {
            image = await doc.embedPng(imageBytes);
          } else {
            image = await doc.embedJpg(imageBytes);
          }

          // Calculate dimensions to fit nicely on cover
          const maxWidth = 350;
          const maxHeight = 220;
          const aspectRatio = image.width / image.height;
          let drawWidth = Math.min(maxWidth, image.width);
          let drawHeight = drawWidth / aspectRatio;

          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight * aspectRatio;
          }

          // Center the image
          const imageX = centerX - drawWidth / 2;

          page.drawImage(image, {
            x: imageX,
            y: y - drawHeight,
            width: drawWidth,
            height: drawHeight,
          });

          y -= drawHeight + 20;
        } catch (e) {
          console.error('Failed to embed facade image:', e);
        }
      }
    } catch (e) {
      console.error('Failed to fetch facade image:', e);
    }
  }

  // Address box
  y -= 20;
  const addressLine1 = address.street || 'Address Not Specified';
  const addressLine2 = `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.zip || ''}`.trim();

  // Address text
  const addr1Width = fonts.bold.widthOfTextAtSize(addressLine1, 16);
  page.drawText(addressLine1, {
    x: centerX - addr1Width / 2,
    y,
    size: 16,
    font: fonts.bold,
    color: COLORS.WHITE,
  });

  if (addressLine2) {
    y -= 22;
    const addr2Width = fonts.regular.widthOfTextAtSize(addressLine2, FONTS.BODY);
    page.drawText(addressLine2, {
      x: centerX - addr2Width / 2,
      y,
      size: FONTS.BODY,
      font: fonts.regular,
      color: COLORS.WHITE,
    });
  }

  // Meta information
  y -= 40;

  const metaItems = [
    { label: 'Prepared for:', value: client.name || 'Client' },
    { label: 'Inspection Date:', value: formatDate(inspection.inspection_date) },
    { label: 'Inspector:', value: inspection.inspector_name || 'Inspector' },
  ];

  for (const item of metaItems) {
    const text = `${item.label} ${item.value}`;
    const textWidth = fonts.regular.widthOfTextAtSize(text, FONTS.BODY);

    page.drawText(text, {
      x: centerX - textWidth / 2,
      y,
      size: FONTS.BODY,
      font: fonts.regular,
      color: COLORS.WHITE,
    });
    y -= 22;
  }

  // Company name at bottom
  y = 80;
  const company = '4J Construction';
  const companyWidth = fonts.bold.widthOfTextAtSize(company, 18);

  page.drawText(company, {
    x: centerX - companyWidth / 2,
    y,
    size: 18,
    font: fonts.bold,
    color: COLORS.WHITE,
  });

  return ctx;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCategoryFromPrefix(prefix: string): string {
  const prefixMap: Record<string, string> = {
    'ext': 'exterior',
    'int': 'interior',
    'roof': 'roofing',
    'plumb': 'plumbing',
    'elec': 'electrical',
    'hvac': 'hvac',
    'ins': 'insulation',
    'fire': 'fireplace',
    'safe': 'safety',
  };
  return prefixMap[prefix] || 'other';
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    'exterior': 'Exterior',
    'interior': 'Interior',
    'roofing': 'Roofing',
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'hvac': 'Heating & Cooling',
    'insulation': 'Insulation & Ventilation',
    'fireplace': 'Fireplaces & Fuel Burning',
    'safety': 'Safety & Misc.',
    'other': 'Other',
  };
  return names[category] || category;
}
