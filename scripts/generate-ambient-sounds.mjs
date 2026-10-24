#!/usr/bin/env node
// Tek seferlik, dışa bağımlılık gerektirmeyen üretim scripti.
//
// Nefes seansları için opsiyonel ortam sesi (ambient sound) özelliğinde
// kullanılacak iki kısa, döngülenebilir (loop) mono WAV dosyasını
// programatik olarak üretir:
//   - assets/sounds/white-noise.wav : düz beyaz gürültü
//   - assets/sounds/rain.wav        : alçak geçiren filtreli gürültü + damla tıkırtıları
//
// Telif/indirme riski olmadan, tamamen bu script içinde matematiksel olarak
// üretilir. Harici ses kütüphanesi kullanılmaz; WAV header'ı elle yazılır.
//
// Çalıştırmak için: node scripts/generate-ambient-sounds.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'sounds');

const SAMPLE_RATE = 22050; // 22.05kHz mono - dosya boyutunu makul tutar
const DURATION_SECONDS = 12; // 10-15sn aralığında, döngülenebilir kısa klip
const FADE_MS = 300; // döngü noktasındaki ani kopmayı önlemek için kısa fade in/out
const TOTAL_SAMPLES = Math.round(SAMPLE_RATE * DURATION_SECONDS);
const FADE_SAMPLES = Math.round((FADE_MS / 1000) * SAMPLE_RATE);

// --- basit, tohumlanabilir (seeded) sözde-rastgele üreteç -------------------
// Node'un Math.random'ı deterministik değil; tekrar üretilebilirlik için
// basit bir mulberry32 PRNG kullanıyoruz (harici bağımlılık yok).
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

// [-1, 1] aralığında düz (uniform) beyaz gürültü üretir.
function generateWhiteNoiseFloat(rng, length) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = randRange(rng, -1, 1);
  }
  return out;
}

// Basit tek kutuplu (one-pole) alçak geçiren IIR filtre: y[n] = a*x[n] + (1-a)*y[n-1]
// Beyaz gürültüyü yumuşatıp "uğultu/rüzgar" hissi veren kahverengi-ye yakın gürültüye çevirir.
function lowPassFilter(input, alpha) {
  const out = new Float32Array(input.length);
  let prev = 0;
  for (let i = 0; i < input.length; i++) {
    prev = alpha * input[i] + (1 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

// Bir Float32Array'i verilen peak mutlak değere normalize eder.
function normalize(samples, targetPeak = 0.9) {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > max) max = abs;
  }
  if (max === 0) return samples;
  const scale = targetPeak / max;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * scale;
  return out;
}

// Başlangıç/bitişe kısa fade-in/fade-out uygular (loop noktasında ani kopmayı önler).
function applyFade(samples, fadeSamples) {
  const out = Float32Array.from(samples);
  const n = out.length;
  const fade = Math.min(fadeSamples, Math.floor(n / 2));
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }
  return out;
}

// Yağmur damlası hissi veren seyrek, kısa, sönümlenen "tıkırtı" darbeleri ekler.
function addRainDroplets(base, rng, sampleRate) {
  const out = Float32Array.from(base);
  const durationSeconds = out.length / sampleRate;
  const dropletsPerSecond = 5; // seyrek ama fark edilir yoğunluk
  const dropletCount = Math.round(durationSeconds * dropletsPerSecond);

  for (let d = 0; d < dropletCount; d++) {
    const startSample = Math.floor(randRange(rng, 0, out.length - 1));
    const dropletMs = randRange(rng, 3, 9); // 3-9ms kısa darbe
    const dropletLength = Math.max(4, Math.round((dropletMs / 1000) * sampleRate));
    const amplitude = randRange(rng, 0.15, 0.45);
    // Yüksek frekanslı, hızlı sönümlenen bir darbe: rastgele işaretli örnekler * üstel sönüm.
    for (let i = 0; i < dropletLength; i++) {
      const idx = startSample + i;
      if (idx >= out.length) break;
      const decay = Math.exp(-i / (dropletLength / 3));
      const noiseSample = randRange(rng, -1, 1);
      out[idx] += noiseSample * amplitude * decay;
    }
  }
  return out;
}

// Float32 [-1,1] örnekleri 16-bit little-endian PCM buffer'a çevirir.
function floatTo16BitPCM(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(s), i * 2);
  }
  return buffer;
}

// Mono, 16-bit PCM WAV header'ı elle yazar (harici kütüphane yok).
function encodeWav(pcmBuffer, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii');

  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Üretilen bir WAV buffer'ının header alanlarının, gerçek buffer boyutuyla
// tutarlı olduğunu doğrular (expo-audio/Expo Go'nun geçerli bir WAV olarak
// tanıyabilmesi için gereken minimum kontrol).
function validateWav(buffer) {
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);
  const fmt = buffer.toString('ascii', 12, 16);
  const dataTag = buffer.toString('ascii', 36, 40);
  const declaredRiffSize = buffer.readUInt32LE(4);
  const declaredDataSize = buffer.readUInt32LE(40);
  const audioFormat = buffer.readUInt16LE(20);
  const numChannels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);

  const errors = [];
  if (riff !== 'RIFF') errors.push(`RIFF header missing (got "${riff}")`);
  if (wave !== 'WAVE') errors.push(`WAVE header missing (got "${wave}")`);
  if (fmt !== 'fmt ') errors.push(`fmt chunk missing (got "${fmt}")`);
  if (dataTag !== 'data') errors.push(`data chunk missing (got "${dataTag}")`);
  if (audioFormat !== 1) errors.push(`audioFormat expected 1 (PCM), got ${audioFormat}`);
  if (numChannels !== 1) errors.push(`numChannels expected 1 (mono), got ${numChannels}`);
  if (bitsPerSample !== 16) errors.push(`bitsPerSample expected 16, got ${bitsPerSample}`);
  if (declaredRiffSize !== buffer.length - 8) {
    errors.push(`RIFF size mismatch: declared ${declaredRiffSize}, expected ${buffer.length - 8}`);
  }
  if (declaredDataSize !== buffer.length - 44) {
    errors.push(`data size mismatch: declared ${declaredDataSize}, expected ${buffer.length - 44}`);
  }

  return { ok: errors.length === 0, errors, sampleRate, bitsPerSample, numChannels };
}

function buildWhiteNoise() {
  const rng = mulberry32(0xC0FFEE);
  let samples = generateWhiteNoiseFloat(rng, TOTAL_SAMPLES);
  samples = normalize(samples, 0.85);
  samples = applyFade(samples, FADE_SAMPLES);
  return samples;
}

function buildRain() {
  const rng = mulberry32(0xBADA55);
  let base = generateWhiteNoiseFloat(rng, TOTAL_SAMPLES);
  // Alçak geçiren filtre ile beyaz gürültüyü yumuşatıp yağmur/uğultu tabanı oluştur.
  base = lowPassFilter(base, 0.18);
  base = normalize(base, 0.55);
  // Üzerine seyrek damla tıkırtıları ekle.
  let withDroplets = addRainDroplets(base, rng, SAMPLE_RATE);
  withDroplets = normalize(withDroplets, 0.85);
  withDroplets = applyFade(withDroplets, FADE_SAMPLES);
  return withDroplets;
}

function writeSoundFile(name, floatSamples) {
  const pcm = floatTo16BitPCM(floatSamples);
  const wav = encodeWav(pcm, SAMPLE_RATE);
  const { ok, errors, sampleRate, bitsPerSample, numChannels } = validateWav(wav);
  if (!ok) {
    throw new Error(`${name}: geçersiz WAV üretildi -> ${errors.join('; ')}`);
  }
  const outPath = join(OUT_DIR, name);
  writeFileSync(outPath, wav);
  const sizeKb = (wav.length / 1024).toFixed(1);
  console.log(
    `OK  ${name}  (${sizeKb} KB, ${sampleRate}Hz, ${bitsPerSample}-bit, ${numChannels}ch, ${DURATION_SECONDS}s)`
  );
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  writeSoundFile('white-noise.wav', buildWhiteNoise());
  writeSoundFile('rain.wav', buildRain());

  console.log(`\nÜretim tamamlandı: ${OUT_DIR}`);
}

main();
