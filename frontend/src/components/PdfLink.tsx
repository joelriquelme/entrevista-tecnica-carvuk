type PdfLinkProps = {
  url: string
  receiptId: number
}

export function PdfLink({ url, receiptId }: PdfLinkProps) {
  if (!url) return <span className="muted">—</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir PDF de la boleta ${receiptId} en una nueva pestaña`}
    >
      Ver PDF
    </a>
  )
}
