import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Edit2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import "./HolidayCalendar.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const emptyForm = {
  name: "",
  date: "",
  description: "",
  type: "Public Holiday",
  recurring: false,
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getStoredItem(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function readJsonStorage(keys) {
  for (const key of keys) {
    const value = getStoredItem(key);
    if (!value) continue;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return null;
}

function getToken() {
  const auth = readJsonStorage([
    "auth",
    "authUser",
    "currentUser",
    "user",
    "userData",
    "employee",
  ]);
  return (
    getStoredItem("token") ||
    getStoredItem("access_token") ||
    getStoredItem("accessToken") ||
    auth?.token ||
    auth?.access_token ||
    auth?.accessToken ||
    ""
  );
}

function decodeJwtPayload(token) {
  if (!token || !token.includes(".")) return {};
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

function getCurrentUser() {
  const auth = readJsonStorage([
    "auth",
    "authUser",
    "currentUser",
    "user",
    "userData",
    "employee",
  ]);
  const tokenUser = decodeJwtPayload(getToken());
  return {
    ...tokenUser,
    ...(auth?.user || auth || {}),
  };
}

function getUserRole(user) {
  const directRole = (
    user?.role ||
    user?.user_type ||
    user?.userType ||
    user?.role_name ||
    user?.roleName ||
    user?.type ||
    user?.designation ||
    user?.account_type ||
    user?.accountType ||
    getStoredItem("role") ||
    getStoredItem("userRole") ||
    getStoredItem("user_type") ||
    ""
  )
    .toString()
    .toLowerCase();

  if (directRole) return directRole;

  const storage = [localStorage, sessionStorage];
  for (const store of storage) {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      const rawValue = store.getItem(key);
      if (!rawValue) continue;

      if (rawValue.toLowerCase() === "admin") return "admin";

      try {
        const value = JSON.parse(rawValue);
        const nestedRole = (
          value?.role ||
          value?.user?.role ||
          value?.user_type ||
          value?.user?.user_type ||
          value?.role_name ||
          value?.user?.role_name ||
          ""
        )
          .toString()
          .toLowerCase();

        if (nestedRole) return nestedRole;
        if (value?.is_admin || value?.user?.is_admin) return "admin";
      } catch {
        if (rawValue.toLowerCase().includes('"role":"admin"')) return "admin";
      }
    }
  }

  return "";
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HolidayCalendar() {
  const today = new Date();
  const currentUser = getCurrentUser();
  const role = getUserRole(currentUser);
  const detectedAdmin =
    role.includes("admin") ||
    currentUser?.is_admin ||
    currentUser?.isAdmin ||
    currentUser?.permissions?.includes?.("manage_holidays");
  const isAdmin = detectedAdmin;

  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const years = useMemo(() => {
    const start = today.getFullYear() - 3;
    return Array.from({ length: 8 }, (_, index) => start + index);
  }, [today]);

  const loadHolidays = async (filters = {}) => {
    const selectedYear = filters.year ?? year;
    const selectedMonth = filters.month ?? month;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set("year", selectedYear);
      if (selectedMonth) params.set("month", selectedMonth);
      const data = await request(`/holidays?${params.toString()}`);
      setHolidays(Array.isArray(data) ? data : data?.holidays || []);
    } catch (err) {
      setError(err.message || "Unable to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [year, month]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter((holiday) => {
      const matchesSearch = holiday.name
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesType = !typeFilter || holiday.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holidays, search, typeFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Holiday name is required.");
      return;
    }
    if (!form.date) {
      setError("Holiday date is required.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      if (editingId) {
        await request(`/holidays/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Holiday updated successfully.");
      } else {
        await request("/holidays", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Holiday created successfully.");
      }
      const holidayYear = Number(payload.date.slice(0, 4));
      setYear(holidayYear);
      setMonth("");
      resetForm();
      loadHolidays({ year: holidayYear, month: "" });
    } catch (err) {
      setError(err.message || "Unable to save holiday");
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      name: holiday.name || "",
      date: holiday.date || "",
      description: holiday.description || "",
      type: holiday.type || "Public Holiday",
      recurring: Boolean(holiday.recurring),
    });
    setEditingId(holiday.id);
    setShowForm(true);
  };

  const handleDelete = async (holiday) => {
    const confirmed = window.confirm(`Delete "${holiday.name}"?`);
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await request(`/holidays/${holiday.id}`, { method: "DELETE" });
      setMessage("Holiday deleted successfully.");
      loadHolidays();
    } catch (err) {
      setError(err.message || "Unable to delete holiday");
    }
  };

  return (
    <div className="holiday-calendar-page">
      <div className="holiday-header">
        <div>
          <h1>Holiday Calendar</h1>
          <p>View and manage company holidays</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="holiday-primary-btn"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Add Holiday
          </button>
        )}
      </div>

      {(message || error) && (
        <div className={error ? "holiday-alert error" : "holiday-alert"}>
          {error || message}
        </div>
      )}

      {isAdmin && showForm && (
        <form className="holiday-form" onSubmit={handleSubmit}>
          <div className="holiday-form-header">
            <h2>{editingId ? "Edit Holiday" : "Create Holiday"}</h2>
            <button type="button" className="holiday-icon-btn" onClick={resetForm}>
              <X size={18} />
            </button>
          </div>

          <div className="holiday-form-grid">
            <label>
              Holiday Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Enter holiday name"
                required
              />
            </label>

            <label>
              Holiday Date
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Holiday Type
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                <option>Public Holiday</option>
                <option>Company Holiday</option>
                <option>Optional Holiday</option>
              </select>
            </label>

            <label className="holiday-checkbox">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurring: event.target.checked,
                  }))
                }
              />
              Recurring annually
            </label>

            <label className="holiday-description-field">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional details"
                rows="3"
              />
            </label>
          </div>

          <div className="holiday-form-actions">
            <button type="button" className="holiday-secondary-btn" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="holiday-primary-btn">
              <Save size={18} />
              {editingId ? "Update Holiday" : "Create Holiday"}
            </button>
          </div>
        </form>
      )}

      <div className="holiday-filters">
        <label>
          Year
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Month
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">All Months</option>
            {months.map((item, index) => (
              <option key={item} value={index + 1}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {isAdmin && (
          <>
            <label>
              Search
              <span className="holiday-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name"
                />
              </span>
            </label>

            <label>
              Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="">All Types</option>
                <option>Public Holiday</option>
                <option>Company Holiday</option>
                <option>Optional Holiday</option>
              </select>
            </label>
          </>
        )}
      </div>

      {loading ? (
        <div className="holiday-empty">Loading holidays...</div>
      ) : filteredHolidays.length === 0 ? (
        <div className="holiday-empty">
          <Calendar size={44} />
          <h3>No holidays found</h3>
          <p>Try adjusting your filters to see more holidays.</p>
        </div>
      ) : (
        <div className="holiday-list">
          {filteredHolidays.map((holiday) => (
            <article className="holiday-card" key={`${holiday.id}-${holiday.date}`}>
              <div>
                <div className="holiday-card-title">
                  <h3>{holiday.name}</h3>
                  {holiday.recurring && (
                    <span className="holiday-recurring">
                      <RotateCcw size={14} />
                      Annual
                    </span>
                  )}
                </div>
                <p className="holiday-date">{formatDate(holiday.date)}</p>
                {holiday.description && <p>{holiday.description}</p>}
              </div>

              <div className="holiday-card-side">
                <span className="holiday-type">{holiday.type}</span>
                {isAdmin && (
                  <div className="holiday-row-actions">
                    <button
                      type="button"
                      className="holiday-icon-btn"
                      onClick={() => handleEdit(holiday)}
                      title="Edit holiday"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      type="button"
                      className="holiday-icon-btn danger"
                      onClick={() => handleDelete(holiday)}
                      title="Delete holiday"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
