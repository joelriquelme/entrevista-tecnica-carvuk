import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ReceiptDetailPage } from './pages/ReceiptDetailPage'
import { ReceiptsPage } from './pages/ReceiptsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogPage />} />
        <Route path="productos/:id" element={<ProductDetailPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="boletas" element={<ReceiptsPage />} />
        <Route path="boletas/:id" element={<ReceiptDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
