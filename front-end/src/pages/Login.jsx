// src/pages/Login.jsx
import React, { useState } from 'react';
import axios from '../axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', form);
      console.log('Connexion réussie ✅');
      localStorage.setItem('token', res.data.token); // حفظ التوكن
    } catch (err) {
      console.error('Erreur de login:', err.response.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input type="password" name="password" placeholder="Mot de passe" onChange={handleChange} />
      <button type="submit">Se connecter</button>
    </form>
  );
};

export default Login;
