// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6 (ปลายสัปดาห์): อ่านจาก Firestore ของจริงแล้ว
// ไม่ใช้ js/data.js ในหน้านี้อีกต่อไป
//
// นี่คือ "ตัว R" ตัวเดียวของสัปดาห์นี้ — อ่านอย่างเดียว
// การเพิ่ม แก้ ลบ ลงฐานข้อมูล เป็นงานของสัปดาห์ที่ 7
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { กันหน้า, เป็นผู้อนุมัติ } from "./auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var กล่อง = document.getElementById("ผลลัพธ์");

// ต้องล็อกอินก่อนถึงจะดูได้ · รอผลก่อนค่อยอ่านข้อมูล
// ไม่งั้นข้อมูลจะแวบให้เห็นก่อนถูกเด้งออกไปหน้าล็อกอิน
var ผู้ใช้ = await กันหน้า();
if (ผู้ใช้) อ่านใบลาจากฐานข้อมูล();

// ── ไปเอาใบลาทั้งหมดจากโฟลเดอร์ leaveRequests บน Firestore ──
async function อ่านใบลาจากฐานข้อมูล() {
  try {
    // 🔑 Security Rules กรองข้อมูลให้ไม่ได้ — ถ้าขอเกินสิทธิ์จะถูกปฏิเสธ "ทั้งคำสั่ง"
    //    ไม่ใช่ได้มาเฉพาะใบที่มีสิทธิ์ ผู้ขอลาจึงต้องระบุ where เองว่าขอเฉพาะใบตัวเอง
    var คำสั่ง = เป็นผู้อนุมัติ(ผู้ใช้)
      ? collection(db, "leaveRequests")
      : query(collection(db, "leaveRequests"), where("requesterId", "==", ผู้ใช้.uid));

    var ผลลัพธ์ = await getDocs(คำสั่ง);

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
    กล่อง.innerHTML = ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
  }
}

function แสดงตาราง(รายการ) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
    return;
  }

  // บรรทัดสรุปจำนวน อยู่บนสุดของผลลัพธ์
  var html =
    "<p>ทั้งหมด <strong>" + รายการ.length + "</strong> ใบ</p>" +
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

