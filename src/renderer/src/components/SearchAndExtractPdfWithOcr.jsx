import React, { useState } from 'react'
import { Container, Row, Col, Button, Input } from 'reactstrap'

const SearchAndExtractPdfWithOcr = () => {
  const [pdfFile, setPdfFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [resultFilePath, setResultFilePath] = useState('')

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0])
    setResultFilePath('')
    setError('')
  }

  const handleSearch = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file first.')
      return
    }

    if (!searchQuery) {
      setError('Please enter a search query.')
      return
    }

    const filePath = pdfFile.path

    try {
      const result = await window.electron.ipcRenderer.send('search-and-create-pdf-ocr', filePath, searchQuery)
      if (result.error) {
        setError(result.error)
      } else {
        setResultFilePath(result.filePath)
      }
    } catch (error) {
      console.error('Error searching and creating PDF with OCR:', error)
      setError('Internal Server Error')
    }
  }

  return (
    <Container fluid>
      <Row className="mt-5">
        <Col md={{ size: 6, offset: 3 }}>
          <h1>Search and Extract PDF with OCR</h1>
          <Input type="file" onChange={handleFileChange} />
          <Input
            type="text"
            placeholder="Search query"
            className="mt-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {error && <p className="text-danger mt-3">{error}</p>}
          <Button color="dark" className="mt-3" onClick={handleSearch}>Search and Extract</Button>
          {resultFilePath && (
            <p className="mt-3">
              New PDF created: <a href={`file://${resultFilePath}`} target="_blank" rel="noopener noreferrer">Open PDF</a>
            </p>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default SearchAndExtractPdfWithOcr
