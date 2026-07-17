"""Offline regression benchmark for the DeMoi2 DOCX set."""
import json, shutil
from pathlib import Path
import pe_generator as pg
from dynamic_exam_parser import parse_dynamic_spec
from benchmark_demo import docx_text, grade

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'DeMoi2'; OUT=ROOT.parent/'PE_Benchmark_Output2'

def main():
    OUT.mkdir(exist_ok=True);results=[]
    for exam in sorted(SOURCE.glob('*.docx')):
        text=docx_text(exam);parsed=pg.ExamParser.parse(text);parsed['dynamic_spec']=parse_dynamic_spec(text)
        config=pg.build_config_from_exam(text,parsed,{'user':[],'resource':[],'booking':[]});config['output_dir']=str(OUT);config['project_name']='Benchmark2_'+config['project_name'].split('_',1)[-1]
        target=OUT/config['project_name']
        if target.exists():shutil.rmtree(target)
        generated,path,_=pg.generate_project(config,False)
        checked,errors=pg.verify_generated_output(path);score,detail=grade(parsed['domain'],target)
        results.append({'exam':exam.name,'domain':parsed['domain'],'confidence':parsed['confidence'],'score':score,'checkedJs':checked,'syntaxErrors':errors,'output':str(target),'rubric':detail})
    (OUT/'benchmark_results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
    rows=['# DeMoi2 offline benchmark','','| Exam | Domain | Confidence | Score | JS errors |','|---|---|---:|---:|---:|']
    rows += [f"| {r['exam']} | {r['domain']} | {r['confidence']}% | {r['score']}/10 | {len(r['syntaxErrors'])} |" for r in results]
    (OUT/'BENCHMARK_REPORT.md').write_text('\n'.join(rows)+'\n',encoding='utf-8');print('\n'.join(rows))
    return 1 if any(r['score']<9 or r['syntaxErrors'] for r in results) else 0

if __name__=='__main__':raise SystemExit(main())
