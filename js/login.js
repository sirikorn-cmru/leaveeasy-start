// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
//
// ⚠️ หน้านี้ห้ามเรียก กันหน้า() เพราะจะเด้งหาตัวเองไม่รู้จบ
//    แต่ถ้าล็อกอินอยู่แล้ว ให้พาไปหน้าแรกเลย ไม่ต้องล็อกอินซ้ำ
// ─────────────────────────────────────────────────────────────

import { รอผู้ใช้, เข้า, ข้อความผิดพลาดล็อกอิน } from "./auth.js";

var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

// ล็อกอินค้างอยู่แล้วก็ไม่ต้องให้ล็อกอินซ้ำ
var บัญชีเดิม = await รอผู้ใช้();
if (บัญชีเดิม) location.replace("index.html");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;

  if (!อีเมล || !รหัสผ่าน) {
    เตือน("กรอกอีเมลและรหัสผ่านให้ครบก่อน");
    return;
  }

  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังเข้าสู่ระบบ…";
  กล่องเตือน.classList.add("hidden");

  try {
    await เข้า(อีเมล, รหัสผ่าน);
    location.replace("index.html");
  } catch (ข้อผิดพลาด) {
    // เข้าไม่สำเร็จ อยู่หน้าเดิม ไม่ล้างอีเมลที่กรอกไว้
    เตือน(ข้อความผิดพลาดล็อกอิน(ข้อผิดพลาด));
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = "เข้าสู่ระบบ";
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
