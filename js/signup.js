// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
//
// ⚠️ หน้านี้ห้ามเรียก กันหน้า() เช่นเดียวกับหน้าเข้าสู่ระบบ
// ─────────────────────────────────────────────────────────────

import { รอผู้ใช้, สมัคร, ข้อความผิดพลาดล็อกอิน } from "./auth.js";

var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มสมัคร");

var บัญชีเดิม = await รอผู้ใช้();
if (บัญชีเดิม) location.replace("index.html");

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var ชื่อ = document.getElementById("name").value.trim();
  var อีเมล = document.getElementById("email").value.trim();
  var รหัสผ่าน = document.getElementById("password").value;

  if (!ชื่อ || !อีเมล || !รหัสผ่าน) {
    เตือน("กรอกให้ครบทุกช่องก่อนกดสมัคร");
    return;
  }

  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังสมัคร…";
  กล่องเตือน.classList.add("hidden");

  try {
    await สมัคร(อีเมล, รหัสผ่าน, ชื่อ);
    location.replace("index.html");
  } catch (ข้อผิดพลาด) {
    เตือน(ข้อความผิดพลาดล็อกอิน(ข้อผิดพลาด));
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = "สมัครสมาชิก";
  }
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
