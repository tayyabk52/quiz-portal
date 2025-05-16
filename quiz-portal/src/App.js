import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Components
import Login from './components/auth/Login';
import Instructions from './components/quiz/Instructions';
import Quiz from './components/quiz/Quiz';
import Result from './components/result/Result';
import Admin from './components/admin/Admin';
import Layout from './components/layout/Layout';

// App styling is now handled by the Layout component

// Check if a user has admin privileges
const isAdmin = (user) => {
  // In a real application, this would check for admin role in Firebase
  // For this example, we'll assume emails containing "admin" are admins
  return user && user.email && user.email.includes('admin');
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Security features are now handled by the QuizSecurity component
  // and will be activated/deactivated in the Quiz component

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={!user ? <Login /> : <Navigate to="/instructions" />} />
          <Route path="/instructions" element={user ? <Instructions /> : <Navigate to="/" />} />
          <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/" />} />
          <Route path="/result" element={user ? <Result /> : <Navigate to="/" />} />
          <Route path="/admin" element={user && isAdmin(user) ? <Admin /> : <Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
