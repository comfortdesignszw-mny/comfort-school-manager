// @ts-ignore
import html2pdf from 'html2pdf.js';

export const downloadPDF = (htmlString: string, filename: string) => {
  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(htmlString).save();
};
