// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';

const Home = () => {
  const [user, setUser] = useState(null); // لتخزين بيانات المستخدم
  const [loading, setLoading] = useState(true); // لتحديد إذا كان مازال البيانات كاينة أو لا
  const [error, setError] = useState(null); // لتخزين الأخطاء إذا كانو

  useEffect(() => {
    // جلب التوكن من localStorage
    const token = localStorage.getItem('token');
    
    // إذا كان التوكن موجود، نبعث الطلب لجلب بيانات المستخدم
    if (token) {
      axios.get('/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => {
        setUser(res.data); // تخزين البيانات في الstate
        setLoading(false); // تعيين حالة التحميل إلى false بعد ما تجيب البيانات
      })
      .catch(err => {
        setError('Erreur lors de la récupération des données'); // التعامل مع الأخطاء
        setLoading(false); // تعيين حالة التحميل إلى false إذا كان هناك خطأ
      });
    } else {
      setLoading(false); // إذا مكاينش التوكن، نوقف التحميل
    }
  }, []); // تفريغ الـ useEffect فقط عند تحميل الصفحة

  if (loading) {
    return <p>Chargement...</p>; // عرض Loading أثناء جلب البيانات
  }

  if (error) {
    return <p>{error}</p>; // عرض رسالة الخطأ إذا كان هناك مشكلة
  }

  return (
    <div>
      <h1>Bienvenue dans ton application 👋</h1>
      {user ? (
        <div>
          <p>Nom: {user.name}</p>
          <p>Email: {user.email}</p>
          {/* يمكنك إضافة المزيد من المعلومات حسب الحاجة */}
        </div>
      ) : (
        <p>Utilisateur non connecté</p>
      )}
    </div>
  );
};

export default Home;
