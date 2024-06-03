import { dialog } from 'electron'
import fs, { readFile, writeFile } from 'fs-extra'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import pdfParse from 'pdf-parse'
import Tesseract from 'tesseract.js'

export const searchAndCreatePdfWithOcr = async (filePath, query) => {
  try {
    console.log('file path:', filePath, 'query:', query)

    const pdfBytes = await readFile(filePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const textContent = await pdfParse(pdfBytes)
    const text = textContent.text
    // console.log("text ==>" , text)
    console.log("textContent ==>" , textContent)

    const occurrences = []
    const regex = new RegExp(query, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      occurrences.push(match.index)
    }
    console.log('occurrences ==>', occurrences)

    const pagesWithQuery = new Set()

    // Iterate through each page
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      // Get the text content of the current page
      const pageText = textContent.text.split(/\f/)[i] // Split text by form feed character to separate pages

      if (pageText && regex.test(pageText)) {
        pagesWithQuery.add(i + 1)
      }
    }

    // Extract images and perform OCR on them
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i)
      const images = page.node.Resources.XObject
      // console.log('page ==>', page)
      // console.log('images ==>', images)
      if (images) {
        console.log(`Page ${i + 1} has images:`, images)
        for (const imageName in images) {
          if (images[imageName].Subtype === 'Image') {
            try {
              const image = images[imageName]
              const imageData = await image.getBytes()
              const {
                data: { text: imageText }
              } = await Tesseract.recognize(imageData, 'eng')

              if (imageText.includes(query)) {
                pagesWithQuery.add(i + 1)
              }
            } catch (imageError) {
              console.error(`Error processing image on page ${i + 1}:`, imageError)
            }
          }
        }
      } else {
        // console.log(`Page ${i + 1} has no images.`)
      }
    }

    if (pagesWithQuery.size === 0) {
      throw new Error('Query not found in the PDF.')
    }
    console.log('pagesWithQuery ==>', pagesWithQuery)

    const newPdfDoc = await PDFDocument.create()
    for (const page of pagesWithQuery) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [page - 1])
      newPdfDoc.addPage(copiedPage)
    }

    const newPdfBytes = await newPdfDoc.save()
    const newPdfPath = path.join(path.dirname(filePath), `result_${Date.now()}.pdf`)
    await writeFile(newPdfPath, newPdfBytes)

    console.log('New PDF created at:', newPdfPath)
    return newPdfPath
  } catch (error) {
    console.error('Error searching and creating PDF with OCR:', error)
    throw error
  }
}
