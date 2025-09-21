import { NavLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink to="/">ChatApp</NavLink>
            </div>
            <div className="navbar-menu">
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)}>Accueil</NavLink>
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)}>Se connecter</NavLink>
                <NavLink to="/register" className={({ isActive }) => (isActive ? 'active-nav-link' : undefined)}>S'inscrire</NavLink>
            </div>
        </nav>
    )
}

export default Navbar;