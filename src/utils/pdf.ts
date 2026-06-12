import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

export const downloadElementAsImage = async (element: HTMLElement, filename: string) => {
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(elt, pseudoElt) {
    const computedStyle = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(computedStyle, {
      get(target, prop, receiver) {
        const val = target[prop as keyof CSSStyleDeclaration];
        if (typeof val === 'function') {
          return function(...args: any[]) {
            const res = (val as Function).apply(target, args);
            if (typeof res === 'string' && res.includes('oklch')) return 'rgba(0, 0, 0, 0)';
            return res;
          };
        }
        if (typeof val === 'string' && val.includes('oklch')) {
          return 'rgba(0, 0, 0, 0)';
        }
        return val;
      }
    });
  };

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
  } catch (err) {
    console.error("Image generation failed:", err);
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
};

export const downloadElementAsPDF = (element: HTMLElement, filename: string, isIDCard: boolean = false) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Temporarily patch getComputedStyle to bypass html2canvas oklch parser bugs
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(elt, pseudoElt) {
    const computedStyle = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(computedStyle, {
      get(target, prop, receiver) {
        const val = target[prop as keyof CSSStyleDeclaration];
        if (typeof val === 'function') {
          return function(...args: any[]) {
            const res = (val as Function).apply(target, args);
            if (typeof res === 'string' && res.includes('oklch')) return 'rgba(0, 0, 0, 0)';
            return res;
          };
        }
        if (typeof val === 'string' && val.includes('oklch')) {
          return 'rgba(0, 0, 0, 0)';
        }
        return val;
      }
    });
  };

  const opt = {
    margin:       isIDCard ? 0 : 10,
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 1 },
    pagebreak:    isIDCard ? { mode: ['avoid-all'] } : { mode: ['css', 'legacy'] },
    html2canvas:  { 
      scale: isMobile ? 3 : 4, 
      useCORS: true, 
      logging: false, 
      windowWidth: isIDCard ? 324 : undefined,
      windowHeight: isIDCard ? 516 : undefined,
      width: isIDCard ? 324 : undefined,
      height: isIDCard ? 516 : undefined
    },
    jsPDF:        isIDCard ? { unit: 'mm' as const, format: [54, 86] as [number, number], orientation: 'portrait' as const } : { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    window.getComputedStyle = originalGetComputedStyle;
  }).catch((err: any) => {
    window.getComputedStyle = originalGetComputedStyle;
    console.error("PDF generation failed:", err);
  });
};

export const downloadPDF = (htmlString: string, filename: string) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile || filename.includes('IDCard')) {
    // True download for mobile devices and ID cards using html2pdf
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '1024px';
    iframe.style.height = '1024px';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(htmlString);
    doc.close();

    const isIDCard = filename.includes('IDCard');
    
    // Give external fonts and images time to load
    setTimeout(() => {
      const element = isIDCard ? ((doc.querySelector('.id-card') as HTMLElement) || doc.body) : doc.body;

      // Temporarily patch getComputedStyle to bypass html2canvas oklch parser bugs
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function(elt, pseudoElt) {
        const computedStyle = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(computedStyle, {
          get(target, prop, receiver) {
            const val = target[prop as keyof CSSStyleDeclaration];
            if (typeof val === 'function') {
              return function(...args: any[]) {
                const res = (val as Function).apply(target, args);
                if (typeof res === 'string' && res.includes('oklch')) return 'rgba(0, 0, 0, 0)';
                return res;
              };
            }
            if (typeof val === 'string' && val.includes('oklch')) {
              return 'rgba(0, 0, 0, 0)';
            }
            return val;
          }
        });
      };

      const opt = {
        margin:       isIDCard ? 0 : 10,
        filename:     filename,
        image:        { type: 'jpeg' as const, quality: 1 },
        pagebreak:    isIDCard ? { mode: ['avoid-all'] } : { mode: ['css', 'legacy'] },
        html2canvas:  { 
          scale: isMobile ? 3 : 4, 
          useCORS: true, 
          logging: false, 
          windowWidth: isIDCard ? 324 : 1024,
          windowHeight: isIDCard ? 432 : undefined,
          width: isIDCard ? 324 : undefined,
          height: isIDCard ? 432 : undefined
        },
        jsPDF:        isIDCard ? { unit: 'mm' as const, format: [9, 12] as [number, number], orientation: 'portrait' as const } : { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        window.getComputedStyle = originalGetComputedStyle;
        document.body.removeChild(iframe);
      }).catch((err: any) => {
        window.getComputedStyle = originalGetComputedStyle;
        console.error("PDF generation failed:", err);
        document.body.removeChild(iframe);
      });
    }, 1000);
  } else {
    // Native print dialog for desktop general reports
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(htmlString);
    doc.close();

    doc.title = filename.replace('.pdf', '');

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
};
