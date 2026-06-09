import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './companyDetails.css';
import { FaPlus, FaEllipsisV } from 'react-icons/fa';
import { Users, ShieldAlert } from 'lucide-react';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCompanies();
    fetchCurrentCompany();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/company/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCompanies(res.data);
    } catch (error) {
      console.error('Failed to fetch companies', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCompany = async () => {
    try {
      const res = await axios.get('http://localhost:8000/company/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentCompany(res.data);
    } catch (error) {
      console.error('Failed to fetch current company', error);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="companies-container">
        <h3>Loading companies...</h3>
      </div>
    );
  }

  return (
    <div className="companies-container">
      {/* Header */}
      <div className="companies-header">
        <div className="companies-title">
          <h1>Companies</h1>
          <p>
            Manage companies registered in EEMS. Your workspace:
            <strong>{currentCompany?.name || 'Company A'}</strong>
          </p>
        </div>

        <button className="add-company-btn">
          <FaPlus /> Add Company
        </button>
      </div>

      {/* Company Table */}
      <div className="company-card">

        

      <table className="company-table">
          <thead>
            <tr>
              <th>COMPANY NAME</th>
              <th>SLUG</th>
              <th>EMPLOYEES</th>
              <th>USERS</th>
              <th>YOUR ACCESS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {companies.length > 0 ? (
              companies.map((company) => (
                <tr key={company._id}>
                  <td>
                    <div className="company-info">
                      <div className="company-avatar">
                        {getInitials(company.name)}
                      </div>

                      <span>{company.name}</span>
                    </div>
                  </td>

                  <td>{company.slug}</td>

                  <td>{company.employeeCount || 0}</td>

                  <td>{company.userCount || 0}</td>

                  <td>
                    {company.isCurrentCompany ? (
                      <span className="badge-current">
                        Current Company
                      </span>
                    ) : (
                      <span className="badge-isolated">
                        Isolated Tenant
                      </span>
                    )}
                  </td>

                  <td>
                    <button className="action-btn">
                      <FaEllipsisV />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No companies found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="company-footer">
          <p>
            Showing 1 to {companies.length} of {companies.length} companies
          </p>

          <div className="pagination">
            <button className="page-btn">{'<'}</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">{'>'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Companies;