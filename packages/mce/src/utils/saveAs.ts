export function saveAs(
  blobOrString: Blob | string,
  filename: string,
) {
  const blob
    = typeof blobOrString === 'string'
      ? new Blob([blobOrString], { type: 'application/octet-stream' })
      : blobOrString

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename

  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}
