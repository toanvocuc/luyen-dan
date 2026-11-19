# Thiết kế combat — Thiên Lò Luyện Đan (hướng A + B)

> Bản đề xuất để duyệt, **chưa code**. Số liệu là điểm xuất phát; sẽ mô phỏng cân bằng trước khi chốt.

## 1. Tổng quan

Một hệ võ công dùng chung cho hai kiểu trận:

| Kiểu | Dùng cho | Người chơi làm gì |
|---|---|---|
| **A. Theo lượt** | boss Vực Thẳm, boss kỳ ngộ, thiên kiếp (sau này) | mỗi lượt tự chọn: **Võ kỹ / Tuyệt chiêu / Thủ / Dùng đan** |
| **B. Tự đánh** | quái thường ở Vực Thẳm và kỳ ngộ | không bấm gì; trận tự chạy nhanh (≈0,4 giây/lượt, có nút **Bỏ qua**) bằng đúng bộ chiêu đang lắp |

Hai kiểu chạy chung một "bộ máy trận đánh", chỉ khác ai ra quyết định: kiểu A là người chơi, kiểu B là máy (luật đơn giản, xem mục 7).

**Cái hồn lấy từ Tale of Immortal:** chiêu phải **ăn khớp với nhau**. Võ kỹ gieo hiệu ứng lên địch → Tuyệt chiêu "ăn" hiệu ứng đó để nổ sát thương lớn → Thân pháp và Tâm pháp khuếch đại vòng lặp. Người chơi mạnh là người lắp bộ chiêu khớp, không phải người có bí tịch phẩm cao nhất.

**Bỏ đi so với Tale of Immortal:** đánh thời gian thực, đạn bay, né bằng tay, 8 loại tâm pháp, đại chiêu cần điều kiện riêng, bộ chiêu ngũ hành riêng biệt.

---

## 2. Chỉ số

Giữ 5 chỉ số đang có, chỉ làm rõ vai trò trong trận:

| Chỉ số | Vai trò trong trận |
|---|---|
| **Khí huyết** | máu |
| **Lực** | sát thương của võ công ngoại gia: **Kiếm, Đao, Thương, Quyền** |
| **Thần thức** | sát thương của võ công nội gia: **Chưởng, Chỉ**; tăng tỉ lệ gây trạng thái |
| **Phòng ngự** | giảm sát thương nhận |
| **Thân pháp** | tỉ lệ né, tỉ lệ bạo kích |

Thêm hai chỉ số **phái sinh** (không cần nâng riêng, tính từ 5 chỉ số trên + trang bị):

- **Né** = 30% × TP_mình / (TP_mình + TP_địch), tối đa 30%.
- **Bạo kích** = 5% + 10% × TP_mình / (TP_mình + TP_địch); bạo kích gây ×1,6.

**Lực chiến** (một con số hiện ở bảng nhân vật): tổng có trọng số của 5 chỉ số + điểm võ công (phẩm × cấp luyện thục) + thần khí + trang phục. Dùng để so sánh nhanh và để kỳ ngộ / Vực Thẳm xét "đủ sức hay không".

### Công thức sát thương
```
sát thương = Công × hệ số chiêu × (1 − giảm do phòng ngự) × cộng thêm từ trạng thái × ngẫu nhiên(0,9–1,1) × (1,6 nếu bạo kích)
Công      = Lực (ngoại gia) hoặc Thần thức (nội gia)
giảm do phòng ngự = PN_địch / (PN_địch + 2 × chuẩn cảnh giới), tối đa 70%
```

---

## 3. Lượt đánh (kiểu A)

1. Đầu trận: hiện **ý đồ** chiêu kế tiếp của địch (như boss Vực Thẳm hiện nay).
2. Người chơi chọn 1 trong 4:
   - **Võ kỹ**: đòn chính, không hồi chiêu, gieo hiệu ứng.
   - **Tuyệt chiêu**: mạnh, hồi chiêu 3–4 lượt, thường "ăn" hiệu ứng trên địch.
   - **Thủ**: nhận 50% sát thương lượt này, +1 tầng **Khí thế** (xem 4.3).
   - **Dùng đan**: như hiện nay.
3. Linh thú: giữ luật cũ — **3 lượt đánh hộ 1 lần, 5 lượt đỡ hộ 1 lần**.
4. Địch ra chiêu đã báo (trễ 1 giây như hiện tại). Trạng thái tính sát thương theo lượt.
5. Thân pháp, Tâm pháp chạy tự động, không chiếm lượt.

---

## 4. Trạng thái

### 4.1 Hiệu ứng do 6 hệ võ gieo (lên địch)

| Hệ | Trạng thái | Tác dụng | Cộng dồn |
|---|---|---|---|
| Kiếm | **Kiếm thương** | mất 3% máu tối đa mỗi lượt | tối đa 5 tầng |
| Đao | **Phá giáp** | phòng ngự −10% mỗi tầng | tối đa 3 tầng |
| Thương | (tự thân) **Liên kích** | sát thương +8% mỗi tầng; thủ hoặc dùng đan thì mất hết | tối đa 5 tầng |
| Quyền | **Chấn động** | đủ 3 tầng → **Choáng** (mất 1 lượt; boss: huỷ chiêu đang báo, mỗi 4 lượt tối đa 1 lần) | 3 tầng |
| Chưởng | **Nội thương** | mất máu mỗi lượt **bỏ qua phòng ngự**; hồi máu của địch −50% | tối đa 3 tầng |
| Chỉ | **Điểm huyệt** | sát thương địch gây ra −12% mỗi tầng | tối đa 3 tầng |

Mỗi tầng tồn tại 3 lượt (gieo thêm thì làm mới).

### 4.2 Hiệu ứng linh căn (cộng thêm cho chiêu **cùng hệ** với linh căn)

| Linh căn | Thêm vào chiêu |
|---|---|
| Kim | **Xuyên giáp**: bỏ qua 20% phòng ngự |
| Mộc | **Sinh cơ**: hồi 3% máu mỗi khi trúng đòn |
| Thủy | **Hàn khí**: địch né −10%, chịu thêm 10% sát thương (2 lượt) |
| Hỏa | **Thiêu đốt**: mất 2% máu tối đa mỗi lượt, cộng dồn 3 |
| Thổ | **Hộ thể**: nhận khiên bằng 8% máu tối đa |
| Lôi | **Lôi kích**: 25% đánh thêm một tia sét (40% sát thương) |

Mỗi chiêu (bí tịch) mang **một hệ linh căn**. Người chơi có linh căn trùng thì được hiệu ứng trên — đây là lý do để săn bí tịch "hợp linh căn" như Tale of Immortal.

> Ghi chú: linh căn hiện chỉ có độ thuần (Phàm căn → Biến dị). Sẽ thêm **hệ** cho linh căn: Ngũ linh căn có 5 hệ nhưng mỗi hệ chỉ được 40% hiệu ứng, Song linh căn 2 hệ 80%, Thiên linh căn 1 hệ 100%, Biến dị = Lôi 120%. Nhân vật cũ được gán hệ ngẫu nhiên theo tên (cố định).

### 4.3 Trạng thái chung

| Trạng thái | Lên ai | Tác dụng |
|---|---|---|
| **Khí thế** | mình | mỗi tầng: tuyệt chiêu hồi chiêu nhanh 1 lượt (tối đa 2) — có được khi Thủ |
| **Choáng** | cả hai | mất lượt |
| **Hộ thể** | cả hai | khiên hút sát thương |
| **Trúng độc**, **Chảy máu**, **Yếu**, **Hắc hoá** | mình | giữ nguyên như Vực Thẳm hiện nay (Chảy máu gộp chung với Kiếm thương) |
| **Cuồng bạo** | boss | như Ma Long hoá ma hiện nay |

Tổng cộng khoảng **14 trạng thái** — mỗi cái cần một biểu tượng nhỏ (mục 8).

---

## 5. Võ công

### 5.1 Ô lắp

| Ô | Số ô | Mở khoá |
|---|---|---|
| Võ kỹ | 1 | từ đầu |
| Tuyệt chiêu | 1 | Trúc Cơ |
| Thân pháp | 1 | Kim Đan |
| Tâm pháp | 1 → 2 | Luyện Khí → ô thứ 2 ở Hóa Thần |

### 5.2 Nên thêm chiêu hay nâng cấp võ công?

Chín biểu tượng đang có là **9 loại**, chưa phải 9 chiêu. Đề xuất: **ít chiêu, nhiều tầng nâng cấp**.

- **20 bí tịch gốc**: 6 hệ × (1 võ kỹ + 1 tuyệt chiêu) = 12, + 3 thân pháp + 5 tâm pháp.
- Mỗi bí tịch có **6 phẩm** (xám → lục → lam → tím → cam → đỏ): cùng một chiêu, phẩm càng cao hệ số càng lớn và càng nhiều **phụ hiệu** (0 / 0 / 1 / 1 / 2 / 3).
- Mỗi bí tịch có **10 cấp luyện thục**: +4% hệ số mỗi cấp; cấp 4 / 7 / 10 mở từng phụ hiệu.
- Phụ hiệu quay ngẫu nhiên từ một danh sách theo hệ (ví dụ Kiếm: "Kiếm thương tối đa 7 tầng", "tuyệt chiêu ăn Kiếm thương thì hồi chiêu −1"…). Đây là phần "ngộ" của Tale of Immortal — khiến hai cuốn cùng tên cũng khác nhau.

Như vậy chỉ cần ~20 biểu tượng chiêu nhưng có hàng trăm biến thể, và đường nâng cấp dài. Sau này muốn thêm thì mỗi hệ thêm 1 võ kỹ + 1 tuyệt chiêu nữa.

### 5.3 Danh sách bí tịch gốc

**Võ kỹ** (đòn chính, hệ số theo Công):

| Hệ | Tên | Hệ số | Gieo |
|---|---|---|---|
| Kiếm | Lưu Vân Kiếm Pháp | 100% | 1 Kiếm thương |
| Đao | Cuồng Lan Đao | 110% | 1 Phá giáp (50%) |
| Thương | Bôn Lôi Thương | 90% | +1 Liên kích |
| Quyền | Khai Sơn Quyền | 95% | 1 Chấn động |
| Chưởng | Hàn Băng Chưởng | 85% (nội gia) | 1 Nội thương |
| Chỉ | Kinh Hồng Chỉ | 90% (nội gia) | 1 Điểm huyệt (60%) |

**Tuyệt chiêu** (hồi chiêu):

| Hệ | Tên | Hồi | Tác dụng |
|---|---|---|---|
| Kiếm | Vạn Kiếm Quy Tông | 4 | 150% + **nổ toàn bộ Kiếm thương**: mỗi tầng thêm 40% |
| Đao | Phá Thiên Nhất Đao | 4 | 260%; mỗi tầng Phá giáp +25% |
| Thương | Long Đằng Cửu Thiên | 3 | đâm 3 lần × 60%; Liên kích tính cho từng lần |
| Quyền | Bá Vương Quyền | 3 | 200%; địch đang Choáng thì ×1,5 |
| Chưởng | Thái Cực Âm Dương Chưởng | 4 | 120% + kích nổ Nội thương ngay 2 lượt |
| Chỉ | Nhất Dương Chỉ | 3 | 180%, chắc chắn trúng; tiêu Điểm huyệt để hồi 5% máu mỗi tầng |

**Thân pháp** (bị động):

| Tên | Tác dụng |
|---|---|
| Lăng Ba Bộ | né +8%; cứ 5 lượt né hẳn 1 đòn |
| Truy Phong Bộ | né thành công → lượt sau Võ kỹ +30% |
| Huyễn Ảnh Bộ | né thành công → 1 tầng Khí thế |

**Tâm pháp** (bị động):

| Tên | Tác dụng |
|---|---|
| Kim Cương Kinh | khí huyết +12% |
| Thanh Tâm Quyết | thần thức +12%; tỉ lệ gây trạng thái +10% |
| Thiết Bố Sam | phòng ngự +15% |
| Cuồng Huyết Lục | lực +12%; máu dưới 30% thì sát thương +20% |
| Hỗn Nguyên Công | trạng thái mình gieo kéo dài thêm 1 lượt |

### 5.4 Ví dụ vài bộ chiêu "khớp"

- **Kiếm máu**: Lưu Vân Kiếm Pháp → Vạn Kiếm Quy Tông + Hỗn Nguyên Công (Kiếm thương sống lâu hơn → nổ to hơn).
- **Quyền khống chế**: Khai Sơn Quyền → Bá Vương Quyền + Huyễn Ảnh Bộ (né → Khí thế → tuyệt chiêu nhanh hơn, đánh đúng lúc địch Choáng).
- **Chưởng nội gia**: Hàn Băng Chưởng (linh căn Thủy) → Thái Cực Âm Dương Chưởng + Thanh Tâm Quyết.

### 5.5 Có bí tịch từ đâu (mục 3 của sếp)

| Nguồn | Phẩm |
|---|---|
| Lên cảnh giới lớn | tặng 1 bí tịch xám / lục |
| Phường thị | xám, lục (đổi mỗi kỳ) |
| Tông môn (Tàng Bảo Các, đổi danh vọng) | lam, tím; mỗi tông môn mạnh 1–2 hệ |
| Kỳ ngộ, boss Vực Thẳm | cam, đỏ — rất hiếm |

### 5.6 Nối về luyện đan

- **Ngộ Đạo Đan** (đan mới): +1 cấp luyện thục cho một bí tịch.
- **Tẩy Tủy Đan / đan đột phá** giữ nguyên.
- Lắp tuyệt chiêu hồi chiêu dài → càng cần đan hồi máu trong trận.

---

## 5b. Thiên phú võ học (căn cốt)

Như Tale of Immortal: mỗi nhân vật có **căn cốt riêng cho từng hệ võ**, quay lúc tạo nhân vật. Người chơi nhìn vào đó mà chọn đi theo thiên phú, hoặc cố tình đi đường khác (chậm hơn, nhưng vẫn đi được).

**Năm bậc căn cốt cho mỗi hệ** (Kiếm, Đao, Thương, Quyền, Chưởng, Chỉ):

| Bậc | Luyện thục | Sát thương hệ đó | Màu |
|---|---|---|---|
| Kém | ×0,7 | −5% | xám |
| Thường | ×1 | 0 | trắng |
| Khá | ×1,3 | +5% | lục |
| Giỏi | ×1,6 | +10% | lam |
| Thiên tài | ×2 | +15%, mở thêm 1 phụ hiệu | vàng |

**Luật quay:**
- Mỗi nhân vật có đúng **1 thiên phú chính** (ít nhất Khá; 10% ra Thiên tài).
- Có thể có thêm 1 hệ phụ (Khá), còn lại phần lớn Thường, 1–2 hệ Kém.
- **Xuất thân nghiêng thiên phú chính** về một hệ (không bắt buộc, 60%):

| Xuất thân | Nghiêng về |
|---|---|
| Nông gia | Quyền |
| Thư hương môn đệ | Chỉ |
| Con nhà thợ săn | Thương |
| Gia đình y sư | Chưởng |
| Con nhà thợ rèn | Đao |
| Đạo đồng | Kiếm |
| Cô nhi, Thương gia, Thế gia luyện đan | ngẫu nhiên |

**Hiển thị:**
- Màn tạo nhân vật: thêm **một dòng** "Thiên phú: Kiếm đạo (Giỏi)" — nằm trong 5 lần tạo lại.
- Bảng nhân vật: đủ 6 hệ dạng thanh màu.
- Bí tịch hợp thiên phú có dấu ★ trong túi để người chơi nhận ra ngay.

**Nhân vật đã tạo trước bản này:** quay căn cốt cố định theo tên (không đổi khi nạp lại), cùng luật trên.

**Đổi hướng về sau:** đan hiếm **Tẩy Cốt Đan** nâng một hệ lên một bậc (tối đa Giỏi) — thêm một đầu ra cho luyện đan.

## 6. Trận theo lượt — giao diện

```
┌──────────────────────────────┐
│  [Boss / quái]   ███████░░ 72% │  ← thanh máu địch
│  ⚔3 🛡2 ✶1                     │  ← biểu tượng trạng thái trên địch (số = tầng)
│  "Nó giương đôi kìm…"          │  ← ý đồ lượt tới
│                                │
│        (ảnh địch + hiệu ứng)   │  ← vệt chiêu chồng lên, số sát thương bay lên
│                                │
│  Nhân vật  ██████████░ 88%     │
│  ✶2 ☯1                         │  ← trạng thái trên mình
│ [Võ kỹ] [Tuyệt chiêu 2] [Thủ] [Đan] │ ← số trên Tuyệt chiêu = còn mấy lượt
│  Nhật ký trận (cuộn được)      │
└──────────────────────────────┘
```

---

## 7. Trận tự đánh (kiểu B)

- Bấm vào quái → mở cửa sổ trận nhỏ, chạy tự động ≈0,4 giây/lượt, có nút **Bỏ qua** (tính ngay kết quả).
- Máy chọn: Tuyệt chiêu khi hồi xong và (với Kiếm/Đao/Chưởng/Chỉ) khi đủ ≥3 tầng hiệu ứng; còn lại dùng Võ kỹ; máu < 30% và có bật "tự uống đan" thì uống đan hồi máu.
- Thay cho cách tính thắng/thua ngay hiện nay ở quái Vực Thẳm.

---

## 8. Hiệu ứng hình ảnh (thay cho chỉ có tiếng)

| Lớp | Làm bằng | Cần ảnh |
|---|---|---|
| **Vệt chiêu** đè lên địch khi trúng đòn (phóng to + mờ dần 0,4 giây) | ảnh + CSS | 6 vệt võ kỹ, 6 vệt tuyệt chiêu |
| **Hiệu ứng linh căn** đi kèm (lửa, sét, băng…) | ảnh + CSS | 6 ảnh |
| **Né, khiên, hồi máu, bạo kích** | ảnh + CSS | 1 tấm 6 ảnh |
| **Số sát thương bay lên** (bạo kích to + vàng, trạng thái đổi màu) | code | — |
| **Rung màn, loé trắng** khi tuyệt chiêu / bạo kích; viền đỏ khi mình trúng đòn nặng | code | — |
| **Biểu tượng trạng thái** dưới thanh máu | ảnh | 14 biểu tượng |
| **Biểu tượng chiêu** trên nút và trong túi bí tịch | ảnh | 12 (6 võ kỹ dùng 6 biểu tượng loại sẵn có; vẽ thêm 6 tuyệt chiêu) |

Ảnh hiệu ứng vẽ **trên nền đen** để ghép bằng chế độ hoà màu "screen": chỗ đen biến mất, chỗ sáng phát quang — không cần tách nền, viền mềm tự nhiên.

Lời nhắc: `Hinh_anh/_gemini/LOI-NHAC-BUOC-6.txt`.

---

## 9. Kế hoạch làm

| Bước | Việc | Ước tính |
|---|---|---|
| 1 | Bộ máy trận đánh chung + 14 trạng thái + 20 bí tịch (dữ liệu) | 4–5 ngày |
| 2 | Chuyển boss Vực Thẳm sang bộ máy mới (kiểu A) + lớp hiệu ứng hình ảnh | 3–4 ngày |
| 3 | Quái thường tự đánh (kiểu B) | 2 ngày |
| 4 | Túi bí tịch, lắp chiêu, luyện thục, phụ hiệu, Ngộ Đạo Đan, nguồn bí tịch | 4–5 ngày |
| 5 | Hệ cho linh căn, lực chiến, mô phỏng cân bằng | 2–3 ngày |

Tổng ≈ **3 tuần** làm việc (chưa tính thần khí, trang phục).

## 10. Cần chốt

1. Linh căn thêm **hệ** (mục 4.2) — đồng ý?
4. Thiên phú võ học (mục 5b): 5 bậc, xuất thân nghiêng thiên phú — đồng ý?
2. Kiểu B: có cho "tự uống đan" không, hay uống đan chỉ khi đánh tay?
3. 20 bí tịch gốc với tên như mục 5.3 — có muốn đổi tên / thêm bớt hệ không?
