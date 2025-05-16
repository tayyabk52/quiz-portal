import React from 'react';
import styled from 'styled-components';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';

const LayoutContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContentWrapper = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const NavbarWrapper = styled.nav`
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
`;

const NavbarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
`;

const UserInfo = styled.div`
  margin-right: 20px;
  font-size: 0.9rem;
  color: var(--light-text);
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;

  &:hover {
    background-color: var(--primary-color);
    color: white;
  }
`;

const Footer = styled.footer`
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eee;
  color: var(--light-text);
  font-size: 0.9rem;
`;

const Layout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Don't show navbar on login page
  const isLoginPage = location.pathname === '/';
  
  return (
    <LayoutContainer>
      {!isLoginPage && user && (
        <NavbarWrapper>
          <NavbarContent>
            <Logo>Quiz Portal</Logo>
            <NavActions>
              <UserInfo>
                Logged in as: {user.email.split('@')[0]}
              </UserInfo>
              <LogoutButton onClick={handleLogout}>
                Logout
              </LogoutButton>
            </NavActions>
          </NavbarContent>
        </NavbarWrapper>
      )}
      
      <MainContentWrapper>
        {children}
      </MainContentWrapper>
      
      <Footer>
        &copy; {new Date().getFullYear()} Quiz Portal. All Rights Reserved.
      </Footer>
    </LayoutContainer>
  );
};

export default Layout;
