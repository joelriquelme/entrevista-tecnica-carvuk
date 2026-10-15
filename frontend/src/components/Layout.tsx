import { UserButton } from '@clerk/react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { isAuthEnabled } from '../auth/config'
import { useCart } from '../cart/CartContext'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav__link nav__link--active' : 'nav__link'

export function Layout() {
  const { itemCount } = useCart()

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="brand">
            Carrito Feliz <span aria-hidden="true">🛒</span>
          </Link>
          <nav className="nav" aria-label="Navegación principal">
            <NavLink to="/" end className={navClassName}>
              Catálogo
            </NavLink>
            <NavLink to="/carrito" className={navClassName}>
              Carrito
              {itemCount > 0 && (
                <span className="nav__badge" aria-label={`${itemCount} unidades`}>
                  {itemCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/boletas" className={navClassName}>
              Boletas
            </NavLink>
          </nav>
          {isAuthEnabled && (
            <div className="header__user">
              <UserButton />
            </div>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
