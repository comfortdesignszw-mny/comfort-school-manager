import html2pdf from 'html2pdf.js';

export const downloadPDF = (htmlString: string, filename: string) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile || filename.includes('IDCard')) {
    // True download for mobile devices and ID cards using html2pdf
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

    const isIDCard = filename.includes('IDCard');
    
    // Give external fonts and images time to load
    setTimeout(() => {
      const element = doc.body;
      const opt = {
        margin:       isIDCard ? 0 : 10,
        filename:     filename,
        image:        { type: 'jpeg' as const, quality: 1 },
        html2canvas:  { scale: 3, useCORS: true, logging: false },
        jsPDF:        isIDCard ? { unit: 'px' as const, format: [320, 480] as [number, number], orientation: 'portrait' as const } : { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
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
