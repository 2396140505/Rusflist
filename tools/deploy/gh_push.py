# 用桌面 GitHub 中文客户端的令牌推送（通过环境变量注入请求头，不写入 git config）
# 用法: python -I tools/deploy/gh_push.py <仓库目录> <远程名>
import base64, json, os, subprocess, sys
tok = json.load(open(os.path.join(os.environ['APPDATA'], 'GitHubCN', 'settings.json'), encoding='utf-8-sig'))['Token']
auth = base64.b64encode(('x-access-token:' + tok).encode()).decode()
env = dict(os.environ, GIT_CONFIG_COUNT='1', GIT_CONFIG_KEY_0='http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0='AUTHORIZATION: basic ' + auth, GIT_TERMINAL_PROMPT='0')
r = subprocess.run(['git', '-C', sys.argv[1], 'push', '-u', sys.argv[2], 'main'], env=env, capture_output=True, text=True)
print(r.returncode, (r.stdout + r.stderr).replace(tok, '***').replace(auth, '***'))
