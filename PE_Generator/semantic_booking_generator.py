"""Offline semantic compiler for resource/time booking families."""
import json, os, re
from generic_generator import _model_code

def _field(model, *needles):
    fields=model.get('fields',[])
    for needle in needles:
        for f in fields:
            if needle in f['name'].lower(): return f['name']
    return None

def _enum(model,name):
    for f in model.get('fields',[]):
        if f['name']==name:return f.get('enum') or []
    return []

def build_mapping(spec):
    models=spec['models']; user=next((m for m in models if m['name'].lower()=='user'),None)
    tx=next((m for m in models if any(x in m['name'].lower() for x in ('reservation','booking','stay'))),None)
    resource=next((m for m in models if m is not user and m is not tx),None)
    if not resource or not tx:return None
    start=_field(tx,'checkin','start');end=_field(tx,'checkout','end');price=_field(resource,'priceper')
    status=_field(tx,'status'); statuses=_enum(tx,status) if status else []
    unit='night' if price and 'night' in price.lower() else ('day' if price and 'day' in price.lower() else 'hour')
    return {'user':user,'resource':resource,'transaction':tx,'resourceId':_field(tx,resource['name'].lower()+'id','roomid','resourceid'),'userId':_field(tx,'userid'),'start':start,'end':end,'quantity':_field(tx,'numberofguests','guestcount','guests','quantity'),'capacity':_field(resource,'capacity'),'price':price,'resourceStatus':_field(resource,'status'),'transactionStatus':status,'total':_field(tx,'totalamount','totalprice','totalcost'),'note':_field(tx,'note'),'activeStatus':'confirmed' if 'confirmed' in statuses else (statuses[0] if statuses else None),'defaultStatus':'confirmed' if 'confirmed' in statuses else (statuses[0] if statuses else None),'durationUnit':unit}

def compatibility(mapping):
    required=['resourceId','userId','start','end','price','total']
    score=sum(bool(mapping.get(k)) for k in required)/len(required)*100 if mapping else 0
    return round(score,1),[k for k in required if not mapping.get(k)] if mapping else required

def generate_semantic_booking_project(config,dry_run=False):
    spec=config['exam_spec'];m=build_mapping(spec);score,missing=compatibility(m)
    if score<85:return None,f"Semantic booking compatibility {score}% (missing: {', '.join(missing)})",[]
    U=m['user'];R=m['resource'];T=m['transaction'];rn=R['name'];tn=T['name'];RC=R['className'];TC=T['className']
    tx_route=next(("/"+a['path'].strip('/').split('/')[0] for a in spec.get('apis',[]) if tn.lower() in a['path'].lower()),config['booking_route_path'])
    resource_route=config['resource_route_path']
    roles=spec.get('roles') or ['admin','customer'];default_role='customer' if 'customer' in roles else roles[-1]
    files={}; deps={'bcryptjs':'^2.4.3','dotenv':'^16.4.5','express':'^4.19.2','jsonwebtoken':'^9.0.2','mongoose':'^8.2.1'}
    files['package.json']=json.dumps({'name':config['db_name'],'version':'1.0.0','main':'server.js','scripts':{'start':'node server.js','dev':'nodemon server.js','seed':'node utils/seedData.js'},'dependencies':deps,'devDependencies':{'nodemon':'^3.1.0'}},indent=2)
    files['.env']=f"PORT=9999\nMONGODB_URI=mongodb://127.0.0.1:27017/{config['db_name']}\nJWT_SECRET=replace_with_a_long_random_secret\n"
    files['config/db.js']="const mongoose=require('mongoose');module.exports=async()=>{try{await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected')}catch(e){console.error(e.message);process.exit(1)}};\n"
    for model in spec['models']: files[f"models/{model['name']}Model.js"]=_model_code(model)
    if U:
        code=files[f"models/{U['name']}Model.js"]
        if "require('bcryptjs')" not in code:
            code=code.replace("const mongoose = require('mongoose');","const mongoose = require('mongoose');\nconst bcrypt = require('bcryptjs');")
        code=re.sub(r"(\brole:\s*\{[^}]*)(\})",rf"\1, default: {json.dumps(default_role)}\2",code)
        code=re.sub(r"(\bcreatedAt:\s*\{[^}]*)(\})",r"\1, default: Date.now\2",code)
        if "schema.methods.comparePassword" not in code:
            code=code.replace("module.exports = mongoose.model('User', schema);","schema.pre('save',async function(next){if(!this.isModified('password'))return next();this.password=await bcrypt.hash(this.password,10);next()});\nschema.methods.comparePassword=function(v){return bcrypt.compare(v,this.password)};\nmodule.exports = mongoose.model('User', schema);")
        files[f"models/{U['name']}Model.js"]=code
    files['middlewares/authMiddleware.js']="const jwt=require('jsonwebtoken');exports.protect=(q,s,n)=>{const h=q.headers.authorization;if(!h?.startsWith('Bearer '))return s.status(401).json({message:'Authentication required'});try{q.user=jwt.verify(h.split(' ')[1],process.env.JWT_SECRET);n()}catch(e){s.status(401).json({message:'Invalid token'})}};\n"
    files['controllers/authController.js']=f"""const User=require('../models/{U['name']}Model'),jwt=require('jsonwebtoken');
exports.register=async(q,s)=>{{try{{if(await User.exists({{username:q.body.username}}))return s.status(409).json({{message:'Username already exists'}});const u=await User.create({{username:q.body.username,password:q.body.password,role:'{default_role}',createdAt:new Date()}});s.status(201).json({{id:u._id,username:u.username,role:u.role}})}}catch(e){{s.status(400).json({{message:e.message}})}}}};
exports.login=async(q,s)=>{{const u=await User.findOne({{username:q.body.username}});if(!u||!await u.comparePassword(q.body.password||''))return s.status(401).json({{message:'Invalid credentials'}});s.json({{token:jwt.sign({{id:u._id,role:u.role}},process.env.JWT_SECRET,{{expiresIn:'1d'}})}})}};
"""
    files[f'controllers/{rn}Controller.js']=f"const {RC}=require('../models/{rn}Model');exports.list=async(_q,s)=>s.json(await {RC}.find());\n"
    dayms=86400000 if m['durationUnit'] in ('night','day') else 3600000
    qty_extract=f", {m['quantity']}" if m['quantity'] else ''
    capacity=f"if(Number({m['quantity']})>resource.{m['capacity']})return s.status(400).json({{message:'Number of guests exceeds room capacity'}});" if m['quantity'] and m['capacity'] else ''
    status_filter=f",{m['transactionStatus']}:'{m['activeStatus']}'" if m['transactionStatus'] and m['activeStatus'] else ''
    status_create=f",{m['transactionStatus']}:'{m['defaultStatus']}'" if m['transactionStatus'] and m['defaultStatus'] else ''
    note_create=f",{m['note']}" if m['note'] else ''
    qty_create=f",{m['quantity']}" if m['quantity'] else ''
    files[f'controllers/{tn}Controller.js']=f"""const {TC}=require('../models/{tn}Model'),{RC}=require('../models/{rn}Model');
exports.list=async(q,s)=>{{const filter=q.user.role==='admin'?{{}}:{{{m['userId']}:q.user.id}};s.json(await {TC}.find(filter).populate('{m['resourceId']}'))}};
exports.create=async(q,s)=>{{try{{const {{{m['resourceId']},{m['start']},{m['end']}{qty_extract}{(','+m['note']) if m['note'] else ''}}}=q.body;const start=new Date({m['start']}),end=new Date({m['end']});if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||start>=end)return s.status(400).json({{message:'Invalid date range'}});if(start<new Date())return s.status(400).json({{message:'Check-in date cannot be in the past'}});const resource=await {RC}.findById({m['resourceId']});if(!resource)return s.status(404).json({{message:'{RC} not found'}});if(resource.{m['resourceStatus']}==='maintenance')return s.status(400).json({{message:'This room is currently unavailable.'}});{capacity}const conflict=await {TC}.findOne({{{m['resourceId']},{m['start']}:{{$lt:end}},{m['end']}:{{$gt:start}}{status_filter}}});if(conflict)return s.status(409).json({{message:'The selected room is already booked for this period.'}});const units=Math.ceil((end-start)/{dayms});const item=await {TC}.create({{{m['userId']}:q.user.id,{m['resourceId']},{m['start']}:start,{m['end']}:end{qty_create},{m['total']}:units*resource.{m['price']}{status_create}{note_create}}});s.status(201).json(item)}}catch(e){{s.status(500).json({{message:e.message}})}}}};
"""
    files['routes/authRoutes.js']="const r=require('express').Router(),c=require('../controllers/authController');r.post('/register',c.register);r.post('/login',c.login);module.exports=r;\n"
    files[f'routes/{rn}Routes.js']=f"const r=require('express').Router(),c=require('../controllers/{rn}Controller');r.get('/',c.list);module.exports=r;\n"
    files[f'routes/{tn}Routes.js']=f"const r=require('express').Router(),c=require('../controllers/{tn}Controller'),{{protect}}=require('../middlewares/authMiddleware');r.get('/',protect,c.list);r.post('/',protect,c.create);module.exports=r;\n"
    files['server.js']=f"require('dotenv').config();const express=require('express'),db=require('./config/db');const app=express();app.use(express.json());db();app.use('/auth',require('./routes/authRoutes'));app.use('{resource_route}',require('./routes/{rn}Routes'));app.use('{tx_route}',require('./routes/{tn}Routes'));const PORT=process.env.PORT||9999;app.listen(PORT,()=>console.log(`Server on ${{PORT}}`));\n"
    mapping_public={k:v for k,v in m.items() if k not in ('user','resource','transaction')};mapping_public.update({'resourceRoute':resource_route,'transactionRoute':tx_route});files['semantic_mapping.json']=json.dumps(mapping_public,indent=2)
    files['GENERATION_REPORT.md']=f"# Generation coverage report\n\n- Semantic booking compiler\n- Compatibility: {score}%\n- Duration unit: {m['durationUnit']}\n- Models generated from exam_spec.json\n"
    files['exam_spec.json']=json.dumps(spec,indent=2,ensure_ascii=False)
    files['README.md']=f"# {config['project_name']}\n\nSemantic booking project. Run `npm install`, then `npm run dev`.\n"
    sample=[]
    for f in R['fields']:
        n=f['name'].lower();v="'Sample'"
        if 'code' in n:v="'DLX-302'"
        elif 'type' in n:v=json.dumps((f.get('enum') or ['standard'])[0])
        elif 'capacity' in n:v='3'
        elif n=='status':v=json.dumps('available' if 'available' in (f.get('enum') or []) else ((f.get('enum') or ['active'])[0]))
        elif 'price' in n:v='1200000'
        elif f['type']=='[String]':v="['balcony','breakfast']"
        elif f['type']=='Number':v='1'
        elif f['type']=='Date':v="new Date(Date.now()+86400000)"
        sample.append(f"{f['name']}:{v}")
    files['utils/seedData.js']=f"require('dotenv').config();const mongoose=require('mongoose'),db=require('../config/db'),User=require('../models/{U['name']}Model'),{RC}=require('../models/{rn}Model'),{TC}=require('../models/{tn}Model');(async()=>{{try{{await db();await Promise.all([{TC}.deleteMany(),User.deleteMany(),{RC}.deleteMany()]);await User.create([{{username:'admin1',password:'123456',role:'admin'}},{{username:'user1',password:'123456',role:'{default_role}'}}]);await {RC}.create({{{','.join(sample)}}});console.log('Seed completed')}}catch(e){{console.error(e);process.exitCode=1}}finally{{await mongoose.connection.close()}}}})();\n"
    collection={'info':{'name':config['project_name'],'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},'variable':[{'key':'base_url','value':'http://localhost:9999'},{'key':'token','value':''},{'key':'resource_id','value':''}],'item':[{'name':'Login','request':{'method':'POST','header':[{'key':'Content-Type','value':'application/json'}],'body':{'mode':'raw','raw':json.dumps({'username':'user1','password':'123456'})},'url':'{{base_url}}/auth/login'}},{'name':'List Resources','request':{'method':'GET','url':'{{base_url}}'+resource_route}},{'name':'List Bookings','request':{'method':'GET','header':[{'key':'Authorization','value':'Bearer {{token}}'}],'url':'{{base_url}}'+tx_route}}]}
    files[f"{config['project_name']}.postman_collection.json"]=json.dumps(collection,indent=2)
    files['POSTMAN_GUIDE.md']="# Postman\n\nImport the generated collection, login, copy a resource ID, then create a booking using the fields in `semantic_mapping.json`.\n"
    if dry_run:return files,os.path.join(config['output_dir'],config['project_name']),[f'Semantic booking compiler ({score}%)']
    out=os.path.join(config['output_dir'],config['project_name']);os.makedirs(out,exist_ok=True)
    for stale in ('utils/checkOverlap.js','utils/calculatePrice.js'):
        path=os.path.join(out,stale)
        if os.path.isfile(path):os.remove(path)
    for rel,content in files.items():
        target=os.path.join(out,rel);os.makedirs(os.path.dirname(target),exist_ok=True);open(target,'w',encoding='utf-8').write(content)
    return files,out,[f'Semantic booking compiler ({score}%)']
