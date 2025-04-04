import axios from "axios";

// إعداد instance خاص بـ axios فيه إعدادات ثابتة
const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // رابط Laravel API
  headers: {
    Accept: "application/json",
  },
});

// نصدر الـ instance باش نستعمله في أي مكان
export default instance;
