# ระบบคิวอัปเกรดที่นั่งแถวหน้า

โปรเจกต์ Next.js ขนาดเล็กสำหรับเลือกแฟนคนถัดไปที่จะได้รับการอัปเกรดตั๋ว ระบบแสดงรายการที่ถูกคัดออกพร้อมเหตุผล จัดกลุ่มบัญชีที่เชื่อมกัน ให้คะแนนตัวแทนของแต่ละกลุ่ม และอธิบายผลการเลือก

<p align="center">
  <img alt="Next.js 16.4.6" src="https://img.shields.io/badge/Next.js-16.4.6-000000?logo=nextdotjs&logoColor=white" />
  <img alt="React 19.3.0" src="https://img.shields.io/badge/React-19.3.0-087EA4?logo=react&logoColor=white" />
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS 4.3.3" src="https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Jest 29.7.0" src="https://img.shields.io/badge/Jest-29.7.0-C21325?logo=jest&logoColor=white" />
  <img alt="ESLint 9" src="https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white" />
</p>

## เทคโนโลยีที่ใช้

- **เว็บแอป:** Next.js App Router, React และ TypeScript
- **รูปแบบหน้า:** Tailwind CSS
- **การทดสอบ:** Jest ผ่าน `next/jest`
- **ตรวจรูปแบบโค้ด:** ESLint
- **ตัวช่วย AI:** ใช้ OpenAI Codex (GPT-6)

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` เวลาเริ่มการจำลองคือ 08:00 UTC จากนั้นเลื่อนเวลาไปข้างหน้า เปลี่ยนโหมดคะแนน แก้คะแนนสะสม หรือกดอัปเกรดผู้ชนะปัจจุบันได้

## ทดสอบและตรวจโค้ด

```bash
npm test -- --runInBand
npm run lint
npm run build
```

เมื่อ `npm run build` สำเร็จแล้ว ใช้ `npm start` เพื่อเปิดรุ่นสำหรับใช้งานจริง

## โครงสร้างโปรเจกต์

- `app/` เก็บหน้าและโครงหน้าของ Next.js App Router รวมถึงสไตล์ส่วนกลาง
- `src/core/` เก็บตรรกะที่ไม่ผูกกับ React หรือ Next.js ได้แก่ normalize, eligibility, grouping, scoring และ selection
- `src/buildFrontRowUpgradeQueue.ts` เรียกขั้นตอน core ตามลำดับและรวมผลลัพธ์
- `src/sampleEntries.ts` เก็บข้อมูลตัวอย่าง ส่วน `src/ui/` เก็บหน้าเว็บที่โต้ตอบได้
- `tests/` เก็บการทดสอบหน่วยและการทดสอบขั้นตอนประมวลผลด้วย Jest

## SOFTWARE DEVELOPER TAKE-HOME TASK

### Front Row Ticket Upgrade Challenge

#### 1. How does your priority score work?

ระบบปรับปัจจัยแต่ละด้านให้อยู่ระหว่าง 0 ถึง 1 แล้วคูณด้วยน้ำหนักของโหมด จากนั้นรวมผลและหารด้วยผลรวมน้ำหนักเพื่อให้คะแนนสูงสุดเป็น 100:

- คะแนนสะสม: `min(points, 1,000) / 1,000`
- เวลารอ: `min(wait minutes, 240) / 240`; เวลาเข้าคิวในอนาคตได้เวลารอเป็นศูนย์
- มูลค่าตั๋ว: `min(log10(1 + value) / log10(1 + 10,000), 1)`
- สมาชิก VIP: เป็น 1 เมื่อเป็นสมาชิก VIP; กรณีอื่นเป็น 0
- จำนวนอัปเกรดย้อนหลัง: `2^(-upgradesLast30Days)`

ค่า `loyaltyPoints` หรือจำนวนอัปเกรดที่เป็น `null` นับเป็นศูนย์ ค่าติดลบถูกปรับเป็นศูนย์ ค่าสูงสุดและน้ำหนักเป็นค่าชั่วคราวสำหรับการสาธิต และรวมไว้ใน `src/core/config.ts` ระบบแสดงคำอธิบายคะแนนแยกตามปัจจัย

แนวคิดการรวมปัจจัยหลายด้านด้วย weights และการ normalize อ้างอิงจาก [Slurm Multifactor Priority Plugin](https://slurm.schedmd.com/priority_multifactor.html) ส่วนแนวคิดเรื่อง fairness ในการแบ่งทรัพยากรร่วมอ้างอิงจาก Kay และ Lauder, [“A Fair Share Scheduler,” *Communications of the ACM*, 31(1), 44–55 (1988)](https://doi.org/10.1145/35043.35047) สูตร caps และ weights ในโปรเจกต์นี้เป็นค่าที่เลือกสำหรับโจทย์นี้ ไม่ใช่สูตรที่คัดลอกจากเอกสารดังกล่าว

#### 2. How do you stop one fan group from dominating?

จัดกลุ่มเฉพาะรายการที่ยังมีสิทธิ์ โดยใช้เบอร์โทร, `deviceId` หรือ `paymentAccount` ที่ตรงกัน แต่ละกลุ่มมีตัวแทนได้หนึ่งคน จึงไม่มีช่องผู้สมัครเพิ่มเพียงเพราะกลุ่มนั้นมีหลายบัญชี เบอร์โทรจะลบอักขระที่ไม่ใช่ตัวเลข ส่วน `deviceId` และ `paymentAccount` จะตัดช่องว่างหัวท้าย ค่าว่างไม่เชื่อมบัญชี และ `fanId` ไม่ใช่ตัวเชื่อม

#### 3. How do you break ties?

เรียงตามคะแนนสูงสุดก่อน ตามด้วยเวลาเข้าคิวที่เก่ากว่า และ `id` ตามลำดับตัวอักษร หากทั้งสามค่าเท่ากันจะคงลำดับเดิมในข้อมูลนำเข้า

#### 4. What is the time complexity of your grouping logic?

Grouping ใช้ expected time `O(n·α(n))` และ space `O(n)` เมื่อมี eligible entries `n` รายการ, `Map` ทำงานเฉลี่ย `O(1)` และ identifier มีความยาวจำกัด โดยตรวจ connection keys 3 ชนิดต่อ entry แล้วใช้ Union-Find รวม entries ที่เชื่อมกัน

ฟังก์ชันหลักของ Union-Find ใน `src/core/grouping.ts`:

```ts
function findRoot(parent: number[], entryIndex: number): number {
  let root = entryIndex;

  while (parent[root] !== root) {
    parent[root] = parent[parent[root]];
    root = parent[root];
  }

  return root;
} // Amortized time: O(α(n)) per call

function union(
  parent: number[],
  groupSize: number[],
  firstEntryIndex: number,
  secondEntryIndex: number,
): void {
  let firstRoot = findRoot(parent, firstEntryIndex);
  let secondRoot = findRoot(parent, secondEntryIndex);

  if (firstRoot === secondRoot) {
    return;
  }

  if (groupSize[firstRoot] < groupSize[secondRoot]) {
    [firstRoot, secondRoot] = [secondRoot, firstRoot];
  }

  parent[secondRoot] = firstRoot;
  groupSize[firstRoot] += groupSize[secondRoot];
} // Amortized time: O(α(n)) per call, including two findRoot calls
```

`findRoot` หา root ของกลุ่มและทำ path halving โดยปรับ parent ให้ข้ามขึ้นไปใกล้ root ในแต่ละรอบ ส่วน `union` เชื่อม root ของสองกลุ่มด้วย union by size โดยให้กลุ่มเล็กต่อใต้กลุ่มใหญ่ หากทั้งคู่มี root เดียวกันอยู่แล้วก็จบโดยไม่เปลี่ยนโครงสร้าง วิธีเหล่านี้ช่วยควบคุมความสูงของต้นไม้และเร่งการค้นหาในครั้งถัดไป

สำหรับ `n` eligible entries โค้ดตรวจ connection keys ได้แก่ phone number, device ID และ payment account อย่างละหนึ่งครั้งต่อ entry โดย `Map` ใช้หา entry แรกที่มี key เดียวกัน การพบ key ซ้ำจะเรียก `union` รวมแล้วไม่เกิน `3n` ครั้ง จากนั้นวน entries อีกรอบเพื่อหา root และประกอบกลุ่ม ทำ `findRoot` อีก `n` ครั้ง ส่วน `union` แต่ละครั้งเรียก `findRoot` สองครั้ง โดย path halving และ union by size ทำให้ Union-Find ใช้เวลา amortized `O(α(n))` ต่อ operation; `α(n)` คือ inverse Ackermann function ซึ่งเพิ่มช้ามาก

ให้ `U ≤ 3n` เป็นจำนวนครั้งที่เรียก `union`; `Map` operations และการประกอบผลลัพธ์รวมกันใช้เวลาเฉลี่ย `O(n)` ดังนั้น:

```text
T(n) = U · O(α(n)) + n · O(α(n)) + O(n)
     ≤ 3n · O(α(n)) + n · O(α(n)) + O(n)
     = O(n · α(n))
```

Space ใช้ `O(n)` สำหรับ maps, parent/group-size arrays และผลลัพธ์ เมื่อ identifier มีความยาวจำกัด หากนับความยาว identifier ที่ต้อง normalize ด้วย ให้บวกเวลาและพื้นที่ตามจำนวนตัวอักษรที่อ่านและเก็บ

เลือก Union-Find เพราะ connection เป็น transitive: หาก A เชื่อมกับ B และ B เชื่อมกับ C ทั้งสามต้องอยู่กลุ่มเดียวกัน การรวมกลุ่มระหว่างไล่ข้อมูลทำได้โดยไม่ต้องเทียบทุกคู่ ซึ่งอาจใช้เวลา `O(n²)` การเลือก representative ใช้การวนเชิงเส้น และการเลือก top 3 เก็บผู้สมัครไว้ไม่เกินสามคน

#### 5. What is one case where your system may still feel unfair?

เบอร์โทรหรืออุปกรณ์ที่ใช้ร่วมกันอาจเป็นของคนละคน เช่น สมาชิกครอบครัว ทำให้ถูกจัดเป็นกลุ่มเดียวกันทั้งที่เป็นแฟนคนละคน อีกกรณีคือเมื่อบัญชีหนึ่งได้รับการอัปเกรดแล้ว รายการนั้นจะถูกคัดออกก่อนจัดกลุ่ม บัญชีพี่น้องที่ยังมีสิทธิ์จึงอาจชนะในการเลือกครั้งถัดไป ผู้เรียกใช้ระบบเป็นผู้บันทึกการอัปเกรดโดยเปลี่ยนสถานะผู้ชนะเป็น `upgraded`

#### 6. How do Rush Hour, VIP Hour, and Fair Queue Mode work?

โหมดเปลี่ยนเฉพาะน้ำหนักของปัจจัย สูตรคะแนนยังเหมือนเดิม และทุกโหมด normalize ด้วยผลรวมน้ำหนัก:

| โหมด | คะแนนสะสม | เวลารอ | มูลค่าตั๋ว | สมาชิก VIP | จำนวนอัปเกรดย้อนหลัง |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal | 30 | 30 | 10 | 10 | 20 |
| Rush Hour | 20 | 50 | 10 | 10 | 10 |
| VIP Hour | 30 | 30 | 10 | 20 | 20 |
| Fair Queue | 25 | 30 | 10 | 10 | 40 |

Rush Hour เพิ่มความสำคัญของเวลารอ, VIP Hour เพิ่มน้ำหนักสมาชิก VIP และ Fair Queue เพิ่มโทษจากการได้รับอัปเกรดในช่วง 30 วันที่ผ่านมา VIP Hour มีผลรวมน้ำหนัก 110 และ Fair Queue มี 115 แต่คะแนนสูงสุดยังเป็น 100 เพราะหารด้วยผลรวมน้ำหนัก

#### 7. What would you improve with more time?

ปรับค่าสูงสุดและน้ำหนักด้วยข้อมูลคิวจริง เพิ่มการทดสอบการโต้ตอบบนหน้า UI และวัดสมรรถนะด้วยข้อมูลขนาดใกล้เคียงการใช้งานจริง
