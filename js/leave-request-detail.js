// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านและเขียนกลับลง Firestore ได้แล้ว
//
// ปุ่มอนุมัติ/ไม่อนุมัติ  → แก้ช่อง status ของไฟล์ใบลา
// ส่งความเห็น           → เพิ่มไฟล์ในโฟลเดอร์ย่อย approvals ของใบนั้น
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ⚠️ ผู้พิจารณาสมมติ — ยังไม่มีล็อกอิน จึงตั้งไว้ตายตัวก่อน
//    เมื่อทำ Firebase Authentication เสร็จ ให้แก้ที่นี่ที่เดียว
var ผู้พิจารณา = { id: "u002", name: "สมหญิง รักงาน" };

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");

var ใบ = null;          // ใบลาที่กำลังเปิดอยู่
var ความเห็น = [];      // ความเห็นของใบนี้
var เตือนสถานะ = "";    // ข้อความบอกว่าเปลี่ยนสถานะไม่สำเร็จ

เปิดใบลา();

// ── ไปเอาใบลาใบนี้ พร้อมความเห็นในโฟลเดอร์ย่อยของมัน ──
async function เปิดใบลา() {
  if (!รหัสใบลา) {
    ไม่พบใบลา();
    return;
  }

  try {
    var ไฟล์ใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));

    if (!ไฟล์ใบลา.exists()) {
      ไม่พบใบลา();
      return;
    }

    // รหัสใบลาคือชื่อไฟล์ ไม่ใช่ช่องข้อมูลข้างใน จึงประกอบกลับเข้าไปเอง
    ใบ = Object.assign({ id: ไฟล์ใบลา.id }, ไฟล์ใบลา.data());

    // ความเห็นอยู่ในโฟลเดอร์ย่อย approvals ที่ซ้อนอยู่ในไฟล์ใบลาใบนี้
    var ผลความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
    ความเห็น = ผลความเห็น.docs.map(function (ไฟล์) {
      return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
    });

    วาดใบลา();
    วาดความเห็น();
    กล่องความเห็น.classList.remove("hidden");

    document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  } catch (ข้อผิดพลาด) {
    กล่องใบลา.innerHTML = ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
  }
}

function ไม่พบใบลา() {
  กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)]
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา
  if (ใบ.status === "รอพิจารณา") {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>";
  } else {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  }

  if (เตือนสถานะ) {
    html += '<div class="alert alert-error">' + เตือนสถานะ + "</div>";
  }

  กล่องใบลา.innerHTML = html;

  if (ใบ.status === "รอพิจารณา") {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }
}

// ── เปลี่ยนสถานะ แล้วบันทึกลง Firestore ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
  if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
    alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
    return;
  }

  ปิดปุ่มพิจารณา("กำลังบันทึก…");

  try {
    // 🔑 updateDoc ส่งไปเฉพาะช่อง status ช่องเดียว อีก 11 ช่องคงเดิมทั้งหมด
    //    spec หัวข้อ 6 สั่งไว้ว่าห้ามเขียนทับช่องอื่นตอนเปลี่ยนสถานะ
    //    (ถ้าใช้ setDoc จะกลายเป็นลบช่องอื่นทิ้งทั้งไฟล์)
    await updateDoc(doc(db, "leaveRequests", ใบ.id), { status: สถานะใหม่ });

    // เขียนสำเร็จแล้วค่อยเปลี่ยนหน้าจอตาม
    ใบ.status = สถานะใหม่;
    เตือนสถานะ = "";
    วาดใบลา();

  } catch (ข้อผิดพลาด) {
    // เขียนไม่สำเร็จ สถานะในฐานยังเป็นค่าเดิม หน้าจอจึงต้องไม่เปลี่ยนตาม
    console.error("เปลี่ยนสถานะไม่สำเร็จ:", ข้อผิดพลาด);
    เตือนสถานะ = "⚠️ เปลี่ยนสถานะไม่สำเร็จ ใบลายังเป็น " + esc(ใบ.status) +
                 " เหมือนเดิม (" + esc(ข้อผิดพลาด.code || ข้อผิดพลาด.message) + ")";
    วาดใบลา();
  }
}

// ปิดปุ่มทั้งสองระหว่างบันทึก กันกดรัวแล้วสั่งซ้ำ
function ปิดปุ่มพิจารณา(ข้อความ) {
  ["ปุ่มอนุมัติ", "ปุ่มไม่อนุมัติ"].forEach(function (id) {
    var ปุ่ม = document.getElementById(id);
    if (ปุ่ม) { ปุ่ม.disabled = true; }
  });
  var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
  if (ปุ่มอนุมัติ) { ปุ่มอนุมัติ.textContent = ข้อความ; }
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .slice()
    .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ ลงโฟลเดอร์ย่อย approvals ของใบนี้ ──
async function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");

  ปุ่มส่ง.disabled = true;
  ปุ่มส่ง.textContent = "กำลังส่ง…";

  // ไม่ใส่ช่อง requestId เพราะการที่ไฟล์นี้อยู่ในโฟลเดอร์ย่อยของใบไหน
  // ก็บอกอยู่แล้วว่าเป็นความเห็นของใบนั้น
  var ความเห็นใหม่ = {
    authorId: ผู้พิจารณา.id,
    authorName: ผู้พิจารณา.name,
    message: ข้อความ,
    createdAt: เวลาตอนนี้()
  };

  try {
    var ไฟล์ใหม่ = await addDoc(collection(db, "leaveRequests", ใบ.id, "approvals"), ความเห็นใหม่);

    // บันทึกสำเร็จแล้วค่อยล้างช่องข้อความและเติมลงรายการ
    ความเห็น.push(Object.assign({ id: ไฟล์ใหม่.id }, ความเห็นใหม่));
    ช่อง.value = "";
    วาดความเห็น();

  } catch (ข้อผิดพลาด) {
    // ส่งไม่สำเร็จ ไม่ล้างช่องข้อความ ผู้ใช้จะได้ไม่ต้องพิมพ์ใหม่
    เตือน.innerHTML = "<p>ส่งความเห็นไม่สำเร็จ ความเห็นยังไม่ถูกบันทึก</p>" +
                      ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
    เตือน.classList.remove("hidden");
  }

  ปุ่มส่ง.disabled = false;
  ปุ่มส่ง.textContent = "ส่งความเห็น";
}
