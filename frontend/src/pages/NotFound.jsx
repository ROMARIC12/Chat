import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="error-code">404</div>
      <h1>Page introuvable</h1>
      <p>Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="home-link">
        <i className="fas fa-home"></i>
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound; 