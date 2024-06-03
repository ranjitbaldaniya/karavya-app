import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Button, Input } from 'reactstrap'

const ExtractPdf = () => {
  const initialFileInfo = { name: '', selectedPages: '' }

  const [pdfFile, setPdfFile] = useState(null)
  const [filesInfo, setFilesInfo] = useState([initialFileInfo])
  const [pdfPath, setPdfPath] = useState('')
  const [error, setError] = useState('')
  const [isCreateButtonDisabled, setIsCreateButtonDisabled] = useState(true)

  const fileInputRefs = useRef([])

  useEffect(() => {
    const isAnyFieldEmpty = filesInfo.some((info) => !info.name || !info.selectedPages)
    setIsCreateButtonDisabled(!pdfPath || isAnyFieldEmpty)
  }, [filesInfo, pdfPath])

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    console.log('file==>', file)
    setPdfFile(file)
  }

  const addMoreFields = useCallback(() => {
    setFilesInfo([...filesInfo, initialFileInfo])
  }, [filesInfo])

  useEffect(() => {
    const newIndex = filesInfo.length - 1
    if (fileInputRefs.current[newIndex]) {
      fileInputRefs.current[newIndex].focus()
    }
  }, [filesInfo.length])

  const removeFields = (indexToRemove) => {
    setFilesInfo(filesInfo.filter((_, index) => index !== indexToRemove))
  }

  const handleFileNameChange = useCallback(
    (index, value) => {
      const updatedFilesInfo = [...filesInfo]
      updatedFilesInfo[index].name = value
      setFilesInfo(updatedFilesInfo)
    },
    [filesInfo]
  )

  const handleSelectedPagesChange = useCallback(
    (index, value) => {
      const updatedFilesInfo = [...filesInfo]
      updatedFilesInfo[index].selectedPages = value
      setFilesInfo(updatedFilesInfo)
    },
    [filesInfo]
  )

  const handleFilePathChange = useCallback((e) => {
    setPdfPath(e.target.value)
  }, [])

  const clearForm = () => {
    console.log('called')
    const input = document.querySelector('input[type="file"]')
    if (input) {
      input.value = ''
    }
    setPdfFile(null)
    setFilesInfo([initialFileInfo])
    setPdfPath('')
    setError('')
  }

  const selectFolder = async () => {
    const result = await window.electron.ipcRenderer.send('select-dirs')
    // console.log('result', result    )
    await window.electron.ipcRenderer.once('select-dirs', (event, filepath) => {
      console.log('filepath', filepath[0])
      setPdfPath(filepath[0])
    })
  }

  const sendToIPCMain = async () => {
    const pdfFileName = pdfFile.name
    const uploadedFilePath = pdfFile.path
    // Convert page ranges to individual page numbers
    const updatedFilesInfo = filesInfo.map((info) => {
      const updatedInfo = { ...info }
      const pages = info.selectedPages.split(',').map((page) => page.trim())
      const updatedPages = []
      pages.forEach((page) => {
        if (page.includes('-')) {
          const [start, end] = page.split('-').map((num) => parseInt(num.trim()))
          for (let i = start; i <= end; i++) {
            updatedPages.push(i)
          }
        } else {
          updatedPages.push(parseInt(page))
        }
      })
      updatedInfo.selectedPages = updatedPages.join(',')
      return updatedInfo
    })
    // console.log('updatedFilesInfo ==>', updatedFilesInfo)
    const formData = { uploadedFilePath, pdfFileName, pdfPath, updatedFilesInfo }
    // console.log('Sending PDF file to main process...', formData)

    await window.electron.ipcRenderer.send('create-pdfs', formData)
  }

  const createPdf = async () => {
    // Check if any required field is empty
    const isAnyFieldEmpty = filesInfo.some((info) => !info.name || !info.selectedPages)

    if (!pdfPath || isAnyFieldEmpty) {
      setError('Please fill all required fields.')
      return
    }

    try {
      const res = sendToIPCMain()
      console.log('res ==>', res)
    } catch (error) {
      console.error('Error:', error)
      setError('Internal Server Error')
    }
  }

  // Rendering logic for multiple file inputs
  const renderFileInputs = () => {
    return filesInfo.map((info, index) => (
      <Row key={index} className="mt-3 mb-3">
        <Col md="1"></Col>
        <Col md="4">
          <Input
            className="mb-2"
            type="text"
            placeholder="File Name"
            value={info.name}
            onChange={(e) => handleFileNameChange(index, e.target.value)}
            innerRef={(inputRef) => (fileInputRefs.current[index] = inputRef)}
          />
        </Col>
        <Col md="4">
          <Input
            type="text"
            placeholder="Add Pages Ex:1,2,5-10,12"
            value={info.selectedPages}
            onChange={(e) => handleSelectedPagesChange(index, e.target.value)}
          />
        </Col>

        <Col md="1">
          {index === filesInfo.length - 1 && (
            <Button color="dark" onClick={addMoreFields}>
              Add
            </Button>
          )}
        </Col>
        <Col md="1">
          {index > 0 && (
            <Button color="danger" className="ms-2" onClick={() => removeFields(index)}>
              Remove
            </Button>
          )}
        </Col>

        <Col md="2"></Col>
      </Row>
    ))
  }

  return (
    <Container fluid>
      <Row>
        <Col md={12} sm={12} className="mt-5 d-flex justify-content-end">
          <Link to={'/'}>
            <Button color="dark" className="me-4">
              Back
            </Button>
          </Link>
        </Col>
      </Row>
      <Row className="justify-content-center align-items-center h-100 mt-2 w-100">
        <Col xs="12" md="12">
          <div className="border border-black p-3 rounded mb-3">
            <h1>PDF Creator</h1>
            <hr />
            <input type="file" onChange={(e) => onDrop(e.target.files)} />
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mt-2">
          <Col md={{ size: 6, offset: 3 }}>
            <p className="text-danger">{error}</p>
          </Col>
        </Row>
      )}
      {pdfFile && (
        <>
          <Row className="mt-3">
            <Col md={{ size: 8, offset: 1 }}>
              <Input type="text" value={pdfPath} onChange={handleFilePathChange} />
            </Col>
            <Col md={{ size: 3 }}>
              <Button color="dark" onClick={selectFolder}>
                Select Path
              </Button>
            </Col>
          </Row>
        </>
      )}
      {pdfFile && renderFileInputs()}
      {pdfFile && (
        <Row className="mb-5 mt-3">
          {/* <Col md="6"></Col> */}
          <Col md={{ size: 10, offset: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <Button
                color="dark"
                className="me-3"
                onClick={createPdf}
                disabled={isCreateButtonDisabled}
              >
                Create PDF
              </Button>
              <Button color="danger" onClick={clearForm}>
                Clear Files
              </Button>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default ExtractPdf
