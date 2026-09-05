// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริงแล้ว
//
// ประเภทการลาในรายการเลื่อนลงก็อ่านจากโฟลเดอร์ leaveTypes จริงเช่นกัน
// ไม่ใช้ js/data.js ในหน้านี้อีกต่อไป
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ⚠️ ผู้ขอลาสมมติ — ยังไม่มีล็อกอิน จึงตั้งไว้ตายตัวก่อน
//    เมื่อทำ Firebase Authentication เสร็จ ให้แก้ที่นี่ที่เดียว
//    โดยเปลี่ยน id เป็น uid ของคนที่ล็อกอิน และ name เป็นชื่อของคนนั้น
var ผู้ขอลา = { id: "u001", name: "สมชาย ใจดี" };

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

var ประเภททั้งหมด = [];

เติมรายการประเภทการลา();
ฟอร์ม.addEventListener("submit", บันทึกใบลา);

// ── ไปเอาประเภทการลาจากโฟลเดอร์ leaveTypes มาใส่รายการเลื่อนลง ──
async function เติมรายการประเภทการลา() {
  ช่องประเภท.innerHTML = '<option value="">กำลังโหลดประเภทการลา…</option>';

  try {
    var ผลลัพธ์ = await getDocs(collection(db, "leaveTypes"));
    ประเภททั้งหมด = ผลลัพธ์.docs.map(function (ไฟล์) {
      return { id: ไฟล์.id, name: ไฟล์.data().name };
    });

    if (ประเภททั้งหมด.length === 0) {
      ช่องประเภท.innerHTML = '<option value="">ยังไม่มีประเภทการลาในระบบ</option>';
      เตือน("ยังไม่มีประเภทการลาในระบบ — ไปเพิ่มที่หน้าจัดการประเภทการลาก่อน");
      return;
    }

    ช่องประเภท.innerHTML = '<option value="">— เลือกประเภทการลา —</option>';
    ประเภททั้งหมด.forEach(function (ประเภท) {
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = ประเภท.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });

  } catch (ข้อผิดพลาด) {
    ช่องประเภท.innerHTML = '<option value="">โหลดประเภทการลาไม่สำเร็จ</option>';
    กล่องเตือน.innerHTML = ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
    กล่องเตือน.classList.remove("hidden");
  }
}

// ── กดบันทึก ──
async function บันทึกใบลา(e) {
  e.preventDefault();

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }

  var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });
  if (!ประเภท) {
    เตือน("ไม่รู้จักประเภทการลาที่เลือก ลองโหลดหน้าใหม่อีกครั้ง");
    return;
  }

  // ปิดปุ่มระหว่างบันทึก กันกดซ้ำแล้วได้ใบลาซ้ำหลายใบ
  ปุ่มบันทึก.disabled = true;
  ปุ่มบันทึก.textContent = "กำลังบันทึก…";
  กล่องเตือน.classList.add("hidden");

  try {
    // ไม่ใส่ช่อง id — บน Firestore รหัสคือชื่อไฟล์ ซึ่ง addDoc ตั้งให้เอง
    await addDoc(collection(db, "leaveRequests"), {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ขอลา.id, requesterName: ผู้ขอลา.name,
      approverId: "",         approverName: "",  // ยังไม่มีผู้อนุมัติ
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,   // จดชื่อซ้ำไว้ Firestore ไม่มี JOIN
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    });

    location.href = "leave-requests.html";

  } catch (ข้อผิดพลาด) {
    // บันทึกไม่สำเร็จ ให้อยู่หน้าเดิม ข้อมูลที่กรอกไว้ไม่หาย
    กล่องเตือน.innerHTML =
      "<p>บันทึกใบลาไม่สำเร็จ ใบลายังไม่ถูกสร้าง</p>" + ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
    กล่องเตือน.classList.remove("hidden");
    ปุ่มบันทึก.disabled = false;
    ปุ่มบันทึก.textContent = "บันทึก";
  }
}

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
