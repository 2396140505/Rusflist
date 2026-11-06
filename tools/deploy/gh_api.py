# GitHub API 小工具（令牌取自桌面 GitHub 中文客户端，不落盘不打印）
# 仓库名与描述读 deploy.json：{ "src": "...-game", "play": "...-play", "srcDesc": "...", "playDesc": "..." }
# 用法: python -I tools/deploy/gh_api.py check|create|pages|status
import json, os, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
C = json.load(open(os.path.join(ROOT, 'deploy.json'), encoding='utf-8'))
OWNER, SRC, PLAY = '2324621372', C['src'], C['play']
tok = json.load(open(os.path.join(os.environ['APPDATA'], 'GitHubCN', 'settings.json'), encoding='utf-8-sig'))['Token']
def api(method, path, body=None):
    req = urllib.request.Request('https://api.github.com' + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'User-Agent': SRC + '-deploy'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'null')
cmd = sys.argv[1]
if cmd == 'check':
    for n in (SRC, PLAY): s, r = api('GET', f'/repos/{OWNER}/{n}'); print(n, s, r.get('private') if s == 200 else r.get('message'))
elif cmd == 'create':
    for name, private, desc in [(SRC, True, C['srcDesc']), (PLAY, False, C['playDesc'])]:
        s, r = api('GET', f'/repos/{OWNER}/{name}')
        if s == 200: print(name, 'exists, private:', r.get('private')); continue
        s, r = api('POST', '/user/repos', {'name': name, 'private': private, 'description': desc, 'auto_init': False})
        print(name, s, r.get('html_url') if isinstance(r, dict) else r, (r.get('errors') or r.get('message')) if s >= 300 else '')
elif cmd == 'pages':
    s, r = api('POST', f'/repos/{OWNER}/{PLAY}/pages', {'source': {'branch': 'main', 'path': '/'}})
    print(s, r.get('html_url') if isinstance(r, dict) else r, r.get('message') if s >= 300 else '')
elif cmd == 'status':
    s, r = api('GET', f'/repos/{OWNER}/{PLAY}/pages/builds/latest'); print(PLAY, s, r.get('status'), r.get('error'))
    s, r = api('GET', f'/repos/{OWNER}/{SRC}'); print(SRC, 'private:', r.get('private'))
