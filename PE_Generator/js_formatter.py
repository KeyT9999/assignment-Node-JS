"""Small dependency-free JavaScript formatter for generated source.

It is deliberately conservative: formatting changes whitespace only and keeps
strings, template literals, comments and regular-expression literals intact.
"""
import re

def _split_require_declarations(source):
    """Keep require declarations unchanged.

    Splitting these declarations safely requires a JavaScript parser. The old
    regex dropped destructured imports and stripped calls such as `.Router()`,
    changing valid programs. A formatter must preserve program behaviour.
    """
    return source

def _space_normal_code(text):
    """Normalize common operators outside string/template/regex literals."""
    result=[];normal=[];state='normal';escape=False;i=0
    def flush():
        if not normal:return
        s=''.join(normal)
        s=re.sub(r'[ \t]*(===|!==|==|!=|<=|>=|=>|\+=|-=|\*=|/=|&&|\|\||\?\?|=(?!=|>))[ \t]*',r' \1 ',s)
        s=re.sub(r'([A-Za-z_$][\w$]*):[ \t]*',r'\1: ',s)
        s=re.sub(r',[ \t]*(?=\S)',', ',s)
        s=re.sub(r'\(\s+\{','({',s);s=re.sub(r'\[\s+\{','[{',s)
        result.append(s);normal.clear()
    while i<len(text):
        ch=text[i];nxt=text[i+1] if i+1<len(text) else ''
        if state=='normal':
            if ch in "'\"`":flush();state={'\'':'single','"':'double','`':'template'}[ch];result.append(ch)
            elif ch=='/' and nxt in ('/','*'):flush();state='linecomment' if nxt=='/' else 'blockcomment';result.extend([ch,nxt]);i+=1
            elif ch=='/' and (not normal or ''.join(normal).rstrip()[-1:] in '=(:,![{;?|'):
                flush();state='regex';result.append(ch)
            else:normal.append(ch)
        else:
            result.append(ch)
            if state in ('single','double','template','regex'):
                if escape:escape=False
                elif ch=='\\':escape=True
                elif (state=='single' and ch=="'") or (state=='double' and ch=='"') or (state=='template' and ch=='`') or (state=='regex' and ch=='/'):state='normal'
            elif state=='linecomment' and ch=='\n':state='normal'
            elif state=='blockcomment' and ch=='*' and nxt=='/':result.append('/');i+=1;state='normal'
        i+=1
    flush();return ''.join(result)

def format_javascript(source):
    source=_split_require_declarations(source.replace('\r\n','\n').strip())
    source=re.sub(r'\basync\s*\(([^()]*)\)\s*=>',lambda m:'async ('+', '.join(x.strip() for x in m.group(1).split(','))+') =>',source)
    source=re.sub(r'\b(exports\.[A-Za-z_$][\w$]*)\s*=\s*async\b',r'\1 = async',source)
    source=re.sub(r'\b(if|for|while|switch|catch)\s*\(',r'\1 (',source)
    out=[];line=[];indent=0;state='normal';escape=False;i=0;paren_depth=0;bracket_depth=0;curly=[];for_parens=[]
    def emit_line(force=False):
        nonlocal line
        text=''.join(line).strip()
        if text or force:out.append('  '*max(indent,0)+text)
        line=[]
    def prev_nonspace():
        for ch in reversed(line):
            if not ch.isspace():return ch
        return ''
    while i<len(source):
        ch=source[i];nxt=source[i+1] if i+1<len(source) else ''
        if state!='normal':
            line.append(ch)
            if state in ('single','double','template','regex'):
                if escape:escape=False
                elif ch=='\\':escape=True
                elif (state=='single' and ch=="'") or (state=='double' and ch=='"') or (state=='template' and ch=='`'):
                    state='normal'
                elif state=='regex' and ch=='/':
                    state='normal'
            elif state=='linecomment' and ch=='\n':emit_line();state='normal'
            elif state=='blockcomment' and ch=='*' and nxt=='/':line.append('/');i+=1;state='normal'
            i+=1;continue
        if ch in "'\"`":state={'\'':'single','"':'double','`':'template'}[ch];line.append(ch);i+=1;continue
        if ch=='/' and nxt=='/':state='linecomment';line.extend('//');i+=2;continue
        if ch=='/' and nxt=='*':state='blockcomment';line.extend('/*');i+=2;continue
        if ch=='/':
            prefix=''.join(line).rstrip();p=prefix[-1:] or ''
            if p in '=(:,![{;?|' or re.search(r'\b(?:return|case|throw|typeof|delete|void|new)\s*$',prefix):
                state='regex'
            line.append(ch);i+=1;continue
        if ch=='(':
            prefix=''.join(line).rstrip();paren_depth+=1
            if re.search(r'\bfor\s*$',prefix):for_parens.append(paren_depth)
            line.append(ch)
        elif ch==')':
            if for_parens and for_parens[-1]==paren_depth:for_parens.pop()
            paren_depth=max(0,paren_depth-1);line.append(ch)
        elif ch=='[':
            bracket_depth+=1;line.append(ch)
        elif ch==']':
            bracket_depth=max(0,bracket_depth-1);line.append(ch)
        elif ch=='{':
            prefix=''.join(line).rstrip()
            is_block=bool(re.search(r'(?:=>|\)|\b(?:else|try|finally|do))\s*$',prefix))
            curly.append('block' if is_block else 'object')
            line.append(' {' if line and not line[-1].isspace() else '{');emit_line();indent+=1
        elif ch=='}':
            if ''.join(line).strip():emit_line()
            indent=max(0,indent-1);kind=curly.pop() if curly else 'block';line.append('}')
            j=i+1
            while j<len(source) and source[j].isspace():j+=1
            following=source[j:j+7]
            if following.startswith(('else','catch','finally')):line.append(' ')
            elif j>=len(source) or source[j] not in ';,).]':emit_line()
        elif ch==';':
            line.append(';')
            if not for_parens:emit_line()
        elif ch==',':
            line.append(',')
            if curly and curly[-1]=='object':emit_line()
            elif not nxt.isspace():line.append(' ')
        elif ch=='\n':
            if ''.join(line).strip().startswith('//'):emit_line()
            elif line and not line[-1].isspace():line.append(' ')
        else:line.append(ch)
        i+=1
    if ''.join(line).strip():emit_line()
    text='\n'.join(x.rstrip() for x in out if x.strip())+'\n'
    text=_space_normal_code(text)
    text=re.sub(r'for \(([^()\n]*)\)',lambda m:'for ('+re.sub(r';[ \t]*','; ',m.group(1))+')',text)
    return re.sub(r'\n{3,}','\n\n',text)
