import type { Produk, Sumber } from './types'

// CSV import. Columns (header row required, comma or semicolon):
// kode, nama, sumber, stok_induk, penjualan_per_hari, lama_datang_hari
// "sumber" is one of: sendiri, supplier, dropship.
// Errors are written for a beginner: which row, what is wrong.

const SUMBER: Sumber[] = ['sendiri', 'supplier', 'dropship']

function pisah(baris: string, pemisah: string): string[] {
  const hasil: string[] = []
  let sel = ''
  let kutip = false
  for (const c of baris) {
    if (c === '"') kutip = !kutip
    else if (c === pemisah && !kutip) {
      hasil.push(sel.trim())
      sel = ''
    } else sel += c
  }
  hasil.push(sel.trim())
  return hasil
}

export function bacaCsv(teks: string): Produk[] {
  const baris = teks.replace(/^﻿/, '').split(/\r?\n/).filter((b) => b.trim())
  if (baris.length < 2) throw new Error('file kosong atau hanya berisi judul kolom')
  const pemisah = baris[0].includes(';') ? ';' : ','
  const judul = pisah(baris[0], pemisah).map((j) => j.toLowerCase())
  const kolom = (nama: string) => {
    const i = judul.indexOf(nama)
    if (i < 0) throw new Error(`kolom "${nama}" tidak ada di baris judul`)
    return i
  }
  const k = {
    kode: kolom('kode'),
    nama: kolom('nama'),
    sumber: kolom('sumber'),
    stok: kolom('stok_induk'),
    jual: kolom('penjualan_per_hari'),
    datang: kolom('lama_datang_hari'),
  }
  return baris.slice(1).map((b, i) => {
    const s = pisah(b, pemisah)
    const no = i + 2
    const angka = (v: string, nama: string) => {
      const n = Number(v.replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) throw new Error(`baris ${no}: "${nama}" harus angka, bukan "${v}"`)
      return n
    }
    const sumber = s[k.sumber]?.toLowerCase() as Sumber
    if (!SUMBER.includes(sumber)) throw new Error(`baris ${no}: sumber harus sendiri, supplier, atau dropship`)
    if (!s[k.kode]) throw new Error(`baris ${no}: kode kosong`)
    return {
      kode: s[k.kode],
      nama: s[k.nama] || s[k.kode],
      sumber,
      stokInduk: Math.round(angka(s[k.stok], 'stok_induk')),
      penjualanPerHari: angka(s[k.jual], 'penjualan_per_hari'),
      lamaDatangHari: angka(s[k.datang], 'lama_datang_hari'),
    }
  })
}
