import React, { useState, useEffect, useRef } from 'react';
import './Home.css';

const Home = () => {
    const [animated, setAnimated] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState([
        { text: "Salut ! Comment ça va ?", type: "received", time: "14:30" },
        { text: "Très bien, merci ! Et toi ?", type: "sent", time: "14:31" },
        { text: "Parfait ! On se voit demain ?", type: "received", time: "14:32" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const stepsRef = useRef(null);
    const ctaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimated(true);
        }, 100);

        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % 3);
        }, 3000);

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll');
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        [heroRef, featuresRef, stepsRef, ctaRef].forEach(ref => {
            if (ref.current) {
                observer.observe(ref.current);
            }
        });

        return () => {
            clearTimeout(timer);
            clearInterval(stepInterval);
            [heroRef, featuresRef, stepsRef, ctaRef].forEach(ref => {
                if (ref.current) {
                    observer.unobserve(ref.current);
                }
            });
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = (e) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            const now = new Date();
            const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const newMessage = { text: inputValue, type: "sent", time: timeString };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setInputValue('');

            // Simuler une réponse de l'IA après un court délai
            setTimeout(() => {
                const now = new Date();
                const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                const botReply = { text: "C'est super ! Je suis un bot, mais j'aime bien discuter aussi.", type: "received", time: timeString };
                setMessages(prevMessages => [...prevMessages, botReply]);
            }, 1000); // 1 seconde de délai
        }
    };

    const features = [
        {
            icon: '💬',
            title: 'Messagerie en temps réel',
            description: 'Échangez instantanément avec vos contacts grâce à notre technologie temps réel.'
        },
        {
            icon: '👥',
            title: 'Groupes dynamiques',
            description: 'Créez et gérez des groupes thématiques pour vos projets et communautés.'
        },
        {
            icon: '🔒',
            title: 'Sécurité maximale',
            description: 'Vos conversations sont protégées par un chiffrement de bout en bout.'
        },
        {
            icon: '📱',
            title: 'Multi-plateforme',
            description: 'Accédez à vos conversations depuis n\'importe quel appareil.'
        },
        {
            icon: '📎',
            title: 'Partage de médias',
            description: 'Partagez photos, vidéos et documents en toute simplicité.'
        },
        {
            icon: '⚡',
            title: 'Performance optimale',
            description: 'Interface fluide et réactive pour une expérience utilisateur exceptionnelle.'
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Créez votre compte',
            description: 'Inscription rapide et sécurisée en quelques clics.'
        },
        {
            number: '02',
            title: 'Connectez-vous',
            description: 'Accédez à votre espace personnel et commencez à discuter.'
        },
        {
            number: '03',
            title: 'Communiquez librement',
            description: 'Profitez de toutes les fonctionnalités pour rester connecté.'
        }
    ];

    return (
        <div className="home-container">
            <section className="hero-section" ref={heroRef}>
                <div className="hero-background">
                    <div className="hero-shapes">
                        <div className="shape shape-1"></div>
                        <div className="shape shape-2"></div>
                        <div className="shape shape-3"></div>
                    </div>
                </div>
                
                <div className="hero-content container">
                    <div className="hero-text">
                        <p className={`hero-description ${animated ? 'fade-in-up delay-1' : ''}`}>
                            Communiquez n toutes tranquillité et simplicité avec nous.
                        </p>
                        <div className={`hero-buttons ${animated ? 'fade-in-up delay-2' : ''}`}>
                            <a href="/register" className="btn btn-primary btn-large">Commencer maintenant</a>
                            <a href="/login" className="btn btn-secondary btn-large">Se connecter</a>
                        </div>
                    </div>
                    <div className={`hero-visual ${animated ? 'fade-in-right' : ''}`}>
                        <div className="phone-mockup">
                            <div className="phone-screen">
                                <div className="chat-interface-mockup">
                                    <div className="mockup-header">
                                        <div className="mockup-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                    <div className="mockup-messages">
                                        {messages.map((msg, index) => (
                                            <div key={index} className={`message message-${msg.type}`}>
                                                <div className="message-bubble">{msg.text}</div>
                                                <div className="message-time">{msg.time}</div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="mockup-input-container">
                                        <input
                                            type="text"
                                            className="mockup-input"
                                            placeholder="Tapez un message..."
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleSendMessage}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="phone-notch"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section" ref={featuresRef}>
                <div className="container">
                    <div className={`section-header ${featuresRef.current ? 'animate-on-scroll' : ''}`}>
                        <h2 className="section-title">Fonctionnalités puissantes</h2>
                        <p className="section-description">
                            Découvrez les fonctionnalités qui font chez ChatApp une expérience de communication unique.
                        </p>
                    </div>
                    <div className={`features-grid ${featuresRef.current ? 'animate-on-scroll' : ''}`}>
                        {features.map((feature, index) => (
                            <div className="feature-card" key={index}>
                                <span className="feature-icon">{feature.icon}</span>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="steps-section" ref={stepsRef}>
                <div className="container">
                    <div className={`section-header ${stepsRef.current ? 'animate-on-scroll' : ''}`}>
                        <h2 className="section-title">Comment ça marche ?</h2>
                        <p className="section-description">
                            Commencez votre aventure en quelques étapes simples.
                        </p>
                    </div>
                    <div className={`steps-container ${stepsRef.current ? 'animate-on-scroll' : ''}`}>
                        {steps.map((step, index) => (
                            <div className={`step-card ${currentStep === index ? 'active' : ''}`} key={index}>
                                <span className="step-number">{step.number}</span>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                                {index < steps.length - 1 && <span className="step-arrow">&rarr;</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta-section" ref={ctaRef}>
                <div className="container">
                    <div className={`cta-content ${ctaRef.current ? 'animate-on-scroll' : ''}`}>
                        <h2 className="cta-title">Prêt à commencer ?</h2>
                        <p className="cta-description">
                            Rejoignez des milliers d'utilisateurs et découvrez une communication plus fluide.
                        </p>
                        <div className="cta-buttons">
                            <a href="/register" className="btn btn-primary btn-large">Commencer maintenant</a>
                            <a href="/login" className="btn btn-outline btn-large">En savoir plus</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
