import os
import sys
import re

# Add the current directory (PE_Generator) to Python path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pe_generator import (
    ExamParser,
    parse_dynamic_spec,
    detect_extra_fields,
    build_config_from_exam,
    generate_project,
    DEFAULT_TEMPLATE_DIR,
    OUTPUT_BASE_DIR
)

# Output directory for the templates
TEAMPLATE_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "TeamPlate8")

EXAMS = [
    {
        "file": "../peprojectbooking.md",
        "folder": "01_EventManagement",
        "friendly_name": "Event Management System"
    },
    {
        "file": "../PE.docx.md",
        "folder": "02_CoWorkingBooking",
        "friendly_name": "Co-Working Space Booking System"
    },
    {
        "file": "../DONE Movie Theaters Management System.docx.md",
        "folder": "03_MovieTheaterBooking",
        "friendly_name": "Movie Theaters Management System"
    },
    {
        "file": "../Done Hospital Appointment.docx.md",
        "folder": "04_HospitalAppointment",
        "friendly_name": "Hospital Appointment Management System"
    },
    {
        "file": "../Done Equipment Rental.docx.md",
        "folder": "05_EquipmentRental",
        "friendly_name": "Equipment Rental Management System"
    },
    {
        "file": "../Done Car Rental Management System.docx.md",
        "folder": "06_CarRental",
        "friendly_name": "Car Rental Management System"
    },
    {
        "file": "../Done DECUATai.md",
        "folder": "07_SmartWarehouse",
        "friendly_name": "Smart Warehouse & Inventory Management System"
    },
    {
        "file": "../DePE2.docx.md",
        "folder": "08_EVChargingSystem",
        "friendly_name": "Smart EV Charging Station Management System"
    }
]

def generate_rename_guide(config, friendly_name):
    project_name = config["project_name"]
    ru = config.get("resource_name_upper", "Resource")
    rl = config.get("resource_name_lower", "resource")
    bu = config.get("booking_name_upper", "Booking")
    bl = config.get("booking_name_lower", "booking")
    
    code_field = config.get("resource_code_field", "resourceCode")
    price_field = config.get("price_field", "pricePerUnit")
    feat_field = config.get("features_field", "features")
    id_field = config.get("resource_id_field", "resourceId")
    total_field = config.get("total_field", "totalAmount")
    
    res_route = config.get("resource_route_path", "/resources")
    book_route = config.get("booking_route_path", "/bookings")
    
    guide = f"""# CẨM NANG ĐỔI TÊN DỰ ÁN MẪU (EXAM RENAMING GUIDE)
## Áp dụng cho dạng đề: {friendly_name} (`{project_name}`)

Tài liệu này hướng dẫn cách đổi nhanh tên dự án, tên các tệp, các biến và đường dẫn từ dự án mẫu `{project_name}` sang đề thi cụ thể ngày mai bằng tính năng **Global Find & Replace (Ctrl + Shift + H)** của VS Code.

> [!TIP]
> Chỉ mất từ 3 đến 5 phút để hoàn thành việc này trong phòng thi!

---

## BƯỚC 1: Khởi tạo và Đổi tên thư mục gốc
1. Đổi tên thư mục gốc `{project_name}` thành:
   `[tên_của_bạn]_[tên_dự_án_trong_đề]` (Ví dụ: `john_coworkingBooking`).
2. Mở tệp `package.json` và cập nhật trường `"name"` thành tên viết thường của dự án mới.

---

## BƯỚC 2: Cấu hình tệp môi trường `.env`
Mở tệp `.env` và cập nhật cấu hình MongoDB:
```env
MONGO_URI=mongodb://127.0.0.1:27017/<tên_db_theo_đề_mới>
```

---

## BƯỚC 3: Đổi tên các Tệp (Files)
Hãy đổi tên các file trong thư mục dự án theo bảng sau:

| Thư mục | Tên tệp hiện tại | Tên tệp mới (Đề thi mới) |
| :--- | :--- | :--- |
| `/models` | `{rl}Model.js` | `<newResourceName>Model.js` |
| | `{bl}Model.js` | `<newBookingName>Model.js` |
| `/controllers` | `{rl}Controller.js` | `<newResourceName>Controller.js` |
| | `{bl}Controller.js` | `<newBookingName>Controller.js` |
| `/routes` | `{rl}Routes.js` | `<newResourceName>Routes.js` |
| | `{bl}Routes.js` | `<newBookingName>Routes.js` |

---

## BƯỚC 4: Tìm kiếm & Thay thế Toàn cục (Global Search & Replace)
Nhấn **Ctrl + Shift + H** trong VS Code. 

> [!WARNING]
> Tích chọn chế độ **Match Case** (Khớp chữ hoa/chữ thường) để tránh đổi nhầm tên Model (chữ hoa đầu) và tên biến (chữ thường đầu).

### 1. Thay thế tên Mongoose Model (Khớp chữ hoa đầu)
* **Tìm kiếm**: `{ru}` $\rightarrow$ **Thay thế**: `<TênModelResourceMới>`
* **Tìm kiếm**: `{bu}` $\rightarrow$ **Thay thế**: `<TênModelBookingMới>`
*(Ví dụ: `const {ru} = require(...)` sẽ tự động đổi thành `const Space = require(...)`)*

### 2. Thay thế tên Biến và Thuộc tính (Khớp chữ thường đầu)
* **Tìm kiếm**: `{code_field}` $\rightarrow$ **Thay thế**: `<tên_mã_mới>` (ví dụ: `spaceCode`, `carNumber`)
* **Tìm kiếm**: `{price_field}` $\rightarrow$ **Thay thế**: `<tên_giá_mới>` (ví dụ: `pricePerHour`, `pricePerDay`)
* **Tìm kiếm**: `{feat_field}` $\rightarrow$ **Thay thế**: `<tên_tiện_ích_mới>` (ví dụ: `amenities`, `features`)
* **Tìm kiếm**: `{id_field}` $\rightarrow$ **Thay thế**: `<tên_id_tham_chiếu_mới>` (ví dụ: `spaceId`, `doctorId`)
* **Tìm kiếm**: `{total_field}` $\rightarrow$ **Thay thế**: `<tên_tổng_tiền_mới>` (ví dụ: `totalCost`, `totalAmount`)

### 3. Thay thế các Import và Require trong code
* **Tìm kiếm**: `{rl}Model` $\rightarrow$ **Thay thế**: `<newResourceName>Model`
* **Tìm kiếm**: `{bl}Model` $\rightarrow$ **Thay thế**: `<newBookingName>Model`
* **Tìm kiếm**: `{rl}Controller` $\rightarrow$ **Thay thế**: `<newResourceName>Controller`
* **Tìm kiếm**: `{bl}Controller` $\rightarrow$ **Thay thế**: `<newBookingName>Controller`
* **Tìm kiếm**: `{rl}Routes` $\rightarrow$ **Thay thế**: `<newResourceName>Routes`
* **Tìm kiếm**: `{bl}Routes` $\rightarrow$ **Thay thế**: `<newBookingName>Routes`

### 4. Thay thế API Endpoints (Đường dẫn Router)
* **Tìm kiếm**: `{res_route}` $\rightarrow$ **Thay thế**: `/<đường_dẫn_tài_nguyên_mới>`
* **Tìm kiếm**: `{book_route}` $\rightarrow$ **Thay thế**: `/<đường_dẫn_đặt_chỗ_mới>`

---

## BƯỚC 5: Thay thế tên các Hàm (Functions) trong Controller
Mở các file Controller mới và đổi tên hàm cho phù hợp với nghiệp vụ cụ thể của đề thi:

### Trong file controller của Tài nguyên (Resource):
* `getAll{ru}s` $\rightarrow$ `getAll<NewResource>s`
* `get{ru}ById` $\rightarrow$ `get<NewResource>ById`
* `create{ru}` $\rightarrow$ `create<NewResource>`
* `update{ru}` $\rightarrow$ `update<NewResource>`
* `delete{ru}` $\rightarrow$ `delete<NewResource>`

### Trong file controller của Giao dịch/Đặt chỗ (Booking):
* `get{bu}s` $\rightarrow$ `get<NewBooking>s`
* `create{bu}` $\rightarrow$ `create<NewBooking>`

---

## BƯỚC 6: Xử lý phần thừa/thiếu theo nghiệp vụ
* **Đối chiếu Schema:** Kiểm tra xem schema của đề thi mới có thiếu hoặc dư thuộc tính nào so với template hiện tại không. Tiến hành xóa thuộc tính thừa ở:
  1. File Model (`/models/`).
  2. File Controller khi nhận dữ liệu từ `req.body` để lưu hoặc cập nhật.
  3. File Seed dữ liệu mẫu (`/utils/seedData.js` hoặc `/seed.js`).
* **Đồng bộ hóa các Helper:**
  * Nếu dùng `checkOverlap.js` hoặc `calculatePrice.js`, hãy cập nhật tên model và thuộc tính sạc/thuê tương ứng bên trong.

---

## BƯỚC 7: Test lại toàn bộ hệ thống
Chạy lệnh seed và dev để kiểm tra lỗi cú pháp hoặc import:
```bash
npm run seed
npm run dev
```
Mở Postman, import file collection `.json` mới đã đổi tên của bạn và tiến hành test thử các API.
"""
    return guide

def main():
    print("=" * 60)
    print("🚀 Giai doan: Tao 8 Template SDN302 ")
    print("=" * 60)
    
    os.makedirs(TEAMPLATE_OUTPUT_DIR, exist_ok=True)
    
    for exam in EXAMS:
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), exam["file"])
        folder_name = exam["folder"]
        friendly_name = exam["friendly_name"]
        
        print(f"\n--- Dang xu ly: {friendly_name} ---")
        
        if not os.path.exists(file_path):
            print(f"❌ Khong tim thay file de: {file_path}")
            continue
            
        with open(file_path, "r", encoding="utf-8") as fh:
            exam_text = fh.read().strip()
            
        # Parse exam
        parse_result = ExamParser.parse(exam_text)
        parse_result['dynamic_spec'] = parse_dynamic_spec(exam_text)
        
        # Detect extra fields
        d = parse_result['detected']
        rename_map = {
            'resourceCode': d.get('resource_code', 'resourceCode'),
            'pricePerUnit': d.get('price_field', 'pricePerUnit'),
            'features': d.get('features_field', 'features'),
            'resourceId': d.get('resource_id', 'resourceId'),
            'quantityEstimate': d.get('quantity_field', '') or 'quantityEstimate',
            'totalAmount': d.get('total_field', 'totalAmount'),
        }
        extra_fields = detect_extra_fields(exam_text, DEFAULT_TEMPLATE_DIR, rename_map)
        
        # Build config & override names
        config = build_config_from_exam(exam_text, parse_result, extra_fields)
        config["output_dir"] = TEAMPLATE_OUTPUT_DIR
        config["project_name"] = folder_name
        
        # Generate project
        print(f"⚙️  Dang generate template vao TeamPlate8/{folder_name}...")
        files_dict, output_path, cleanup_log = generate_project(config, dry_run=False)
        
        if files_dict is None:
            print(f"❌ Error generating project: {output_path}")
            continue
            
        # Write tailored RENAME_GUIDE.md
        rename_guide_content = generate_rename_guide(config, friendly_name)
        rename_guide_path = os.path.join(output_path, "RENAME_GUIDE.md")
        with open(rename_guide_path, "w", encoding="utf-8") as rfh:
            rfh.write(rename_guide_content)
        
        print(f"✅ Da tao xong {friendly_name} va RENAME_GUIDE.md")
        if cleanup_log:
            print(f"🧹 Log don dep: {len(cleanup_log)} truong.")

    print("\n" + "=" * 60)
    print("🎉 DA HOAN THANH TAO 8 TEMPLATES TRONG TeamPlate8!")
    print("=" * 60)

if __name__ == "__main__":
    main()
