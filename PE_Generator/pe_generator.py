"""
PE Code Generator v6 - SDN302 Practical Exam (CLI)
===================================================
Tool tự động generate code dự án PE từ template SUOCPE.
Chạy offline hoàn toàn, không cần mạng, không cần GUI.

Cách dùng:
    1. Dán đề thi vào file debai.md (cùng thư mục)
    2. Chạy: python pe_generator.py
    3. Folder output sẽ được tạo tại thư mục cha (d:\\Assignment_NodeJS\\)

Features:
- 🔍 Tự động phân tích đề bài từ debai.md
- 🧹 Tự động so sánh schemas, dọn dẹp trường thừa
- 📮 Export Postman Collection JSON
- 📁 Copy node_modules từ SUOCPE template
- ⚡ Chạy 1 lệnh, ra 1 folder hoàn chỉnh
"""

import os
import re
import json
import uuid
import sys
import shutil
import subprocess
from pathlib import Path
from dynamic_exam_parser import parse_dynamic_spec
from generic_generator import generate_generic_project
from semantic_booking_generator import generate_semantic_booking_project
from semantic_exam_generator import generate_semantic_exam_project
from advanced_exam_generator import generate_advanced_project
from js_formatter import format_javascript
from postman_guide_generator import enrich_generated_guide
from generated_project_hardening import harden_generated_project

# Fix Windows terminal encoding for emoji/unicode
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ===== Thư mục & Cấu hình =====
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TEMPLATE_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "SUOCPE")
DEBAI_FILE = os.path.join(SCRIPT_DIR, "debai.md")
OUTPUT_BASE_DIR = os.path.dirname(SCRIPT_DIR)  # d:\Assignment_NodeJS\
OWNER_NAME = "TranKimThang"


# ============================================================
# OFFLINE SCHEMA COMPARATOR LOGIC
# ============================================================

def extract_fields_from_schema(model_content):
    """Trích xuất danh sách tên trường (fields) từ file schema Mongoose."""
    fields = []
    lines = model_content.split('\n')
    for line in lines:
        # Match "  fieldName: {" hoặc "  fieldName: [" hoặc "  fieldName: type,"
        match = re.match(r'^[ \t]*(\w+)\s*:\s*[\{\[\w]', line)
        if match:
            field = match.group(1)
            # Loại bỏ các mongoose keyword và cú pháp
            if field not in ['type', 'required', 'unique', 'default', 'enum', 'ref', 'trim', 'mongoose', 'const', 'module', 'module.exports']:
                fields.append(field)
    return list(set(fields))


def extract_model_contexts(exam_text):
    """Chia đề bài thành 3 phần ngữ cảnh độc lập để so khớp chính xác: User, Resource, Booking."""
    lines = exam_text.split('\n')
    user_text = ""
    resource_text = ""
    booking_text = ""
    
    current_context = 'general'
    
    user_kws = ['user', 'auth', 'member', 'register', 'login', 'đăng ký', 'đăng nhập', 'tài khoản']
    resource_kws = ['space', 'station', 'room', 'slot', 'court', 'book', 'tài nguyên', 'phòng', 'chỗ đặt']
    booking_kws = ['reservation', 'session', 'booking', 'lending', 'lượt đặt', 'đặt chỗ', 'giao dịch']
    
    for line in lines:
        line_lower = line.lower()
        
        # Nhận diện chuyển ngữ cảnh dựa trên tiêu đề hoặc mô tả model
        if any(kw in line_lower for kw in ['usermodel', 'user schema', 'user management']) or (any(kw in line_lower for kw in user_kws) and 'model' in line_lower):
            current_context = 'user'
        elif any(kw in line_lower for kw in ['spacemodel', 'stationmodel', 'roommodel', 'slotmodel', 'space schema', 'station schema']) or (any(kw in line_lower for kw in resource_kws) and 'model' in line_lower and not any(bkw in line_lower for bkw in booking_kws)):
            current_context = 'resource'
        elif any(kw in line_lower for kw in ['reservationmodel', 'sessionmodel', 'bookingmodel', 'reservation schema', 'session schema']) or (any(kw in line_lower for kw in booking_kws) and 'model' in line_lower):
            current_context = 'booking'
            
        if current_context == 'user':
            user_text += line + "\n"
        elif current_context == 'resource':
            resource_text += line + "\n"
        elif current_context == 'booking':
            booking_text += line + "\n"
            
    # Fallback nếu không phân rã được tiêu đề
    if not user_text: user_text = exam_text
    if not resource_text: resource_text = exam_text
    if not booking_text: booking_text = exam_text
    
    return user_text, resource_text, booking_text


def should_keep_field(field_name, context_text, rename_map):
    """Kiểm tra xem trường này (hoặc tên thay thế của nó) có xuất hiện trong ngữ cảnh đề bài hay không."""
    text_lower = context_text.lower()
    
    # Từ khóa so khớp (tên gốc)
    keywords = [field_name.lower()]
    
    # Thêm tên đã rename tương ứng
    renamed = rename_map.get(field_name)
    if renamed:
        keywords.append(renamed.lower())
        
    # Một số từ đồng nghĩa phổ biến trong đề thi SDN302
    synonyms = {
        'resourceCode': ['spacecode', 'stationcode', 'roomcode', 'slotcode', 'courtcode', 'bookcode'],
        'pricePerUnit': ['priceperhour', 'priceperkwh', 'pricepernight', 'priceperday', 'rental price', 'price for 1 unit'],
        'features': ['amenities', 'connectors', 'facilities', 'equipment', 'tags', 'plugs'],
        'resourceId': ['spaceid', 'stationid', 'roomid', 'slotid', 'courtid', 'bookid'],
        'quantityEstimate': ['guestcount', 'energyestimate', 'quantity', 'estimated electricity', 'guest count'],
        'totalAmount': ['totalamount', 'totalcost', 'totalprice', 'total payment', 'final calculated price'],
    }
    
    if field_name in synonyms:
        keywords.extend(synonyms[field_name])
        
    for kw in keywords:
        # Nếu từ khóa quá ngắn (ví dụ: 'name'), bắt buộc so khớp nguyên từ độc lập để tránh so nhầm
        if len(kw) <= 4:
            pattern = rf'\b{re.escape(kw)}\b'
        else:
            pattern = re.escape(kw)
            
        if re.search(pattern, text_lower):
            return True
    return False


def detect_extra_fields(exam_text, template_dir, rename_map):
    """So sánh tự động schemas của xuộc mẫu với đề bài để lọc ra các trường thừa."""
    extra_fields = {
        'user': [],
        'resource': [],
        'booking': []
    }
    
    # 1. Đọc nội dung schemas của template
    user_model_path = os.path.join(template_dir, "models/userModel.js")
    res_model_path = os.path.join(template_dir, "models/resourceModel.js")
    book_model_path = os.path.join(template_dir, "models/bookingModel.js")
    
    user_content, res_content, book_content = "", "", ""
    
    if os.path.exists(user_model_path):
        with open(user_model_path, "r", encoding="utf-8") as f:
            user_content = f.read()
    if os.path.exists(res_model_path):
        with open(res_model_path, "r", encoding="utf-8") as f:
            res_content = f.read()
    if os.path.exists(book_model_path):
        with open(book_model_path, "r", encoding="utf-8") as f:
            book_content = f.read()
            
    # 2. Trích xuất danh sách trường
    user_orig = extract_fields_from_schema(user_content) if user_content else ['username', 'password', 'role', 'balance', 'createdAt']
    res_orig = extract_fields_from_schema(res_content) if res_content else ['resourceCode', 'name', 'type', 'capacity', 'status', 'pricePerUnit', 'features', 'createdAt']
    book_orig = extract_fields_from_schema(book_content) if book_content else ['userId', 'resourceId', 'startTime', 'endTime', 'quantityEstimate', 'totalAmount', 'note', 'status', 'createdAt']
    
    # 3. Phân tách ngữ cảnh đề bài
    user_context, res_context, book_context = extract_model_contexts(exam_text)
    
    # 4. Chạy thuật toán so sánh đối chiếu tự động
    for field in user_orig:
        if field in ['username', 'password', 'role']: # Bắt buộc giữ
            continue
        if not should_keep_field(field, user_context, rename_map):
            extra_fields['user'].append(field)
            
    for field in res_orig:
        if field == 'resourceCode': # Bắt buộc giữ
            continue
        if not should_keep_field(field, res_context, rename_map):
            extra_fields['resource'].append(field)
            
    for field in book_orig:
        if field in ['userId', 'resourceId', 'startTime', 'endTime']: # Bắt buộc giữ
            continue
        if not should_keep_field(field, book_context, rename_map):
            extra_fields['booking'].append(field)
            
    return extra_fields


# ============================================================
# EXAM TEXT AUTO-PARSER
# ============================================================

class ExamParser:
    """Phân tích đề thi PE từ text, tự động nhận diện các thành phần."""
    
    DOMAIN_PATTERNS = {
        'event_management': {
            'keywords': ['event management system', 'registrationmodel.js', 'listregistrations', 'getregistrationsbydate', 'register/unregister for events'],
            'resource': ('Event', 'event'), 'booking': ('Registration', 'registration'),
            'resource_code': 'name', 'price_field': 'capacity', 'features_field': 'date',
            'resource_id': 'eventId', 'resource_route': '/events', 'booking_route': '/registrations',
            'pricing_mode': 'EVENT_REGISTRATION',
        },
        'movie_theater_booking': {
            'keywords': ['movie theaters management', 'movie theater', 'theatermodel.js', 'schedulemodel.js', 'numberoftickets'],
            'resource': ('Theater', 'theater'), 'booking': ('Booking', 'booking'),
            'resource_code': 'theaterName', 'price_field': 'ticketPrice', 'features_field': 'amenities',
            'resource_id': 'scheduleId', 'resource_route': '/theaters', 'booking_route': '/bookings',
            'pricing_mode': 'MOVIE_TICKETS',
        },
        'hospital_appointment': {
            'keywords': ['hospital appointment', 'fpt hospital', 'doctormodel.js', 'consultationfee', 'appointmenttime'],
            'resource': ('Doctor', 'doctor'), 'booking': ('Appointment', 'appointment'),
            'resource_code': 'doctorCode', 'price_field': 'consultationFee', 'features_field': 'specialty',
            'resource_id': 'doctorId', 'resource_route': '/doctors', 'booking_route': '/appointments',
            'pricing_mode': 'HOSPITAL_APPOINTMENT',
        },
        'smart_warehouse': {
            'keywords': ['warepro', 'smart warehouse', 'stockledger', 'stock transaction', 'warehouse_manager'],
            'resource': ('Product', 'product'),
            'booking': ('StockTransaction', 'stockTransaction'),
            'resource_code': 'sku', 'price_field': 'unitPrice', 'features_field': 'category',
            'resource_id': 'productId', 'resource_route': '/products',
            'booking_route': '/transactions', 'pricing_mode': 'SMART_WAREHOUSE',
        },
        'car_rental': {
            'keywords': ['car rental', 'carrental', 'car booking', 'carmodel.js', 'priceperday of the car'],
            'resource': ('Car', 'car'),
            'booking': ('Booking', 'booking'),
            'resource_code': 'carNumber',
            'price_field': 'pricePerDay',
            'features_field': 'features',
            'resource_id': 'carNumber',
            'resource_route': '/cars',
            'booking_route': '/bookings',
            'pricing_mode': 'CAR_RENTAL',
        },
        'equipment_rental': {
            'keywords': ['equipment rental', 'gear rental', 'rental orders', 'stockquantity', 'return equipment'],
            'resource': ('Equipment', 'equipment'),
            'booking': ('Rental', 'rental'),
            'resource_code': 'name',
            'price_field': 'pricePerDay',
            'features_field': 'category',
            'resource_id': 'equipmentId',
            'resource_route': '/equipment',
            'booking_route': '/rentals',
            'pricing_mode': 'INVENTORY_RENTAL',
        },
        'coworking': {
            'keywords': ['co-working', 'coworking', 'workspace', 'meeting room', 'desk', 'room/desk'],
            'resource': ('Space', 'space'),
            'booking': ('Reservation', 'reservation'),
            'resource_code': 'spaceCode',
            'price_field': 'pricePerHour',
            'features_field': 'amenities',
            'resource_id': 'spaceId',
            'resource_route': '/spaces',
            'booking_route': '/reservations',
            'pricing_mode': 'NORMAL',
        },
        'ev_charging': {
            'keywords': ['ev charging', 'charging station', 'electric vehicle', 'smart ev', 'charger'],
            'resource': ('Station', 'station'),
            'booking': ('Session', 'session'),
            'resource_code': 'stationCode',
            'price_field': 'pricePerKwh',
            'features_field': 'connectors',
            'resource_id': 'stationId',
            'resource_route': '/stations',
            'booking_route': '/sessions',
            'pricing_mode': 'EV',
        },
        'hotel': {
            'keywords': ['hotel', 'room booking', 'accommodation', 'check-in', 'check-out'],
            'resource': ('Room', 'room'),
            'booking': ('Booking', 'booking'),
            'resource_code': 'roomCode',
            'price_field': 'pricePerNight',
            'features_field': 'facilities',
            'resource_id': 'roomId',
            'resource_route': '/rooms',
            'booking_route': '/bookings',
            'pricing_mode': 'NORMAL',
        },
        'parking': {
            'keywords': ['smart parking slot', 'parking slot management', 'parkingsessionmodel.js', 'parking session', 'slotcode', 'parking', 'car park', 'parking lot', 'vehicle park'],
            'resource': ('Slot', 'slot'),
            'booking': ('Booking', 'booking'),
            'resource_code': 'slotCode',
            'price_field': 'pricePerHour',
            'features_field': 'features',
            'resource_id': 'slotId',
            'resource_route': '/slots',
            'booking_route': '/bookings',
            'pricing_mode': 'NORMAL',
        },
        'dental_appointment': {
            'keywords': ['dental appointment', 'dentistmodel.js', 'dentist schema', 'durationminutes', 'teeth_cleaning'],
            'resource': ('Dentist', 'dentist'), 'booking': ('Appointment', 'appointment'),
            'resource_code': 'dentistCode', 'price_field': 'consultationFee', 'features_field': 'specialty',
            'resource_id': 'dentistId', 'resource_route': '/dentists', 'booking_route': '/appointments',
            'pricing_mode': 'DENTAL_APPOINTMENT',
        },
        'workshop_registration': {
            'keywords': ['workshop registration', 'workshopmodel.js', 'workshop schema', 'maximumcapacity', 'waiting-list'],
            'resource': ('Workshop', 'workshop'), 'booking': ('Registration', 'registration'),
            'resource_code': 'title', 'price_field': 'maximumCapacity', 'features_field': 'location',
            'resource_id': 'workshopId', 'resource_route': '/workshops', 'booking_route': '/registrations',
            'pricing_mode': 'WORKSHOP_REGISTRATION',
        },
        'bus_booking': {
            'keywords': ['intercity bus', 'bus ticket booking', 'bus trip schema', 'tripmodel.js', 'availableSeats', 'numberOfTickets', 'ticket booking'],
            'resource': ('Trip', 'trip'), 'booking': ('Booking', 'booking'),
            'resource_code': 'tripCode', 'price_field': 'ticketPrice', 'features_field': 'departureCity',
            'resource_id': 'tripId', 'resource_route': '/trips', 'booking_route': '/bookings',
            'pricing_mode': 'BUS_BOOKING',
        },
        'device_loan': {
            'keywords': ['library device loan', 'deviceloan', 'device schema', 'fineperday', 'depositfee', 'returnedat'],
            'resource': ('Device', 'device'),
            'booking': ('Loan', 'loan'),
            'resource_code': 'deviceName',
            'price_field': 'depositFee',
            'features_field': 'category',
            'resource_id': 'deviceId',
            'resource_route': '/devices',
            'booking_route': '/loans',
            'pricing_mode': 'DEVICE_LOAN',
        },
        'food_delivery': {
            'keywords': ['food delivery order', 'food delivery', 'menuitemmodel.js', 'menu item schema', 'deliveryfee', 'deliveryaddress', 'linetotal'],
            'resource': ('MenuItem', 'menuItem'), 'booking': ('Order', 'order'),
            'resource_code': 'itemCode', 'price_field': 'price', 'features_field': 'category',
            'resource_id': 'menuItemId', 'resource_route': '/menu-items', 'booking_route': '/orders',
            'pricing_mode': 'FOOD_DELIVERY',
        },
        'sports_court_booking': {
            'keywords': ['sports court booking', 'courtmodel.js', 'court schema', 'numberofplayers', 'refundamount', 'peak-hour pricing'],
            'resource': ('Court', 'court'), 'booking': ('Booking', 'booking'),
            'resource_code': 'courtCode', 'price_field': 'pricePerHour', 'features_field': 'amenities',
            'resource_id': 'courtId', 'resource_route': '/courts', 'booking_route': '/bookings',
            'pricing_mode': 'SPORTS_COURT',
        },
        'parcel_delivery': {
            'keywords': ['parcel delivery', 'deliveryzonemodel.js', 'delivery zone schema', 'maxweightkg', 'feeperkm', 'declaredvalue'],
            'resource': ('DeliveryZone', 'deliveryZone'), 'booking': ('Shipment', 'shipment'),
            'resource_code': 'zoneCode', 'price_field': 'baseFee', 'features_field': 'zoneName',
            'resource_id': 'zoneId', 'resource_route': '/delivery-zones', 'booking_route': '/shipments',
            'pricing_mode': 'PARCEL_DELIVERY',
        },
        'course_enrollment': {
            'keywords': ['course enrollment', 'coursemodel.js', 'course schema', 'prerequisitecodes', 'finalscore', 'early-registration'],
            'resource': ('Course', 'course'), 'booking': ('Enrollment', 'enrollment'),
            'resource_code': 'courseCode', 'price_field': 'fee', 'features_field': 'prerequisiteCodes',
            'resource_id': 'courseId', 'resource_route': '/courses', 'booking_route': '/enrollments',
            'pricing_mode': 'COURSE_ENROLLMENT',
        },
        'bicycle_sharing': {
            'keywords': ['bicycle sharing rental', 'bicyclemodel.js', 'bicycle schema', 'bikecode', 'batterylevel', 'unlockfee', 'active trip'],
            'resource': ('Bicycle', 'bicycle'), 'booking': ('Trip', 'trip'),
            'resource_code': 'bikeCode', 'price_field': 'unlockFee', 'features_field': 'stationName',
            'resource_id': 'bicycleId', 'resource_route': '/bicycles', 'booking_route': '/trips',
            'pricing_mode': 'BICYCLE_SHARING',
        },
        'procureflow': {
            'keywords': ['procureflow', 'supplier procurement', 'purchaseordermodel.js', 'goodsreceiptmodel.js', 'procurementtransactionmodel.js'],
            'resource': ('Item', 'item'), 'booking': ('PurchaseOrder', 'purchaseOrder'), 'resource_code': 'itemCode', 'price_field': 'standardUnitPrice', 'features_field': 'category', 'resource_id': 'itemId', 'resource_route': '/items', 'booking_route': '/purchase-orders', 'pricing_mode': 'ADVANCED_PROCUREMENT',
        },
        'portops': {
            'keywords': ['portops', 'container yard', 'containermovementmodel.js', 'yardslotmodel.js', 'gate-in container', 'gate out container', 'yard occupancy'],
            'resource': ('Container', 'container'), 'booking': ('ContainerMovement', 'containerMovement'), 'resource_code': 'containerNumber', 'price_field': 'grossWeightKg', 'features_field': 'type', 'resource_id': 'containerId', 'resource_route': '/containers', 'booking_route': '/movements', 'pricing_mode': 'ADVANCED_PORTOPS',
        },
        'powerbill': {
            'keywords': ['powerbill', 'smart meter, billing', 'meterreadingmodel.js', 'tariffplanmodel.js', 'paymenttransactionmodel.js'],
            'resource': ('Meter', 'meter'), 'booking': ('Invoice', 'invoice'), 'resource_code': 'meterCode', 'price_field': 'currentReading', 'features_field': 'serviceZone', 'resource_id': 'meterId', 'resource_route': '/customers', 'booking_route': '/invoices', 'pricing_mode': 'ADVANCED_POWERBILL',
        },
        'safecampus': {
            'keywords': ['safecampus', 'facility access', 'visitorpassmodel.js', 'accesseventmodel.js', 'emergency evacuation'],
            'resource': ('VisitorPass', 'visitorPass'), 'booking': ('AccessEvent', 'accessEvent'), 'resource_code': 'passCode', 'price_field': 'maximumOccupancy', 'features_field': 'accessLevel', 'resource_id': 'passId', 'resource_route': '/visitor-passes', 'booking_route': '/access', 'pricing_mode': 'ADVANCED_ACCESS',
        },
        'granttrack': {
            'keywords': ['granttrack', 'research grant', 'fundingrequestmodel.js', 'granttransactionmodel.js', 'grant utilization'],
            'resource': ('Grant', 'grant'), 'booking': ('FundingRequest', 'fundingRequest'), 'resource_code': 'grantCode', 'price_field': 'approvedAmount', 'features_field': 'fundingSource', 'resource_id': 'grantId', 'resource_route': '/grants', 'booking_route': '/funding-requests', 'pricing_mode': 'ADVANCED_GRANT',
        },
    }
    
    @classmethod
    def parse(cls, text):
        text_lower = text.lower()
        result = {
            'domain': None,
            'confidence': 0,
            'detected': {},
            'flags': {},
        }
        
        best_domain = None
        best_score = 0
        for domain, info in cls.DOMAIN_PATTERNS.items():
            score = sum(1 for kw in info['keywords'] if kw in text_lower)
            if score > best_score:
                best_score = score
                best_domain = domain
        
        if best_domain:
            result['domain'] = best_domain
            result['confidence'] = min(best_score * 25, 100)
            pattern = cls.DOMAIN_PATTERNS[best_domain]
            result['detected'] = {
                'resource_upper': pattern['resource'][0],
                'resource_lower': pattern['resource'][1],
                'booking_upper': pattern['booking'][0],
                'booking_lower': pattern['booking'][1],
                'resource_code': pattern['resource_code'],
                'price_field': pattern['price_field'],
                'features_field': pattern['features_field'],
                'resource_id': pattern['resource_id'],
                'resource_route': pattern['resource_route'],
                'booking_route': pattern['booking_route'],
                'pricing_mode': pattern['pricing_mode'],
            }
        
        model_pattern = r'(?:create|file[:\s]*)\s*(\w+)Model\.js'
        models = re.findall(model_pattern, text, re.IGNORECASE)
        for m in models:
            ml = m.lower()
            if ml == 'user':
                continue
            if any(kw in ml for kw in ['space', 'station', 'room', 'slot', 'court', 'equipment', 'car']):
                result['detected']['resource_upper'] = m[0].upper() + m[1:]
                result['detected']['resource_lower'] = m[0].lower() + m[1:]
            elif any(kw in ml for kw in ['reservation', 'session', 'booking', 'lending', 'rental']):
                result['detected']['booking_upper'] = m[0].upper() + m[1:]
                result['detected']['booking_lower'] = m[0].lower() + m[1:]
        
        field_patterns = {
            'resource_code': [r'(\w+Code)\s*\(?String', r'(\w+Code)\s*:'],
            'price_field': [r'(pricePerHour|pricePerKwh|pricePerNight|pricePerDay)\s*[:\(]'],
            'features_field': [r'(amenities|connectors|facilities|equipment|tags)\s*[:\(]'],
            'resource_id': [r'(spaceId|stationId|roomId|slotId|courtId|bookId|equipmentId|carNumber)\s*[:\(]'],
        }
        for key, patterns in field_patterns.items():
            for p in patterns:
                match = re.search(p, text, re.IGNORECASE)
                if match:
                    result['detected'][key] = match.group(1)
                    break
        
        result['flags'] = {
            'has_balance': bool(re.search(r'balance\s*[:(\[]', text, re.IGNORECASE)),
            'has_happy_hour': bool(re.search(r'happy\s*hour|off.?peak|discount', text, re.IGNORECASE)),
            'has_wallet': bool(re.search(r'wallet|deduct\s+(?:total|cost|balance|wallet|fee)|payment\s*required|402', text, re.IGNORECASE)),
            'has_welcome_bonus': bool(re.search(r'welcome\s*bonus|credited.*\$50|\$50.*bonus', text, re.IGNORECASE)),
            'has_quantity': bool(re.search(r'energyEstimate|guestCount|quantity', text, re.IGNORECASE)),
            'has_status_booking': bool(re.search(r'pending.*active.*completed|status.*tracking', text, re.IGNORECASE)),
        }
        
        qty_match = re.search(r'(energyEstimate|guestCount|quantityEstimate)\s*[:\(]', text, re.IGNORECASE)
        if qty_match:
            result['detected']['quantity_field'] = qty_match.group(1)
        
        total_match = re.search(r'(totalCost|totalAmount|totalPrice)\s*[:\(]', text, re.IGNORECASE)
        if total_match:
            result['detected']['total_field'] = total_match.group(1)
        
        return result


# ============================================================
# POSTMAN COLLECTION GENERATOR
# ============================================================

def generate_postman_collection(config):
    ru = config["resource_name_upper"]
    rl = config["resource_name_lower"]
    bu = config["booking_name_upper"]
    bl = config["booking_name_lower"]
    base_url = "http://localhost:9999"
    admin_pw = config.get("admin_password", "123456")
    customer_pw = config.get("customer_password", "123456")
    res_route = config["resource_route_path"]
    book_route = config["booking_route_path"]
    res_id_field = config["resource_id_field"]
    is_ev = config.get("pricing_mode") == "EV"
    resource_body = {
        config["resource_code_field"]: "TEST-001",
        "type": "FastCharge" if is_ev else "meetingRoom",
        "status": "available",
        config["price_field"]: 3850 if is_ev else 150000,
        config["features_field"]: ["CCS2", "CHAdeMO"] if is_ev else ["projector", "whiteboard"],
    }
    if not is_ev:
        resource_body["capacity"] = 8
    booking_body = {
        res_id_field: f"{{{{{rl}_id}}}}",
        "startTime": "2027-08-01T08:00:00.000Z",
        "endTime": "2027-08-01T10:00:00.000Z",
    }
    if is_ev:
        booking_body["energyEstimate"] = 30.5
    create_booking_route = f"{book_route}/book" if is_ev else book_route
    
    collection = {
        "info": {
            "_postman_id": str(uuid.uuid4()),
            "name": f"SDN302 PE - {config['project_name']}",
            "description": f"Auto-generated Postman collection for {config['project_name']}",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {"key": "base_url", "value": base_url},
            {"key": "admin_token", "value": ""},
            {"key": "customer_token", "value": ""},
            {"key": f"{rl}_id", "value": ""}
        ],
        "item": [
            {
                "name": "Auth",
                "item": [
                    {
                        "name": "Register Customer",
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({"username": "testuser", "password": customer_pw, "role": "customer"}, indent=2)
                            },
                            "url": {"raw": "{{base_url}}/auth/register", "host": ["{{base_url}}"], "path": ["auth", "register"]}
                        }
                    },
                    {
                        "name": "Register Admin",
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({"username": "admin1", "password": admin_pw, "role": "admin"}, indent=2)
                            },
                            "url": {"raw": "{{base_url}}/auth/register", "host": ["{{base_url}}"], "path": ["auth", "register"]}
                        }
                    },
                    {
                        "name": "Login Admin",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var data = pm.response.json();",
                                        "if (data.token) {",
                                        "    pm.collectionVariables.set('admin_token', data.token);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({"username": "admin1", "password": admin_pw}, indent=2)
                            },
                            "url": {"raw": "{{base_url}}/auth/login", "host": ["{{base_url}}"], "path": ["auth", "login"]}
                        }
                    },
                    {
                        "name": "Login Customer",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var data = pm.response.json();",
                                        "if (data.token) {",
                                        "    pm.collectionVariables.set('customer_token', data.token);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({"username": "testuser", "password": customer_pw}, indent=2)
                            },
                            "url": {"raw": "{{base_url}}/auth/login", "host": ["{{base_url}}"], "path": ["auth", "login"]}
                        }
                    }
                ]
            },
            {
                "name": f"{ru} Management",
                "item": [
                    {
                        "name": f"Get All {ru}s",
                        "request": {
                            "method": "GET",
                            "url": {"raw": f"{{{{base_url}}}}{res_route}", "host": ["{{base_url}}"], "path": res_route.strip('/').split('/')}
                        }
                    },
                    {
                        "name": f"Get {ru} By ID",
                        "request": {
                            "method": "GET",
                            "url": {"raw": f"{{{{base_url}}}}{res_route}/{{{{{rl}_id}}}}", "host": ["{{base_url}}"], "path": res_route.strip('/').split('/') + [f"{{{{{rl}_id}}}}"]}
                        }
                    },
                    {
                        "name": f"Create {ru} (Admin)",
                        "event": [{
                            "listen": "test",
                            "script": {"exec": [
                                "var data = pm.response.json();",
                                f"if (data._id) pm.collectionVariables.set('{rl}_id', data._id);",
                            ], "type": "text/javascript"},
                        }],
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "Authorization", "value": "Bearer {{admin_token}}"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(resource_body, indent=2)
                            },
                            "url": {"raw": f"{{{{base_url}}}}{res_route}", "host": ["{{base_url}}"], "path": res_route.strip('/').split('/')}
                        }
                    }
                ]
            },
            {
                "name": f"{bu} Management",
                "item": [
                    {
                        "name": f"Get {bu}s",
                        "request": {
                            "method": "GET",
                            "header": [{"key": "Authorization", "value": "Bearer {{customer_token}}"}],
                            "url": {"raw": f"{{{{base_url}}}}{book_route}", "host": ["{{base_url}}"], "path": book_route.strip('/').split('/')}
                        }
                    },
                    {
                        "name": f"Create {bu}",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "Authorization", "value": "Bearer {{customer_token}}"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps(booking_body, indent=2)
                            },
                            "url": {"raw": f"{{{{base_url}}}}{create_booking_route}", "host": ["{{base_url}}"], "path": create_booking_route.strip('/').split('/')}
                        }
                    }
                ]
            }
        ]
    }
    return json.dumps(collection, indent=2, ensure_ascii=False)


# ============================================================
# TEMPLATE LOADING & REPLACEMENTS
# ============================================================

def load_templates_from_dir(template_dir):
    templates = {}
    files_to_read = [
        "models/userModel.js", "models/resourceModel.js", "models/bookingModel.js",
        "controllers/authController.js", "controllers/bookingController.js",
        "controllers/resourceController.js",
        "routes/authRoutes.js", "routes/bookingRoutes.js", "routes/resourceRoutes.js",
        "middlewares/authMiddleware.js", "middlewares/roleMiddleware.js",
        "utils/calculatePrice.js", "utils/checkOverlap.js", "utils/seedData.js",
        "config/db.js", "server.js", ".env", ".env.example", "package.json",
    ]
    for f in files_to_read:
        full_path = os.path.join(template_dir, f)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as fh:
                templates[f] = fh.read()
    return templates


def apply_replacements(content, replacements):
    for old, new in replacements:
        content = content.replace(old, new)
    return content


def remove_comment_blocks(content):
    pattern = r'/\\*\\*\\s*\\n\\s*\\*\\s*EXAM RENAMING REFERENCE.*?\\*/'
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    content = re.sub(r'\\n{3,}', '\\n\\n', content)
    return content


# ============================================================
# CLEAN-UP LOGIC
# ============================================================

def remove_field_from_schema(content, field_name):
    # Dạng block: fieldName: { ... },
    pattern1 = rf'[ \\t]*{re.escape(field_name)}:\\s*\\{{[^}}]*\\}},?\\n'
    content = re.sub(pattern1, '', content)
    # Dạng inline: fieldName: value,
    pattern2 = rf'[ \\t]*{re.escape(field_name)}:\\s*[^{{\\n][^\\n]*,?\\n'
    content = re.sub(pattern2, '', content)
    return content


def clean_field_from_controller_file(content, field_name):
    # 1. Xóa khỏi destructuring req.body (chỉ trên cùng một dòng, tránh dấu chấm đi trước như station.status)
    content = re.sub(r',[ \t]*(?<!\\$\\{)(?<!\\.)\\b' + re.escape(field_name) + r'\\b(?=[ \t\\r\\n,}])', '', content)
    content = re.sub(r'(?<!\\$\\{)(?<!\\.)\\b' + re.escape(field_name) + r'\\b,[ \t]*', '', content)
    content = re.sub(r'(?<!\\$\\{)(?<!\\.)\\b' + re.escape(field_name) + r'\\b(?=[ \t]*})', '', content)
    
    # 2. Xóa khỏi object.create (chỉ khớp ở đầu dòng, dùng re.MULTILINE)
    pattern_create = rf'^[ \\t]*{re.escape(field_name)}:\\s*{re.escape(field_name)}\\s*\\|\\|\\s*[^\\n]+,?\\n'
    content = re.sub(pattern_create, '', content, flags=re.MULTILINE)
    pattern_create2 = rf'^[ 	]*{re.escape(field_name)}\\s*(?::\\s*[^\\n,]+)?,?\\n'
    content = re.sub(pattern_create2, '', content, flags=re.MULTILINE)
    
    # 3. Xóa logic check và update: if (field !== undefined) ... (chỉ khớp đầu dòng)
    pattern_update = rf'^[ \\t]*if\\s*\\(\\s*{re.escape(field_name)}\\s*!==\\s*undefined\\s*\\)[^\\n]*\\n'
    content = re.sub(pattern_update, '', content, flags=re.MULTILINE)
    
    return content


def clean_field_from_seed_file(content, field_name):
    pattern = rf'^[ \\t]*\\b{re.escape(field_name)}\\b\\s*:[^\\n]*,?\\n'
    content = re.sub(pattern, '', content, flags=re.MULTILINE)
    return content


def clean_auth_controller_no_wallet(content):
    pattern = r'\\n    // Set default balance\\n.*?userBalance = 0;\\n      \\}\\n    \\}\\n'
    content = re.sub(pattern, '\\n', content, flags=re.DOTALL)
    content = content.replace('      balance: userBalance\\n', '')
    content = content.replace('      role: userRole,\\n    });', '      role: userRole\\n    });')
    content = content.replace('      balance: user.balance,\\n', '')
    content = content.replace(', balance', '')
    return content

def clean_booking_controller_no_wallet(content):
    pattern = r"    // E\. Wallet payment mode validation.*?(?=\s*// F\. Create)"
    content = re.sub(pattern, '\n    const userId = req.user.id;\n\n', content, flags=re.DOTALL)
    content = content.replace('    let user = null;\n\n', '')
    content = content.replace('    let user = null;\n', '')
    return content


def clean_booking_controller_no_status(content):
    content = content.replace("      status: 'pending' // default status\n", '')
    return content


def clean_calculate_price_normal_only(content):
    pattern = (
        r"  // 1\. Check pricing mode \(EV vs Normal\)\n"
        r"  // EV charging session formula:.*?\n"
        r"  if \(process\.env\.PRICING_MODE === 'EV'\) \{\n"
        r"    totalAmount = hours \* 15 \* \w+;\n"
        r"  \} else \{\n"
        r"    // Normal .*? formula: .*?\n"
        r"    totalAmount = hours \* (\w+);\n"
        r"  \}"
    )
    match = re.search(pattern, content)
    if match:
        price_var = match.group(1)
        replacement = f"  // Calculate: Total = Hours × {price_var}\n  totalAmount = hours * {price_var};"
        content = re.sub(pattern, replacement, content)
    return content


def clean_calculate_price_ev_only(content):
    pattern = (
        r"  // 1\. Check pricing mode \(EV vs Normal\)\n"
        r"  // EV charging session formula:.*?\n"
        r"  if \(process\.env\.PRICING_MODE === 'EV'\) \{\n"
        r"    totalAmount = hours \* 15 \* (\w+);\n"
        r"  \} else \{\n"
        r"    // Normal .*? formula: .*?\n"
        r"    totalAmount = hours \* \w+;\n"
        r"  \}"
    )
    match = re.search(pattern, content)
    if match:
        price_var = match.group(1)
        replacement = f"  // EV formula: Cost = (Hours × 15kWh) × pricePerKwh\n  totalAmount = hours * 15 * {price_var};"
        content = re.sub(pattern, replacement, content)
    return content


def clean_calculate_price_no_happy_hour(content):
    pattern = (
        r"\n  // 2\. Check Happy Hour \(Off-peak discount\)\n"
        r"  let discountApplied = false;\n"
        r"  if \(process\.env\.ENABLE_HAPPY_HOUR === 'true'\) \{.*?\n  \}\n"
    )
    content = re.sub(pattern, '\n  let discountApplied = false;\n', content, flags=re.DOTALL)
    return content


def clean_check_overlap_no_status(content):
    content = re.sub(r"    status: \{ \$ne: 'cancelled' \},.*?\n", "", content)
    return content


def clean_seed_data_domain(content, config):
    rl = config['resource_name_lower']
    ru = config['resource_name_upper']
    code_field = config['resource_code_field']
    price_field = config['price_field']
    feat_field = config['features_field']
    is_ev = config['pricing_mode'] == 'EV'
    
    old_block = re.search(
        r"(    // 2\. Seed .*?\n    console\.log\('Seeding .*?'\);\n    const \w+ = await \w+\.create\(\[)\n.*?(\n    \]\);)",
        content, re.DOTALL
    )
    if not old_block:
        return content
    
    if is_ev:
        new_data = f"""
      {{
        {code_field}: 'EV-FAST-HANOI-01',
        type: 'FastCharge',
        capacity: 1,
        status: 'available',
        {price_field}: 3850,
        {feat_field}: ['CCS2', 'CHAdeMO']
      }},
      {{
        {code_field}: 'EV-NORM-HCM-02',
        type: 'NormalCharge',
        capacity: 1,
        status: 'available',
        {price_field}: 2500,
        {feat_field}: ['Type2']
      }}"""
    else:
        new_data = f"""
      {{
        {code_field}: 'MR-201',
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        {price_field}: 150000,
        {feat_field}: ['projector', 'whiteboard', 'air-conditioner']
      }},
      {{
        {code_field}: 'DK-101',
        type: 'desk',
        capacity: 1,
        status: 'available',
        {price_field}: 50000,
        {feat_field}: ['power-outlet', 'monitor']
      }}"""
    
    content = content[:old_block.start()] + old_block.group(1) + new_data + old_block.group(2) + content[old_block.end():]
    
    content = re.sub(
        r"console\.log\(`- Meeting Room ID:.*?\n.*?console\.log\(`- EV Station ID.*?\n",
        f"console.log(`- {ru} 1 ID: ${{{rl}s[0]._id}} (Code: ${{{rl}s[0].{code_field}}})`);\n    console.log(`- {ru} 2 ID: ${{{rl}s[1]._id}} (Code: ${{{rl}s[1].{code_field}}})`);\n",
        content
    )
    return content


def clean_server_default_route(content, config):
    no_wallet = config.get("remove_wallet_logic") == "true"
    no_happy_hour = config.get("remove_happy_hour_logic") == "true"
    if config['pricing_mode'] == 'NORMAL' and no_happy_hour and no_wallet:
        content = content.replace("    pricingMode: process.env.PRICING_MODE || 'NORMAL',\n", '')
        content = content.replace("    enableHappyHour: process.env.ENABLE_HAPPY_HOUR || 'false',\n", '')
        content = content.replace("    enableWallet: process.env.ENABLE_WALLET || 'false'\n", '')
        content = content.replace("    status: 'Running',\n  }", "    status: 'Running'\n  }")
    return content


# ============================================================
# MAIN GENERATE FUNCTION
# ============================================================

def generate_equipment_rental_project(config, dry_run=False):
    """Generate the stock-based Equipment Rental variant (not time-slot booking)."""
    template_dir = os.path.join(SCRIPT_DIR, "templates", "equipment_rental")
    if not os.path.isdir(template_dir):
        return None, "Không tìm thấy template Equipment Rental!", []

    generated_files = {}
    replacements = [
        ("__PROJECT_NAME__", config["project_name"]),
        ("__DB_NAME__", config["db_name"]),
        ("__ADMIN_PASSWORD__", config["admin_password"]),
        ("__CUSTOMER_PASSWORD__", config["customer_password"]),
    ]
    for root, _, names in os.walk(template_dir):
        for name in names:
            source = os.path.join(root, name)
            relative = os.path.relpath(source, template_dir).replace("\\", "/")
            relative = relative.replace("__PROJECT_NAME__", config["project_name"])
            with open(source, "r", encoding="utf-8") as fh:
                generated_files[relative] = apply_replacements(fh.read(), replacements)

    output_path = os.path.join(config["output_dir"], config["project_name"])
    if dry_run:
        return generated_files, output_path, ["Dùng template chuyên biệt Equipment Rental"]

    os.makedirs(output_path, exist_ok=True)
    # Remove stale generic booking files from an earlier generation of the same project.
    stale = [
        "models/spaceModel.js", "models/reservationModel.js",
        "controllers/spaceController.js", "controllers/reservationController.js",
        "routes/spaceRoutes.js", "routes/reservationRoutes.js",
        "utils/checkOverlap.js", "utils/calculatePrice.js",
    ]
    for relative in stale:
        path = os.path.join(output_path, relative)
        if os.path.isfile(path):
            os.remove(path)

    for relative, content in generated_files.items():
        target = os.path.join(output_path, relative)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write(content)
    return generated_files, output_path, ["Dùng template chuyên biệt Equipment Rental"]

def generate_car_rental_project(config, dry_run=False):
    """Generate the Car Rental MVCR variant with EJS views and day-based pricing."""
    template_dir = os.path.join(SCRIPT_DIR, "templates", "car_rental")
    if not os.path.isdir(template_dir):
        return None, "Không tìm thấy template Car Rental!", []
    generated_files = {}
    replacements = [("__PROJECT_NAME__", config["project_name"]), ("__DB_NAME__", config["db_name"])]
    for root, _, names in os.walk(template_dir):
        for name in names:
            source = os.path.join(root, name)
            relative = os.path.relpath(source, template_dir).replace("\\", "/")
            relative = relative.replace("__PROJECT_NAME__", config["project_name"])
            with open(source, "r", encoding="utf-8") as fh:
                generated_files[relative] = apply_replacements(fh.read(), replacements)
    output_path = os.path.join(config["output_dir"], config["project_name"])
    if dry_run:
        return generated_files, output_path, ["Dùng template chuyên biệt Car Rental MVCR"]
    os.makedirs(output_path, exist_ok=True)
    for relative, content in generated_files.items():
        target = os.path.join(output_path, relative)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write(content)
    return generated_files, output_path, ["Dùng template chuyên biệt Car Rental MVCR"]

def generate_smart_warehouse_project(config, dry_run=False):
    """Generate WarePro warehouse/inventory APIs."""
    template_dir = os.path.join(SCRIPT_DIR, "templates", "smart_warehouse")
    if not os.path.isdir(template_dir):
        return None, "Không tìm thấy template Smart Warehouse!", []
    generated_files = {}
    replacements = [
        ("__PROJECT_NAME__", config["project_name"]), ("__DB_NAME__", config["db_name"]),
        ("__ADMIN_PASSWORD__", config["admin_password"]), ("__CUSTOMER_PASSWORD__", config["customer_password"]),
    ]
    for root, _, names in os.walk(template_dir):
        for name in names:
            source = os.path.join(root, name)
            relative = os.path.relpath(source, template_dir).replace("\\", "/").replace("__PROJECT_NAME__", config["project_name"])
            with open(source, "r", encoding="utf-8") as fh:
                generated_files[relative] = apply_replacements(fh.read(), replacements)
    output_path = os.path.join(config["output_dir"], config["project_name"])
    if dry_run:
        return generated_files, output_path, ["Dùng template chuyên biệt Smart Warehouse / WarePro"]
    os.makedirs(output_path, exist_ok=True)
    for relative, content in generated_files.items():
        target = os.path.join(output_path, relative); os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh: fh.write(content)
    return generated_files, output_path, ["Dùng template chuyên biệt Smart Warehouse / WarePro"]

def generate_hospital_project(config, dry_run=False):
    template_dir = os.path.join(SCRIPT_DIR, "templates", "hospital_appointment")
    if not os.path.isdir(template_dir): return None, "Không tìm thấy template Hospital Appointment!", []
    generated_files = {}; replacements = [("__PROJECT_NAME__",config["project_name"]),("__DB_NAME__",config["db_name"])]
    for root,_,names in os.walk(template_dir):
        for name in names:
            source=os.path.join(root,name); relative=os.path.relpath(source,template_dir).replace("\\","/").replace("__PROJECT_NAME__",config["project_name"])
            with open(source,"r",encoding="utf-8") as fh: generated_files[relative]=apply_replacements(fh.read(),replacements)
    output_path=os.path.join(config["output_dir"],config["project_name"])
    if dry_run:return generated_files,output_path,["Dùng template chuyên biệt Hospital Appointment (không JWT)"]
    os.makedirs(output_path,exist_ok=True)
    stale=["models/spaceModel.js","models/reservationModel.js","models/userModel.js","controllers/spaceController.js","controllers/reservationController.js","controllers/authController.js","routes/spaceRoutes.js","routes/reservationRoutes.js","routes/authRoutes.js","middlewares/authMiddleware.js","middlewares/roleMiddleware.js","utils/checkOverlap.js","utils/calculatePrice.js"]
    for relative in stale:
        path=os.path.join(output_path,relative)
        if os.path.isfile(path):os.remove(path)
    for relative,content in generated_files.items():
        target=os.path.join(output_path,relative);os.makedirs(os.path.dirname(target),exist_ok=True)
        with open(target,"w",encoding="utf-8") as fh:fh.write(content)
    return generated_files,output_path,["Dùng template chuyên biệt Hospital Appointment (không JWT)"]

def generate_movie_project(config, dry_run=False):
    template_dir=os.path.join(SCRIPT_DIR,"templates","movie_theater_booking")
    if not os.path.isdir(template_dir):return None,"Không tìm thấy template Movie Theater!",[]
    generated_files={};replacements=[("__PROJECT_NAME__",config["project_name"]),("__DB_NAME__",config["db_name"])]
    for root,_,names in os.walk(template_dir):
        for name in names:
            source=os.path.join(root,name);relative=os.path.relpath(source,template_dir).replace("\\","/").replace("__PROJECT_NAME__",config["project_name"])
            with open(source,"r",encoding="utf-8") as fh:generated_files[relative]=apply_replacements(fh.read(),replacements)
    output_path=os.path.join(config["output_dir"],config["project_name"])
    if dry_run:return generated_files,output_path,["Dùng template chuyên biệt Movie Theater Booking MVCR"]
    os.makedirs(output_path,exist_ok=True)
    stale=["models/spaceModel.js","models/reservationModel.js","models/userModel.js","controllers/spaceController.js","controllers/reservationController.js","controllers/authController.js","routes/spaceRoutes.js","routes/reservationRoutes.js","routes/authRoutes.js","middlewares/authMiddleware.js","middlewares/roleMiddleware.js","utils/checkOverlap.js","utils/calculatePrice.js"]
    for relative in stale:
        path=os.path.join(output_path,relative)
        if os.path.isfile(path):os.remove(path)
    for relative,content in generated_files.items():
        target=os.path.join(output_path,relative);os.makedirs(os.path.dirname(target),exist_ok=True)
        with open(target,"w",encoding="utf-8") as fh:fh.write(content)
    return generated_files,output_path,["Dùng template chuyên biệt Movie Theater Booking MVCR"]

def generate_event_project(config, dry_run=False):
    template_dir=os.path.join(SCRIPT_DIR,"templates","event_management")
    if not os.path.isdir(template_dir):return None,"Không tìm thấy template Event Management!",[]
    generated_files={};replacements=[("__PROJECT_NAME__",config["project_name"]),("__DB_NAME__",config["db_name"])]
    for root,_,names in os.walk(template_dir):
        for name in names:
            source=os.path.join(root,name);relative=os.path.relpath(source,template_dir).replace("\\","/").replace("__PROJECT_NAME__",config["project_name"])
            with open(source,"r",encoding="utf-8") as fh:generated_files[relative]=apply_replacements(fh.read(),replacements)
    output_path=os.path.join(config["output_dir"],config["project_name"])
    if dry_run:return generated_files,output_path,["Dùng template chuyên biệt Event Management"]
    os.makedirs(output_path,exist_ok=True)
    stale=["models/spaceModel.js","models/reservationModel.js","controllers/spaceController.js","controllers/reservationController.js","routes/spaceRoutes.js","routes/reservationRoutes.js","utils/checkOverlap.js","utils/calculatePrice.js","controllers/userController.js"]
    for relative in stale:
        path=os.path.join(output_path,relative)
        if os.path.isfile(path):os.remove(path)
    for relative,content in generated_files.items():
        target=os.path.join(output_path,relative);os.makedirs(os.path.dirname(target),exist_ok=True)
        with open(target,"w",encoding="utf-8") as fh:fh.write(content)
    return generated_files,output_path,["Dùng template chuyên biệt Event Management"]

def generate_device_loan_project(config, dry_run=False):
    template_dir = os.path.join(SCRIPT_DIR, "templates", "device_loan")
    if not os.path.isdir(template_dir):return None,"Không tìm thấy template Device Loan!",[]
    generated_files={};replacements=[("__PROJECT_NAME__",config["project_name"]),("__DB_NAME__",config["db_name"])]
    for root,_,names in os.walk(template_dir):
        for name in names:
            source=os.path.join(root,name);relative=os.path.relpath(source,template_dir).replace("\\","/").replace("__PROJECT_NAME__",config["project_name"])
            with open(source,"r",encoding="utf-8") as fh:generated_files[relative]=apply_replacements(fh.read(),replacements)
    output_path=os.path.join(config["output_dir"],config["project_name"])
    if dry_run:return generated_files,output_path,["Dùng template chuyên biệt Device Loan"]
    os.makedirs(output_path,exist_ok=True)
    stale=["models/spaceModel.js","models/reservationModel.js","controllers/spaceController.js","controllers/reservationController.js","routes/spaceRoutes.js","routes/reservationRoutes.js","utils/checkOverlap.js","utils/calculatePrice.js","controllers/userController.js"]
    for relative in stale:
        path=os.path.join(output_path,relative)
        if os.path.isfile(path):os.remove(path)
    for relative,content in generated_files.items():
        target=os.path.join(output_path,relative);os.makedirs(os.path.dirname(target),exist_ok=True)
        with open(target,"w",encoding="utf-8") as fh:fh.write(content)
    return generated_files,output_path,["Dùng template chuyên biệt Device Loan"]

def _generate_project_unformatted(config, dry_run=False):
    if config.get("recognized_domain") in {"procureflow", "portops", "powerbill", "safecampus", "granttrack"}:
        return generate_advanced_project(config, dry_run)
    if config.get("recognized_domain") in {"dental_appointment", "parking", "workshop_registration", "bus_booking", "food_delivery", "sports_court_booking", "parcel_delivery", "course_enrollment", "bicycle_sharing"}:
        return generate_semantic_exam_project(config, dry_run)
    if config.get("pricing_mode") == "DEVICE_LOAN":
        return generate_device_loan_project(config, dry_run)
    if config.get("recognized_domain") == "hotel":
        return generate_semantic_booking_project(config, dry_run)
    if config.get("pricing_mode") == "INVENTORY_RENTAL":
        return generate_equipment_rental_project(config, dry_run)
    if config.get("pricing_mode") == "CAR_RENTAL":
        return generate_car_rental_project(config, dry_run)
    if config.get("pricing_mode") == "SMART_WAREHOUSE":
        return generate_smart_warehouse_project(config, dry_run)
    if config.get("pricing_mode") == "HOSPITAL_APPOINTMENT":
        return generate_hospital_project(config, dry_run)
    if config.get("pricing_mode") == "MOVIE_TICKETS":
        return generate_movie_project(config, dry_run)
    if config.get("pricing_mode") == "EVENT_REGISTRATION":
        return generate_event_project(config, dry_run)
    if not config.get("recognized_domain") and config.get("exam_spec", {}).get("models"):
        return generate_generic_project(config, config["exam_spec"], dry_run)
    template_dir = config.get("template_dir", DEFAULT_TEMPLATE_DIR)
    templates = load_templates_from_dir(template_dir)
    if not templates:
        return None, "Không tìm thấy thư mục template SUOCPE!", []
    
    output_dir = config["output_dir"]
    project_name = config["project_name"]
    output_path = os.path.join(output_dir, project_name)
    
    ru = config["resource_name_upper"]
    rl = config["resource_name_lower"]
    bu = config["booking_name_upper"]
    bl = config["booking_name_lower"]
    
    # Custom remove lists
    user_remove_fields = [f.strip() for f in config.get("user_fields_to_remove", "").split(",") if f.strip()]
    resource_remove_fields = [f.strip() for f in config.get("resource_fields_to_remove", "").split(",") if f.strip()]
    booking_remove_fields = [f.strip() for f in config.get("booking_fields_to_remove", "").split(",") if f.strip()]
    
    is_normal = config["pricing_mode"] == "NORMAL"
    no_wallet = config.get("remove_wallet_logic", "true") == "true"
    no_happy_hour = config.get("remove_happy_hour_logic", "true") == "true"
    
    qty_field = config.get("quantity_field", "quantityEstimate")
    if not qty_field or qty_field in booking_remove_fields:
        qty_field = "quantityEstimate"
        if "quantityEstimate" not in booking_remove_fields:
            booking_remove_fields.append("quantityEstimate")
            
    replacements = [
        ("resourceController", f"{rl}Controller"), ("bookingController", f"{bl}Controller"),
        ("resourceModel", f"{rl}Model"), ("bookingModel", f"{bl}Model"),
        ("resourceRoutes", f"{rl}Routes"), ("bookingRoutes", f"{bl}Routes"),
        ("resourceCode", config["resource_code_field"]),
        ("pricePerUnit", config["price_field"]),
        ("features", config["features_field"]),
        ("resourceId", config["resource_id_field"]),
        ("quantityEstimate", qty_field),
    ]
    if config["total_field"] != "totalAmount":
        replacements.append(("totalAmount", config["total_field"]))
    replacements.extend([("Resource", ru), ("Booking", bu)])
    replacements.extend([("resource", rl), ("booking", bl)])
    replacements.extend([("/resources", config["resource_route_path"]), ("/bookings", config["booking_route_path"])])
    replacements.extend([
        ("getAllResources", f"getAll{ru}s"), ("getResourceById", f"get{ru}ById"),
        ("createResource", f"create{ru}"), ("updateResource", f"update{ru}"),
        ("deleteResource", f"delete{ru}"), ("getBookings", f"get{bu}s"),
        ("createBooking", f"create{bu}"),
    ])
    replacements.append(("sdn302_pe_template", config["db_name"]))
    replacements.extend([
        ('"sdn302_pe_template"', f'"{config["db_name"]}"'),
        ("SDN302 Practical Exam Generic Template", f'SDN302 PE - {project_name}'),
    ])
    env_replacements = [
        ("PRICING_MODE=NORMAL", f'PRICING_MODE={config["pricing_mode"]}'),
        ("ENABLE_HAPPY_HOUR=false", f'ENABLE_HAPPY_HOUR={config["enable_happy_hour"]}'),
        ("ENABLE_WALLET=false", f'ENABLE_WALLET={config["enable_wallet"]}'),
    ]
    file_renames = {
        "models/resourceModel.js": f"models/{rl}Model.js",
        "models/bookingModel.js": f"models/{bl}Model.js",
        "controllers/resourceController.js": f"controllers/{rl}Controller.js",
        "controllers/bookingController.js": f"controllers/{bl}Controller.js",
        "routes/resourceRoutes.js": f"routes/{rl}Routes.js",
        "routes/bookingRoutes.js": f"routes/{bl}Routes.js",
    }
    
    cleanup_log = []
    generated_files = {}  # path -> content
    
    for template_path, content in templates.items():
        output_file = file_renames.get(template_path, template_path)
        new_content = apply_replacements(content, replacements)
        
        if template_path in [".env", ".env.example"]:
            new_content = apply_replacements(new_content, env_replacements)
            if is_normal and no_wallet:
                new_content = re.sub(r'# PRICING_MODE:.*\n', '', new_content)
                new_content = re.sub(r'# ENABLE_HAPPY_HOUR:.*\n', '', new_content)
                new_content = re.sub(r'# ENABLE_WALLET:.*\n', '', new_content)
        
        new_content = remove_comment_blocks(new_content)
        
        # --- User Model & Controller ---
        if template_path == "models/userModel.js":
            for field in user_remove_fields:
                new_content = remove_field_from_schema(new_content, field)
                cleanup_log.append(f"🧹 userModel.js: Xóa field '{field}'")
        
        if template_path == "controllers/authController.js":
            for field in user_remove_fields:
                new_content = clean_field_from_controller_file(new_content, field)
                cleanup_log.append(f"🧹 authController.js: Xóa field '{field}'")
            if no_wallet and "balance" in user_remove_fields:
                new_content = clean_auth_controller_no_wallet(new_content)
                cleanup_log.append("🧹 authController.js: Xóa balance/wallet logic")
                
        # --- Resource Model & Controller ---
        if template_path == "models/resourceModel.js":
            for field in resource_remove_fields:
                new_content = remove_field_from_schema(new_content, field)
                cleanup_log.append(f"🧹 {rl}Model.js: Xóa field '{field}'")
                
        if template_path == "controllers/resourceController.js":
            for field in resource_remove_fields:
                new_content = clean_field_from_controller_file(new_content, field)
                cleanup_log.append(f"🧹 {rl}Controller.js: Xóa field '{field}'")
                
        # --- Booking Model & Controller ---
        if template_path == "models/bookingModel.js":
            for field in booking_remove_fields:
                new_content = remove_field_from_schema(new_content, field)
                cleanup_log.append(f"🧹 {bl}Model.js: Xóa field '{field}'")
                
        if template_path == "controllers/bookingController.js":
            for field in booking_remove_fields:
                if field == qty_field:
                    new_content = re.sub(rf',[ \t]*{re.escape(qty_field)}', '', new_content)
                    new_content = re.sub(rf'{re.escape(qty_field)},[ \t]*', '', new_content)
                    pattern = rf'\s*{re.escape(qty_field)}:\s*{re.escape(qty_field)}\s*\|\|\s*\d+,?\n'
                    new_content = re.sub(pattern, '\n', new_content)
                    cleanup_log.append(f"🧹 {bl}Controller.js: Xóa quantity field '{qty_field}'")
                else:
                    new_content = clean_field_from_controller_file(new_content, field)
                    cleanup_log.append(f"🧹 {bl}Controller.js: Xóa field '{field}'")
            if no_wallet:
                new_content = clean_booking_controller_no_wallet(new_content)
                cleanup_log.append(f"🧹 {bl}Controller.js: Xóa wallet check")
            if "status" in booking_remove_fields:
                new_content = clean_booking_controller_no_status(new_content)
                cleanup_log.append(f"🧹 {bl}Controller.js: Xóa status")
                
        # --- seedData.js ---
        if template_path == "utils/seedData.js":
            for field in user_remove_fields:
                new_content = clean_field_from_seed_file(new_content, field)
            for field in resource_remove_fields:
                new_content = clean_field_from_seed_file(new_content, field)
            for field in booking_remove_fields:
                new_content = clean_field_from_seed_file(new_content, field)
            new_content = clean_seed_data_domain(new_content, config)
            cleanup_log.append("🧹 seedData.js: Dọn dẹp seed fields")
            
        # --- checkOverlap.js ---
        if template_path == "utils/checkOverlap.js":
            if "status" in booking_remove_fields:
                new_content = clean_check_overlap_no_status(new_content)
                cleanup_log.append("🧹 checkOverlap.js: Xóa status filter")
                
        # --- calculatePrice.js ---
        if template_path == "utils/calculatePrice.js":
            if is_normal:
                new_content = clean_calculate_price_normal_only(new_content)
                cleanup_log.append("🧹 calculatePrice.js: Chỉ NORMAL mode")
            else:
                new_content = clean_calculate_price_ev_only(new_content)
                cleanup_log.append("🧹 calculatePrice.js: Chỉ EV mode")
            if no_happy_hour:
                new_content = clean_calculate_price_no_happy_hour(new_content)
                cleanup_log.append("🧹 calculatePrice.js: Xóa Happy Hour")
                
        # --- server.js ---
        if template_path == "server.js":
            new_content = clean_server_default_route(new_content, config)
            
        new_content = re.sub(r'\n{3,}', '\n\n', new_content)
        generated_files[output_file] = new_content
        
    generated_files["README.md"] = generate_readme(config)
    generated_files["POSTMAN_GUIDE.md"] = generate_postman_guide(config)
    
    postman_json = generate_postman_collection(config)
    generated_files[f"{project_name}.postman_collection.json"] = postman_json

    if dry_run:
        return generated_files, output_path, cleanup_log
        
    os.makedirs(output_path, exist_ok=True)
    for filepath, content in generated_files.items():
        full_output = os.path.join(output_path, filepath)
        os.makedirs(os.path.dirname(full_output), exist_ok=True)
        with open(full_output, "w", encoding="utf-8") as f:
            f.write(content)
            
    postman_path = os.path.join(output_path, f"{project_name}.postman_collection.json")
    with open(postman_path, "w", encoding="utf-8") as f:
        f.write(postman_json)
    return generated_files, output_path, cleanup_log


def generate_project(config, dry_run=False):
    """Generate and automatically format every JavaScript artifact offline."""
    result=_generate_project_unformatted(config,dry_run)
    if not result or result[0] is None:return result
    files,output_path,log=result
    for relative,content in list(files.items()):
        if relative.endswith('.js'):
            files[relative]=format_javascript(content)
            if not dry_run:
                target=os.path.join(output_path,relative)
                with open(target,'w',encoding='utf-8') as fh:fh.write(files[relative])
    log.extend(harden_generated_project(files, config))
    if enrich_generated_guide(files, config["project_name"]):
        if not dry_run:
            target=os.path.join(output_path,"POSTMAN_GUIDE.md")
            with open(target,'w',encoding='utf-8') as fh:fh.write(files["POSTMAN_GUIDE.md"])
        log.append("Generated detailed Postman guide from collection")
    if not dry_run:
        for relative,content in files.items():
            target=os.path.join(output_path,relative)
            os.makedirs(os.path.dirname(target),exist_ok=True)
            with open(target,'w',encoding='utf-8') as fh:fh.write(content)
    return files,output_path,log+["Auto-formatted generated JavaScript (offline)"]


def generate_readme(config):
    ru, rl = config["resource_name_upper"], config["resource_name_lower"]
    bu, bl = config["booking_name_upper"], config["booking_name_lower"]
    p = config["project_name"]
    return f"""# {p}

## SDN302 - Practical Examination

### Mô tả
Backend RESTful API bằng Node.js, Express, MongoDB/Mongoose.
Hệ thống quản lý {rl} và {bl} với JWT Authentication + RBAC.

---
## Cài đặt
```bash
npm install
```

## Seed dữ liệu mẫu
```bash
npm run seed
```

## Chạy server
```bash
npm run dev
```
Server: `http://localhost:9999`

---
## Tài khoản Test

| Role | Username | Password |
|------|----------|----------|
| Admin | admin1 | {config["admin_password"]} |
| Customer | user1 | {config["customer_password"]} |

---
## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập → JWT |

### {ru}
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | {config["resource_route_path"]} | Public |
| GET | {config["resource_route_path"]}/:id | Public |
| POST | {config["resource_route_path"]} | Admin |
| PUT | {config["resource_route_path"]}/:id | Admin |
| DELETE | {config["resource_route_path"]}/:id | Admin |

### {bu}
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | {config["booking_route_path"]} | JWT |
| POST | {config["booking_route_path"]} | JWT |
| POST | {config["booking_route_path"]}/book | JWT |

---
## Cấu trúc (MCR)
```
├── models/      (userModel, {rl}Model, {bl}Model)
├── controllers/ (authController, {rl}Controller, {bl}Controller)
├── routes/      (authRoutes, {rl}Routes, {bl}Routes)
├── middlewares/  (authMiddleware, roleMiddleware)
├── utils/       (calculatePrice, checkOverlap, seedData)
├── config/      (db.js)
└── server.js
```

## Test Postman
1. Import file `{p}.postman_collection.json` vào Postman
2. Chạy Login Admin → token tự lưu vào collection variable
3. Test các request
"""


def generate_postman_guide(config):
    rl = config["resource_name_lower"]
    bl = config["booking_name_lower"]
    return f"""# Hướng dẫn Test Postman

## Cách nhanh: Import Collection
1. Mở Postman → Import → chọn file `{config['project_name']}.postman_collection.json`
2. Token tự động lưu sau khi Login!

## Cách thủ công:

### 1. Login
POST `http://localhost:9999/auth/login`
```json
{{"username": "admin1", "password": "{config['admin_password']}"}}
```

### 2. Copy token → Authorization → Bearer Token

### 3. Get {rl}s
GET `http://localhost:9999{config['resource_route_path']}`

### 4. Create {bl}
POST `http://localhost:9999{config['booking_route_path']}`
```json
{{"{config['resource_id_field']}": "<id>", "startTime": "2026-08-01T08:00:00Z", "endTime": "2026-08-01T10:00:00Z"}}
```
"""


# ============================================================
# CLI HELPER FUNCTIONS
# ============================================================

def extract_project_suffix_from_exam(text):
    """Trích xuất tên project suffix từ đề bài (e.g. EVChargingSystem)."""
    # Tìm pattern: "Create a project folder named: <yourname>_ XXX" hoặc tương tự
    patterns = [
        r'\\?<\s*(?:your)?name\s*\\?>\s*\\?[_\s]+\s*(\w+)',
        r'yourname\s*\\?>?\s*\\?[_\s]+\s*(\w+)',
        r'folder\s+named\s*:\s*\\?<?\s*yourname\s*\\?>?\s*[_\s]+\s*(\w+)',
        r'project\s+folder\s*:\s*\w+[_\s]+(\w+)',
        r'folder\s+named\s*:\s*\S+[_\s]+(\w+)',
    ]
    for p in patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def extract_passwords_from_exam(text):
    """Trích xuất admin/customer password từ bảng Sample Test Accounts."""
    admin_pw = "123456"
    customer_pw = "123456"
    
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # Tìm dòng bảng chứa admin
        if 'admin' in line_lower and '|' in line:
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 3:
                admin_pw = parts[2].strip()
        # Tìm dòng bảng chứa customer
        if 'customer' in line_lower and '|' in line:
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 3:
                customer_pw = parts[2].strip()
    
    return admin_pw, customer_pw


def build_config_from_exam(exam_text, parse_result, extra_fields):
    """Tự động xây dựng config dict đầy đủ từ kết quả phân tích đề bài."""
    d = parse_result['detected']
    flags = parse_result['flags']
    
    # Trích xuất tên project
    project_suffix = extract_project_suffix_from_exam(exam_text)
    if parse_result.get('domain') == 'smart_warehouse':
        project_suffix = 'warepro'
    if not project_suffix:
        # Fallback: dùng domain name
        rl = d.get('resource_lower', 'resource')
        bl = d.get('booking_lower', 'booking')
        project_suffix = f"{rl}{d.get('booking_upper', 'Booking')}System"
    
    project_name = f"{OWNER_NAME}_{project_suffix}"
    db_name = project_suffix[0].lower() + project_suffix[1:] if project_suffix else "peProject"
    
    # Trích xuất password
    admin_pw, customer_pw = extract_passwords_from_exam(exam_text)
    
    # Xác định fields cần xóa
    user_remove = ", ".join(extra_fields.get('user', []))
    resource_remove = ", ".join(extra_fields.get('resource', []))
    booking_remove = ", ".join(extra_fields.get('booking', []))
    
    # Xác định wallet/happy hour logic
    no_wallet = not flags.get('has_wallet', False)
    no_happy_hour = not flags.get('has_happy_hour', False)
    
    config = {
        "project_name": project_name,
        "db_name": db_name,
        "resource_name_upper": d.get('resource_upper', 'Space'),
        "resource_name_lower": d.get('resource_lower', 'space'),
        "booking_name_upper": d.get('booking_upper', 'Reservation'),
        "booking_name_lower": d.get('booking_lower', 'reservation'),
        "resource_code_field": d.get('resource_code', 'resourceCode'),
        "price_field": d.get('price_field', 'pricePerUnit'),
        "features_field": d.get('features_field', 'features'),
        "resource_id_field": d.get('resource_id', 'resourceId'),
        "quantity_field": d.get('quantity_field', ''),
        "total_field": d.get('total_field', 'totalAmount'),
        "pricing_mode": d.get('pricing_mode', 'NORMAL'),
        "enable_happy_hour": str(flags.get('has_happy_hour', False)).lower(),
        "enable_wallet": str(flags.get('has_wallet', False)).lower(),
        "resource_route_path": d.get('resource_route', '/resources'),
        "booking_route_path": d.get('booking_route', '/bookings'),
        "output_dir": OUTPUT_BASE_DIR,
        "template_dir": DEFAULT_TEMPLATE_DIR,
        "admin_password": admin_pw,
        "customer_password": customer_pw,
        "welcome_bonus": 50 if flags.get('has_welcome_bonus', False) else 0,
        "user_fields_to_remove": user_remove,
        "resource_fields_to_remove": resource_remove,
        "booking_fields_to_remove": booking_remove,
        "remove_wallet_logic": str(no_wallet).lower(),
        "remove_happy_hour_logic": str(no_happy_hour).lower(),
        "recognized_domain": parse_result.get("domain"),
        "exam_spec": parse_result.get("dynamic_spec", {}),
        "exam_text": exam_text,
    }
    
    return config


def copy_node_modules(template_dir, output_path):
    """Copy node_modules từ SUOCPE template sang output project."""
    src = os.path.join(template_dir, "node_modules")
    dst = os.path.join(output_path, "node_modules")
    
    if not os.path.exists(src):
        print(f"  ⚠️  node_modules không tồn tại tại: {src}")
        return False
    
    if os.path.exists(dst):
        print(f"  ⏭️  node_modules đã tồn tại, bỏ qua copy.")
        return True
    
    print(f"  📦 Đang copy node_modules... (có thể mất vài giây)")
    shutil.copytree(src, dst)
    print(f"  ✅ Copy node_modules xong!")
    return True


def verify_generated_output(output_path):
    """Verify JS syntax, route module loading, and JSON readability."""
    errors = []
    checked_js = 0
    for root, dirs, names in os.walk(output_path):
        dirs[:] = [d for d in dirs if d != "node_modules"]
        for name in names:
            path = os.path.join(root, name)
            if name.endswith(".js"):
                checked_js += 1
                try:
                    result = subprocess.run(["node", "--check", path], capture_output=True, text=True, timeout=10)
                    if result.returncode != 0:
                        errors.append(f"JS syntax: {os.path.relpath(path, output_path)}: {result.stderr.strip()}")
                except (OSError, subprocess.SubprocessError) as exc:
                    errors.append(f"Không chạy được node --check: {exc}")
                    return checked_js, errors
            elif name.endswith(".json") and name != "package-lock.json":
                try:
                    with open(path, "r", encoding="utf-8") as fh:
                        json.load(fh)
                except (OSError, json.JSONDecodeError) as exc:
                    errors.append(f"JSON: {os.path.relpath(path, output_path)}: {exc}")
    # Syntax checks miss initialization errors (for example, calling `.post`
    # on `require('express')`) and unresolved middleware names. Loading route
    # modules catches both without starting the server or connecting to MongoDB.
    routes_dir = os.path.join(output_path, "routes")
    if os.path.isdir(routes_dir):
        smoke_env = os.environ.copy()
        dependency_dir = os.path.join(DEFAULT_TEMPLATE_DIR, "node_modules")
        existing_node_path = smoke_env.get("NODE_PATH", "")
        smoke_env["NODE_PATH"] = os.pathsep.join(
            part for part in (dependency_dir, existing_node_path) if part
        )
        for name in sorted(os.listdir(routes_dir)):
            if not name.endswith(".js"):
                continue
            route_path = os.path.join(routes_dir, name)
            script = (
                "const route=require(process.argv[1]);"
                "if(typeof route!=='function')"
                "throw new Error('route module must export an Express router');"
            )
            try:
                result = subprocess.run(
                    ["node", "-e", script, route_path],
                    cwd=output_path,
                    env=smoke_env,
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
                if result.returncode != 0:
                    detail = (result.stderr or result.stdout).strip()
                    errors.append(f"Route load: routes/{name}: {detail}")
            except (OSError, subprocess.SubprocessError) as exc:
                errors.append(f"Cannot load route routes/{name}: {exc}")

    mapping_path = os.path.join(output_path, "semantic_mapping.json")
    spec_path = os.path.join(output_path, "exam_spec.json")
    if os.path.isfile(mapping_path) and os.path.isfile(spec_path):
        try:
            with open(mapping_path, encoding="utf-8") as fh: mapping = json.load(fh)
            with open(spec_path, encoding="utf-8") as fh: spec = json.load(fh)
            for model in spec.get("models", []):
                model_path = os.path.join(output_path, "models", f"{model['name']}Model.js")
                content = open(model_path, encoding="utf-8").read() if os.path.isfile(model_path) else ""
                for field in model.get("fields", []):
                    if not re.search(rf"\b{re.escape(field['name'])}\s*:", content):
                        errors.append(f"Conformance: missing {model['className']}.{field['name']}")
            tx_name = next((m["name"] for m in spec.get("models", []) if any(x in m["name"].lower() for x in ("reservation","booking","stay"))), None)
            controller = open(os.path.join(output_path,"controllers",f"{tx_name}Controller.js"),encoding="utf-8").read() if tx_name else ""
            for key in ("start","end","price","total"):
                if mapping.get(key) and mapping[key] not in controller:
                    errors.append(f"Conformance: controller does not use semantic field {mapping[key]}")
            if mapping.get("durationUnit") in ("night","day") and "86400000" not in controller:
                errors.append("Conformance: pricing unit mismatch; expected day/night divisor 86400000")
            if mapping.get("quantity") and mapping.get("capacity") and mapping["capacity"] not in controller:
                errors.append("Conformance: missing capacity validation")
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            errors.append(f"Conformance audit failed: {exc}")
    return checked_js, errors


# ============================================================
# MAIN CLI ENTRY POINT
# ============================================================

def main():
    print("=" * 60)
    print("🚀 PE Code Generator v6 — CLI Mode")
    print("=" * 60)
    print()
    
    # 1. Đọc file debai.md
    if not os.path.exists(DEBAI_FILE):
        print(f"❌ Không tìm thấy file đề bài: {DEBAI_FILE}")
        print(f"   Hãy tạo file debai.md và dán đề thi PE vào đó.")
        return
    
    with open(DEBAI_FILE, "r", encoding="utf-8") as f:
        exam_text = f.read().strip()
    
    if not exam_text:
        print(f"❌ File debai.md trống!")
        print(f"   Hãy dán nội dung đề thi PE vào file: {DEBAI_FILE}")
        return
    
    print(f"📄 Đã đọc đề bài từ: debai.md ({len(exam_text)} ký tự)")
    print()
    
    # 2. Phân tích đề bài
    print("🔍 Đang phân tích đề bài...")
    parse_result = ExamParser.parse(exam_text)
    parse_result['dynamic_spec'] = parse_dynamic_spec(exam_text)
    d = parse_result['detected']
    flags = parse_result['flags']
    
    if parse_result['domain']:
        print(f"  ✅ Domain nhận diện: {parse_result['domain']} (confidence: {parse_result['confidence']}%)")
    else:
        print(f"  ⚠️  Không nhận diện được domain cụ thể, sẽ dùng so khớp trường")
    
    print(f"  📋 Resource Model: {d.get('resource_upper', '?')} ({d.get('resource_lower', '?')})")
    print(f"  📋 Booking Model: {d.get('booking_upper', '?')} ({d.get('booking_lower', '?')})")
    print(f"  💰 Pricing Mode: {d.get('pricing_mode', 'NORMAL')}")
    print(f"  🎫 Happy Hour: {'Có' if flags.get('has_happy_hour') else 'Không'}")
    print(f"  💳 Wallet: {'Có' if flags.get('has_wallet') else 'Không'}")
    print(f"  🎁 Welcome Bonus: {'Có' if flags.get('has_welcome_bonus') else 'Không'}")
    spec = parse_result['dynamic_spec']
    print(f"  🧠 Dynamic Spec: {len(spec['models'])} models, {len(spec['apis'])} APIs, {len(spec['roles'])} roles")
    print()
    
    # 3. So sánh schemas tự động
    print("🔍 Đang so sánh schemas với template SUOCPE...")
    rename_map = {
        'resourceCode': d.get('resource_code', 'resourceCode'),
        'pricePerUnit': d.get('price_field', 'pricePerUnit'),
        'features': d.get('features_field', 'features'),
        'resourceId': d.get('resource_id', 'resourceId'),
        'quantityEstimate': d.get('quantity_field', '') or 'quantityEstimate',
        'totalAmount': d.get('total_field', 'totalAmount'),
    }
    
    extra_fields = detect_extra_fields(exam_text, DEFAULT_TEMPLATE_DIR, rename_map)
    
    for model, fields in extra_fields.items():
        if fields:
            print(f"  🧹 {model}: sẽ xóa trường [{', '.join(fields)}]")
        else:
            print(f"  ✅ {model}: không có trường thừa")
    print()
    
    # 4. Xây dựng config
    config = build_config_from_exam(exam_text, parse_result, extra_fields)
    
    print(f"📁 Project Name: {config['project_name']}")
    print(f"📁 Database: {config['db_name']}")
    print(f"📁 Output: {os.path.join(config['output_dir'], config['project_name'])}")
    print(f"🔑 Admin password: {config['admin_password']}")
    print(f"🔑 Customer password: {config['customer_password']}")
    print()
    
    # 5. Generate project
    print("⚙️  Đang generate project...")
    result = generate_project(config, dry_run=False)
    
    if result[0] is None:
        print(f"❌ Lỗi: {result[1]}")
        return
    
    files_dict, output_path, cleanup_log = result

    # Persist the parser's intermediate representation for audit/debugging.
    spec_path = os.path.join(output_path, "exam_spec.json")
    if "exam_spec.json" not in files_dict:
        spec_json = json.dumps(parse_result['dynamic_spec'], indent=2, ensure_ascii=False)
        with open(spec_path, "w", encoding="utf-8") as fh:
            fh.write(spec_json)
        files_dict["exam_spec.json"] = spec_json
    if parse_result.get("domain") and "GENERATION_REPORT.md" not in files_dict:
        report = (
            "# Generation coverage report\n\n"
            f"- Verified domain module: `{parse_result['domain']}`\n"
            f"- Confidence: {parse_result['confidence']}%\n"
            f"- Parsed models: {len(parse_result['dynamic_spec']['models'])}\n"
            f"- Parsed APIs: {len(parse_result['dynamic_spec']['apis'])}\n"
            "- Business logic source: specialized tested template\n"
        )
        with open(os.path.join(output_path, "GENERATION_REPORT.md"), "w", encoding="utf-8") as fh:
            fh.write(report)
        files_dict["GENERATION_REPORT.md"] = report
    
    print(f"  ✅ Đã tạo {len(files_dict)} files:")
    for f in sorted(files_dict.keys()):
        print(f"     📄 {f}")
    print()
    
    # 6. In log dọn dẹp
    if cleanup_log:
        print("🧹 Nhật ký dọn dẹp code thừa:")
        for msg in sorted(set(cleanup_log)):
            print(f"   {msg}")
        print()

    print("🧪 Tự kiểm tra output...")
    checked_js, verify_errors = verify_generated_output(output_path)
    if verify_errors:
        print(f"  ❌ Phát hiện {len(verify_errors)} lỗi sau khi generate:")
        for error in verify_errors:
            print(f"     - {error}")
        print("  ⛔ Output chưa đạt kiểm tra; không báo THÀNH CÔNG.")
        return
    print(f"  ✅ JavaScript syntax: {checked_js} files; JSON artifacts hợp lệ")
    print()
    
    # 7. Copy node_modules
    print("📦 Copy node_modules từ SUOCPE template...")
    copy_node_modules(DEFAULT_TEMPLATE_DIR, output_path)
    print()
    
    # 8. Copy package-lock.json
    lock_src = os.path.join(DEFAULT_TEMPLATE_DIR, "package-lock.json")
    if os.path.exists(lock_src):
        lock_dst = os.path.join(output_path, "package-lock.json")
        if not os.path.exists(lock_dst):
            shutil.copy2(lock_src, lock_dst)
            print("  ✅ Copy package-lock.json")
    
    # 9. Tổng kết
    print()
    print("=" * 60)
    print(f"🎉 THÀNH CÔNG! Project đã được tạo hoàn chỉnh!")
    print("=" * 60)
    print()
    print(f"📂 Thư mục: {output_path}")
    print()
    print("📌 Các bước tiếp theo:")
    print(f"   1. cd {config['project_name']}")
    print(f"   2. npm run seed")
    print(f"   3. npm run dev")
    print()
    print(f"🧪 Test Postman: Import file {config['project_name']}.postman_collection.json")
    if config.get("pricing_mode") in ("CAR_RENTAL", "HOSPITAL_APPOINTMENT", "MOVIE_TICKETS"):
        print("   Đề không yêu cầu đăng nhập; có thể gọi API trực tiếp")
    elif config.get("pricing_mode") == "SMART_WAREHOUSE":
        print("   Login manager1/123456, keeper1/123456 hoặc auditor1/123456")
    else:
        print(f"   Login admin1/{config['admin_password']} → token tự động lưu")
    print()


if __name__ == "__main__":
    main()

