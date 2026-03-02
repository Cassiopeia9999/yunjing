import axios from 'axios'

/**
 * 将HTML压缩包转换为PDF
 * @param {File} file - HTML压缩包文件
 * @returns {Promise<Blob>} PDF文件Blob
 */
export function convertHtmlToPdf(file) {
  const formData = new FormData()
  formData.append('file', file)

  return axios.post('/pyapi/html-to-pdf', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 下载PDF文件
 * @param {Blob} blob - PDF文件Blob
 * @param {string} filename - 下载文件名
 */
export function downloadPdf(blob, filename = 'output.pdf') {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
