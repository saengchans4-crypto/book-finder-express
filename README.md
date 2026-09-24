# Book Finder — Open Library Explorer (Express.js + Custom DSA)

ระบบค้นหาและจัดเรียงหนังสือจาก Open Library พัฒนาด้วย **Node.js / Express.js** และการเขียน **Data Structures & Algorithms (DSA) ขึ้นเองโดยไม่พึ่งพาคำสั่งสำเร็จรูป**

## 🚀 ฟีเจอร์ และ DSA ที่ใช้งาน

| ฟีเจอร์ | รายละเอียดการใช้งาน DSA |
|---|---|
| **Server-Side API Cache** | **Custom Hash Table** (เขียนขึ้นเองด้วย Array of Buckets + Hash Function + Chaining) บน Express backend เพื่อลดการดึงข้อมูลซ้ำจาก Open Library |
| **จัดเรียงหนังสือตาม Edition / ปี** | **Custom Merge Sort** ($O(n \log n)$) เขียนขึ้นเอง รองรับการเรียงตามจำนวน Edition มากสุด/น้อยสุด และปีตีพิมพ์ |
| **ค้นหาคำเติมอัตโนมัติ (Autocomplete)** | **Trie Structure** เก็บชื่อหนังสือที่เคยค้นหา แล้วนำมาเสนอคำล่วงหน้าแบบ Prefix Matching |
| **ประวัติการเข้าดูล่าสุด** | **Bounded Stack (LIFO)** ดันหนังสือที่ผู้ใช้คลิกไว้บนสุด จำกัดสูงสุด 8 รายการ |
| **คิวสำหรับโหลดข้อมูลเพิ่ม** | **Queue (FIFO)** จัดคิวหมายเลขหน้าที่ต้องดึงมาต่อท้ายผลลัพธ์การค้นหา |
| **ค้นหากระโดดไปปีที่ต้องการ** | **Binary Search** ($O(\log n)$) ค้นหาหนังสือที่มีปีใกล้เคียงที่สุดในอาร์เรย์ที่จัดเรียงแล้ว |
| **เปรียบเทียบหมวดหมู่** | **Set Intersection** หาจุดร่วมของ Subject จากหนังสือ 2-3 เล่ม |

## 🛠 วิธีการติดตั้งและรันในเครื่อง

1. ติดตั้ง Dependencies:
   ```bash
   npm install