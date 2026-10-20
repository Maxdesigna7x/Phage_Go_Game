"""Encode the licensed recorded bubble pop; keep the five existing preference IDs."""
from pathlib import Path
import shutil
import subprocess
root = Path(__file__).resolve().parents[1]
source = root / 'audio/sonidos/fuentes/el_boss_669918_bubble_pop.mp3'
web = root / 'audio/sonidos/web'
master = root / 'audio/sonidos/originales'
for extension, codec in [('mp3', ['-c:a','libmp3lame','-b:a','64k']), ('ogg',['-c:a','libvorbis','-q:a','3'])]:
    first = web / f'burbuja_explotar_01.{extension}'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-ac','1',*codec,str(first)],check=True)
    for i in range(2,6): shutil.copyfile(first,web/f'burbuja_explotar_{i:02}.{extension}')
first=master/'burbuja_explotar_01.wav'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-ac','1','-c:a','pcm_s16le',str(first)],check=True)
for i in range(2,6): shutil.copyfile(first,master/f'burbuja_explotar_{i:02}.wav')
