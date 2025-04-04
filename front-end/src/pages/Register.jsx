import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const csrfToken = document.head.querySelector('meta[name="csrf-token"]').content; // جلب الـ CSRF Token من الـ meta
      const token = localStorage.getItem('token'); // إذا كان لديك توكن مخزن في الـ localStorage

      const res = await axios.post('/register', form, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Inscription réussie ✅');
      localStorage.setItem('token', res.data.token); // تخزين التوكن
    } catch (err) {
      console.error('Erreur:', err.response ? err.response.data : err.message);
    }
  };

  return (
    <div>
      <h2>Inscription</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nom"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mot de passe"
        />
        <input
          type="password"
          name="password_confirmation"
          value={form.password_confirmation}
          onChange={handleChange}
          placeholder="Confirmer mot de passe"
        />
        <button type="submit">S'inscrire</button>
      </form>
    </div>
  );
};

export default Register;
