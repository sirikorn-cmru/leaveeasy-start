// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ลง Firestore จริงแล้ว
// ไม่ใช้ js/data.js ในหน้านี้อีกต่อไป
//
// ⚠️ ยังไม่กันตามบทบาท — ACL.md ระบุว่าเฉพาะ hr ที่แก้ประเภทการลาได้
//    แต่การบังคับจริงเป็นงานของสัปดาห์ที่ 8 (Security Rules รายห้อง)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import { กันหน้า } from "./auth.js";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

var รายการ = [];
var ที่วางตาราง = document.getElementById("ตารางประเภท");
var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
var กล่องเตือน = document.getElementById("เตือนประเภท");
var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

// ต้องล็อกอินก่อนถึงจะเข้าได้ · รอผลก่อนค่อยอ่านข้อมูล
var ผู้ใช้ = await กันหน้า();
if (ผู้ใช้) {
  ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);
  โหลดประเภทการลา();
}

// ── อ่านประเภทการลาทั้งหมดจากโฟลเดอร์ leaveTypes ──
async function โหลดประเภทการลา() {
  ที่วางตาราง.innerHTML = "<p>กำลังโหลดข้อมูล…</p>";
  try {
    var ผลลัพธ์ = await getDocs(collection(db, "leaveTypes"));
    // รหัสคือชื่อไฟล์ ไม่ใช่ช่องข้อมูลข้างใน จึงประกอบกลับเข้าไปเอง
    รายการ = ผลลัพธ์.docs.map(function (ไฟล์) {
      return Object.assign({ id: ไฟล์.id }, ไฟล์.data());
    });
    วาดตาราง();
  } catch (ข้อผิดพลาด) {
    ที่วางตาราง.innerHTML = ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
  }
}

function วาดตาราง() {
  if (รายการ.length === 0) {
    ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
    return;
  }

  var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
  รายการ.forEach(function (ประเภท) {
    html +=
      "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
      '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
      '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
      "</td></tr>";
  });
  html += "</tbody></table>";
  ที่วางตาราง.innerHTML = html;

  ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
  });
  ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
  });
}

// ── เพิ่มประเภทการลาใหม่ ──
async function เพิ่มประเภท() {
  var ชื่อ = ช่องชื่อใหม่.value.trim();
  if (!ชื่อ) {
    เตือน("พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้");
    return;
  }
  กล่องเตือน.classList.add("hidden");

  ปุ่มเพิ่ม.disabled = true;
  ปุ่มเพิ่ม.textContent = "กำลังบันทึก…";

  try {
    // ไม่ใส่ช่อง id — addDoc ตั้งชื่อไฟล์ให้เอง
    var ไฟล์ใหม่ = await addDoc(collection(db, "leaveTypes"), { name: ชื่อ });

    // บันทึกสำเร็จแล้วค่อยล้างช่องและเติมลงตาราง
    รายการ.push({ id: ไฟล์ใหม่.id, name: ชื่อ });
    ช่องชื่อใหม่.value = "";
    วาดตาราง();

  } catch (ข้อผิดพลาด) {
    // เพิ่มไม่สำเร็จ ไม่ล้างช่องข้อความ ผู้ใช้จะได้ไม่ต้องพิมพ์ใหม่
    กล่องเตือน.innerHTML = "<p>เพิ่มประเภทการลาไม่สำเร็จ</p>" + ข้อความผิดพลาดฐานข้อมูล(ข้อผิดพลาด);
    กล่องเตือน.classList.remove("hidden");
  }

  ปุ่มเพิ่ม.disabled = false;
  ปุ่มเพิ่ม.textContent = "เพิ่มประเภทการลา";
}

// ── แก้ชื่อประเภทการลา ──
async function แก้ประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);

  if (ชื่อใหม่ === null) return;                       // กดยกเลิก
  ชื่อใหม่ = ชื่อใหม่.trim();
  if (!ชื่อใหม่) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
  if (ชื่อใหม่ === ประเภท.name) return;                 // ไม่ได้เปลี่ยนอะไร ไม่ต้องเขียนลงฐาน

  try {
    // แก้เฉพาะช่อง name ช่องเดียว
    await updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่ });
    ประเภท.name = ชื่อใหม่;
    วาดตาราง();
  } catch (ข้อผิดพลาด) {
    console.error("แก้ชื่อประเภทการลาไม่สำเร็จ:", ข้อผิดพลาด);
    alert("แก้ชื่อไม่สำเร็จ ชื่อเดิมยังอยู่เหมือนเดิม (" + (ข้อผิดพลาด.code || ข้อผิดพลาด.message) + ")");
  }
}

// ── ลบประเภทการลา ──
// 🔁 ใบลาเก่าที่ใช้ประเภทนี้ไม่กระทบ เพราะจดชื่อ leaveTypeName ซ้ำไว้ในใบแล้ว
//    (spec หัวข้อ 5 ให้จดชื่อซ้ำไว้ เพราะ Firestore ไม่มี JOIN)
async function ลบประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่\nใบลาที่ใช้ประเภทนี้อยู่แล้วจะไม่กระทบ แต่จะเลือกประเภทนี้ในใบใหม่ไม่ได้อีก')) return;

  try {
    await deleteDoc(doc(db, "leaveTypes", id));
    รายการ = รายการ.filter(function (t) { return t.id !== id; });
    วาดตาราง();
  } catch (ข้อผิดพลาด) {
    console.error("ลบประเภทการลาไม่สำเร็จ:", ข้อผิดพลาด);
    alert("ลบไม่สำเร็จ ประเภทการลานี้ยังอยู่ในระบบ (" + (ข้อผิดพลาด.code || ข้อผิดพลาด.message) + ")");
  }
}

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
