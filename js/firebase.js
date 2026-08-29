// ─────────────────────────────────────────────────────────────
// js/firebase.js — ต่อเว็บเข้ากับ Firestore
// สัปดาห์ที่ 6: ไฟล์นี้ทำหน้าที่เดียวคือ "เปิดสายเชื่อมฐานข้อมูล"
//               แล้วส่งต่อให้หน้าอื่นเอาไปใช้
//
// ⚠️ ไฟล์นี้เป็น module — หน้าที่จะเรียกใช้ต้องเขียน type="module"
//    และต้องเปิดผ่าน npm run dev เท่านั้น เปิดจากไฟล์ตรง ๆ ไม่ได้
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ค่าประจำตัวของโปรเจกต์บน Firebase — บอกแค่ว่า "นี่คือโปรเจกต์ไหน"
// ไม่ใช่รหัสลับ Firebase ออกแบบมาให้เปิดเผยในหน้าเว็บอยู่แล้ว
// ตัวที่กันข้อมูลจริง ๆ คือ Security Rules ซึ่งจะทำในสัปดาห์ที่ 8
const firebaseConfig = {
  apiKey: "AIzaSyCEkko5PDa58oNORmpHo9A5YT2EB3NOiNI",
  authDomain: "gen-lang-client-0091628886.firebaseapp.com",
  projectId: "gen-lang-client-0091628886",
  storageBucket: "gen-lang-client-0091628886.firebasestorage.app",
  messagingSenderId: "24997565466",
  appId: "1:24997565466:web:0b15bf4f18eabbe24feda3",
  measurementId: "G-RJD414LQWS"
};

const app = initializeApp(firebaseConfig);

// db คือ "ทางเข้าฐานข้อมูล" หน้าอื่นเอาไปใช้ด้วยการเขียน
//   import { db } from "./firebase.js";
export const db = getFirestore(app);
