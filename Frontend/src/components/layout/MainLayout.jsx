import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

/**
 * MainLayout Component.
 * Provides the overarching layout structure including Sidebar, Header, and the main content area (Outlet).
 */
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Toggles the visibility of the sidebar.
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="layout-main">
        <Header toggleSidebar={toggleSidebar} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
