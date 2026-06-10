export const downloadPDF = (htmlString: string, filename: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlString);
  doc.close();

  // title is used as the default filename when printing to PDF in most browsers
  doc.title = filename.replace('.pdf', '');

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500); // Give images a moment to load
};
