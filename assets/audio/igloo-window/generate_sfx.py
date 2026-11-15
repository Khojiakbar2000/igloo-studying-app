"""Generate the original, synthesized Igloo Window sound palette (CC0, no samples)."""
import math, random, struct, wave
from pathlib import Path
OUT=Path(__file__).parent
SR=22050

def render(name, seconds, make):
    rng=random.Random(19)
    n=int(SR*seconds)
    samples=[]
    for i in range(n):
        t=i/SR
        v=make(t, seconds, rng)
        samples.append(max(-1,min(1,v)))
    with wave.open(str(OUT/f'{name}.wav'),'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes(b''.join(struct.pack('<h',int(v*32767)) for v in samples))

def env(t,d,a=.03,r=.12): return min(1,t/a if a else 1,max(0,(d-t)/r if r else 1))
def gust(t,d,rng):
    # Smoothed noise with broad gust envelope, quiet in the mix.
    x=sum(rng.uniform(-1,1) for _ in range(5))/5
    swell=.42+.30*math.sin(2*math.pi*t*.31)+.15*math.sin(2*math.pi*t*.73)
    return x*swell*env(t,d,.35,.55)*.16

def latch(t,d,rng):
    click=math.exp(-((t-.055)/.012)**2)*.34 + math.exp(-((t-.095)/.018)**2)*.12
    ring=math.sin(2*math.pi*(660-140*t)*t)*math.exp(-t*29)*.11
    return (click+ring)*env(t,d,0,.01)
def creak(t,d,rng):
    e=env(t,d,.1,.17)
    return (math.sin(2*math.pi*(190+70*math.sin(t*4))*t)*.055 + rng.uniform(-1,1)*.012)*e

def peep(t,d,rng):
    f=660+160*math.sin(math.pi*t/d)
    return math.sin(2*math.pi*f*t)*env(t,d,.045,.16)*.12 + math.sin(2*math.pi*(f*2)*t)*env(t,d,.04,.1)*.025
def shiver(t,d,rng):
    trem=(.5+.5*math.sin(2*math.pi*8*t))
    return (rng.uniform(-1,1)*.045+math.sin(2*math.pi*260*t)*.018)*trem*env(t,d,.05,.1)
def close(t,d,rng):
    thunk=math.exp(-((t-.23)/.035)**2)*.25
    return thunk+math.sin(2*math.pi*105*t)*math.exp(-max(0,t-.2)*26)*.06
def ambience(t,d,rng):
    # A seamless low-volume warm airy bed, no sampled audio.
    return (math.sin(2*math.pi*61*t)*.018+math.sin(2*math.pi*92*t)*.011+math.sin(2*math.pi*.33*t)*.009)*.55

for args in [('wind',6,gust),('latch',.28,latch),('window-creak',.72,creak),('gust',1.15,gust),('pip-peep',.42,peep),('shiver',.72,shiver),('window-close',.55,close),('warm-room',5,ambience)]: render(*args)
