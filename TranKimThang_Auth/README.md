# TranKimThang_Auth

Auth/RBAC starter dùng lại cho bài thi Node.js + Express + MongoDB. Module hỗ trợ hai kiểu đề phổ biến:

1. `public`: người dùng tự đăng ký, role mặc định như `customer` hoặc `student`.
2. `manager_only`: chỉ manager có JWT mới được tạo user; không cho tạo thêm manager qua API.

## Chạy project

```powershell
npm install
npm run seed
npm run dev
```

Tài khoản seed đều dùng password `123456`:

| Username | Ý nghĩa |
|---|---|
| `manager1` | Role đầu tiên trong `AUTH_MANAGER_ROLES` |
| `user1` | Role trong `AUTH_DEFAULT_ROLE` |
| `deactivated1` | Tài khoản `isActive: false` |

Nếu port trong `.env` đang bận, `npm run dev` tự chọn một trong 49 port kế tiếp và in URL thực tế.

## Endpoint

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/auth/register` | Public hoặc manager-only tùy cấu hình |
| POST | `/auth/login` | Bcrypt authentication và trả JWT |
| GET | `/auth/me` | Lấy user hiện tại bằng JWT |
| GET | `/demo/authenticated` | Ví dụ route cần đăng nhập |
| GET | `/demo/manager` | Ví dụ route cần manager role |

Trong controller nghiệp vụ, luôn lấy user từ:

```js
req.user.userId
req.user.role
```

Không nhận `userId`, `performedBy`, `registeredBy` từ request body.

## Preset 1 — Admin/Customer

Dùng cho Co-working, Equipment Rental, EV Charging và các đề có role `admin/customer`:

```env
AUTH_REGISTRATION_MODE=public
AUTH_ALLOWED_ROLES=admin,customer
AUTH_DEFAULT_ROLE=customer
AUTH_MANAGER_ROLES=admin
AUTH_ASSIGNMENT_FIELD=
AUTH_ASSIGNMENT_REQUIRED_ROLES=
AUTH_WELCOME_BALANCE=0
```

EV Charging có welcome bonus:

```env
AUTH_WELCOME_BALANCE=50
```

## Preset 2 — Admin/Student

Dùng cho Event Management:

```env
AUTH_REGISTRATION_MODE=public
AUTH_ALLOWED_ROLES=admin,student
AUTH_DEFAULT_ROLE=student
AUTH_MANAGER_ROLES=admin
AUTH_ASSIGNMENT_FIELD=
AUTH_ASSIGNMENT_REQUIRED_ROLES=
```

Nếu đề chỉ yêu cầu login và seed account, có thể bỏ route `POST /auth/register`.

## Preset 3 — WarePro

```env
AUTH_REGISTRATION_MODE=manager_only
AUTH_ALLOWED_ROLES=warehouse_manager,stock_keeper,auditor
AUTH_DEFAULT_ROLE=stock_keeper
AUTH_MANAGER_ROLES=warehouse_manager
AUTH_ALLOW_MANAGER_CREATION_VIA_API=false
AUTH_MANAGER_CREATION_MESSAGE=Cannot register another manager via API
AUTH_DEACTIVATED_MESSAGE=Account is deactivated. Contact your manager.
AUTH_ASSIGNMENT_FIELD=assignedWarehouse
AUTH_ASSIGNMENT_REF=Warehouse
AUTH_ASSIGNMENT_REQUIRED_ROLES=stock_keeper
```

JWT và User schema tự có field `assignedWarehouse`.

## Preset 4 — LabTrack

```env
AUTH_REGISTRATION_MODE=manager_only
AUTH_ALLOWED_ROLES=laboratory_manager,laboratory_technician,quality_auditor
AUTH_DEFAULT_ROLE=laboratory_technician
AUTH_MANAGER_ROLES=laboratory_manager
AUTH_ALLOW_MANAGER_CREATION_VIA_API=false
AUTH_MANAGER_CREATION_MESSAGE=Cannot register another laboratory manager via API
AUTH_DEACTIVATED_MESSAGE=Account is deactivated. Contact your laboratory manager.
AUTH_ASSIGNMENT_FIELD=assignedLaboratory
AUTH_ASSIGNMENT_REF=Laboratory
AUTH_ASSIGNMENT_REQUIRED_ROLES=laboratory_technician
```

## Preset 5 — Domain manager/worker/auditor

Ví dụ hệ thống kho bãi:

```env
AUTH_REGISTRATION_MODE=manager_only
AUTH_ALLOWED_ROLES=yard_manager,gate_operator,auditor
AUTH_DEFAULT_ROLE=gate_operator
AUTH_MANAGER_ROLES=yard_manager
AUTH_ASSIGNMENT_FIELD=assignedYard
AUTH_ASSIGNMENT_REF=Yard
AUTH_ASSIGNMENT_REQUIRED_ROLES=gate_operator
```

Thay role và assignment theo đề, không cần sửa controller.

## Dùng middleware trong route nghiệp vụ

```js
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  controller.create
);
```

Nhiều role:

```js
router.post(
  '/',
  verifyToken,
  requireRole('warehouse_manager', 'stock_keeper'),
  controller.importStock
);
```

## Kiểm thử tự động

```powershell
npm run test:auth
```

Test suite chạy cả public mode và manager-controlled mode, bao gồm status `201`, `400`, `401`, `403`, `409`, JWT payload, assignment field và RBAC.

## Trước khi nộp bài

1. Đổi database và role trong `.env` theo đề.
2. Đổi `JWT_SECRET` thành placeholder an toàn.
3. Nếu đề không có `balance`, có thể xóa field này khỏi User model và response.
4. Nếu đề yêu cầu đường dẫn `/middlewares`, đổi tên thư mục `middleware` và sửa các import tương ứng.
5. Không cho phép self-register manager/admin trừ khi đề ghi rõ.
