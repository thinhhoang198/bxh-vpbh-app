# Bảng xếp hạng "Dẫn lối khách hàng - Chinh phục booking"

Trang bảng xếp hạng công khai cho trò chơi thi đua **Dẫn lối khách hàng** (chuỗi "Tọa độ bứt phá") của dự án
**Nam Mekong Grand Plaza Bình Dương**. CVKD xem thứ hạng trên điện thoại, và trang chạy toàn màn hình trên TV tại VPBH.

- Chương trình: **12/10/2026 đến 27/12/2026, 11 tuần**, mỗi tuần từ Thứ Hai đến Chủ nhật
  (tuần 1: 12/10 đến 18/10, tuần 2: 19/10 đến 25/10, tuần 11: 21/12 đến 27/12).
- Điểm = số khách thực tế được lễ tân xác nhận. Giải tuần 1.000.000 VNĐ cho người dẫn đầu và đạt tối thiểu 5 khách.
- Đồng điểm: ai đạt sớm hơn xếp trên. Thứ tự do Google Sheet tính sẵn, trang **không tự sắp xếp lại**.

## 1. Kiến trúc

```
Google Sheet của BTC (riêng tư, công thức tự tính điểm)
        |  Apps Script Web App (chỉ đọc, chỉ trả JSON đã che SĐT)
        v
Vercel Function /api/leaderboard (giữ khóa bí mật, cache CDN 60 giây)
        v
React SPA (trình duyệt chỉ gọi /api/leaderboard cùng origin)
```

- Trình duyệt **không bao giờ** gọi Apps Script và **không bao giờ** nhận SĐT đầy đủ (chỉ dạng `0797***333`).
- Không có CCCD, tên khách hàng hay cờ nội bộ trong JSON công khai. Function còn validate lại bằng zod và loại mọi
  trường không thuộc hợp đồng dữ liệu ([src/lib/types.ts](src/lib/types.ts)).
- Khóa bí mật chỉ nằm trong biến môi trường, không có trong bundle client (đã kiểm tra bằng grep trên `dist/`).

```
apps-script/Code.gs        mã Apps Script cho BTC dán vào (+ Code.test.ts)
api/leaderboard.ts         proxy + cache + mã truy cập tùy chọn (+ leaderboard.test.ts)
public/brand/              logo (logo-color.png; logo-color-sm.png là bản thu nhỏ của đúng logo đó)
src/                       React app (lib/, components/, pages/)
scripts/                   make-logo-sm, make-favicons
```

## 2. Chạy local

Yêu cầu Node 20 trở lên. Không có dữ liệu mẫu: trang luôn đọc dữ liệu thật qua Apps Script.

```bash
npm install
cp .env.example .env.local   # rồi điền APPS_SCRIPT_URL và APPS_SCRIPT_KEY (xem mục 3 và 4)
npm run dev                  # http://localhost:5173
```

`npm run dev` chạy chính hàm `api/leaderboard.ts` trong máy bạn, nên cần đã triển khai Apps Script (mục 4).
Nếu thiếu `APPS_SCRIPT_URL`, API trả `503 {"error":"not_configured"}` và trang hiện "Không tải được bảng xếp hạng".

Các lệnh khác: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

Mẹo khi phát triển:

| Cần                               | Cách làm                                                                  |
| --------------------------------- | ------------------------------------------------------------------------- |
| Xem chế độ TV                     | `/?tv=1` (mũi tên trái/phải chuyển slide)                                 |
| Giả lập thời gian                 | `/?now=2026-11-20T10:00` (chỉ đổi đồng hồ phía trình duyệt, chỉ ở `npm run dev`) |
| Thử màn hình nhập mã truy cập     | đặt `ACCESS_CODE=abc` trong `.env.local`                                  |
| Bản build QA có giả lập thời gian | `VITE_ALLOW_SIM=1 npm run build` (**không** đặt biến này trên production) |

## 3. Biến môi trường (chỉ phía server)

| Biến              | Bắt buộc           | Ý nghĩa                                                                                   |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `APPS_SCRIPT_URL` | có (khi chạy thật) | URL Web App của Apps Script (kết thúc bằng `/exec`)                                       |
| `APPS_SCRIPT_KEY` | có                 | Trùng với Script Property `API_KEY`                                                       |
| `ACCESS_CODE`     | không              | Mã truy cập chung. Đặt thì mọi người phải nhập mã                                         |

Xem [.env.example](.env.example) (khi chạy local, đặt trong `.env.local`, file này không được commit). Tuyệt đối không đặt tiền tố `VITE_` cho các biến này.

## 4. Triển khai Apps Script (từng bước)

Script được viết riêng cho file **"BXH Dẫn Lối Khách Hàng"**
(`https://docs.google.com/spreadsheets/d/1IhlHYa4pFLXY9CdpAWoi7OsUmCUJPAUVJLoSBSiMf-g`). Nó **chỉ đọc**, không ghi,
không đổi cấu trúc sheet. Làm bằng tài khoản Google sở hữu file này (đó cũng là tài khoản có quyền xem file check-in
nguồn mà sheet **Dữ liệu** đang IMPORTRANGE).

**Giá trị sheet `Cấu hình` cần có** (script chỉ đọc, không sửa). File hiện tại đã đúng các giá trị này:

| Ô     | Giá trị                                                                    |
| ----- | -------------------------------------------------------------------------- |
| `C7`  | **12/10/2026** (bắt đầu chương trình, Thứ Hai)                             |
| `C8`  | 27/12/2026 (kết thúc chương trình)                                         |
| `C10` | 5 (số khách tối thiểu mỗi tuần)                                            |
| `C11` | 1000000 (tiền giải tuần)                                                   |
| `C13` | **05/10/2026** (Thứ Hai **trước** ngày khởi động 1 tuần, mốc chia tuần)    |
| `C14` | công thức `=INT((C8-C13)/7)`, kết quả **11** (số tuần, **không** gõ đè số) |

**`C13` phải là 05/10/2026, không đặt 12/10.** Công thức của sheet tính số tuần bằng `INT((ngày - C13) / 7)` và tuần n
bắt đầu từ `C13 + 7n`. Vì vậy `C13` phải là Thứ Hai **trước** Thứ Hai khởi động đúng 7 ngày. Với `C13` = 05/10 thì
tuần 1 là 12/10 đến 18/10, tuần 2 bắt đầu 19/10, `C14` ra 11. Nếu đặt `C13` = 12/10 thì tuần 1 bị kéo dài thành
12/10 đến 25/10 và chỉ còn 10 tuần.

**Khi dời ngày bắt đầu:** chỉ sửa `C7` (và `C8` nếu đổi ngày kết thúc), rồi đặt `C13` = Thứ Hai trước ngày bắt đầu
1 tuần. Các ghi chú trong sheet còn nhắc "tuần 1 kéo dài 12 ngày (07/10 đến 18/10)" (Cấu hình D13 và D14,
BXH tuần A2) cần sửa lại cho khớp, vì không còn đúng.

**Script đọc những gì (không đụng sheet nào khác):**

| Sheet                  | Ô / cột                      | Dùng làm                                                                                         |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Cấu hình               | C7, C8                       | ngày bắt đầu, ngày kết thúc chương trình                                                         |
| Cấu hình               | C10, C11                     | mốc khách tối thiểu/tuần (5), tiền giải/tuần (1.000.000)                                         |
| Cấu hình               | C13, C14                     | mốc chia tuần (05/10/2026) và số tuần (11)                                                       |
| CVKD (hàng 2 đến 1201) | C, D, E (hoặc F), G, H, I, K | SĐT chuẩn (chỉ để che số), họ tên, đại lý, tổng khách, số lượt, check-in gần nhất, điểm xếp hạng |
| CVKD                   | N đến AB, AC đến AQ          | số khách theo tuần 1 đến 15 và khóa xếp hạng tuần (0 = không có khách)                           |
| Dữ liệu                | C2:C4001                     | giờ check-in, chỉ để lấy thời điểm "Dữ liệu tính đến"                                            |

Script **không** đọc cột Cảnh báo (CVKD!J), CCCD, tên khách hay bất kỳ cột nào khác của sheet Dữ liệu.

Cách chia tuần giống hệt công thức của sheet **Giải tuần** và **Dữ liệu!T**: tuần 1 từ C7 đến `C13 + 13 ngày`
(12/10 đến 18/10), tuần n từ 2 là `C13 + 7n` đến `+ 6 ngày`, tuần cuối bị chặn bởi C8 (21/12 đến 27/12).
Thứ hạng lấy theo cột **Điểm xếp hạng** (K) và **Xếp tuần** (AC đến AQ) mà sheet đã tính sẵn (nhiều khách hơn xếp trên,
bằng nhau thì check-in sớm hơn xếp trên). Khi trùng hoàn toàn, hai người cùng hạng và người ở dòng trên của CVKD
được hiển thị trước, giống cách sheet chọn người nhận giải (cột "Lưu ý" của sheet Giải tuần báo BTC xác định).

**Các bước:**

1. Mở file Google Sheet trên. Vào **File > Settings**, tab **General**, đặt **Time zone** là
   `(GMT+07:00) Bangkok, Hanoi, Jakarta`, rồi bấm **Save settings**.
2. Vào **Extensions > Apps Script** (script gắn với file, không cần điền ID). Xóa nội dung mặc định, dán toàn bộ
   [apps-script/Code.gs](apps-script/Code.gs), bấm biểu tượng **Save project** (hoặc Ctrl+S). (Nếu muốn tạo script
   độc lập thay vì gắn vào file, thêm script property `SPREADSHEET_ID` là ID của file; mặc định đã là ID ở trên.)
3. (Khuyến nghị) Bấm **Project Settings** (biểu tượng bánh răng ở thanh bên trái) > bật
   **Show "appsscript.json" manifest file in editor**. Quay lại **Editor**, mở tệp `appsscript.json` và đặt
   `"timeZone": "Asia/Ho_Chi_Minh"`.
4. Đặt khóa API: **Project Settings > Script Properties > Add script property**. Ở **Property** nhập `API_KEY`, ở
   **Value** nhập một chuỗi ngẫu nhiên dài (từ 32 ký tự), rồi bấm **Save script properties**. Chuỗi này sẽ là
   `APPS_SCRIPT_KEY` trên Vercel.
5. Bấm **Deploy > New deployment**. Ở biểu tượng bánh răng cạnh **Select type**, chọn **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone

   Bấm **Deploy**, bấm **Authorize access** và cấp quyền khi được hỏi (script chỉ đọc Google Sheet), rồi sao chép
   **Web app URL** (dạng `https://script.google.com/macros/s/.../exec`). Đây là `APPS_SCRIPT_URL`.

6. Thử nhanh bằng trình duyệt: `APPS_SCRIPT_URL?action=summary&key=API_KEY`. Phải thấy JSON có `meta`, `overall`...
   Thiếu hoặc sai `key` phải trả `{"error":"unauthorized"}`. Kiểm tra JSON **không có** số điện thoại đầy đủ.
   Thử thêm `?action=week&week=1&key=API_KEY`.
7. **Mỗi lần sửa mã** phải tạo phiên bản mới: **Deploy > Manage deployments > Edit** (biểu tượng bút chì) >
   **Version: New version** > **Deploy**. Chỉ bấm Save thì Web App vẫn chạy mã cũ.
8. Đổi khóa: sửa `API_KEY` trong **Project Settings > Script Properties**, rồi cập nhật `APPS_SCRIPT_KEY` trên Vercel
   và Redeploy.

**Quyền chia sẻ file (quan trọng):** file này chứa SĐT đầy đủ (sheet CVKD, Dữ liệu). Script chạy dưới quyền chủ file nên
file **không cần** chia sẻ công khai. Bấm **Share > General access** và chọn **Restricted**, chỉ thêm tài khoản BTC cần
dùng. Nếu file đang ở chế độ **Anyone with the link**, bất kỳ ai có link đều tải được toàn bộ SĐT.

Giới hạn: đọc tối đa dòng 2 đến 1201 của sheet CVKD (bỏ dòng trống), BXH tổng tối đa 300 dòng, BXH tuần tối đa 200 dòng.

## 5. Triển khai Vercel

1. Đẩy mã lên GitHub (hoặc dùng Vercel CLI), vào Vercel chọn **Add New > Project** và import repo. Framework: Vite
   (tự nhận). Build command `npm run build`, output `dist`.
2. **Settings > Environment Variables** (Production), thêm `APPS_SCRIPT_URL`, `APPS_SCRIPT_KEY`, và nếu muốn `ACCESS_CODE`.
3. **Deploy**. Kiểm tra `https://<tên-miền>/api/leaderboard` trả JSON và header `Cache-Control: public, s-maxage=60, ...`
   cùng `X-Robots-Tag: noindex, nofollow`.
4. Mỗi lần đổi biến môi trường phải **Redeploy** mới có hiệu lực.

Hành vi của function ([api/leaderboard.ts](api/leaderboard.ts)):

- Lỗi từ nguồn trả `502 {"error":"upstream_unavailable"}`, không lộ URL hay khóa. Trang giữ dữ liệu cũ và báo "Đang hiển thị dữ liệu lúc HH:mm".
- Có `ACCESS_CODE`: bắt buộc header `x-access-code` khớp, sai trả 401. Khi đó CDN **không** cache công khai
  (`private, max-age=30`) và function giữ cache bộ nhớ 60 giây để bảo vệ Apps Script.

## 6. Trỏ subdomain

Dự kiến `bxh.nammekonggrandplaza.com` (cấu hình giống `checkin.nammekonggrandplaza.com`).

1. Vercel: **Project > Settings > Domains > Add** nhập `bxh.nammekonggrandplaza.com`.
2. Tại nơi quản lý DNS của `nammekonggrandplaza.com`, thêm bản ghi **CNAME**: tên `bxh`, giá trị `cname.vercel-dns.com`
   (hoặc đúng giá trị Vercel hiển thị). Nếu DNS hỗ trợ proxy (ví dụ Cloudflare), tắt proxy khi xác minh lần đầu.
3. Chờ Vercel báo **Valid Configuration**, chứng chỉ HTTPS được cấp tự động.

## 7. Mã truy cập (ACCESS_CODE)

Mã truy cập chung chỉ là **rào cản mềm**, không phải bảo mật tuyệt đối: mọi người cùng dùng một mã, mã đã chia sẻ
thì ai biết cũng vào được, và mã được gửi từ trình duyệt của từng người. Dữ liệu công khai đã được che SĐT và
không có thông tin khách hàng, đó mới là lớp bảo vệ chính. Đổi mã bằng cách sửa biến môi trường và Redeploy.

## 8. Chế độ TV

Mở `https://<tên-miền>/?tv=1` trên TV/LED rồi bấm F11 (toàn màn hình). Giao diện tối, chữ lớn, tự luân phiên mỗi
20 giây giữa Tuần này (top 10), Bảng tổng (top 10) và Giải các tuần, tự làm mới mỗi 60 giây, ẩn con trỏ chuột.
Nếu TV có mã truy cập, nhập mã một lần bằng bàn phím.

## 9. Giả định

- Dự án mới độc lập (repo trống ban đầu), không phải website check-in hiện có, nên route `/` và `/bxh` cùng hiển thị bảng xếp hạng.
- Lịch chương trình theo chỉ đạo mới nhất của BTC (ngày 07/10/2026): bắt đầu Thứ Hai 12/10/2026 (dời từ 07/10, tuần 1 đủ 7 ngày như các tuần khác),
  kết thúc Chủ nhật 27/12/2026 (tuần trước 31/12), 11 tuần. Lịch lấy từ sheet nên khi đổi lịch chỉ cần sửa các ô ở `Cấu hình` (C7, C8, C13).
- Tailwind v4 với `@theme` (không có `tailwind.config.js`). Font Be Vietnam Pro (kể cả tiêu đề, hỗ trợ đầy đủ dấu tiếng Việt) tải từ Google Fonts.
- Màu chữ cam cỡ nhỏ trên nền sáng dùng `#9A5200` (màu phái sinh) thay vì `#C26A05` vì `#C26A05` chỉ đạt khoảng 3,9:1,
  chưa đủ WCAG AA cho chữ nhỏ. `#C26A05` giữ lại cho chữ lớn.
- Sheet CVKD cột C là SĐT chuẩn; nếu Sheets làm mất số 0 đầu (số 9 chữ số), script tự bù lại trước khi che.
- "Dữ liệu tính đến" lấy giờ check-in mới nhất trong sheet Dữ liệu (giống ô "Check-in mới nhất" của BXH tổng), kể cả check-in chưa được tính điểm.
- `logo-color-sm.png` là bản thu nhỏ của đúng logo gốc (tạo bằng `scripts/make-logo-sm.ts`) để trang tải nhanh. Logo gốc không bị thay đổi.
  Khi có bản logo trắng (`logo-white.svg` hoặc `.png`) đặt vào `public/brand/` rồi build lại, header sẽ tự dùng bản trắng.
- Thông tin liên hệ BTC trong hộp "Thể lệ rút gọn" nằm ở [src/components/RulesDialog.tsx](src/components/RulesDialog.tsx).
- Chưa có analytics hay cookie theo dõi. Chỉ `localStorage` cho nút "Ghim tôi" và `sessionStorage` cho mã truy cập.
- Lighthouse mobile (giả lập mạng chậm, đo trên máy phát triển): Accessibility 100, Performance dao động 77 đến 86,
  LCP khoảng 4 giây. Cần đo lại sau khi triển khai Vercel (có nén brotli và CDN).

## 10. Phase 2 (chưa làm)

- **Mũi tên tăng/giảm hạng so với hôm qua:** cần một sheet lưu ảnh chụp thứ hạng hằng ngày (ví dụ Apps Script chạy
  trigger theo ngày vào lúc 23:59, ghi `ngày, SĐT chuẩn, hạng tổng, hạng tuần` vào sheet `LichSuHang`). Apps Script đọc
  ảnh chụp gần nhất để thêm trường `rankDelta` vào `Entry`, giao diện hiển thị mũi tên.
- **BXH theo đại lý:** thêm route `?action=agencies` cộng điểm theo đại lý (tổng khách, số CVKD có điểm, số CVKD đạt mốc tuần)
  và một tab mới.
