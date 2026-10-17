/** Server-side behavioral checks. Keep this file out of client imports. */
const tests: Record<number, string[]> = {
  1: ['new Anggota("Mira", 2031).getLabel().equals("Mira - 2031")', 'new Anggota("Budi", 2000).getLabel().equals("Budi - 2000")'],
  2: ['new Persegi(5).hitungLuas() == 25', 'new Persegi(-4).hitungLuas() == 1'],
  3: ['Kartu k=new Kartu(); k.isiSaldo(2500); k.isiSaldo(-900); k.isiSaldo(0); return k.getSaldo()==12500;'],
  4: ['StokRoti s=new StokRoti(); s.tambah(4); s.tambah(-2); return s.getStok()==9;'],
  5: ['new Panjang(12).keSentimeter() == 1200', 'new Panjang(-7).keSentimeter() == 0'],
  6: ['new BelanjaBuku().hitungTotal(2) == 20000', 'new BelanjaBuku().hitungTotal(4) == 38000', 'new BelanjaBuku().getHarga() == 10000'],
  7: ['new Durasi(3, 15).keDetik() == 195', 'new Durasi(0, 45).keDetik() == 45'],
  8: ['new Denda(0).hitungDenda() == 0', 'new Denda(1).hitungDenda() == 0', 'new Denda(5).hitungDenda() == 4000'],
  9: ['Baterai b=new Baterai(); b.setPersen(0); if(b.getPersen()!=0)return false; b.setPersen(101); if(b.getPersen()!=0)return false; b.setPersen(100); return b.getPersen()==100;'],
  10: ['Lampu l=new Lampu(); if(l.isMenyala())return false; l.tekanSakelar(); if(!l.isMenyala())return false; l.tekanSakelar(); return !l.isMenyala();'],
  11: ['NilaiKuis n=new NilaiKuis(); if(n.jumlah()!=161 || n.rataRata()!=80.5)return false; set(n,"nilai1",20); set(n,"nilai2",9); return n.jumlah()==29 && n.rataRata()==14.5;'],
  12: ['new Angka(8).getJenis().equals("Positif")', 'new Angka(0).getJenis().equals("Nol")', 'new Angka(-3).getJenis().equals("Negatif")'],
  13: ['new DaftarBarang(new String[0]).getPertama().equals("Kosong")', 'new DaftarBarang(new String[]{"Teh","Kopi"}).getPertama().equals("Teh")', 'new DaftarBarang(new String[]{"a","b","c"}).jumlahBarang()==3'],
  14: ['Antrean a=new Antrean(); for(int i=0;i<8;i++)a.berikutnya(); return a.getNomor()==5;'],
  15: ['Pasangan p=new Pasangan(); set(p,"angka",new int[]{-8,14}); if(p.terbesar()!=14 || p.jumlah()!=6)return false; set(p,"angka",new int[]{7,7}); return p.terbesar()==7;'],
  16: ['Kursi k=new Kursi(); boolean a=k.pesanSatu(); boolean b=k.pesanSatu(); return a && !b && k.getTersedia()==0;'],
  17: ['new Kata("  Java  ").panjang()==4', 'new Kata("  ").panjang()==0'],
  18: ['new Barang("Pensil",5).getLabel().equals("Pensil (5)")', 'new Barang("Buku",1).getLabel().equals("Buku (1)")'],
  19: ['new Nama().hurufBesar().equals("RANI")', 'new Nama().getTeks().equals(" rani ")'],
  20: ['new Sapaan("  Dinda  ").sapa().equals("Halo, Dinda")', 'new Sapaan("   ").sapa().equals("Halo, Teman")'],
  21: ['Pengumuman p=new Pengumuman(); p.setPesan("  Kelas dimulai  "); if(!p.getPesan().equals("Kelas dimulai"))return false; p.setPesan("   "); return p.getPesan().equals("Kelas dimulai");'],
  22: ['new NomorAnggota(9).getNomor()==9', 'new NomorAnggota(0).getNomor()==1', 'new NomorAnggota(-3).getNomor()==1'],
  23: ['new Kamera("Nikon",36).getInfo().equals("Nikon 36MP")', 'new Kamera("Sony",12).getInfo().equals("Sony 12MP")'],
  24: ['Laptop l=new Laptop(); l.tambahRam(7); if(l.getRam()!=11)return false; l.tambahRam(6); return l.getRam()==11;'],
  25: ['new Paket("Banda Aceh","23111").getAlamat().equals("Banda Aceh - 23111")', 'new Paket("Medan","00123").getAlamat().equals("Medan - 00123")'],
  26: ['new Laundry(2).hitungBiaya()==10000', 'new Laundry(5).hitungBiaya()==20000', 'new Laundry(7).hitungBiaya()==30000'],
  27: ['new Pengiriman().totalBayar(49999)==59999', 'new Pengiriman().totalBayar(50000)==50000', 'new Pengiriman().getBiaya()==10000'],
  28: ['new Sepeda().biayaSewa(3)==15000', 'new Sepeda().biayaSewa(0)==0', 'new Sepeda().biayaSewa(-2)==0'],
  29: ['new Praktikum(59).getStatus().equals("Belum lulus")', 'new Praktikum(60).getStatus().equals("Lulus")', 'new Praktikum(79).getStatus().equals("Lulus")', 'new Praktikum(80).getStatus().equals("Sangat baik")'],
  30: ['Tabungan t=new Tabungan(); t.setor(6000); t.setor(-4); if(t.sisaTarget()!=4000)return false; t.setor(5000); return t.sisaTarget()==0;'],
  31: ['Kelas k=new Kelas(); if(k.kursiKosong()!=1)return false; boolean b=k.daftar(); boolean c=!k.daftar(); return b && c && k.kursiKosong()==0;'],
  32: ['Kuota k=new Kuota(); k.pakai(3); k.pakai(20); k.pakai(-1); k.pakai(0); return k.getSisa()==7;'],
  33: ['new Kehadiran(true,true).getStatus().equals("Hadir")', 'new Kehadiran(false,true).getStatus().equals("Izin")', 'new Kehadiran(false,false).getStatus().equals("Alpa")'],
  34: ['new Keranjang().getBuah(1).equals("Jeruk")', 'new Keranjang().getBuah(-1).equals("Tidak ada")', 'new Keranjang().getBuah(2).equals("Tidak ada")', 'new Keranjang().jumlahBuah()==2'],
  35: ['new Suhu(19).getKondisi().equals("Dingin")', 'new Suhu(20).getKondisi().equals("Sejuk")', 'new Suhu(29).getKondisi().equals("Sejuk")', 'new Suhu(30).getKondisi().equals("Panas")'],
  36: ['Skor s=new Skor(); s.tambahPoin(9); s.tambahPoin(-2); s.tambahPoin(0); return s.getPoin()==9;'],
  37: ['DaftarHari d=new DaftarHari(); set(d,"hari",new String[]{"A","B","C"}); return d.jumlahHari()==3 && d.getHariTerakhir().equals("C");'],
  38: ['Timer t=new Timer(); t.kurangi(2); if(t.getDetik()!=3)return false; t.kurangi(9); if(t.getDetik()!=0)return false; t.kurangi(-1); return t.getDetik()==0;'],
  39: ['new Bilangan(8).isGenapPositif()', '!new Bilangan(7).isGenapPositif()', '!new Bilangan(0).isGenapPositif()', '!new Bilangan(-4).isGenapPositif()'],
  40: ['new Hitung().jumlahSampai(5)==15', 'new Hitung().jumlahSampai(1)==1', 'new Hitung().kuadrat(-4)==16', 'new Hitung().kuadrat(0)==0'],
};

export function buildGradingCode(code: string, questionId: number, nonce: string) {
  const cases = tests[questionId];
  if (!cases) throw new Error('Nomor soal tidak valid.');
  if (!/public\s+class\s+Main\b/.test(code)) throw new Error('Pertahankan class Main yang disediakan agar soal bisa diuji.');
  const student = code.replace(/public\s+class\s+Main\b/, 'class StudentMain');
  const escapedNonce = JSON.stringify(nonce);
  const caseMethods = cases.map((body, i) => `static boolean test${i}() throws Exception { ${body.includes('return ') ? body : `return (${body});`} }`).join('\n');
  const caseCode = cases.map((_, i) => `try { if (!test${i}()) ok=false; } catch (Throwable t) { ok=false; }`).join('\n');
  const harness = `
public class Main {
  static void set(Object target, String name, Object value) throws Exception {
    java.lang.reflect.Field f=target.getClass().getDeclaredField(name); f.setAccessible(true); f.set(target,value);
  }
  public static void main(String[] args) throws Exception {
    java.io.PrintStream original=System.out;
    java.io.ByteArrayOutputStream captured=new java.io.ByteArrayOutputStream();
    try { System.setOut(new java.io.PrintStream(captured)); StudentMain.main(args); }
    finally { System.setOut(original); }
    boolean ok=true;
    ${caseCode}
    String output=java.util.Base64.getEncoder().encodeToString(captured.toByteArray());
    System.out.println("JL_GRADE_"+${escapedNonce}+"="+(ok?"1":"0"));
    System.out.println("JL_OUTPUT_"+${escapedNonce}+"="+output);
  }
  ${caseMethods}
}`;
  return student + '\n' + harness;
}

export function extractGradingResult(stdout: string, nonce: string) {
  const lines = stdout.replace(/\r\n?/g, '\n').split('\n');
  const gradePrefix = `JL_GRADE_${nonce}=`;
  const outputPrefix = `JL_OUTPUT_${nonce}=`;
  const grade = lines.find(line => line.startsWith(gradePrefix));
  const encoded = lines.find(line => line.startsWith(outputPrefix))?.slice(outputPrefix.length) ?? '';
  let studentOutput = '';
  try { studentOutput = new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0))); } catch { /* Empty student output. */ }
  return { stdout: studentOutput, gradePassed: grade?.slice(gradePrefix.length) === '1' };
}
