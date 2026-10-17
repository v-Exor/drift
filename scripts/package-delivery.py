"""Create the Python kit, static deploy directory, and independent project ZIP."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

ROOT = Path(__file__).resolve().parents[1]
with ZipFile(ROOT / 'downloads/python-lab4.zip', 'w', ZIP_DEFLATED) as archive:
    for path in sorted((ROOT / 'python').rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts and path.suffix != '.pyc':
            archive.write(path, path.relative_to(ROOT / 'python'))
deploy = ROOT / 'artifacts/github-pages'
deploy.mkdir(parents=True, exist_ok=True)
for filename in ['index.html', 'styles.css', 'app.js', 'processing.js', 'worker.js', 'site-config.js', '.nojekyll', 'SOURCE_MAP.md', 'README.md', 'VALIDATION.md', 'DEPLOYMENT.md']:
    shutil.copy2(ROOT / filename, deploy / filename)
for directory in ['assets', 'downloads', 'python']:
    shutil.copytree(ROOT / directory, deploy / directory, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
excluded = {'node_modules', 'artifacts', 'test-results', '.git', '__pycache__', '.venv'}
target = ROOT.parent / 'CSST106-Lab04-Website.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and not excluded.intersection(path.relative_to(ROOT).parts) and path.suffix != '.pyc':
            archive.write(path, Path('lab-04') / path.relative_to(ROOT))
print('Python kit:', ROOT / 'downloads/python-lab4.zip')
print('Static deployment:', deploy)
print('Complete project:', target)
