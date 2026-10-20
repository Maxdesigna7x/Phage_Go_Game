import json
import re
from pathlib import Path
labels={
'Menú e interfaz':{'ui_pulsar':'Pulsar botón','partida_iniciar':'Comenzar partida','volver_menu':'Volver al menú','partida_tiempo_agotado':'Tiempo terminado'},
'Exploración':{'fago_nadar':'Nado del fago','choque_suave':'Choque suave','bacteria_disponible':'Bacteria compatible cercana'},
'Burbujas y energía':{'burbuja_explotar':'Explotar burbuja','burbuja_racha':'Aumentar racha','burbuja_racha_fin':'Fin de racha','energia_activar':'Activar superenergía','energia_activa':'Superenergía activa','energia_renovar':'Renovar superenergía','energia_terminar':'Terminar superenergía'},
'Infección':{'infeccion_acercamiento':'Acercamiento','infeccion_anclaje':'Anclaje','adn_inyectar':'Inyectar ADN','adn_inyeccion_completa':'Inyección completa','bacteria_entrar':'Entrar en la bacteria'},
'ADN y nucleótidos':{'adn_seleccionar':'Seleccionar ADN','adn_copiar':'Duplicar ADN','adn_copias_completas':'Copias completas','nucleotido_tomar':'Tomar nucleótido','nucleotido_encajar':'Encajar nucleótido','pieza_no_encaja':'Pieza incorrecta','adn_secuencia_completa':'Secuencia completa'},
'Construcción':{'biosintesis_proceso':'Biosíntesis','pieza_aparecer':'Aparecer pieza','pieza_tomar':'Tomar pieza','adn_empaquetar':'Empaquetar ADN','fago_unir_cabeza_cuerpo':'Unir cabeza y cola','fago_unir_fibras':'Unir fibras','fago_construido':'Fago construido','fagos_objetivo_completo':'Todos los fagos construidos'},
'Lisis y liberación':{'lisis_pulsar':'Pulsación de lisis','lisis_deterioro':'Deterioro de bacteria','lisis_presion_maxima':'Presión máxima','bacteria_explotar':'Explosión de bacteria','fagos_liberar':'Liberar fagos','fago_seguimiento':'Seguir al nuevo fago','ciclo_completo':'Ciclo completo'},
'Vida del fondo':{'fondo_infeccion':'Infección lejana','fondo_explosion':'Explosión lejana'}}
base=Path('audio/sonidos/web'); catalog=[]
for category, groups in labels.items():
 for group,label in groups.items():
  stems=sorted({p.stem for p in base.iterdir() if p.stem==group or re.fullmatch(re.escape(group)+r'_\d+',p.stem)})
  for stem in stems:
   files=sorted(base.glob(stem+'.*'),key=lambda p:p.stat().st_size)
   catalog.append(dict(id=stem,group=group,label=label+((' '+stem[-2:]) if stem!=group else ''),category=category,files=[str(p) for p in files],bytes=files[0].stat().st_size))
for entry in catalog:
 if entry['group']=='burbuja_explotar': entry['revision']='20261019-20'
 if entry['id']=='fago_nadar': entry['revision']='20261019-19'
Path('audio/catalog.js').write_text('window.SOUND_CATALOG = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
print(len(catalog),'efectos;',sum(c['bytes'] for c in catalog),'bytes preferidos')
