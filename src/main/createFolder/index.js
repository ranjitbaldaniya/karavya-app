import { dialog } from 'electron'
import { pathExists } from 'fs-extra'
import fs from 'fs'
import path from 'path'

export const createFolders = async (selectedDoctors, selectedPath) => {
  try {
    const exists = await pathExists(selectedPath)
    console.log('exists ==>', exists)

    if (!exists) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Folder not found',
        message: `The selected path ${selectedPath} does not exist. Please select a valid folder.`
      })
      return
    }
    const appFolderPath = selectedPath

    const existingDoctorNames = fs.readdirSync(appFolderPath)
    console.log('selected doctors ==>', selectedDoctors)
    selectedDoctors.forEach((doctor) => {
      const doctorFolderName = `${doctor.doctorName}`
      if (existingDoctorNames.includes(doctorFolderName)) {
        console.log(`${doctorFolderName} already exists, skipping...`)
        return
      }

      const doctorFolderPath = path.join(appFolderPath, doctorFolderName)
      const dateFolderPath = path.join(doctorFolderPath, doctor.todaysDate)

      if (!fs.existsSync(doctorFolderPath)) {
        fs.mkdirSync(doctorFolderPath, { recursive: true })
      }
      if (!fs.existsSync(dateFolderPath)) {
        fs.mkdirSync(dateFolderPath, { recursive: true })
      }

      console.log('doctor.vendor ==>', doctor.vendor)
      let vendorFolderPath;
      if (doctor.vendor === "GEICO" || doctor.vendor === "Geico" ) {
        console.log("its calledd")
        vendorFolderPath = path.join(dateFolderPath, "GEICO");
      } else {
        const nonGeicoFolderPath = path.join(dateFolderPath, "NON-GEICO");
        if (!fs.existsSync(nonGeicoFolderPath)) {
          fs.mkdirSync(nonGeicoFolderPath, { recursive: true });
        }
        vendorFolderPath = path.join(
          nonGeicoFolderPath,
          doctor.vendor.toUpperCase()
        ); // Capitalize vendor name
      }
      const reportType = doctor.reportType === 'Retrospective' ? 'Resrospective' : 'Prospective'
      const reportTypeFolderPath = path.join(vendorFolderPath, reportType)

      if (!fs.existsSync(reportTypeFolderPath)) {
        fs.mkdirSync(reportTypeFolderPath, { recursive: true })
      }

      const finalFolderPath = path.join(
        reportTypeFolderPath,
        `${doctor.docId} ${doctor.patientName}`
      )
      if (!fs.existsSync(finalFolderPath)) {
        fs.mkdirSync(finalFolderPath, { recursive: true })
      }

      // Create the .docx files in the final folder
      const docxFilesContent = {
        'DAIGNOSIS.docx': '',
        'SPECIAL_INSTRUCTIONS.docx': ''
      }

      Object.keys(docxFilesContent).forEach((fileName) => {
        const filePath = path.join(finalFolderPath, fileName)
        fs.writeFileSync(filePath, docxFilesContent[fileName])
      })
    })

    // Show success message
    await dialog.showMessageBox({
      type: 'info',
      title: 'Folders created',
      message: 'Folders created successfully.'
    })
  } catch (error) {
    console.error('Error creating folders:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Failed to create folders. Please try again.'
    })
  }
}
