
import PptxGenJS from 'pptxgenjs';
import { SlideContent, PresentationTheme } from '../types';

export async function createPptx(
  slidesData: SlideContent[], 
  fileName: string = "presentation.pptx", 
  theme: PresentationTheme
): Promise<void> {
  const pptx = new PptxGenJS();

  pptx.author = 'AI PPT Generator';
  pptx.company = 'User Generated Content';
  pptx.title = fileName.replace(/\.pptx$/i, '');
  pptx.subject = 'Presentation generated from PDF';

  // Default Master Slide (for text-heavy or mixed content)
  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: theme.colors.bg },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.65, fill: { color: theme.colors.primary } } },
      { text: {
          text: pptx.title,
          options: { x: 0.5, y: '95%', w:'90%', h: 0.3, align: 'left', fontSize: 9, color: theme.colors.subtleText }
        }
      },
      { text: {
          text: 'Page {[slideNumber]}',
          options: { x: 0.5, y: '95%', w:'90%', h: 0.3, align: 'right', fontSize: 9, color: theme.colors.subtleText }
        }
      }
    ],
  });

  // Master Slide for Image-Dominant Content
  pptx.defineSlideMaster({
    title: 'IMAGE_MASTER_SLIDE',
    background: { color: theme.colors.bg },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.65, fill: { color: theme.colors.primary } } },
      { text: {
          text: pptx.title,
          options: { x: 0.5, y: '95%', w:'90%', h: 0.3, align: 'left', fontSize: 9, color: theme.colors.subtleText }
        }
      },
       { text: {
          text: 'Page {[slideNumber]}',
          options: { x: 0.5, y: '95%', w:'90%', h: 0.3, align: 'right', fontSize: 9, color: theme.colors.subtleText }
        }
      }
    ],
  });


  const titleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  titleSlide.addText(fileName.replace(/\.pptx$/i, ''), { 
    x: 0.5, y: 2.5, w: '90%', h: 1, fontSize: 40, bold: true, align: 'center', color: theme.colors.accent
  });
  titleSlide.addText(`Generated on: ${new Date().toLocaleDateString()}`, { 
    x: 0.5, y: 3.6, w: '90%', h: 0.5, fontSize: 16, align: 'center', color: theme.colors.text
  });


  slidesData.forEach((slideData, index) => {
    const masterName = slideData.imageData ? 'IMAGE_MASTER_SLIDE' : 'MASTER_SLIDE';
    const slide = pptx.addSlide({ masterName });

    // Slide Title
    slide.addText(slideData.title || `Slide ${index + 1}`, { 
      x: 0.4, y: 0.15, w: '92%', h: 0.4, 
      fontSize: 26, bold: true, color: theme.colors.textOnPrimary, align:'center', valign:'middle'
    });

    if (slideData.imageData && slideData.imageMimeType) {
      // Image-centric layout
      const imgW = 7.5; // Inches for image width
      const imgH = 4.5; // Inches for image height (aspect ratio 16:9)
      const imgX = (pptx.layout.width / 2) - (imgW / 2); // Center image
      const imgY = 0.85;

      slide.addImage({
        data: slideData.imageData, // Expects full data URL: "data:image/png;base64,..."
        x: imgX, y: imgY, w: imgW, h: imgH,
        sizing: { type: 'contain', w: imgW, h: imgH } // Fit image within dimensions
      });

      if (slideData.points && slideData.points.length > 0) {
        slide.addText(slideData.points.map(p => ({text:p, options:{breakLine:true}})), {
          x: 0.5, y: imgY + imgH + 0.2, w: '90%', h: 1.5, 
          fontSize: 14, color: theme.colors.text, bullet: {type: 'bullet', code:'25CF'}, align:'center',
          lineSpacing: 22
        });
      }
    } else {
      // Text-centric layout
      if (slideData.points && slideData.points.length > 0) {
        slide.addText(slideData.points.map(point => ({
          text: point,
          options: { fontSize: 18, color: theme.colors.text, breakLine: true }
        })), { 
          x: 0.6, y: 1.0, w: '88%', h: '75%', 
          bullet: { type: 'bullet', code: '2022' },
          lineSpacing: 28
        });
      } else {
          slide.addText("No specific points generated for this slide.", {
              x:0.6, y: 1.0, w:'88%', h: 1, fontSize: 18, color: theme.colors.subtleText, italic: true
          });
      }
    }
    
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  });
  
  const thankYouSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
  thankYouSlide.addText("Thank You!", { 
    x: 0.5, y: 2.5, w: '90%', h: 1.5, fontSize: 48, bold: true, align: 'center', color: theme.colors.accent
  });

  try {
    await pptx.writeFile({ fileName });
  } catch (error) {
    console.error("Error writing PPTX file:", error);
    throw new Error("Failed to generate and save the PowerPoint file.");
  }
}
