// ─────────────────────────────────────────────────────────────
// js/auth.js — เรื่องล็อกอินทั้งหมด ใช้ร่วมกันทุกหน้า
// สัปดาห์ที่ 7
//
// หน้าที่ต้องล็อกอินก่อนใช้ ให้เรียก กันหน้า() เป็นอย่างแรก
// แล้ว "รอผลก่อน" ค่อยวาดอะไรลงจอ
// ไม่งั้นข้อมูลจะแวบให้คนที่ยังไม่ล็อกอินเห็นก่อนถูกเด้งออก
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ── รอให้ Firebase ตอบว่าตอนนี้ใครล็อกอินอยู่ ──
// ตอนเพิ่งเปิดหน้า Firebase ยังตอบไม่ได้ทันที ต้องรอสักครู่
// ฟังครั้งเดียวพอ ได้คำตอบแล้วเลิกฟังทันที
export function รอผู้ใช้() {
  return new Promise(function (ตอบกลับ) {
    var เลิกฟัง = onAuthStateChanged(auth, function (บัญชี) {
      เลิกฟัง();
      ตอบกลับ(บัญชี);
    });
  });
}

// ── อ่านโปรไฟล์ของคนที่ล็อกอิน จากโฟลเดอร์ users ──
// ถ้าไม่มีไฟล์ (เช่นบัญชีถูกสร้างจาก Console) ให้ใช้ค่าสำรอง อย่าปล่อยให้ทั้งหน้าพัง
async function โปรไฟล์ของ(บัญชี) {
  try {
    var ไฟล์ = await getDoc(doc(db, "users", บัญชี.uid));
    if (ไฟล์.exists()) {
      var ข้อมูล = ไฟล์.data();
      return {
        uid: บัญชี.uid,
        email: บัญชี.email,
        name: ข้อมูล.name || บัญชี.email,
        role: ข้อมูล.role || "employee"
      };
    }
  } catch (ข้อผิดพลาด) {
    console.error("อ่านโปรไฟล์ไม่สำเร็จ ใช้ค่าสำรองแทน:", ข้อผิดพลาด);
  }
  return { uid: บัญชี.uid, email: บัญชี.email, name: บัญชี.email, role: "employee" };
}

// ── ยามเฝ้าหน้า ──
// คืนโปรไฟล์ถ้าล็อกอินอยู่ · คืน null พร้อมเด้งออกถ้ายังไม่ล็อกอิน
// ⚠️ ห้ามเรียกใน login.html และ signup.html จะเด้งวนหาตัวเองไม่รู้จบ
export async function กันหน้า() {
  var บัญชี = await รอผู้ใช้();
  if (!บัญชี) {
    // ใช้ replace ไม่ใช่ href — กด back แล้วจะไม่ย้อนกลับมาหน้าที่ยังไม่มีสิทธิ์
    location.replace("login.html");
    return null;
  }
  var ผู้ใช้ = await โปรไฟล์ของ(บัญชี);
  วาดชื่อบนแถบเมนู(ผู้ใช้);
  เปิดของเฉพาะฝ่ายบุคคล(ผู้ใช้);
  return ผู้ใช้;
}

// ── สมัครสมาชิก ──
export async function สมัคร(อีเมล, รหัสผ่าน, ชื่อ) {
  var ผล = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
  // spec หัวข้อ 3 US-08 — ไฟล์ใหม่ใน users ต้องมี role เป็น employee เสมอ
  // ผู้สมัครเลือกบทบาทเองไม่ได้ ถ้าต้องการ manager หรือ hr ให้ไปแก้ใน Console
  await setDoc(doc(db, "users", ผล.user.uid), {
    name: ชื่อ,
    email: อีเมล,
    role: "employee"
  });
  return ผล.user;
}

export function เข้า(อีเมล, รหัสผ่าน) {
  return signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
}

export function ออก() {
  return signOut(auth);
}

// ── ชื่อคนที่ล็อกอินอยู่ + ปุ่มออกจากระบบ บนแถบเมนู ──
// js/nav.js เว้นช่อง <span id="navUser"> ไว้ให้แล้วตั้งแต่แรก
function วาดชื่อบนแถบเมนู(ผู้ใช้) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;
  ที่วาง.innerHTML = "";

  var ชื่อ = document.createElement("span");
  ชื่อ.textContent = ผู้ใช้.name + " · " + ผู้ใช้.role;
  ที่วาง.appendChild(ชื่อ);

  var ปุ่มออก = document.createElement("button");
  ปุ่มออก.type = "button";
  ปุ่มออก.className = "btn-ghost";
  ปุ่มออก.textContent = "ออกจากระบบ";
  ปุ่มออก.addEventListener("click", async function () {
    ปุ่มออก.disabled = true;
    ปุ่มออก.textContent = "กำลังออก…";
    await ออก();
    location.replace("login.html");
  });
  ที่วาง.appendChild(ปุ่มออก);
}

// ── เปิดเมนูและปุ่มที่มีแต่ฝ่ายบุคคลเห็น ──
// ทุกที่ที่ใส่ data-hr-only ไว้จะถูกซ่อนตั้งแต่แรก (class="hidden")
// แล้วเปิดให้ตรงนี้ที่เดียวเมื่อรู้แล้วว่าเป็น hr
// ทำแบบ "ซ่อนก่อนแล้วค่อยเปิด" เพราะถ้า JS พังกลางทาง ของจะไม่โผล่ ซึ่งปลอดภัยกว่า
function เปิดของเฉพาะฝ่ายบุคคล(ผู้ใช้) {
  if (!เป็นฝ่ายบุคคล(ผู้ใช้)) return;
  document.querySelectorAll("[data-hr-only]").forEach(function (ของ) {
    ของ.classList.remove("hidden");
  });
}

// ── ตัวช่วยเช็กบทบาท ตาม ACL.md ──
// ⚠️ นี่เป็นแค่การกันบนหน้าจอ การกันจริงอยู่ใน firestore.rules
export function เป็นผู้อนุมัติ(ผู้ใช้) {
  return !!ผู้ใช้ && (ผู้ใช้.role === "manager" || ผู้ใช้.role === "hr");
}

export function เป็นฝ่ายบุคคล(ผู้ใช้) {
  return !!ผู้ใช้ && ผู้ใช้.role === "hr";
}

// ── แปลรหัสข้อผิดพลาดของ Firebase Authentication เป็นภาษาคน ──
export function ข้อความผิดพลาดล็อกอิน(ข้อผิดพลาด) {
  var รหัส = ข้อผิดพลาด.code || "";

  if (รหัส === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  if (รหัส === "auth/missing-password") return "ยังไม่ได้กรอกรหัสผ่าน";
  if (รหัส === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องยาวอย่างน้อย 6 ตัวอักษร";
  if (รหัส === "auth/email-already-in-use") return "อีเมลนี้สมัครไว้แล้ว ไปที่หน้าเข้าสู่ระบบแทน";
  if (รหัส === "auth/invalid-credential" || รหัส === "auth/wrong-password" || รหัส === "auth/user-not-found") {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (รหัส === "auth/too-many-requests") return "ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";
  if (รหัส === "auth/network-request-failed") return "ต่อเน็ตไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่";
  if (รหัส === "auth/operation-not-allowed") {
    return "ยังไม่ได้เปิดวิธีล็อกอินแบบอีเมล/รหัสผ่านใน Firebase Console";
  }
  return "ทำรายการไม่สำเร็จ (" + (รหัส || ข้อผิดพลาด.message) + ")";
}
