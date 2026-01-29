import { useEffect, useState } from "react";
import api from "../utils/api";
import "./Training.css";

export default function Training() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    preferredDate: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  // Load courses
  useEffect(() => {
    api.get("/training/courses")
      .then((res) => setCourses(res.data))
      .catch(() => alert("Failed to load courses"));
  }, []);

  const toggleTraining = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const changeForm = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.email) {
      alert("Full name, phone, and email are required.");
      return;
    }

    if (selected.length === 0) {
      alert("Select at least one training.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/training/book", {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        preferredDate: form.preferredDate || null,
        message: form.message || "",
        trainingNames: selected,
      });

      alert("Training booked successfully!");

      setForm({
        fullName: "",
        phone: "",
        email: "",
        preferredDate: "",
        message: "",
      });
      setSelected([]);

    } catch (err) {
      alert("Failed to submit training form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="training-page">

      <h1 className="training-header">Training Registration</h1>
      <p className="training-desc">
        Choose your training(s) and complete the form below.
      </p>

      {/* Training options */}
      <div className="training-grid">
        {courses.map((c) => (
          <div
            key={c.name}
            className={`training-option ${
              selected.includes(c.name) ? "active" : ""
            }`}
            onClick={() => toggleTraining(c.name)}
          >
            <h3>{c.name}</h3>
            <p>Rs. {c.price}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <form className="training-form" onSubmit={handleSubmit}>
        <h2>Registration Details</h2>

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={changeForm}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={changeForm}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={changeForm}
          required
        />

        <input
          type="date"
          name="preferredDate"
          value={form.preferredDate}
          onChange={changeForm}
        />

        <textarea
          name="message"
          placeholder="Additional notes (optional)"
          value={form.message}
          onChange={changeForm}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Book Training"}
        </button>
      </form>
    </div>
  );
}
