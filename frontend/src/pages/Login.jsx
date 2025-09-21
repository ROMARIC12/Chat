import React, { useState } from 'react';
import { loginUser } from "../services/authService";
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [ message, setMessage ] = useState({ type: "", text: "" });
    const [ isLoading, setIsLoading ] = useState(false);

    const [ formData, setFormData ] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const validation = () => {
        if(!formData.email || !formData.password) {
            setMessage({ type: "error", text: "Veuillez remplir tous les champs" });
            return false;
        }

        if(formData.password.length < 8) {
            setMessage({ type: "error", text: "Votre mot de passe à moins 8 caractères" });
            return false;
        }
        return true;
    }

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!validation()) return;

        setIsLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await loginUser(formData);
            console.log("🔍 Données de réponse :", response);

            setMessage({ type:"success", text: "Connexion en cours..." });
            localStorage.setItem('token', response.token);
            localStorage.setItem('userId', response.user._id);
            localStorage.setItem('email', formData.email);
            console.log("💾 userId stocké dans localStorage:", response.user._id);
            
            if(formData.email === "yaoyaopascal77@gmail.com") {
                setTimeout(() => window.location.href = "/admin", 1200);
            } else {
                setTimeout(() => window.location.href = "/chat", 1200);
            }
        } catch (error) {
            setMessage({type: "error", text: error.message});
            setIsLoading(false);
        }
    }

    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <main className="login-container">
            <div className="login-form">
                <h2>🚀 Se connecter</h2>
                <p>Vous n'avez pas un compte ? <a href="/register">Inscrivez-vous</a></p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">📧 Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name='email' 
                            value={formData.email} 
                            placeholder="Entrer votre email" 
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="form-group password-input-wrapper">
                        <label htmlFor="password">🔒 Mot de passe</label>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            name='password' 
                            value={formData.password} 
                            id="password" 
                            placeholder="Entrer votre mot de passe" 
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={togglePasswordVisibility}
                            style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                        >
                            <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        className="submit-btn btn-blue"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span style={{ marginRight: '0.5rem' }}>⏳</span>
                                Connexion en cours...
                            </>
                        ) : (
                            <>
                                <span style={{ marginRight: '0.5rem' }}>🔐</span>
                                Se connecter
                            </>
                        )}
                    </button>
                    
                    <p><a href="/forgot-password">❓ Mot de passe oublié ?</a></p>

                    {message.text && (
                        <div className={`message ${message.type === "error" ? "error-msg" : "success-msg"}`}>
                            <span style={{ marginRight: '0.5rem' }}>
                                {message.type === "error" ? "⚠️" : "✅"}
                            </span>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </main>
    )
}

export default Login; 