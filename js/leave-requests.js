// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6 (ปลายสัปดาห์): อ่านจาก Firestore ของจริงแล้ว
// ไม่ใช้ js/data.js ในหน้านี้อีกต่อไป
//
// นี่คือ "ตัว R" ตัวเดียวของสัปดาห์นี้ — อ่านอย่างเดียว
// การเพิ่ม แก้ ลบ ลงฐานข้อมูล เป็นงานของสัปดาห์ที่ 7
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var กล่อง = document.getElementById("ผลลัพธ์");

อ่านใบลาจากฐานข้อมูล();

// ── ไปเอาใบลาทั้งหมดจากโฟลเดอร์ leaveRequests บน Firestore ──
async function อ่านใบลาจากฐานข้อมูล() {
  try {
    var ผลลัพธ์ = await getDocs(collection(db, "leaveRequests"));

    // 🔑 จุดที่ต่างจากข้อมูลปลอม:
    //    บน Firestore "รหัสใบลา" คือ ชื่อไฟล์ (doc.id) ไม่ใช่ช่องข้อมูลข้างใน
    //    จึงต้องประกอบ id กลับเข้าไปเอง ไม่งั้นกดที่แถวแล้วจะไปหน้ารายละเอียดไม่ได้
    var ใบลาทั้งหมด = ผลลัพธ์.docs.map(function (ไฟล์) {
      return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
    });

    // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
    var สถานะที่กรอง = ค่าจากURL("status");
    if (สถานะที่กรอง) {
      ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
      document.querySelector(".subtitle").textContent =
        "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
    }

    แสดงตาราง(ใบลาทั้งหมด);

  } catch (ข้อผิดพลาด) {
    แสดงข้อผิดพลาด(ข้อผิดพลาด);
  }
}

function แสดงตาราง(รายการ) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
    return;
  }

  var html =
    "<table><thead><tr>" +
    "<th>หัวข้อ</th>" +
    "<th>ประเภทการลา</th>" +
    "<th>สถานะ</th>" +
    '<th class="hide-mobile">ผู้ขอลา</th>' +
    '<th class="hide-mobile">วันที่ลา</th>' +
    "</tr></thead><tbody>";

  รายการ.forEach(function (ใบ) {
    html +=
      '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
      "<td>" + esc(ใบ.title) + "</td>" +
      "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
      "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
      '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
      "</tr>";
  });

  html += "</tbody></table>";
  กล่อง.innerHTML = html;

  // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
  กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
    แถว.addEventListener("click", function () {
      location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
    });
  });
}

// ── ต่อฐานข้อมูลไม่สำเร็จ บอกให้รู้ว่าติดตรงไหน อย่าปล่อยจอว่าง ──
function แสดงข้อผิดพลาด(ข้อผิดพลาด) {
  var รหัส = ข้อผิดพลาด.code || "";
  var คำแนะนำ = "";

  if (รหัส === "permission-denied") {
    คำแนะนำ = "กฎของ Firestore ไม่ยอมให้อ่าน — ถ้าเปิดโหมดทดสอบไว้ อาจครบ 30 วันแล้ว ให้ไปต่ออายุที่ Firebase Console หัวข้อ Rules";
  } else if (รหัส === "unavailable" || รหัส === "failed-precondition") {
    คำแนะนำ = "ติดต่อฐานข้อมูลไม่ได้ — ตรวจว่าเปิด Firestore Database ในโปรเจกต์นี้แล้วหรือยัง และเน็ตต่ออยู่ไหม";
  } else {
    คำแนะนำ = "ลองเปิด Console ของเบราว์เซอร์ (กด F12) เพื่อดูรายละเอียดเพิ่ม";
  }

  console.error("อ่านข้อมูลจาก Firestore ไม่สำเร็จ:", ข้อผิดพลาด);

  กล่อง.innerHTML =
    "<p>⚠️ อ่านข้อมูลจากฐานข้อมูลไม่สำเร็จ</p>" +
    '<p class="hint">' + esc(คำแนะนำ) + "</p>" +
    '<p class="hint">รายละเอียด: ' + esc(รหัส || ข้อผิดพลาด.message) + "</p>";
}
