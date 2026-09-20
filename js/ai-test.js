// ─────────────────────────────────────────────────────────────
// js/ai-test.js — หน้าทดสอบเชื่อมต่อ OpenRouter
// สัปดาห์ที่ 8 · เป็นแค่หน้าทดลอง ยังไม่ใช่ปุ่มผู้ช่วย AI ใน US-09
//
// 🔴 คีย์อยู่ใน js/ai-key.js ซึ่งไม่ถูก commit และไม่ถูก deploy
//    แต่ต้องรู้ไว้ว่า "โค้ดที่รันในเบราว์เซอร์ซ่อนคีย์ไม่ได้"
//    ใครเปิด F12 บนหน้านี้ก็เห็นคีย์ — จึงใช้ทดสอบในเครื่องเท่านั้น
// ─────────────────────────────────────────────────────────────

import { คีย์, โมเดล } from "./ai-key.js";

var ปุ่มส่ง = document.getElementById("ปุ่มส่ง");
var กล่องคำตอบ = document.getElementById("กล่องคำตอบ");

var ข้อความที่ส่ง = "สวัสดี";
var วินาทีที่รอได้ = 15;

document.getElementById("ชื่อโมเดล").textContent = โมเดล;
ปุ่มส่ง.addEventListener("click", ส่งข้อความหาAI);

async function ส่งข้อความหาAI() {
  if (!คีย์ || คีย์.indexOf("ใส่คีย์ของคุณ") !== -1) {
    แสดง('<p>⚠️ ยังไม่ได้ใส่คีย์</p><p class="hint">คัดลอก js/ai-key.example.js เป็น js/ai-key.js แล้วใส่คีย์จริงลงไป</p>');
    return;
  }

  ปุ่มส่ง.disabled = true;
  ปุ่มส่ง.textContent = "กำลังถาม AI…";
  แสดง('<p class="hint">กำลังรอคำตอบ…</p>');

  // ตัดการรอเมื่อครบเวลา ไม่ให้หน้าค้างถ้าปลายทางไม่ตอบ
  var ตัวยกเลิก = new AbortController();
  var ตัวจับเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, วินาทีที่รอได้ * 1000);
  var เริ่มเมื่อ = Date.now();

  try {
    var คำตอบดิบ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวยกเลิก.signal,
      headers: {
        "Authorization": "Bearer " + คีย์,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: โมเดล,
        messages: [{ role: "user", content: ข้อความที่ส่ง }]
      })
    });

    var ข้อมูล = await คำตอบดิบ.json();

    if (!คำตอบดิบ.ok) {
      // OpenRouter ส่งเหตุผลมาในรูป { error: { message } }
      var เหตุผล = (ข้อมูล.error && ข้อมูล.error.message) || คำตอบดิบ.statusText;
      แสดงพลาด(คำตอบดิบ.status, เหตุผล);
      return;
    }

    var ข้อความตอบ = ข้อมูล.choices && ข้อมูล.choices[0] &&
                     ข้อมูล.choices[0].message && ข้อมูล.choices[0].message.content;

    if (!ข้อความตอบ) {
      แสดง("<p>⚠️ เรียกสำเร็จ แต่ไม่มีข้อความตอบกลับมา</p>" +
           '<pre class="hint">' + esc(JSON.stringify(ข้อมูล, null, 2)) + "</pre>");
      return;
    }

    var ใช้เวลา = ((Date.now() - เริ่มเมื่อ) / 1000).toFixed(1);
    แสดง(
      "<h2>AI ตอบว่า</h2>" +
      '<div class="alert alert-ok">' + esc(ข้อความตอบ) + "</div>" +
      '<p class="hint">โมเดล ' + esc(ข้อมูล.model || โมเดล) + " · ใช้เวลา " + ใช้เวลา + " วินาที</p>"
    );

  } catch (ข้อผิดพลาด) {
    if (ข้อผิดพลาด.name === "AbortError") {
      แสดง("<p>⏱️ รอเกิน " + วินาทีที่รอได้ + " วินาทีแล้วยังไม่ตอบ จึงยกเลิกการรอ</p>" +
           '<p class="hint">ลองกดใหม่อีกครั้ง หรือตรวจว่าเน็ตต่ออยู่ไหม</p>');
    } else {
      console.error("เรียก OpenRouter ไม่สำเร็จ:", ข้อผิดพลาด);
      แสดง("<p>⚠️ ต่อไปหา OpenRouter ไม่ได้</p>" +
           '<p class="hint">' + esc(ข้อผิดพลาด.message) + "</p>");
    }
  } finally {
    clearTimeout(ตัวจับเวลา);
    ปุ่มส่ง.disabled = false;
    ปุ่มส่ง.textContent = "ส่งข้อความหา AI";
  }
}

// แปลรหัสที่เจอบ่อยเป็นภาษาคน จะได้ไม่ต้องไปเปิดคู่มือ
function แสดงพลาด(รหัส, เหตุผล) {
  var คำแนะนำ = "";
  if (รหัส === 401) คำแนะนำ = "คีย์ไม่ถูกต้องหรือถูกเพิกถอนไปแล้ว — ตรวจที่ openrouter.ai/keys";
  else if (รหัส === 402) คำแนะนำ = "เครดิตในบัญชี OpenRouter หมด — ต้องเติมก่อนจึงจะเรียกได้";
  else if (รหัส === 404) คำแนะนำ = "ไม่รู้จักชื่อโมเดลนี้ — ตรวจตัวสะกดใน js/ai-key.js";
  else if (รหัส === 429) คำแนะนำ = "เรียกถี่เกินไป รอสักครู่แล้วลองใหม่";
  else if (รหัส >= 500) คำแนะนำ = "ฝั่ง OpenRouter มีปัญหา ไม่ใช่ที่โค้ดเรา ลองใหม่อีกครั้ง";
  else คำแนะนำ = "ดูรายละเอียดในข้อความด้านล่าง";

  แสดง("<p>⚠️ เรียกไม่สำเร็จ (รหัส " + รหัส + ")</p>" +
       '<p class="hint">' + esc(คำแนะนำ) + "</p>" +
       '<p class="hint">ข้อความจากปลายทาง: ' + esc(เหตุผล || "ไม่มี") + "</p>");
}

function แสดง(html) {
  กล่องคำตอบ.innerHTML = html;
}
