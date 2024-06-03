import React, { useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import Tesseract from 'tesseract.js'
import 'pdfjs-dist/build/pdf.worker.entry'

const PdfReader = () => {
  const [pdf, setPdf] = useState(null)
  const [textData, setTextData] = useState([])
  const [searchResult, setSearchResult] = useState(null)
  const [query, setQuery] = useState('')

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = async () => {
        const pdfData = new Uint8Array(reader.result)
        GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js'
        const pdfDocument = await getDocument({ data: pdfData }).promise
        setPdf(pdfDocument)

        const numPages = pdfDocument.numPages
        const textArray = []

        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDocument.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({ canvasContext: context, viewport }).promise

          const textContent = await page.getTextContent()
          const strings = textContent.items.map((item) => item.str).join(' ')

          textArray.push({ page: i, text: strings })

          const imgSrc = canvas.toDataURL()
          console.log('image ser', imgSrc)
          const ocrResult = await Tesseract.recognize(imgSrc, 'eng')

          const ocrText = ocrResult.data.text
          console.log('text ===>', ocrText)
          textArray.push({ page: i, text: ocrText })
        }

        setTextData(textArray)
      }
    }
  }

  const handleSearch = () => {
    const queryLower = query.toLowerCase()
    const result = textData.find((item) => item.text.toLowerCase().includes(queryLower))
    setSearchResult(result ? result.page : 'Not found')
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, padding: '10px' }}>
        {pdf && (
          <div>
            {Array.from({ length: pdf.numPages }, (_, index) => (
              <canvas
                key={index}
                ref={async (canvas) => {
                  if (canvas) {
                    const page = await pdf.getPage(index + 1)
                    const viewport = page.getViewport({ scale: 1 })
                    const context = canvas.getContext('2d')
                    canvas.width = viewport.width
                    canvas.height = viewport.height

                    await page.render({ canvasContext: context, viewport }).promise
                  }
                }}
              ></canvas>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        <input type="file" onChange={handleFileChange} accept="application/pdf" />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        {searchResult !== null && <p>Found on page: {searchResult}</p>}
      </div>
    </div>
  )
}

export default PdfReader

// import React, { useState } from 'react';
// import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// import 'pdfjs-dist/build/pdf.worker.entry';

// const PdfReader = () => {
//   const [images, setImages] = useState([]);

//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.readAsArrayBuffer(file);
//       reader.onload = async () => {
//         const pdfData = new Uint8Array(reader.result);
//         GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
//         const pdf = await getDocument({ data: pdfData }).promise;
//         const numPages = pdf.numPages;
//         const imageArray = [];

//         for (let i = 1; i <= numPages; i++) {
//           const page = await pdf.getPage(i);
//           const viewport = page.getViewport({ scale: 1 });
//           const canvas = document.createElement('canvas');
//           const context = canvas.getContext('2d');
//           canvas.width = viewport.width;
//           canvas.height = viewport.height;

//           await page.render({ canvasContext: context, viewport }).promise;
//           const imgSrc = canvas.toDataURL();
//           imageArray.push(imgSrc);
//         }

//         setImages(imageArray);
//       };
//     }
//   };

//   return (
//     <div>
//       <input type="file" onChange={handleFileChange} accept="application/pdf" />
//       {images.map((src, index) => (
//         <img key={index} src={src} alt={`Page ${index + 1}`} />
//       ))}
//     </div>
//   );
// };

// export default PdfReader;
