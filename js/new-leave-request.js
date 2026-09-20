// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริงแล้ว
//
// ประเภทการลาในรายการเลื่อนลงก็อ่านจากโฟลเดอร์ leaveTypes จริงเช่นกัน
// ไม่ใช้ js/data.js ในหน้านี้อีกต่อไป
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { กันหน้า } from "./auth.js";
import { มีคีย์ไหม, ถามAI } from "./ai.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ผู้ขอลาคือคนที่ล็อกอินอยู่จริง (spec US-08)
// เติมค่าหลัง กันหน้า() ตอบกลับมาแล้วเท่านั้น
var ผู้ขอลา = null;

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

var ประเภททั้งหมด = [];

// ต้องล็อกอินก่อนถึงจะยื่นใบลาได้ · รอผลก่อนค่อยเริ่มทำอะไร
var ผู้ใช้ = await กันหน้า();
if (ผู้ใช้) {
  ผู้ขอลา = { id: ผู้ใช้.uid, name: ผู้ใช้.name };
  เติมรายการประเภทการลา();
  ฟอร์ม.addEventListener("submit", บันทึกใบลา);
  เตรียมปุ่มAI();
}

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

// ─────────────────────────────────────────────────────────────
// 🤖 US-09 — ปุ่มให้ AI ช่วยจัดประเภทการลา
//
// เป็นแค่ "ข้อเสนอ" ผู้ใช้เปลี่ยนทับได้ตลอด
// และผลที่ได้ต้องเป็นประเภทที่มีอยู่จริงในระบบเท่านั้น
// ─────────────────────────────────────────────────────────────

async function เตรียมปุ่มAI() {
  // ไม่มีไฟล์คีย์ (เช่นบนเว็บจริง) ก็ไม่ต้องโชว์ปุ่ม ที่เหลือใช้งานได้ปกติ
  if (!(await มีคีย์ไหม())) return;

  document.getElementById("แถวปุ่มAI").classList.remove("hidden");
  document.getElementById("ปุ่มจัดประเภท").addEventListener("click", ให้AIจัดประเภท);

  // ผู้ใช้เลือกเองเมื่อไหร่ ป้ายข้อเสนอจาก AI ต้องหายไป
  ช่องประเภท.addEventListener("change", function () {
    document.getElementById("ผลAI").innerHTML = "";
  });
}

async function ให้AIจัดประเภท() {
  var ปุ่ม = document.getElementById("ปุ่มจัดประเภท");
  var ที่วางผล = document.getElementById("ผลAI");
  var เหตุผล = document.getElementById("reason").value.trim();

  if (!เหตุผล) {
    ที่วางผล.innerHTML = '<div class="alert alert-warn">พิมพ์เหตุผลการลาก่อน AI จึงจะช่วยจัดประเภทให้ได้</div>';
    return;
  }
  if (ประเภททั้งหมด.length === 0) {
    ที่วางผล.innerHTML = '<div class="alert alert-warn">ยังไม่มีประเภทการลาในระบบให้เลือก</div>';
    return;
  }

  ปุ่ม.disabled = true;
  ปุ่ม.textContent = "กำลังให้ AI ช่วยคิด…";
  ที่วางผล.innerHTML = "";

  var รายชื่อ = ประเภททั้งหมด.map(function (t) { return t.name; });
  var คำสั่ง =
    "รายชื่อประเภทการลาที่เลือกได้: " + รายชื่อ.join(" | ") + "@@" +
    "เหตุผลที่ผู้ขอลาพิมพ์: " + เหตุผล + "@@@@" +
    "ตอบกลับเป็นชื่อประเภทเดียวจากรายชื่อข้างบนเท่านั้น@@" +
    "ห้ามอธิบาย ห้ามใส่เครื่องหมายใด ๆ@@" +
    "ถ้าไม่มีอันไหนตรง ให้ตอบว่า ไม่แน่ใจ";
  คำสั่ง = คำสั่ง.split("@@").join("\n");

  var ผล = await ถามAI(คำสั่ง);

  ปุ่ม.disabled = false;
  ปุ่ม.textContent = "🤖 ให้ AI ช่วยจัดประเภทการลา";

  if (!ผล.สำเร็จ) {
    // AI พลาดต้องไม่กระทบการกรอกฟอร์ม ปุ่มบันทึกยังกดได้ตามปกติ
    ที่วางผล.innerHTML = '<div class="alert alert-error">⚠️ ให้ AI ช่วยไม่สำเร็จ — ' + esc(ผล.เหตุผล) +
      '</div><p class="hint">เลือกประเภทการลาเองได้ตามปกติ</p>';
    return;
  }

  var ที่เลือกได้ = หาประเภทที่ตรง(ผล.ข้อความ);

  if (!ที่เลือกได้) {
    // 🔑 เกณฑ์สำคัญของ US-09 — ไม่ตรงกับของที่มีจริง ห้ามเปลี่ยนค่าเดิม
    ที่วางผล.innerHTML =
      '<div class="alert alert-warn">จัดประเภทให้ไม่ได้ กรุณาเลือกเอง</div>' +
      '<p class="hint">AI ตอบว่า “' + esc(ผล.ข้อความ) + '” ซึ่งไม่ตรงกับประเภทการลาที่มีในระบบ</p>';
    return;
  }

  ช่องประเภท.value = ที่เลือกได้.id;
  ที่วางผล.innerHTML =
    '<div class="alert alert-ai">เลือกให้แล้ว: <strong>' + esc(ที่เลือกได้.name) + "</strong></div>" +
    '<p class="hint">ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน · เปลี่ยนเองได้จากรายการด้านบน</p>';
}

// เทียบคำตอบของ AI กับประเภทที่มีอยู่จริง · คืน null ถ้าไม่ตรงอะไรเลย
// AI มักตอบเกินกรอบ เช่น ใส่อัญประกาศ จุด หรือคำว่า "ครับ" ต่อท้าย จึงต้องล้างก่อน
function หาประเภทที่ตรง(คำตอบ) {
  var ล้างแล้ว = String(คำตอบ || "")
    .replace(/["'`“”‘’]/g, "")
    .replace(/[.。·:：\-]+$/g, "")
    .trim();

  // 1) ตรงตัวเป๊ะ
  var ตรงเป๊ะ = ประเภททั้งหมด.find(function (t) { return t.name === ล้างแล้ว; });
  if (ตรงเป๊ะ) return ตรงเป๊ะ;

  // 2) ชื่อประเภทอยู่ในข้อความที่ตอบมา เช่นตอบว่า "ลาป่วยครับ"
  var ที่อยู่ข้างใน = ประเภททั้งหมด.filter(function (t) { return ล้างแล้ว.indexOf(t.name) !== -1; });
  // เจอมากกว่า 1 แปลว่ากำกวม ไม่เดาให้
  if (ที่อยู่ข้างใน.length === 1) return ที่อยู่ข้างใน[0];

  return null;
}

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
