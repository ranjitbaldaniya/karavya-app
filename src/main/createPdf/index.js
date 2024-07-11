import { dialog } from 'electron'
import fs, { ensureDir, pathExistsSync, readFile, writeFile } from 'fs-extra'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

export const CreatePdfs = async (formData) => {
  const { uploadedFilePath, pdfFileName, pdfPath, updatedFilesInfo } = formData
  console.log('received ==> ', uploadedFilePath, pdfFileName, pdfPath, updatedFilesInfo)
  try {
    console.log('checking path ==>', pathExistsSync(pdfPath))
    // Check if the directory exists
    if (!pathExistsSync(pdfPath)) {
      throw new Error('Path does not exist')
    }

    // Read the uploaded PDF file
    const pdfBytes = await readFile(uploadedFilePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // Normalize the PDF path
    const normalizedPdfPath = path.normalize(pdfPath)

    // Perform operations to create new PDF files based on updatedFilesInfo
    for (const fileInfo of updatedFilesInfo) {
      const selectedPages = fileInfo.selectedPages.split(',').map((page) => parseInt(page.trim()))

      if (!selectedPages || selectedPages.length === 0) {
        throw new Error('No pages selected')
      }

      // Validate selected pages
      for (const page of selectedPages) {
        if (page < 1 || page > pdfDoc.getPageCount()) {
          throw new Error('Invalid page number: ' + page)
        }
      }

      // Create a new PDF containing only selected pages
      const newPdfDoc = await PDFDocument.create()

      for (const page of selectedPages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [page - 1])
        newPdfDoc.addPage(copiedPage)
      }

      // Serialize the new PDF to bytes
      const newPdfBytes = await newPdfDoc.save()

      // Ensure the directory exists
      await ensureDir(normalizedPdfPath)


      // Capitalize the first letter of the file name
      const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

      const fileName = `${capitalizeFirstLetter(fileInfo.name)}.pdf`;
      console.log("file name ===>" , fileName)
      const filePath = path.join(normalizedPdfPath, fileName);

      // Write the PDF bytes to the file system
      await writeFile(filePath, newPdfBytes)
    }

    // Show success message
    await dialog.showMessageBox({
      type: 'info',
      title: 'PDF created',
      message: 'PDFs created successfully.'
    })

    // Return a success message
    return 'PDFs created successfully'
  } catch (error) {
    console.error('Error creating PDFs:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: error.toString()
    })
  }
}
