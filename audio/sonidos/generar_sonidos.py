#!/usr/bin/env python3
"""Generate the original procedural sound pack for Phage GO!"""
from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "originales"
WEB = ROOT / "web"
SR = 44100
RNG = np.random.default_rng(20261019)


def time_axis(seconds: float) -> np.ndarray:
    return np.arange(round(seconds * SR), dtype=np.float64) / SR


def envelope(t: np.ndarray, attack: float = 0.01, decay: float = 0.18,
             sustain: float = 0.0, release: float | None = None) -> np.ndarray:
    end = float(t[-1]) + 1 / SR if len(t) else 0
    release = release if release is not None else max(0.015, end * 0.58)
    env = np.ones_like(t)
    if attack:
        env *= np.minimum(1.0, t / attack)
    if sustain == 0:
        env *= np.exp(-np.maximum(0, t - attack) / max(decay, 1e-4))
    else:
        env *= sustain + (1 - sustain) * np.exp(-np.maximum(0, t - attack) / max(decay, 1e-4))
    if release and end > release:
        tail = np.clip((end - t) / release, 0, 1)
        # Smooth cosine tail, preserving the initial transient.
        tail = 0.5 - 0.5 * np.cos(np.pi * tail)
        env *= tail
    return env


def stereo(mono: np.ndarray, pan: float = 0.0) -> np.ndarray:
    pan = float(np.clip(pan, -1, 1))
    angle = (pan + 1) * math.pi / 4
    return np.column_stack((mono * math.cos(angle), mono * math.sin(angle)))


def add(dst: np.ndarray, src: np.ndarray, start: float = 0.0,
        gain: float = 1.0, pan: float = 0.0) -> None:
    i = max(0, round(start * SR))
    if i >= len(dst):
        return
    if src.ndim == 1:
        src = stereo(src, pan)
    n = min(len(dst) - i, len(src))
    dst[i:i+n] += gain * src[:n]


def tone(seconds: float, f0: float, f1: float | None = None, amp: float = 0.3,
         harmonics: tuple[tuple[int, float], ...] = ((1, 1.0),),
         attack: float = 0.008, decay: float = 0.22,
         sustain: float = 0.0, release: float | None = None,
         vibrato: float = 0.0, fm: float = 0.0) -> np.ndarray:
    t = time_axis(seconds)
    f1 = f0 if f1 is None else f1
    # Exponential glide sounds rounder than a linear frequency ramp.
    ratio = max(0.01, f1 / max(0.01, f0))
    freq = f0 * np.exp(np.log(ratio) * np.clip(t / max(seconds, 1e-4), 0, 1))
    if vibrato:
        freq *= 1 + 0.012 * np.sin(2 * np.pi * vibrato * t)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    if fm:
        phase += fm * np.sin(2 * np.pi * 5.2 * t)
    wave_data = np.zeros_like(t)
    for harmonic, weight in harmonics:
        wave_data += weight * np.sin(phase * harmonic)
    wave_data /= max(1, sum(abs(weight) for _, weight in harmonics))
    return amp * wave_data * envelope(t, attack, decay, sustain, release)


def filtered_noise(seconds: float, low: float = 150, high: float = 4500) -> np.ndarray:
    n = round(seconds * SR)
    raw = RNG.normal(0, 1, n)
    nyquist = SR / 2
    low, high = max(20, low), min(nyquist * .96, high)
    if high <= low:
        high = min(nyquist * .96, low * 1.5)
    sos = butter(3, [low / nyquist, high / nyquist], btype="bandpass", output="sos")
    filtered = sosfilt(sos, raw)
    peak = max(1e-9, np.max(np.abs(filtered)))
    return filtered / peak


def bubble(seconds: float = .21, pitch: float = 430, amp: float = .44) -> np.ndarray:
    t = time_axis(seconds)
    # Rounded downward chirp, a tiny secondary wobble, and a very soft watery tick.
    f0, f1 = pitch * 1.7, pitch * .55
    f = f0 * np.exp(np.log(f1 / f0) * t / seconds)
    phase = 2 * np.pi * np.cumsum(f) / SR
    watery = np.sin(phase + .4 * np.sin(2 * np.pi * 23 * t))
    watery += .22 * np.sin(phase * 2.01 + .7)
    n = filtered_noise(seconds, 850, 5200)
    env = np.exp(-t / (seconds * .34)) * (1 - np.exp(-t / .004))
    return amp * (0.82 * watery / 1.22 + .18 * n) * env


def whoosh(seconds: float, direction: int = 1, amp: float = .24,
           low: float = 180, high: float = 3800) -> np.ndarray:
    t = time_axis(seconds)
    n = filtered_noise(seconds, low, high)
    if direction > 0:
        swell = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.15
        freq = np.linspace(270, 570, len(t))
    else:
        swell = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.15
        freq = np.linspace(560, 230, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return amp * (n * .58 + np.sin(phase) * .42) * swell


def short_reverb(signal: np.ndarray, strength: float = .12) -> np.ndarray:
    out = signal.copy()
    for delay, level in ((.047, .35), (.083, .2), (.131, .1)):
        k = round(delay * SR)
        if k < len(out):
            out[k:] += signal[:-k] * strength * level
    return out


def finish(data: np.ndarray, target: float = .62, loop: bool = False) -> np.ndarray:
    data = np.asarray(data, dtype=np.float64)
    if loop and len(data) > SR:
        # Blend the tail toward the head so looping never produces a hard seam.
        n = min(round(.8 * SR), len(data) // 6)
        x = np.linspace(0, 1, n, endpoint=False)[:, None]
        data[-n:] = data[-n:] * np.cos(x * np.pi / 2) + data[:n] * np.sin(x * np.pi / 2)
        # Guarantee matching endpoints.
        data[-1] = data[0]
    peak = max(1e-9, float(np.max(np.abs(data))))
    data = data * min(target / peak, 1.0)
    return np.clip(data, -0.98, 0.98)


def save_wav(name: str, data: np.ndarray, loop: bool = False) -> None:
    data = finish(data, .56 if loop else .66, loop)
    pcm = (data * 32767).astype("<i2")
    path = MASTER / f"{name}.wav"
    with wave.open(str(path), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    # Browser copies: Ogg is compact; MP3 is available on older mobile browsers.
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
                    "-c:a", "libvorbis", "-q:a", "4", str(WEB / f"{name}.ogg")], check=True)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
                    "-c:a", "libmp3lame", "-q:a", "4", str(WEB / f"{name}.mp3")], check=True)


def make_bubble_variant(pitch: float, seconds: float, sparkle: bool = False) -> np.ndarray:
    total = seconds + (.07 if sparkle else 0)
    out = np.zeros((round(total * SR), 2))
    add(out, bubble(seconds, pitch, .53), .0, pan=-.05)
    if sparkle:
        add(out, tone(.12, pitch * 2.0, pitch * 2.8, .2, ((1, 1), (2, .15)), decay=.065),
            seconds * .44, .45, .18)
    return short_reverb(out, .10)


def make_environment(seconds: float, variant: str) -> np.ndarray:
    out = np.zeros((round(seconds * SR), 2))
    t = time_axis(seconds)
    if variant == "menu":
        pad_notes = [(146.83, .12), (220.00, .085), (293.66, .055), (369.99, .042), (440.00, .026)]
        noise_gain, bubble_gap, note_gap = .020, 4.1, 5.5
    elif variant == "interior":
        pad_notes = [(110.0, .11), (164.81, .078), (220.0, .052), (293.66, .031)]
        noise_gain, bubble_gap, note_gap = .014, 6.4, 7.5
    else:
        pad_notes = [(130.81, .105), (196.00, .075), (261.63, .052), (329.63, .036), (392.0, .025)]
        noise_gain, bubble_gap, note_gap = .026, 3.2, 4.7
    breath = .8 + .2 * np.sin(2 * np.pi * t / (seconds * .78))
    for i, (freq, gain) in enumerate(pad_notes):
        phase = 2 * np.pi * freq * t
        partial = np.sin(phase + i * .18) + .14 * np.sin(2 * phase + .6)
        layer = gain * breath * partial
        # Slow, gentle left-right drift gives the stereo field a sense of depth.
        pan = .26 * np.sin(2 * np.pi * t / (seconds * .62) + i)
        out[:, 0] += layer * np.sqrt((1-pan) / 2)
        out[:, 1] += layer * np.sqrt((1+pan) / 2)
    wash = filtered_noise(seconds, 120, 850 if variant != "interior" else 520)
    wash *= noise_gain * (.8 + .2 * np.sin(2 * np.pi * t / (seconds * .43)))
    out += stereo(wash, .0)
    # Sparse bubbles and a few notes from the same D major pentatonic family.
    bubble_pitch = [310, 390, 470, 350, 430, 540, 380, 490]
    pos = 1.1 if variant == "menu" else 1.7
    idx = 0
    while pos < seconds - .45:
        dur = .19 + .04 * (idx % 3)
        add(out, bubble(dur, bubble_pitch[idx % len(bubble_pitch)], .23 if variant == "interior" else .27),
            pos, .34, (-.55, .35, .72, -.25)[idx % 4])
        pos += bubble_gap * (1 + .13 * ((idx % 3) - 1))
        idx += 1
    note_frequencies = [293.66, 369.99, 440.0, 493.88, 587.33, 659.25]
    pos, idx = 2.8, 0
    while pos < seconds - .9:
        dur = .5 if variant == "menu" else .38
        add(out, tone(dur, note_frequencies[(idx * 2 + 1) % 6], amp=.12,
                      harmonics=((1,1), (2,.18), (3,.04)), decay=.48, release=.35),
            pos, 1, (-.35, .5, .22)[idx % 3])
        pos += note_gap * (1 + .17 * (idx % 2))
        idx += 1
    # Interior's very soft, even pulse is a fluid modulation, not a heartbeat.
    if variant == "interior":
        pulse = .006 * (np.sin(2 * np.pi * 1.2 * t) ** 2)
        out += stereo(pulse * np.sin(2 * np.pi * 73 * t), .0)
    return out


def make_swim_stroke() -> np.ndarray:
    """A rounded 160 ms liquid burble, without a noise transient or impact."""
    seconds = .16
    t = time_axis(seconds)
    out = np.zeros_like(t)
    for start, length, f0, f1, gain in ((0, .14, 920, 460, .8), (.045, .115, 510, 980, .32)):
        local = t - start
        u = np.clip(local / length, 0, 1)
        frequency = f0 * (f1 / f0) ** u
        phase = 2 * np.pi * np.cumsum(frequency) / SR
        # Smooth swelling bubbles instead of the previous noisy percussive hit.
        env = np.sin(np.pi * u) ** 2
        env[(local < 0) | (local > length)] = 0
        out += gain * env * np.sin(phase + .24 * np.sin(2 * np.pi * 19 * local))
    out *= .38 / max(1e-9, np.max(np.abs(out)))
    return stereo(out, -.05)


def make_energy_loop() -> np.ndarray:
    seconds = 2.0
    out = np.zeros((round(seconds * SR), 2))
    t = time_axis(seconds)
    env = .5 + .5 * np.sin(2 * np.pi * t / seconds)
    for j, freq in enumerate((440, 554.37, 659.25, 880)):
        sig = .018 * np.sin(2 * np.pi * freq * t + j * .7) * env
        out += stereo(sig, (-.6, .4, .7, -.2)[j])
    return out


def make_process_loop() -> np.ndarray:
    seconds = 3.2
    out = np.zeros((round(seconds * SR), 2))
    # Soft repeating clicks and low watery pulses, evenly spaced for a seamless loop.
    for i, pos in enumerate((.22, .76, 1.34, 1.89, 2.49, 2.94)):
        add(out, tone(.17, (330, 392, 294)[i % 3], (470, 440, 360)[i % 3], .28,
                      ((1,1), (2,.15)), decay=.12), pos, .33, (-.3, .3)[i % 2])
        add(out, bubble(.13, (360, 420, 310)[i % 3], .15), pos + .11, .22, .1)
    return out


def make_inject_loop() -> np.ndarray:
    seconds = 1.2
    out = np.zeros((round(seconds * SR), 2))
    t = time_axis(seconds)
    flow = filtered_noise(seconds, 240, 1900) * (.012 + .009 * np.sin(2 * np.pi * t / seconds) ** 2)
    out += stereo(flow, .0)
    for i, pos in enumerate((.18, .62, 1.02)):
        add(out, tone(.15, (370, 440, 494)[i], (410, 494, 587)[i], .19,
                      ((1,1), (2,.1)), decay=.16), pos, .22, (-.25, .3, .05)[i])
    return out


def one_shot(name: str, data: np.ndarray) -> None:
    save_wav(name, short_reverb(data, .10))


def main() -> None:
    MASTER.mkdir(parents=True, exist_ok=True)
    WEB.mkdir(parents=True, exist_ok=True)

    # Reusable sound beds, each loop blended at the seam.
    save_wav("ambiente_menu", make_environment(30, "menu"), loop=True)
    save_wav("ambiente_exterior", make_environment(36, "exterior"), loop=True)
    save_wav("ambiente_interior", make_environment(28, "interior"), loop=True)
    save_wav("fago_nadar", make_swim_stroke())
    save_wav("energia_activa", make_energy_loop(), loop=True)
    save_wav("biosintesis_proceso", make_process_loop(), loop=True)
    save_wav("adn_inyectar", make_inject_loop(), loop=True)

    # UI, exploration and bubble feedback.
    out = np.zeros((round(.15 * SR), 2)); add(out, tone(.13, 587.33, 740, .42, ((1,1),(2,.12)), decay=.075), .0); one_shot("ui_pulsar", out)
    out = np.zeros((round(.85 * SR), 2)); add(out, whoosh(.67, 1, .23), .0); add(out, tone(.58, 369.99, 587.33, .35, ((1,1),(2,.12)), decay=.55, release=.4), .18, .7, .1); one_shot("partida_iniciar", out)
    for i, (pitch, dur) in enumerate(((360, .18), (415, .21), (475, .24))):
        out = np.zeros((round((dur+.06)*SR),2)); add(out, bubble(dur, pitch, .48), .0); add(out, tone(.10, pitch*1.3, amp=.1, decay=.075), dur*.45, .18, .2); one_shot(f"choque_suave_{i+1:02}", out)
    for i, (pitch, dur) in enumerate(((390,.16),(440,.19),(510,.21),(350,.24),(570,.18))):
        if (ROOT / "fuentes/el_boss_669918_bubble_pop.mp3").exists():
            continue  # Imported recording: rebuild with scripts/import_bubble_pop.py.
        out = np.zeros((round((dur+.08)*SR), 2)); add(out, bubble(dur,pitch,.56), .0); one_shot(f"burbuja_explotar_{i+1:02}", out)
    out=np.zeros((round(.2*SR),2)); add(out,tone(.17,493.88,783.99,.38,((1,1),(2,.2)),decay=.11),.0); one_shot("burbuja_racha",out)
    out=np.zeros((round(.28*SR),2)); add(out,tone(.24,440,293.66,.24,((1,1),(2,.12)),decay=.17),.0); one_shot("burbuja_racha_fin",out)
    out=np.zeros((round(.9*SR),2)); add(out,whoosh(.65,1,.22),.0); 
    for i,f in enumerate((369.99,440,587.33,739.99)): add(out,tone(.42,f,amp=.32,harmonics=((1,1),(2,.16)),decay=.34,release=.28),.28+i*.075,.53,(-.35,.25)[i%2])
    one_shot("energia_activar",out)
    out=np.zeros((round(.17*SR),2)); add(out,tone(.16,659.25,880,.32,((1,1),(2,.14)),decay=.1),.0); one_shot("energia_renovar",out)
    out=np.zeros((round(.48*SR),2)); add(out,tone(.45,587.33,293.66,.28,((1,1),(2,.1)),decay=.36,release=.25),.0); one_shot("energia_terminar",out)
    out=np.zeros((round(.33*SR),2)); add(out,tone(.3,440,587.33,.25,((1,1),(2,.12)),decay=.22),.0); one_shot("bacteria_disponible",out)

    # Infection, DNA and assembly.
    out=np.zeros((round(.74*SR),2)); add(out,whoosh(.68,1,.22,160,3000),.0); add(out,tone(.35,293.66,440,.21,decay=.3),.3,.4,.12); one_shot("infeccion_acercamiento",out)
    out=np.zeros((round(.37*SR),2));
    for i,pos in enumerate((.035,.10,.18)): add(out,tone(.10,440+i*75,330+i*75,.2,((1,1),(2,.12)),decay=.08),pos,.45,(-.25,.2,.55)[i])
    add(out,bubble(.18,330,.37),.12,.55); one_shot("infeccion_anclaje",out)
    out=np.zeros((round(.55*SR),2)); add(out,bubble(.22,310,.37),0,.28); add(out,tone(.38,392,659.25,.28,((1,1),(2,.14)),decay=.3),.13,.65,.15); one_shot("adn_inyeccion_completa",out)
    out=np.zeros((round(1.3*SR),2)); add(out,whoosh(1.15,1,.24,120,2200),.0); add(out,tone(.62,293.66,392,.19,decay=.42),.45,.45,-.1); one_shot("bacteria_entrar",out)
    out=np.zeros((round(.16*SR),2)); add(out,tone(.14,659.25,587.33,.30,((1,1),(2,.08)),decay=.085),.0); one_shot("adn_seleccionar",out)
    out=np.zeros((round(.38*SR),2)); add(out,tone(.22,440,554.37,.30,((1,1),(2,.1)),decay=.16),.0); add(out,tone(.23,554.37,739.99,.27,((1,1),(2,.1)),decay=.17),.14,.7,.2); one_shot("adn_copiar",out)
    out=np.zeros((round(.9*SR),2));
    for i,f in enumerate((293.66,369.99,440,587.33)): add(out,tone(.47,f,amp=.32,harmonics=((1,1),(2,.14)),decay=.36,release=.28),i*.145,.55,(-.35,.15,.35,.1)[i])
    one_shot("adn_copias_completas",out)
    out=np.zeros((round(.13*SR),2)); add(out,tone(.12,554.37,659.25,.27,decay=.07),0); one_shot("nucleotido_tomar",out)
    out=np.zeros((round(.24*SR),2)); add(out,bubble(.14,400,.26),0,.25); add(out,tone(.19,493.88,659.25,.31,((1,1),(2,.16)),decay=.14),.07,.55); one_shot("nucleotido_encajar",out)
    out=np.zeros((round(.19*SR),2)); add(out,bubble(.16,300,.30),0,.45); one_shot("pieza_no_encaja",out)
    out=np.zeros((round(.96*SR),2));
    for i,f in enumerate((293.66,369.99,440,587.33)): add(out,tone(.48,f,amp=.33,harmonics=((1,1),(2,.13)),decay=.37,release=.3),i*.14,.55,(-.35,.1,.35,.15)[i])
    one_shot("adn_secuencia_completa",out)
    for i,(f,pan) in enumerate(((370,-.28),(440,.22),(554,.35))):
        out=np.zeros((round(.22*SR),2)); add(out,bubble(.19,f,.40),0); add(out,tone(.14,f*1.5,f*1.8,.12,decay=.08),.05,.25,.15); one_shot(f"pieza_aparecer_{i+1:02}",out)
    out=np.zeros((round(.19*SR),2)); add(out,bubble(.17,330,.43),0,.65); one_shot("pieza_tomar",out)
    out=np.zeros((round(.7*SR),2)); add(out,whoosh(.49,-1,.18,180,2800),0); add(out,tone(.25,523.25,392,.25,decay=.2),.4,.55); one_shot("adn_empaquetar",out)
    out=np.zeros((round(.29*SR),2)); add(out,bubble(.21,365,.43),.0,.5); add(out,tone(.18,392,494,.25,((1,1),(2,.1)),decay=.13),.06,.55,.2); one_shot("fago_unir_cabeza_cuerpo",out)
    out=np.zeros((round(.38*SR),2));
    for i,pos in enumerate((.02,.095,.17,.245)): add(out,tone(.13,440+i*35,560+i*30,.22,decay=.095),pos,.42,(-.5,-.15,.2,.5)[i])
    one_shot("fago_unir_fibras",out)
    for i, f in enumerate((440,493.88,554.37)):
        out=np.zeros((round(.5*SR),2)); add(out,tone(.45,f, f*1.5,.28,((1,1),(2,.12)),decay=.35,release=.24,vibrato=5),0); one_shot(f"fago_construido_{i+1:02}",out)
    out=np.zeros((round(1.1*SR),2));
    for i,f in enumerate((293.66,369.99,440,587.33,739.99)): add(out,tone(.67,f,amp=.3,harmonics=((1,1),(2,.14)),decay=.5,release=.35),i*.1,.49,(-.4,-.2,.15,.35,.2)[i])
    one_shot("fagos_objetivo_completo",out)

    # Lysis and returning to the outer world.
    for i,(f0,f1) in enumerate(((330,390),(370,440),(415,494),(466,554))):
        out=np.zeros((round(.16*SR),2)); add(out,bubble(.15,f0,.41),0,.38); add(out,tone(.12,f0*1.5,f1*1.55,.12,decay=.08),.02,.18,.1); one_shot(f"lisis_pulsar_{i+1:02}",out)
    for i,(duration,pitch) in enumerate(((.24,350),(.32,290),(.42,240))):
        out=np.zeros((round((duration+.08)*SR),2)); add(out,filtered_noise(duration,140,900),0,.17); add(out,bubble(duration,pitch,.36),0,.35); one_shot(f"lisis_deterioro_{i+1:02}",out)
    out=np.zeros((round(.64*SR),2)); add(out,whoosh(.6,1,.24,120,2400),0); add(out,tone(.52,293.66,587.33,.24,((1,1),(2,.1)),decay=.4),.08,.5); one_shot("lisis_presion_maxima",out)
    out=np.zeros((round(1.08*SR),2)); add(out,whoosh(.96,1,.34,100,3400),0); add(out,bubble(.29,240,.6),.16,.7,-.2); add(out,bubble(.34,330,.45),.38,.43,.32); add(out,tone(.72,196,369.99,.19,((1,1),(2,.08)),decay=.56,release=.4),.12,.38); one_shot("bacteria_explotar",out)
    out=np.zeros((round(.74*SR),2));
    for i,pos in enumerate((.05,.13,.21,.3,.4,.49)): add(out,whoosh(.22,1,.20,220,1800),pos,.32,(-.72,-.4,-.1,.2,.48,.75)[i])
    one_shot("fagos_liberar",out)
    out=np.zeros((round(1.6*SR),2)); add(out,whoosh(1.5,-1,.19,140,2500),0); add(out,tone(1.1,494,293.66,.17,decay=.92,release=.55),.15,.5); one_shot("fago_seguimiento",out)
    out=np.zeros((round(1.3*SR),2));
    for i,f in enumerate((293.66,369.99,440,587.33,659.25)): add(out,tone(.8,f,amp=.27,harmonics=((1,1),(2,.12)),decay=.67,release=.4),i*.105,.47,(-.4,-.18,.1,.35,.15)[i])
    one_shot("ciclo_completo",out)
    out=np.zeros((round(1.55*SR),2));
    for i,f in enumerate((440,392,369.99,293.66)): add(out,tone(.68,f,amp=.22,harmonics=((1,1),(2,.1)),decay=.53,release=.38),i*.22,.54,(-.2,.2,.35,0)[i])
    one_shot("partida_tiempo_agotado",out)
    out=np.zeros((round(.52*SR),2)); add(out,whoosh(.44,-1,.18,170,2300),0); add(out,tone(.3,440,293.66,.2,decay=.23),.15,.5); one_shot("volver_menu",out)

    # Distant background layers derived from the matching close event sounds.
    for source, target in (("infeccion_anclaje", "fondo_infeccion"), ("bacteria_explotar", "fondo_explosion")):
        # Build subtle filtered versions directly from the saved PCM master.
        with wave.open(str(MASTER / f"{source}.wav"), "rb") as f:
            raw = np.frombuffer(f.readframes(f.getnframes()), dtype="<i2").astype(np.float64) / 32768
            raw = raw.reshape(-1, 2).mean(axis=1)
        filtered = sosfilt(butter(3, 850 / (SR/2), btype="lowpass", output="sos"), raw)
        derived = stereo(filtered * .16, .0)
        save_wav(target, derived)

    print(f"Generated {len(list(MASTER.glob('*.wav')))} WAV masters and {len(list(WEB.glob('*.ogg')))} Ogg + {len(list(WEB.glob('*.mp3')))} MP3 browser files.")


if __name__ == "__main__":
    main()
