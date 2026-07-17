"""Offline DEMOI regression benchmark and rubric-oriented static grader."""
import json, shutil, sys
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parent; sys.path.insert(0,str(ROOT))
import pe_generator as pg
from dynamic_exam_parser import parse_dynamic_spec

NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
OUT=ROOT.parent/'PE_Benchmark_Output'

RUBRICS={
'procureflow':[(.5,['package.json','server.js','.env']),(1.5,['procurement_manager','purchasing_officer','assignedDepartment','isActive','bcrypt.hash','jwt.sign']),(2,['supplierModel.js','itemModel.js','supplierCode','standardUnitPrice','lowStock','$expr']),(4,['purchaseOrderModel.js','goodsReceiptModel.js','procurementTransactionModel.js','Duplicate item line','lineTotal','withTransaction','order_commitment','goods_receipt','acceptedQuantity','partially_received']),(1.5,['procurement-spending','supplier-performance','committedValue','receivedValue','successfulDeliveries']),(.5,['models/','controllers/','routes/','middlewares/'])],
'portops':[(.5,['package.json','server.js','.env']),(1.5,['yard_manager','gate_operator','assignedYard','isActive','bcrypt.hash','jwt.sign']),(2,['yardModel.js','yardSlotModel.js','containerModel.js','containerNumber','longStay','86400000']),(4,['containerMovementModel.js','gate_in','relocation_out','relocation_in','gate_out','withTransaction','refrigeratedSupport','occupiedSlots','dwellDays','storageCharge','150000']),(1.5,['yard-occupancy','movement-history','utilizationPercent','populate']),(.5,['models/','controllers/','routes/','middlewares/'])],
'powerbill':[(.5,['package.json','server.js','.env']),(1.5,['billing_manager','meter_reader','assignedZone','isActive','bcrypt.hash','jwt.sign']),(2,['customerAccountModel.js','meterModel.js','tariffPlanModel.js','tiers','continuous and non-overlapping','hasDebt']),(4,['meterReadingModel.js','invoiceModel.js','paymentTransactionModel.js','billingMonth','consumptionKwh','withTransaction','pricePerKwh','taxAmount','15*86400000','Overpayment','outstandingBalance']),(1.5,['consumption-summary','collection-summary','averageConsumptionKwh','collection','collectedAmount']),(.5,['models/','controllers/','routes/','middlewares/'])],
'safecampus':[(.5,['package.json','server.js','.env']),(1.5,['security_manager','security_officer','assignedFacility','isActive','bcrypt.hash','jwt.sign']),(2,['facilityModel.js','accessZoneModel.js','visitorPassModel.js','validFrom','approvedBy','visitor-passes']),(4,['accessEventModel.js','withTransaction','currentOccupancy','maximumOccupancy','visitDurationMinutes','forced_exit','evacuatedVisitorCount','emergency','Math.max(0']),(1.5,['occupancy-summary','access-history','utilizationPercent','populate']),(.5,['models/','controllers/','routes/','middlewares/'])],
'granttrack':[(.5,['package.json','server.js','.env']),(1.5,['grant_manager','project_officer','assignedProject','isActive','bcrypt.hash','jwt.sign']),(2,['researchProjectModel.js','grantModel.js','approvedAmount','remainingAmount','Project already funded','lowBalance']),(4,['milestoneModel.js','fundingRequestModel.js','grantTransactionModel.js','completionPercent','plannedBudget','Duplicate active request','commitment','disbursement','committedAmount','withTransaction','Insufficient grant balance']),(1.5,['grant-utilization','milestone-performance','utilizationPercent','overdueMilestones']),(.5,['models/','controllers/','routes/','middlewares/'])],
'sports_court_booking':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'customer'",'/register','/login']),(1,['courtCode','sportType','capacity','pricePerHour','amenities']),(1,['courtId','numberOfPlayers','refundAmount',"'confirmed'"]),(1,["role==='admin'",'userId:req.user.userId']),(2.5,['hours>3','numberOfPlayers>court.capacity',"status:'confirmed'",'1.2','409']),(1,['hours>24?b.totalAmount','hours>=6?b.totalAmount*.5',"status='cancelled'","role!=='admin'"]),(.5,['models/','controllers/','routes/'])],
'parcel_delivery':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'customer'",'/register','/login']),(1,['zoneCode','maxWeightKg','baseFee','feePerKm','feePerKg']),(1,['receiverName','distanceKm','weightKg','declaredValue','totalFee']),(1,["role==='admin'",'userId:req.user.userId']),(2.5,['weightKg>zone.maxWeightKg','distanceKm*zone.feePerKm','weightKg*zone.feePerKg','totalFee*=1.4','declaredValue*.01']),(1,['flow={pending:',"next==='cancelled'","role!=='admin'",'Invalid status transition']),(.5,['models/','controllers/','routes/'])],
'course_enrollment':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'student'",'studentCode','/register','/login']),(1,['courseCode','capacity','fee','prerequisiteCodes']),(1,['studentId','courseId','totalFee','finalScore']),(1,["role==='admin'",'studentId:req.user.userId']),(2.5,["status:{$in:['enrolled','completed']}",'countDocuments',"finalScore:{$gte:5}",'days>=14?course.fee*.9','86400000']),(1,["role!=='admin'",'score<0||score>10',"status='completed'",'finalScore=score']),(.5,['models/','controllers/','routes/'])],
'bicycle_sharing':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign','balance:100000',"'customer'"]),(1,['bikeCode','batteryLevel','unlockFee',"'rented'"]),(1,['bicycleId','startStation','endStation','totalCost',"'active'"]),(1,["role==='admin'",'userId:req.user.userId']),(2,['batteryLevel<20',"status:'active'",'user.balance<20000',"bike.status='rented'"]),(1.5,['Math.ceil((minutes-30)/15)','bike.unlockFee+10000','totalCost*=1.2','status(402)','withTransaction',"bike.status='available'"]),(.5,['models/','controllers/','routes/'])],
'food_delivery':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'customer'",'/register','/login']),(1,['itemCode','category','price','stockQuantity',"'available'"]),(1,['menuItemId','unitPrice','lineTotal','deliveryFee','totalAmount']),(1,["role==='admin'",'userId:req.user.userId']),(2.5,['Number.isInteger','withTransaction','unitPrice*requested.quantity','subtotal>=300000?0:30000','stockQuantity-=requested.quantity']),(1,['flow={pending:',"['pending','confirmed']",'$inc:{stockQuantity:line.quantity}',"role!=='admin'"]),(.5,['models/','controllers/','routes/'])],
'hotel':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign','/register','/login',"'admin'","'customer'"]),(1,['roomCode','roomType','pricePerNight','amenities']),(1,['checkInDate','checkOutDate','numberOfGuests','totalAmount']),(1.5,["role==='admin'",'userId:q.user.id']),(3,['86400000','checkInDate','checkOutDate','maintenance','capacity','409']),(.5,['models/','controllers/','routes/'])],
'device_loan':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign','/register','/login',"'student'"]),(1,['deviceCode','availableQuantity','depositFee','finePerDay']),(1,['dueDate','returnedAt','depositAmount','fineAmount']),(1,["role === 'student'",'userId']),(2,['quantity','availableQuantity','depositFee * qty']),(1.5,['Math.ceil','finePerDay','returnedAt','returned']),(.5,['models/','controllers/','routes/'])],
'dental_appointment':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign','/register','/login',"'patient'"]),(1,['dentistCode','workingStartHour','workingEndHour','consultationFee']),(1,['durationMinutes','serviceType','completedAt','totalFee']),(1,["role==='admin'",'userId:req.user.userId']),(2.5,['60000','workingStartHour','409','durationMinutes','req.user.userId']),(1,['teeth_cleaning:200000','whitening:800000','extraction:500000','completedAt']),(.5,['models/','controllers/','routes/'])],
'parking':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign','balance:100000',"'customer'"]),(1,['slotCode','vehicleType','hasChargingPort','pricePerHour']),(1,['vehiclePlate','totalCost',"'booked'"]),(1,["role==='admin'",'userId:req.user.userId']),(3.5,['Math.ceil(durationMinutes/30)','1.25','0.8','status(402)','user.balance-=totalCost','409']),(.5,['models/','controllers/','routes/'])],
'workshop_registration':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'student'",'/register','/login']),(1,['maximumCapacity','registrationDeadline',"'open'"]),(1,['studentId','workshopId','registrationDate',"'waiting'"]),(1,["role==='admin'",'studentId:req.user.userId']),(2,['Duplicate registration','countDocuments','maximumCapacity',"?'confirmed':'waiting'"]),(1.5,["status:'waiting'","sort({registrationDate:1})","next.status='confirmed'",'req.user.userId']),(.5,['models/','controllers/','routes/'])],
'bus_booking':[(.5,['package.json','server.js']),(2.5,['bcrypt','jwt.sign',"'customer'",'/register','/login']),(1,['tripCode','ticketPrice','totalSeats','availableSeats']),(1,['numberOfTickets','totalAmount','bookingDate',"'confirmed'"]),(1,["role==='admin'",'userId:req.user.userId']),(2,['departureTime<=new Date()','availableSeats-=n','n*trip.ticketPrice']),(1,['difference=n-b.numberOfTickets','availableSeats-=difference','b.totalAmount=n*trip.ticketPrice']),(.5,["status='cancelled'",'availableSeats+=b.numberOfTickets']),(.5,['models/','controllers/','routes/'])]}

def docx_text(path):
    with ZipFile(path) as z: root=ET.fromstring(z.read('word/document.xml'))
    return '\n'.join(''.join(t.text or '' for t in p.findall('.//w:t',NS)).strip() for p in root.findall('.//w:p',NS))

def corpus(path):
    parts=[]; names=[]
    for p in path.rglob('*'):
        if p.is_file() and p.suffix in ('.js','.json','.md'):
            names.append(p.relative_to(path).as_posix());parts.append(p.read_text(encoding='utf-8',errors='ignore'))
    return '\n'.join(names)+'\n'+'\n'.join(parts)

def grade(domain,path):
    data=corpus(path); compact=''.join(data.split());details=[]; total=0
    for points,tokens in RUBRICS[domain]:
        missing=[t for t in tokens if t not in data and ''.join(t.split()) not in compact]; earned=points if not missing else round(points*(len(tokens)-len(missing))/len(tokens),2)
        total+=earned;details.append({'max':points,'earned':earned,'missing':missing})
    return round(total,2),details

def main():
    source=ROOT.parent/'DEMOI';OUT.mkdir(exist_ok=True);results=[]
    for exam in sorted(source.glob('*.docx')):
        text=docx_text(exam); parsed=pg.ExamParser.parse(text);parsed['dynamic_spec']=parse_dynamic_spec(text)
        config=pg.build_config_from_exam(text,parsed,{'user':[],'resource':[],'booking':[]});config['output_dir']=str(OUT);config['project_name']='Benchmark_'+config['project_name'].split('_',1)[-1]
        target=OUT/config['project_name']
        if target.exists():shutil.rmtree(target)
        files,output,log=pg.generate_project(config,False);checked,errors=pg.verify_generated_output(output)
        score,detail=grade(parsed['domain'],target);results.append({'exam':exam.name,'domain':parsed['domain'],'confidence':parsed['confidence'],'score':score,'syntaxErrors':errors,'checkedJs':checked,'output':str(target),'rubric':detail})
    (OUT/'benchmark_results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
    rows=['# DEMOI offline benchmark','','| Exam | Domain | Confidence | Score | JS errors |','|---|---|---:|---:|---:|']
    rows += [f"| {r['exam']} | {r['domain']} | {r['confidence']}% | {r['score']}/10 | {len(r['syntaxErrors'])} |" for r in results]
    (OUT/'BENCHMARK_REPORT.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
    print('\n'.join(rows));return 1 if any(r['syntaxErrors'] or r['score']<9 for r in results) else 0

if __name__=='__main__':raise SystemExit(main())
