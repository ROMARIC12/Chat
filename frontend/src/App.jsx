import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";

import Sidebar from "./components/Sidebare";
// import ChatRoom from "./pages/Chat";
import ChatRoom from "./pages/chat";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

import useAuth from "./hooks/useAuth";

const App = () => {
    const isAuth = useAuth();

    return (
        <div className="app">
            <Routes>
                {/* Routes without Navbar/Footer */}
                <Route path="/chat" element={isAuth ? <ChatRoom /> : <Navigate to={"/login"} />} />
                <Route path="/sidebare" element={isAuth ? <Sidebar onUserSelect={() => {}} /> : <Navigate to={"/login"} />} />
                <Route path="/admin" element={isAuth ? <AdminDashboard /> : <Navigate to="/login" />} />

                {/* Routes with Navbar/Footer */}
                <Route path="*" element={
                    <>
                        <Navbar />
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/login" element={<Login />} />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </main>
                        <Footer />
                    </>
                } />
            </Routes>
        </div>
    );
}

export default App;